/**
 * Invoice Mapping Service
 *
 * Determines what action to take for each extracted line item:
 *   - Create: no matching ingredient found → new ingredient
 *   - Merge: matching ingredient found but at a different size → add configuration
 *   - Update: matching ingredient found at the same size → update price
 *
 * Also snaps extracted volumes to the predefined PRODUCT_SIZES list
 * so we don't create random sizes.
 */

import { supabase } from '@/src/lib/supabase';
import { PRODUCT_SIZES } from '@/src/constants/appConstants';
import { Volume, volumeToOunces, volumeLabel } from '@/src/types/models';
import { parseVolumeFromBpc } from './product-normalization-service';
import type { InvoiceLineItem } from '@/src/types/invoice-models';
import type { SavedIngredient } from '@/src/types/models';

// ==========================================
// TYPES
// ==========================================

export type MappingAction = 'create' | 'merge' | 'update' | 'skip';

export interface LineItemMapping {
  lineItem: InvoiceLineItem;
  action: MappingAction;
  /** Matched ingredient (for merge/update) */
  matchedIngredient?: SavedIngredient;
  /** Snapped bottle volume from PRODUCT_SIZES */
  volume: Volume;
  /** Pack size from extraction */
  packSize: number;
  /** Per-bottle price */
  perBottlePrice: number;
  /** Clean product name (normalized) */
  cleanName: string;
  /** Detected category */
  category: string | null;
  /** Detected subcategory */
  subcategory: string | null;
  /** Match confidence (for highlighting low-confidence items) */
  confidence: number;
}

// ==========================================
// SNAP VOLUME TO PREDEFINED SIZES
// ==========================================

/**
 * Find the closest PRODUCT_SIZE to an extracted volume.
 * Returns the exact predefined size if within 5% tolerance.
 */
export function snapToProductSize(extracted: Volume): Volume {
  const extractedOz = volumeToOunces(extracted);
  if (extractedOz <= 0) return { kind: 'milliliters', ml: 750 }; // default

  let bestMatch = PRODUCT_SIZES[0];
  let bestDiff = Infinity;

  for (const size of PRODUCT_SIZES) {
    const sizeOz = volumeToOunces(size);
    if (sizeOz <= 0) continue;

    const diff = Math.abs(sizeOz - extractedOz);
    const pctDiff = diff / extractedOz;

    // Within 5% tolerance → exact match
    if (pctDiff < 0.05 && diff < bestDiff) {
      bestMatch = size;
      bestDiff = diff;
    }
  }

  // If no close match, return the extracted volume as-is (milliliters)
  if (bestDiff === Infinity) {
    return extracted;
  }

  return bestMatch;
}

// ==========================================
// BUILD MAPPINGS
// ==========================================

/**
 * Analyze each line item and determine the appropriate action.
 */
