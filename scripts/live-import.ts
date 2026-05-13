/**
 * Live CSV import: parse friend_bar_inventory.csv and seed ingredients +
 * configurations for a given user into Supabase.
 *
 * Usage:
 *   npx tsx scripts/live-import.ts [path/to/file.csv] [user-id]
 *
 * Defaults:
 *   CSV  → docs/friend_bar_inventory.csv
 *   user → IMPORT_USER_ID env var (or pass as second arg)
 *
 * Dry-run first:
 *   npx tsx scripts/dry-run-import.ts docs/friend_bar_inventory.csv
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import { PRODUCT_SIZES, INGREDIENT_TYPES } from '../src/constants/appConstants';
import { volumeLabel } from '../src/types/models';
import type { Volume } from '../src/types/models';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const CSV_PATH = process.argv[2] ?? path.resolve(__dirname, '../docs/friend_bar_inventory.csv');
const USER_ID  = process.argv[3] ?? process.env.IMPORT_USER_ID;

// ── helpers ──────────────────────────────────────────────────────────────────

function isAllCaps(s: string): boolean {
  return s.length > 3 && s === s.toUpperCase() && /[A-Z]{3}/.test(s);
}

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseBottleSize(raw: string): Volume | null {
  const trimmed = raw.trim();
  const asNum = parseFloat(trimmed);
  if (!isNaN(asNum) && asNum > 0) return { kind: 'milliliters', ml: asNum };
  return PRODUCT_SIZES.find(
    (s) => volumeLabel(s).toLowerCase() === trimmed.toLowerCase(),
  ) ?? null;
}

// ── parse ────────────────────────────────────────────────────────────────────

interface ImportRow {
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
  needsCostUpdate: boolean;
  isDuplicateConfig: boolean;
  errors: string[];
}

function parseCSVFile(content: string): ImportRow[] {
  const parsed = Papa.parse<Record<string, string>>(content.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/[\s-]+/g, '_'),
  });

  const rows: ImportRow[] = parsed.data.map((raw, idx) => {
    const rowIndex = idx + 2;
    const errors: string[] = [];

    const rawName = raw['name']?.trim() ?? '';
    const name = isAllCaps(rawName) ? toTitleCase(rawName) : rawName;
    if (!name) errors.push('name required');

    const typeRaw = raw['type']?.trim() ?? '';
    const matchedType = INGREDIENT_TYPES.find((t) => t.toLowerCase() === typeRaw.toLowerCase());
    if (!typeRaw) errors.push('type required');
    else if (!matchedType) errors.push(`type "${typeRaw}" unrecognized`);

    const sizeRaw = raw['bottle_size']?.trim() ?? '';
    let productSize: Volume;
    if (!sizeRaw) {
      productSize = { kind: 'freeForm', label: 'Update Required' };
    } else {
      const parsed = parseBottleSize(sizeRaw);
      productSize = parsed ?? { kind: 'freeForm', label: sizeRaw };
    }

    const packSizeRaw = raw['pack_size']?.trim() ?? '';
    const packCostRaw = raw['pack_cost']?.trim() ?? '';
    const rawPackSize = packSizeRaw ? parseInt(packSizeRaw, 10) : undefined;
    const packSize = rawPackSize ?? 1;
    const rawPackCost = packCostRaw ? parseFloat(packCostRaw) : undefined;

    if (packSizeRaw && (isNaN(packSize) || packSize < 1))
      errors.push(`pack_size "${packSizeRaw}" must be a positive integer`);
    if (packCostRaw && (rawPackCost === undefined || isNaN(rawPackCost) || rawPackCost < 0))
      errors.push(`pack_cost "${packCostRaw}" must be a number`);

    const costRaw = raw['cost']?.trim() ?? '';
    let productCost = 0;
    let needsCostUpdate = false;
    if (costRaw) {
      const c = parseFloat(costRaw);
      if (isNaN(c) || c < 0) errors.push(`cost "${costRaw}" must be a number`);
      else productCost = c;
    } else if (rawPackCost !== undefined && !isNaN(rawPackCost) && rawPackCost >= 0) {
      productCost = rawPackCost / packSize;
    } else {
      needsCostUpdate = true;
    }

    const abvRaw = raw['abv']?.trim();
    const abv = abvRaw ? parseFloat(abvRaw) : undefined;

    const rawBrand = raw['brand']?.trim() || undefined;
    const brand = rawBrand && isAllCaps(rawBrand) ? toTitleCase(rawBrand) : rawBrand;

    const rawDistributor = raw['distributor']?.trim() || undefined;
    const distributor = rawDistributor && isAllCaps(rawDistributor)
      ? toTitleCase(rawDistributor) : rawDistributor;

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

  // Mark duplicate-name rows as extra configs
  const seenNames = new Set<string>();
  for (const row of rows) {
    const key = row.name.toLowerCase();
    if (key && row.errors.length === 0) {
      if (seenNames.has(key)) row.isDuplicateConfig = true;
      else seenNames.add(key);
    }
  }

  return rows;
}

// ── canonical matching ───────────────────────────────────────────────────────

async function matchCanonicals(rows: ImportRow[]): Promise<Map<string, string>> {
  const validNames = [...new Set(
    rows.filter((r) => r.errors.length === 0 && r.name).map((r) => r.name),
  )];

  const nameToCanonicalId = new Map<string, string>();
  await Promise.all(
    validNames.map(async (name) => {
      const { data } = await supabase
        .from('canonical_products')
        .select('id')
        .ilike('name', name)
        .limit(1)
        .maybeSingle();
      if (data) nameToCanonicalId.set(name.toLowerCase(), (data as any).id);
    }),
  );
  return nameToCanonicalId;
}

// ── user-owned canonical creation (low-confidence first pass) ────────────────

/**
 * Map user-side type + sub_type to canonical category. User-side `type` is the
 * chip vocab (Spirit/Wine/Beer/Non-Alc/Garnish/Prepped/Other); canonical
 * category is more granular (Liqueur/Vermouth/Bitters/etc. as siblings of
 * Spirit). Mirrors the logic in migration 027.
 */
