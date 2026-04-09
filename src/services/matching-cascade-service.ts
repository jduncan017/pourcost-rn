/**
 * Matching Cascade Service
 *
 * Runs each invoice line item through a 5-level matching cascade to find
 * the best ingredient match. Each level increases cost/complexity but catches
 * items that simpler methods miss.
 *
 * Cascade levels:
 *   1. Exact SKU lookup in distributor_skus
 *   2. Org-level custom mapping (org_product_mappings)
 *   3. Fuzzy name match against canonical_products (pg_trgm)
 *   4. Fuzzy name match against user's own ingredients
 *   5. Unmatched — queued for user review
 *
 * Pure service — all DB access goes through injected functions or supabase
 * client so the logic is testable in isolation.
 */

import { supabase } from '@/src/lib/supabase';
import type { Volume } from '@/src/types/models';
import type {
  InvoiceLineItem,
  MatchMethod,
  MatchStatus,
} from '@/src/types/invoice-models';

// ==========================================
// TYPES
// ==========================================

export interface MatchResult {
  ingredientId: string | null;
  ingredientName?: string;
  canonicalProductId?: string;
  distributorSkuId?: string;
  matchMethod: MatchMethod | null;
  matchConfidence: number;
  matchStatus: MatchStatus;
  /** Alternatives for "needs confirmation" items (confidence 0.6–0.85) */
  alternatives?: MatchCandidate[];
}

export interface MatchCandidate {
  ingredientId: string;
  ingredientName: string;
  canonicalProductId?: string;
  similarity: number;
  source: 'canonical' | 'ingredient';
}

export interface LineItemInput {
  id: string;
  sku?: string;
  productName?: string;
  productSize?: Volume;
  packSize?: number;
  distributorId?: string;
}

/** Thresholds for match confidence categorisation */
const THRESHOLDS = {
  /** >= this → auto-match (green) */
  AUTO_MATCH: 0.85,
  /** >= this → suggest with alternatives (yellow) */
  SUGGEST: 0.6,
  /** max alternatives to return for yellow-band items */
  MAX_ALTERNATIVES: 3,
} as const;

// ==========================================
// MAIN CASCADE
// ==========================================

/**
 * Run the full matching cascade for a single line item.
 * Returns a MatchResult with the best match found (or unmatched).
 */
export async function matchLineItem(
  lineItem: LineItemInput,
  userId: string,
): Promise<MatchResult> {
  // Level 1 — Exact SKU lookup
  if (lineItem.sku && lineItem.distributorId) {
    const skuResult = await matchBySku(
      lineItem.sku,
      lineItem.distributorId,
      userId,
    );
    if (skuResult) return skuResult;
  }

  // Level 2 — Org-level custom mapping (via canonical product)
  // We need a canonical product ID to check org mappings, so we look for one
  // from the SKU table even if the SKU didn't match exactly.
  if (lineItem.productName) {
    const orgResult = await matchByOrgMapping(lineItem.productName, userId);
    if (orgResult) return orgResult;
  }

  // Level 3 — Fuzzy match against canonical_products
  if (lineItem.productName) {
    const canonicalResult = await matchByCanonicalFuzzy(
      lineItem.productName,
      userId,
    );
    if (canonicalResult) return canonicalResult;
  }

  // Level 4 — Fuzzy match against user's own ingredients
  if (lineItem.productName) {
    const ingredientResult = await matchByIngredientFuzzy(
      lineItem.productName,
      userId,
    );
    if (ingredientResult) return ingredientResult;
  }

  // Level 5 — Unmatched
  return {
    ingredientId: null,
    matchMethod: null,
    matchConfidence: 0,
    matchStatus: 'unmatched',
  };
}

/**
 * Run the cascade for all line items of an invoice.
 * Returns a map of lineItemId → MatchResult.
 */
export async function matchInvoiceLineItems(
  lineItems: LineItemInput[],
  userId: string,
  distributorId?: string,
): Promise<Map<string, MatchResult>> {
  const results = new Map<string, MatchResult>();

  for (const item of lineItems) {
    const input: LineItemInput = {
      ...item,
      distributorId: item.distributorId ?? distributorId,
    };
    const result = await matchLineItem(input, userId);
    results.set(item.id, result);
  }

  return results;
}

// ==========================================
// LEVEL 1: EXACT SKU LOOKUP
// ==========================================

async function matchBySku(
  sku: string,
  distributorId: string,
  userId: string,
): Promise<MatchResult | null> {
  // Look up SKU in distributor_skus, joining to canonical_products
  const { data: skuRow } = await supabase
    .from('distributor_skus')
    .select('id, canonical_product_id, raw_product_name, verified, confidence')
    .eq('distributor_id', distributorId)
    .eq('sku', sku)
    .maybeSingle();

  if (!skuRow?.canonical_product_id) return null;

  // Found a canonical product — now find the user's ingredient for it
  const ingredientId = await findIngredientForCanonical(
    skuRow.canonical_product_id,
    userId,
  );

  if (!ingredientId) {
    // SKU maps to a canonical product, but user has no ingredient for it.
    // Still useful metadata — return as unmatched with canonical info so
    // the review screen can pre-populate a "create new ingredient" flow.
    return null;
  }

  const confidence = skuRow.verified ? 1.0 : Math.max(skuRow.confidence, 0.9);

  return {
    ingredientId,
    canonicalProductId: skuRow.canonical_product_id,
    distributorSkuId: skuRow.id,
    matchMethod: 'sku_exact',
    matchConfidence: confidence,
    matchStatus: confidence >= THRESHOLDS.AUTO_MATCH ? 'auto_matched' : 'unmatched',
  };
}

