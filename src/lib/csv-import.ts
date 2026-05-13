import Papa from 'papaparse';
import { supabase } from './supabase';
import { PRODUCT_SIZES, INGREDIENT_TYPES } from '@/src/constants/appConstants';
import { volumeLabel } from '@/src/types/models';
import type { Volume } from '@/src/types/models';

// ==========================================
// NORMALIZATION HELPERS
// ==========================================

function isAllCaps(s: string): boolean {
  return s.length > 3 && s === s.toUpperCase() && /[A-Z]{3}/.test(s);
}

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// ==========================================
// TEMPLATE
// ==========================================

export const CSV_TEMPLATE_FILENAME = 'pourcost_import_template.csv';

export const CSV_TEMPLATE_CONTENT = [
  'name,type,sub_type,bottle_size,cost,abv,brand,distributor,pack_size,pack_cost',
  "Tito's Handmade Vodka,Spirit,Vodka,750,22.99,40,Tito's,Republic National,,",
  'Bud Light,Beer,Lager,355,,4.2,Anheuser-Busch,Reyes Beverage,24,36.00',
  'Kim Crawford Sauvignon Blanc,Wine,White,750,14.99,12.5,Kim Crawford,Southern Glazers,,',
  'Monin Simple Syrup,Non-Alc,Syrup,1000,12.99,,Monin,Sysco,,',
  'Half Barrel IPA,Beer,IPA,Half Barrel,165.00,6.8,Local Brewing Co,,,',
].join('\n');

// ==========================================
// TYPES
// ==========================================

export interface CsvImportRow {
  rowIndex: number;
  name: string;
  type: string;
  subType?: string;
  productSize: Volume;
  productCost: number;
  abv?: number;
  brand?: string;
  distributor?: string;
  packSize?: number;
  packCost?: number;
  canonicalProductId?: string;
  /** True when no cost was provided — imported with productCost=0, user updates in-app. */
  needsCostUpdate: boolean;
  /** True when this name already appeared earlier in the CSV — adds a config to the
   *  existing ingredient instead of creating a new one. */
  isDuplicateConfig: boolean;
  errors: string[];
}

export interface CsvParseResult {
  rows: CsvImportRow[];
  validCount: number;
  errorCount: number;
}

// ==========================================
// VOLUME PARSING
// ==========================================

function parseBottleSize(raw: string): Volume | null {
  const trimmed = raw.trim();

  // Numeric → milliliters
  const asNum = parseFloat(trimmed);
  if (!isNaN(asNum) && asNum > 0) {
    return { kind: 'milliliters', ml: asNum };
  }

  // Named size matching volumeLabel() output (case-insensitive)
  return PRODUCT_SIZES.find(
    (s) => volumeLabel(s).toLowerCase() === trimmed.toLowerCase(),
  ) ?? null;
}

// ==========================================
// PARSE
// ==========================================

export function parseCSV(content: string): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(content.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/[\s-]+/g, '_'),
  });

  const rows: CsvImportRow[] = parsed.data.map((raw, idx) => {
    const rowIndex = idx + 2;
    const errors: string[] = [];

    const rawName = raw['name']?.trim() ?? '';
    const name = isAllCaps(rawName) ? toTitleCase(rawName) : rawName;
    if (!name) errors.push('name required');

    const typeRaw = raw['type']?.trim() ?? '';
    const matchedType = INGREDIENT_TYPES.find(
      (t) => t.toLowerCase() === typeRaw.toLowerCase(),
    );
    if (!typeRaw) {
      errors.push('type required');
    } else if (!matchedType) {
      errors.push(`"${typeRaw}" not a valid type`);
    }

    const sizeRaw = raw['bottle_size']?.trim() ?? '';
    let productSize: Volume;
    if (!sizeRaw) {
      productSize = { kind: 'freeForm', label: 'Update Required' };
    } else {
      const parsedSize = parseBottleSize(sizeRaw);
      productSize = parsedSize ?? { kind: 'freeForm', label: sizeRaw };
    }

    // ── pack fields ──────────────────────────────────────────────────────
    const packSizeRaw = raw['pack_size']?.trim() ?? '';
    const packCostRaw = raw['pack_cost']?.trim() ?? '';

    const rawPackSize = packSizeRaw ? parseInt(packSizeRaw, 10) : undefined;
    const packSize = rawPackSize ?? 1;
    const rawPackCost = packCostRaw ? parseFloat(packCostRaw) : undefined;

    if (packSizeRaw && (isNaN(packSize) || packSize < 1)) {
      errors.push(`pack_size "${packSizeRaw}" must be a positive integer`);
    }
    if (packCostRaw && (rawPackCost === undefined || isNaN(rawPackCost) || rawPackCost < 0)) {
      errors.push(`pack_cost "${packCostRaw}" must be a number`);
    }

    // ── cost: direct, computed from pack, or flagged for update ──────────
    const costRaw = raw['cost']?.trim() ?? '';
    let productCost = 0;
    let needsCostUpdate = false;
    if (costRaw) {
      const parsed = parseFloat(costRaw);
      if (isNaN(parsed) || parsed < 0) {
        errors.push(`cost "${costRaw}" must be a number`);
      } else {
        productCost = parsed;
      }
    } else if (rawPackCost !== undefined && !isNaN(rawPackCost) && rawPackCost >= 0) {
      // Derive unit cost from pack price
      productCost = rawPackCost / packSize;
    } else {
      // No cost provided — import with $0, flag for update
      needsCostUpdate = true;
    }

    const abvRaw = raw['abv']?.trim();
    const abv = abvRaw ? parseFloat(abvRaw) : undefined;

    const rawBrand = raw['brand']?.trim() || undefined;
    const brand = rawBrand && isAllCaps(rawBrand) ? toTitleCase(rawBrand) : rawBrand;

    const rawDistributor = raw['distributor']?.trim() || undefined;
    const distributor = rawDistributor && isAllCaps(rawDistributor)
      ? toTitleCase(rawDistributor)
      : rawDistributor;

    return {
      rowIndex,
      name: name || '',
      type: matchedType ?? typeRaw,
      subType: raw['sub_type']?.trim() || undefined,
      productSize,
      productCost,
      abv: abv !== undefined && !isNaN(abv) ? abv : undefined,
      brand,
      distributor,
      packSize: rawPackSize !== undefined && !isNaN(rawPackSize) ? rawPackSize : undefined,
      packCost: rawPackCost !== undefined && !isNaN(rawPackCost) ? rawPackCost : undefined,
      needsCostUpdate,
      isDuplicateConfig: false,
      errors,
    };
  });

  // Mark rows whose name already appeared earlier — they add configs, not new ingredients
  const seenNames = new Set<string>();
  for (const row of rows) {
    const key = row.name.toLowerCase();
    if (key && row.errors.length === 0) {
      if (seenNames.has(key)) {
        row.isDuplicateConfig = true;
      } else {
        seenNames.add(key);
      }
    }
  }

  const validCount = rows.filter((r) => r.errors.length === 0).length;
  return { rows, validCount, errorCount: rows.length - validCount };
}