function mapTypeToCanonicalCategory(type: string, subType?: string): string {
  if (type === 'Spirit') {
    if (subType === 'Liqueur' || subType === 'Amaro') return 'Liqueur';
    if (subType === 'Vermouth') return 'Vermouth';
    if (subType === 'Bitters') return 'Bitters';
    return 'Spirit';
  }
  if (type === 'Non-Alc') {
    if (subType && ['Mixer','Syrup','Juice','Garnish','Dairy','Egg','Spice','Herb'].includes(subType)) {
      return subType;
    }
    return 'Mixer'; // 'Other' catchall
  }
  if (type === 'Garnish') return 'Garnish';
  if (type === 'Prepped') return 'Prepped';
  if (type === 'Beer') return 'Beer';
  if (type === 'Wine') return 'Wine';
  return type;
}

/**
 * Map user-side sub_type to canonical subcategory for the layers where
 * user vocab aligns with canonical vocab (Wine/Beer). Spirit chip subs
 * (Vodka/Whiskey/Rum/etc.) are too coarse to map to specific canonical
 * subcategories (Bourbon vs Rye, White Rum vs Aged Rum) — leave NULL,
 * Gemini fills on enrichment pass.
 */
function mapSubTypeToCanonicalSubcategory(type: string, subType?: string): string | null {
  if (!subType) return null;
  if (type === 'Wine' && ['Red','White','Rosé','Sparkling','Fortified'].includes(subType)) {
    return subType;
  }
  if (type === 'Beer' && [
    'Lager','Pilsner','IPA','Pale Ale','Amber','Stout','Porter','Wheat',
    'Sour','Belgian','Ale','Cider','Hard Seltzer','Other',
  ].includes(subType)) {
    return subType;
  }
  return null;
}

async function createUserCanonical(row: ImportRow, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('canonical_products')
    .insert({
      name: row.name,
      brand: row.brand ?? null,
      category: mapTypeToCanonicalCategory(row.type, row.subType),
      subcategory: mapSubTypeToCanonicalSubcategory(row.type, row.subType),
      abv: row.abv ?? null,
      default_sizes: [row.productSize],
      owner_type: 'user',
      owner_org_id: userId,
      enrichment_status: 'pending',
    })
    .select('id')
    .single();

  if (error || !data) {
    console.warn(`  Failed to create user canonical for "${row.name}": ${error?.message}`);
    return null;
  }
  return (data as any).id;
}

// ── import ───────────────────────────────────────────────────────────────────