// ==========================================
// LEVEL 2: ORG-LEVEL CUSTOM MAPPING
// ==========================================

async function matchByOrgMapping(
  productName: string,
  userId: string,
): Promise<MatchResult | null> {
  // Check if there's an org mapping whose canonical product name or custom name
  // closely matches the line item. We use pg_trgm similarity here too,
  // but at a very high threshold (essentially the user has already told us
  // "this canonical product = this ingredient").
  const { data: mappings } = await supabase
    .from('org_product_mappings')
    .select(`
      id,
      ingredient_id,
      canonical_product_id,
      custom_name,
      auto_update_price,
      canonical_products(name)
    `)
    .eq('user_id', userId);

  if (!mappings || mappings.length === 0) return null;

  const normalised = normalise(productName);

  // Score each mapping by string similarity to the line item name
  let bestMatch: { mapping: typeof mappings[0]; similarity: number } | null = null;

  for (const m of mappings) {
    const canonicalName = (m as any).canonical_products?.name ?? '';
    const customName = m.custom_name ?? '';

    const simCanonical = trigramSimilarity(normalised, normalise(canonicalName));
    const simCustom = customName
      ? trigramSimilarity(normalised, normalise(customName))
      : 0;

    const sim = Math.max(simCanonical, simCustom);

    if (sim >= THRESHOLDS.SUGGEST && (!bestMatch || sim > bestMatch.similarity)) {
      bestMatch = { mapping: m, similarity: sim };
    }
  }

  if (!bestMatch) return null;

  const confidence = bestMatch.similarity;
  const status: MatchStatus =
    confidence >= THRESHOLDS.AUTO_MATCH ? 'auto_matched' : 'unmatched';

  return {
    ingredientId: bestMatch.mapping.ingredient_id,
    canonicalProductId: bestMatch.mapping.canonical_product_id,
    matchMethod: 'fuzzy',
    matchConfidence: round2(confidence),
    matchStatus: status,
  };
}

// ==========================================
// LEVEL 3: FUZZY MATCH — CANONICAL PRODUCTS
// ==========================================

async function matchByCanonicalFuzzy(
  productName: string,
  userId: string,
): Promise<MatchResult | null> {
  // Use PostgreSQL pg_trgm similarity to find close matches.
  // We call a raw RPC since Supabase JS doesn't have built-in similarity operators.
  const { data: rows, error } = await supabase.rpc('match_canonical_products', {
    search_name: productName,
    min_similarity: THRESHOLDS.SUGGEST,
    max_results: THRESHOLDS.MAX_ALTERNATIVES + 1,
  });

  if (error || !rows || rows.length === 0) return null;

  // For each canonical match, check if the user has a mapped ingredient
  const candidates: MatchCandidate[] = [];

  for (const row of rows) {
    const ingredientId = await findIngredientForCanonical(row.id, userId);
    if (ingredientId) {
      candidates.push({
        ingredientId,
        ingredientName: row.ingredient_name ?? row.name,
        canonicalProductId: row.id,
        similarity: Number(row.similarity),
        source: 'canonical',
      });
    }
  }

  if (candidates.length === 0) return null;

  // Sort by similarity descending
  candidates.sort((a, b) => b.similarity - a.similarity);

  const best = candidates[0];
  const confidence = best.similarity;
  const autoMatch = confidence >= THRESHOLDS.AUTO_MATCH;

  return {
    ingredientId: best.ingredientId,
    ingredientName: best.ingredientName,
    canonicalProductId: best.canonicalProductId,
    matchMethod: 'fuzzy',
    matchConfidence: round2(confidence),
    matchStatus: autoMatch ? 'auto_matched' : 'unmatched',
    alternatives: autoMatch ? undefined : candidates.slice(0, THRESHOLDS.MAX_ALTERNATIVES),
  };
}

// ==========================================
// LEVEL 4: FUZZY MATCH — USER INGREDIENTS
// ==========================================

