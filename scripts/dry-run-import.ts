/**
 * Dry-run the CSV import pipeline against friend_bar_inventory.csv.
 * Reads, parses, validates, and runs exact canonical matching.
 * Writes NOTHING to the database.
 *
 * Usage: npx tsx scripts/dry-run-import.ts [path/to/file.csv]
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

function parseSizeWithFallback(sizeRaw: string): { size: Volume; needsUpdate: boolean } {
  if (!sizeRaw) return { size: { kind: 'freeForm', label: 'Update Required' }, needsUpdate: true };
  const parsed = parseBottleSize(sizeRaw);
  if (parsed) return { size: parsed, needsUpdate: false };
  return { size: { kind: 'freeForm', label: sizeRaw }, needsUpdate: true };
}

// ── parse ────────────────────────────────────────────────────────────────────

interface ParsedRow {
  rowIndex: number;
  rawName: string;
  name: string;
  type: string;
  subType?: string;
  productSize: Volume;
  needsSizeUpdate: boolean;
  productCost: number;
  abv?: number;
  brand?: string;
  distributor?: string;
  packSize?: number;
  packCost?: number;
  errors: string[];
  warnings: string[];
}

function parseCSVFile(content: string): ParsedRow[] {
  const parsed = Papa.parse<Record<string, string>>(content.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/[\s-]+/g, '_'),
  });

  return parsed.data.map((raw, idx) => {
    const rowIndex = idx + 2;
    const errors: string[] = [];
    const warnings: string[] = [];

    const rawName = raw['name']?.trim() ?? '';
    const name = isAllCaps(rawName) ? toTitleCase(rawName) : rawName;
    if (!name) errors.push('name required');
    if (isAllCaps(rawName)) warnings.push(`ALL CAPS name → normalized to: "${name}"`);

    const typeRaw = raw['type']?.trim() ?? '';
    const matchedType = INGREDIENT_TYPES.find((t) => t.toLowerCase() === typeRaw.toLowerCase());
    if (!typeRaw) errors.push('type required');
    else if (!matchedType) errors.push(`type "${typeRaw}" unrecognized`);

    const sizeRaw = raw['bottle_size']?.trim() ?? '';
    const { size: productSize, needsUpdate: needsSizeUpdate } = parseSizeWithFallback(sizeRaw);
    if (needsSizeUpdate) {
      warnings.push(sizeRaw
        ? `bottle_size "${sizeRaw}" unrecognized → freeForm placeholder; user must update in-app`
        : 'no bottle_size → freeForm placeholder; user must update in-app');
    }

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

    const costRaw = raw['cost']?.trim() ?? '';
    let productCost = 0;
    if (costRaw) {
      const parsed = parseFloat(costRaw);
      if (isNaN(parsed) || parsed < 0) errors.push(`cost "${costRaw}" must be a number`);
      else productCost = parsed;
    } else if (rawPackCost !== undefined && !isNaN(rawPackCost) && rawPackCost >= 0) {
      productCost = rawPackCost / packSize;
    } else {
      errors.push('cost required (or provide pack_cost to compute)');
    }

    const abvRaw = raw['abv']?.trim();
    const abv = abvRaw ? parseFloat(abvRaw) : undefined;

    const rawBrand = raw['brand']?.trim() || undefined;
    const brand = rawBrand && isAllCaps(rawBrand) ? toTitleCase(rawBrand) : rawBrand;
    if (rawBrand && isAllCaps(rawBrand)) warnings.push(`ALL CAPS brand → normalized to: "${brand}"`);

    const rawDistributor = raw['distributor']?.trim() || undefined;
    const distributor = rawDistributor && isAllCaps(rawDistributor)
      ? toTitleCase(rawDistributor)
      : rawDistributor;
    if (rawDistributor && isAllCaps(rawDistributor)) {
      warnings.push(`ALL CAPS distributor → normalized to: "${distributor}"`);
    }

    return {
      rowIndex,
      rawName,
      name,
      type: matchedType ?? typeRaw,
      subType: raw['sub_type']?.trim() || undefined,
      productSize,
      needsSizeUpdate,
      productCost,
      abv: abv !== undefined && !isNaN(abv) ? abv : undefined,
      brand,
      distributor,
      packSize: rawPackSize !== undefined && !isNaN(rawPackSize) ? rawPackSize : undefined,
      packCost: rawPackCost !== undefined && !isNaN(rawPackCost) ? rawPackCost : undefined,
      errors,
      warnings,
    };
  });
}

// ── canonical matching ───────────────────────────────────────────────────────

async function matchCanonicals(rows: ParsedRow[]): Promise<Map<string, { id: string; name: string }>> {
  const validNames = [...new Set(
    rows.filter((r) => r.errors.length === 0 && r.name).map((r) => r.name),
  )];

  const results = new Map<string, { id: string; name: string }>();

  await Promise.all(
    validNames.map(async (name) => {
      const { data } = await supabase
        .from('canonical_products')
        .select('id, name')
        .ilike('name', name)
        .limit(1)
        .maybeSingle();
      if (data) {
        results.set(name.toLowerCase(), { id: (data as any).id, name: (data as any).name });
      }
    }),
  );

  return results;
}

// ── report ───────────────────────────────────────────────────────────────────

type MatchStatus = 'exact_match' | 'no_match' | 'parse_error' | 'needs_size';

interface RowReport {
  row: number;
  name: string;
  type: string;
  sub_type: string;
  bottle_size: string;
  cost: string;
  abv: string;
  match_status: MatchStatus;
  canonical_id?: string;
  canonical_name?: string;
  errors: string[];
  warnings: string[];
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`File not found: ${CSV_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  console.log(`\nParsing: ${CSV_PATH}`);
  console.log('─'.repeat(60));

  const rows = parseCSVFile(content);
  const validRows = rows.filter((r) => r.errors.length === 0);

  console.log(`Total rows:   ${rows.length}`);
  console.log(`Valid:        ${validRows.length}`);
  console.log(`Parse errors: ${rows.length - validRows.length}`);
  console.log('\nMatching canonicals (exact ilike)…');

  const canonicalMap = await matchCanonicals(rows);

  const report: RowReport[] = rows.map((row) => {
    const key = row.name.toLowerCase();
    const canonical = canonicalMap.get(key);

    let match_status: MatchStatus;
    if (row.errors.length > 0) match_status = 'parse_error';
    else if (canonical) match_status = row.needsSizeUpdate ? 'needs_size' : 'exact_match';
    else match_status = row.needsSizeUpdate ? 'needs_size' : 'no_match';

    return {
      row: row.rowIndex,
      name: row.name,
      type: row.type,
      sub_type: row.subType ?? '',
      bottle_size: volumeLabel(row.productSize),
      cost: `$${row.productCost.toFixed(2)}`,
      abv: row.abv != null ? `${row.abv}%` : '',
      match_status,
      canonical_id: canonical?.id,
      canonical_name: canonical?.name,
      errors: row.errors,
      warnings: row.warnings,
    };
  });

  // ── aggregates ──
  const matched = report.filter((r) => r.match_status === 'exact_match');
  const noMatch = report.filter((r) => r.match_status === 'no_match');
  const needsSize = report.filter((r) => r.match_status === 'needs_size');
  const parseErrors = report.filter((r) => r.match_status === 'parse_error');
  const withWarnings = report.filter((r) => r.warnings.length > 0);

  // type breakdown for no_match
  const noMatchByType: Record<string, number> = {};
  for (const r of [...noMatch, ...needsSize]) {
    noMatchByType[r.type] = (noMatchByType[r.type] ?? 0) + 1;
  }

  console.log('\n' + '═'.repeat(60));
  console.log('DRY RUN SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total rows:        ${rows.length}`);
  console.log(`Exact matches:     ${matched.length}`);
  console.log(`New (no match):    ${noMatch.length}`);
  console.log(`Needs size update: ${needsSize.length}  ← imports with freeForm placeholder`);
  console.log(`Parse errors:      ${parseErrors.length}  ← skipped (missing name/type/cost)`);
  console.log(`Warnings:          ${withWarnings.length}  ← ALL CAPS normalized, etc.`);

  console.log('\nNew/needs-size by type:');
  for (const [t, n] of Object.entries(noMatchByType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t.padEnd(12)} ${n}`);
  }

  if (parseErrors.length > 0) {
    console.log('\n' + '─'.repeat(60));
    console.log('PARSE ERRORS (will be skipped on import):');
    for (const r of parseErrors) {
      console.log(`  Row ${r.row}: ${r.name || '(no name)'}`);
      for (const e of r.errors) console.log(`    ✗ ${e}`);
    }
  }

  if (needsSize.length > 0) {
    console.log('\n' + '─'.repeat(60));
    console.log('NEEDS SIZE UPDATE (imports with freeForm placeholder):');
    for (const r of needsSize) {
      console.log(`  Row ${r.row}: ${r.name}  [${r.bottle_size}]`);
    }
  }

  if (withWarnings.length > 0) {
    console.log('\n' + '─'.repeat(60));
    console.log('NORMALIZATION / OTHER WARNINGS:');
    for (const r of withWarnings) {
      if (r.warnings.some(w => !w.includes('freeForm'))) {
        console.log(`  Row ${r.row}: ${r.name}`);
        for (const w of r.warnings.filter(w => !w.includes('freeForm'))) {
          console.log(`    ⚠ ${w}`);
        }
      }
    }
  }

  // ── write JSON report ──
  const outPath = path.resolve(__dirname, '../docs/dry-run-report.json');
  fs.writeFileSync(outPath, JSON.stringify({
    generated: new Date().toISOString(),
    source: CSV_PATH,
    summary: {
      total: rows.length,
      exact_match: matched.length,
      no_match: noMatch.length,
      needs_size_update: needsSize.length,
      parse_errors: parseErrors.length,
      normalization_warnings: withWarnings.length,
      no_match_by_type: noMatchByType,
    },
    rows: report,
  }, null, 2));

  console.log(`\nFull report → docs/dry-run-report.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