async function main() {
  if (!USER_ID) {
    console.error('No user ID. Pass as second arg or set IMPORT_USER_ID env var.');
    process.exit(1);
  }
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`File not found: ${CSV_PATH}`);
    process.exit(1);
  }

  console.log(`\nImporting: ${CSV_PATH}`);
  console.log(`User:      ${USER_ID}`);
  console.log('─'.repeat(60));

  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows = parseCSVFile(content);
  const validRows = rows.filter((r) => r.errors.length === 0);
  const errorRows = rows.filter((r) => r.errors.length > 0);

  console.log(`Total rows:    ${rows.length}`);
  console.log(`Valid:         ${validRows.length}`);
  console.log(`Parse errors:  ${errorRows.length}  (will be skipped)`);
  console.log(`Needs price:   ${validRows.filter((r) => r.needsCostUpdate).length}`);
  console.log(`Extra configs: ${validRows.filter((r) => r.isDuplicateConfig).length}`);
  console.log('\nMatching canonicals…');

  const canonicalMap = await matchCanonicals(rows);
  console.log(`Canonical matches: ${canonicalMap.size}`);
  console.log('\nImporting…');

  let created = 0;
  let configs = 0;
  let skipped = 0;
  let userCanonicalsCreated = 0;
  const nameToIngredientId = new Map<string, string>();
  // Cache of user-owned canonicals created during this run, so a CSV with
  // multiple Tito's rows shares one user canonical instead of N duplicates.
  const createdCanonicals = new Map<string, string>();
  const now = new Date().toISOString();

  // Pending sightings for canonical-matched rows
  const sizeSightings: Array<{ canonical_product_id: string; size_ml: number; last_seen_at: string }> = [];
  const packSightings: Array<{ canonical_product_id: string; size_ml: number; pack_size: number; last_seen_at: string }> = [];

  for (const row of validRows) {
    const nameKey = row.name.toLowerCase();
    let canonicalId = canonicalMap.get(nameKey) ?? createdCanonicals.get(nameKey);

    // Low-confidence first pass: if no canonical exists, create a user-owned
    // canonical (subcategory NULL until Gemini enrichment) and link to it.
    // Only do this for the first occurrence of a name; duplicate-config rows
    // reuse the same canonical via the createdCanonicals cache.
    if (!canonicalId && !row.isDuplicateConfig) {
      const newId = await createUserCanonical(row, USER_ID!);
      if (newId) {
        canonicalId = newId;
        createdCanonicals.set(nameKey, newId);
        userCanonicalsCreated++;
      }
    }

    try {
      if (row.isDuplicateConfig) {
        const existingId = nameToIngredientId.get(row.name.toLowerCase());
        if (!existingId) { skipped++; continue; }
        await supabase.from('ingredient_configurations').insert({
          ingredient_id: existingId,
          product_size: row.productSize,
          product_cost: row.productCost,
          pack_size: row.packSize ?? 1,
          pack_cost: row.packCost ?? null,
          distributor_name: row.distributor ?? null,
          is_default: false,
          source: 'csv_import',
        });
        configs++;
      } else {
        const { data: ing, error } = await supabase
          .from('ingredients')
          .insert({
            user_id: USER_ID,
            name: row.name,
            type: row.type,
            sub_type: row.subType ?? null,
            product_size: row.productSize,
            product_cost: row.productCost,
            abv: row.abv ?? null,
            brand: row.brand ?? null,
            canonical_product_id: canonicalId ?? null,
          })
          .select('id')
          .single();

        if (error || !ing) throw error ?? new Error('No id returned');

        nameToIngredientId.set(row.name.toLowerCase(), ing.id);

        await supabase.from('ingredient_configurations').insert({
          ingredient_id: ing.id,
          product_size: row.productSize,
          product_cost: row.productCost,
          pack_size: row.packSize ?? 1,
          pack_cost: row.packCost ?? null,
          distributor_name: row.distributor ?? null,
          is_default: true,
          source: 'csv_import',
        });

        created++;

        // Collect size sightings for canonical-matched rows
        if (canonicalId && row.productSize.kind === 'milliliters') {
          sizeSightings.push({ canonical_product_id: canonicalId, size_ml: row.productSize.ml, last_seen_at: now });
          if (row.packSize && row.packSize > 1) {
            packSightings.push({ canonical_product_id: canonicalId, size_ml: row.productSize.ml, pack_size: row.packSize, last_seen_at: now });
          }
        }
      }
    } catch (err: any) {
      console.warn(`  Row ${row.rowIndex} failed: ${err?.message ?? err}`);
      skipped++;
    }

    if ((created + configs + skipped) % 50 === 0) {
      process.stdout.write(`  ${created + configs} saved, ${skipped} skipped…\r`);
    }
  }

  // Upsert size/pack sightings
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

  console.log('\n' + '═'.repeat(60));
  console.log('IMPORT COMPLETE');
  console.log('═'.repeat(60));
  console.log(`Ingredients created:    ${created}`);
  console.log(`Extra configs written:  ${configs}`);
  console.log(`User canonicals created (low-confidence first pass): ${userCanonicalsCreated}`);
  console.log(`Skipped (errors):       ${skipped}`);
  console.log(`Canonical size sightings enqueued: ${dedupSize.length}`);
  console.log(`Canonical pack sightings enqueued: ${dedupPack.length}`);

  if (errorRows.length > 0) {
    console.log('\nSkipped parse-error rows:');
    for (const r of errorRows) {
      console.log(`  Row ${r.rowIndex}: ${r.name || '(no name)'} — ${r.errors.join(', ')}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