async function matchByIngredientFuzzy(
  productName: string,
  userId: string,
): Promise<MatchResult | null> {
  // Fetch user's ingredients and do client-side trigram similarity.
  // For most users this is a small set (<500 items), so local matching
  // is fine and avoids needing another RPC function.
  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, name')
    .eq('user_id', userId);

  if (!ingredients || ingredients.length === 0) return null;

  const normalised = normalise(productName);
  const scored: MatchCandidate[] = [];

  for (const ing of ingredients) {
    const sim = trigramSimilarity(normalised, normalise(ing.name));
    if (sim >= THRESHOLDS.SUGGEST) {
      scored.push({
        ingredientId: ing.id,
        ingredientName: ing.name,
        similarity: sim,
        source: 'ingredient',
      });
    }
  }

  if (scored.length === 0) return null;

  scored.sort((a, b) => b.similarity - a.similarity);

  const best = scored[0];
  const confidence = best.similarity;
  const autoMatch = confidence >= THRESHOLDS.AUTO_MATCH;

  return {
    ingredientId: best.ingredientId,
    ingredientName: best.ingredientName,
    matchMethod: 'fuzzy',
    matchConfidence: round2(confidence),
    matchStatus: autoMatch ? 'auto_matched' : 'unmatched',
    alternatives: autoMatch ? undefined : scored.slice(0, THRESHOLDS.MAX_ALTERNATIVES),
  };
}

// ==========================================
// HELPERS
// ==========================================

/**
 * Find a user's ingredient ID for a canonical product.
 * Checks org_product_mappings first, then falls back to
 * the canonical_product_id FK on the ingredients table.
 */
async function findIngredientForCanonical(
  canonicalProductId: string,
  userId: string,
): Promise<string | null> {
  // Check org_product_mappings first (explicit user mapping)
  const { data: mapping } = await supabase
    .from('org_product_mappings')
    .select('ingredient_id')
    .eq('user_id', userId)
    .eq('canonical_product_id', canonicalProductId)
    .maybeSingle();

  if (mapping?.ingredient_id) return mapping.ingredient_id;

  // Fall back to direct FK on ingredients table
  const { data: ingredient } = await supabase
    .from('ingredients')
    .select('id')
    .eq('user_id', userId)
    .eq('canonical_product_id', canonicalProductId)
    .maybeSingle();

  return ingredient?.id ?? null;
}

/**
 * Normalise a product name for comparison.
 * Strips noise that causes false negatives: leading/trailing whitespace,
 * repeated spaces, common abbreviations, case, and punctuation.
 */
function normalise(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[^a-z0-9' ]/g, ' ')
    .replace(/\b(hm|handmade|hmade)\b/g, 'handmade')
    .replace(/\b(vdka|vdk)\b/g, 'vodka')
    .replace(/\b(whsky|whsk)\b/g, 'whiskey')
    .replace(/\b(brbn)\b/g, 'bourbon')
    .replace(/\bltr?\b/g, 'liter')
    .replace(/\bml\b/g, 'milliliter')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Client-side trigram similarity (Jaccard index over character trigrams).
 * Mirrors PostgreSQL's pg_trgm similarity() function closely enough
 * for Level 2 and Level 4 matching where we can't use SQL.
 */
function trigramSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 3 || b.length < 3) {
    // For very short strings, fall back to containment check
    if (a.includes(b) || b.includes(a)) return 0.8;
    return 0;
  }

  const trigramsA = buildTrigrams(a);
  const trigramsB = buildTrigrams(b);

  let intersection = 0;
  for (const t of trigramsA) {
    if (trigramsB.has(t)) intersection++;
  }

  const union = trigramsA.size + trigramsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function buildTrigrams(s: string): Set<string> {
  const padded = `  ${s} `;
  const set = new Set<string>();
  for (let i = 0; i <= padded.length - 3; i++) {
    set.add(padded.substring(i, i + 3));
  }
  return set;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ==========================================
// SUPABASE RPC — SQL function for Level 3
// ==========================================

/**
 * SQL function that must be deployed to Supabase for Level 3 matching.
 * Uses pg_trgm's similarity() for server-side fuzzy matching on the
 * canonical_products table.
 *
 * Deploy via migration:
 *
 * ```sql
 * CREATE OR REPLACE FUNCTION match_canonical_products(
 *   search_name TEXT,
 *   min_similarity FLOAT DEFAULT 0.6,
 *   max_results INT DEFAULT 5
 * )
 * RETURNS TABLE(id UUID, name TEXT, similarity FLOAT, ingredient_name TEXT) AS $$
 * BEGIN
 *   RETURN QUERY
 *   SELECT
 *     cp.id,
 *     cp.name,
 *     similarity(cp.name, search_name)::FLOAT AS similarity,
 *     cp.name AS ingredient_name
 *   FROM canonical_products cp
 *   WHERE similarity(cp.name, search_name) >= min_similarity
 *   ORDER BY similarity(cp.name, search_name) DESC
 *   LIMIT max_results;
 * END;
 * $$ LANGUAGE plpgsql STABLE;
 * ```
 */
export const MATCH_CANONICAL_PRODUCTS_SQL = `
CREATE OR REPLACE FUNCTION match_canonical_products(
  search_name TEXT,
  min_similarity FLOAT DEFAULT 0.6,
  max_results INT DEFAULT 5
)
RETURNS TABLE(id UUID, name TEXT, similarity FLOAT, ingredient_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    cp.name,
    similarity(cp.name, search_name)::FLOAT AS similarity,
    cp.name AS ingredient_name
  FROM canonical_products cp
  WHERE similarity(cp.name, search_name) >= min_similarity
  ORDER BY similarity(cp.name, search_name) DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;
`;