// ==========================================
// CANONICAL MATCHING
// ==========================================

/** Enrich valid rows with canonical_product_id where a name match exists.
 *  Runs parallel lookups per unique name; mutates rows in place. */
export async function matchCanonicalsForRows(rows: CsvImportRow[]): Promise<void> {
  const validRows = rows.filter((r) => r.errors.length === 0 && r.name);
  if (validRows.length === 0) return;

  const uniqueNames = [...new Set(validRows.map((r) => r.name))];

  await Promise.all(
    uniqueNames.map(async (name) => {
      const { data } = await supabase
        .from('canonical_products')
        .select('id')
        .ilike('name', name)
        .limit(1)
        .maybeSingle();

      if (data) {
        const id = (data as { id: string }).id;
        validRows
          .filter((r) => r.name.toLowerCase() === name.toLowerCase())
          .forEach((r) => { r.canonicalProductId = id; });
      }
    }),
  );
}

// ==========================================
// CONFIGURATION SAVE
// ==========================================

/** Write an ingredient_configurations row for an imported ingredient.
 *  isDefault=true for the first/primary config; false for additional pack configs. */
export async function saveRowConfiguration(
  ingredientId: string,
  row: CsvImportRow,
  isDefault: boolean,
): Promise<void> {
  await supabase.from('ingredient_configurations').insert({
    ingredient_id: ingredientId,
    product_size: row.productSize,
    product_cost: row.productCost,
    pack_size: row.packSize ?? 1,
    pack_cost: row.packCost ?? null,
    distributor_name: row.distributor ?? null,
    is_default: isDefault,
    source: 'csv_import',
  });
}

// ==========================================
// PENDING PIPELINE
// ==========================================

type CanonicalRow = { id: string; default_sizes: Array<{ kind: string; ml?: number }> | null };

/** For canonical-matched rows, enqueue size/pack sightings not yet in the
 *  canonical's default_sizes. Batch-fetches canonicals then batch-upserts. */
export async function enqueuePendingSightings(rows: CsvImportRow[]): Promise<void> {
  const sightingRows = rows.filter(
    (r) => r.canonicalProductId && r.productSize.kind === 'milliliters',
  );
  if (sightingRows.length === 0) return;

  const uniqueIds = [...new Set(sightingRows.map((r) => r.canonicalProductId!))];

  const { data: canonicals } = await supabase
    .from('canonical_products')
    .select('id, default_sizes')
    .in('id', uniqueIds);

  const knownSizesMap = new Map<string, number[]>();
  for (const c of (canonicals ?? []) as CanonicalRow[]) {
    const mls = (c.default_sizes ?? [])
      .filter((v) => v.kind === 'milliliters' && v.ml != null)
      .map((v) => v.ml!);
    knownSizesMap.set(c.id, mls);
  }

  const now = new Date().toISOString();
  const sizeSightings: Array<{ canonical_product_id: string; size_ml: number; last_seen_at: string }> = [];
  const packSightings: Array<{ canonical_product_id: string; size_ml: number; pack_size: number; last_seen_at: string }> = [];

  for (const row of sightingRows) {
    if (row.productSize.kind !== 'milliliters') continue;
    const ml = row.productSize.ml;
    const known = knownSizesMap.get(row.canonicalProductId!) ?? [];

    if (!known.includes(ml)) {
      sizeSightings.push({ canonical_product_id: row.canonicalProductId!, size_ml: ml, last_seen_at: now });
    }

    const packSize = row.packSize ?? 1;
    if (packSize > 1) {
      packSightings.push({ canonical_product_id: row.canonicalProductId!, size_ml: ml, pack_size: packSize, last_seen_at: now });
    }
  }

  // Deduplicate by conflict key before upserting
  const dedupSize = [...new Map(sizeSightings.map((s) => [`${s.canonical_product_id}:${s.size_ml}`, s])).values()];
  const dedupPack = [...new Map(packSightings.map((s) => [`${s.canonical_product_id}:${s.size_ml}:${s.pack_size}`, s])).values()];

  if (dedupSize.length > 0) {
    await supabase.from('pending_canonical_sizes')
      .upsert(dedupSize, { onConflict: 'canonical_product_id,size_ml' });
  }
  if (dedupPack.length > 0) {
    await supabase.from('pending_canonical_pack_sizes')
      .upsert(dedupPack, { onConflict: 'canonical_product_id,size_ml,pack_size' });
  }
}