export async function buildMappings(
  lineItems: InvoiceLineItem[],
  userId: string,
): Promise<LineItemMapping[]> {
  // Fetch user's ingredients for matching
  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, name, product_size, product_cost, type, sub_type')
    .eq('user_id', userId);

  const userIngredients: SavedIngredient[] = (ingredients ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    productSize: row.product_size as Volume,
    productCost: Number(row.product_cost),
    type: row.type,
    subType: row.sub_type,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  // Fetch existing configurations for size matching
  const ingredientIds = userIngredients.map(i => i.id);
  const { data: configs } = ingredientIds.length > 0
    ? await supabase
        .from('ingredient_configurations')
        .select('ingredient_id, product_size, pack_size')
        .in('ingredient_id', ingredientIds)
    : { data: [] };

  const configsByIngredient = new Map<string, Array<{ productSize: Volume; packSize: number }>>();
  for (const c of (configs ?? [])) {
    const list = configsByIngredient.get(c.ingredient_id) ?? [];
    list.push({ productSize: c.product_size as Volume, packSize: c.pack_size });
    configsByIngredient.set(c.ingredient_id, list);
  }

  const mappings: LineItemMapping[] = [];

  for (const item of lineItems) {
    // Skip credits and already-skipped items
    if (item.matchStatus === 'credit' || item.matchStatus === 'skipped') {
      continue;
    }

    // Parse volume from BPC in raw_text
    let extractedVolume: Volume = { kind: 'milliliters', ml: 750 };
    let extractedPackSize = item.packSize ?? 1;

    if (item.rawText) {
      const bpcMatch = item.rawText.match(/BPC:\s*(.+?)(?:\s+\d|$)/i);
      if (bpcMatch) {
        const parsed = parseVolumeFromBpc(bpcMatch[1]);
        if (parsed.volume) extractedVolume = parsed.volume;
        if (parsed.packSize) extractedPackSize = parsed.packSize;
      }
    }

    // Snap to predefined size
    const volume = snapToProductSize(extractedVolume);

    // Calculate per-bottle price
    const packSize = extractedPackSize;
    const qty = Number(item.quantity) || 1;
    const total = Number(item.totalPrice) || 0;
    const perBottlePrice = total > 0
      ? Math.round((total / (qty * packSize)) * 100) / 100
      : Number(item.unitPrice) || 0;

    // Detect category from normalized data
    const { normalizeProduct } = await import('./product-normalization-service');
    const norm = normalizeProduct(item.productName ?? '', item.rawText);

    // Try to find a matching ingredient
    const matched = item.matchedIngredientId
      ? userIngredients.find(i => i.id === item.matchedIngredientId)
      : findBestIngredientMatch(item.productName ?? '', userIngredients);

    let action: MappingAction;
    let confidence = item.matchConfidence ?? 0;

    if (!matched) {
      action = 'create';
      confidence = 0;
    } else {
      // Check if this size already exists on the ingredient
      const existingConfigs = configsByIngredient.get(matched.id) ?? [];
      const volumeOz = volumeToOunces(volume);
      const existingSize = existingConfigs.find(c => {
        const configOz = volumeToOunces(c.productSize);
        return Math.abs(configOz - volumeOz) < 0.5; // within 0.5oz
      });

      // Also check the ingredient's own productSize
      const ingredientSizeOz = volumeToOunces(matched.productSize);
      const sameAsIngredient = Math.abs(ingredientSizeOz - volumeOz) < 0.5;

      if (existingSize || sameAsIngredient) {
        action = 'update';
      } else {
        action = 'merge';
      }

      if (!item.matchedIngredientId) {
        // We found a match ourselves — set confidence based on name similarity
        confidence = Math.max(confidence, 0.7);
      }
    }

    mappings.push({
      lineItem: item,
      action,
      matchedIngredient: matched,
      volume,
      packSize,
      perBottlePrice,
      cleanName: norm.name,
      category: norm.category,
      subcategory: norm.subcategory,
      confidence,
    });
  }

  return mappings;
}

/**
 * Simple name-based ingredient matching for items the pipeline didn't match.
 */
function findBestIngredientMatch(
  productName: string,
  ingredients: SavedIngredient[],
): SavedIngredient | undefined {
  if (!productName || ingredients.length === 0) return undefined;

  const normalised = productName.toLowerCase().replace(/[^a-z0-9 ]/g, '');

  let best: { ingredient: SavedIngredient; score: number } | null = null;

  for (const ing of ingredients) {
    const ingName = ing.name.toLowerCase().replace(/[^a-z0-9 ]/g, '');

    // Check containment
    if (normalised.includes(ingName) || ingName.includes(normalised)) {
      const score = Math.min(normalised.length, ingName.length) / Math.max(normalised.length, ingName.length);
      if (!best || score > best.score) {
        best = { ingredient: ing, score };
      }
    }

    // Check word overlap
    const words1 = new Set(normalised.split(' ').filter(w => w.length > 2));
    const words2 = new Set(ingName.split(' ').filter(w => w.length > 2));
    let overlap = 0;
    for (const w of words1) {
      if (words2.has(w)) overlap++;
    }
    const overlapScore = (2 * overlap) / (words1.size + words2.size);
    if (overlapScore > 0.5 && (!best || overlapScore > best.score)) {
      best = { ingredient: ing, score: overlapScore };
    }
  }

  return best && best.score >= 0.5 ? best.ingredient : undefined;
}
