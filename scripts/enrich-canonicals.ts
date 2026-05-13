/**
 * One-shot enrichment of every row in canonical_products via Gemini.
 *
 * Overwrites name, category, subcategory, abv, origin, production_region,
 * description, flavor_notes, parent_company, aging_years, varietal,
 * non_alcoholic. Marks enrichment_status='complete' and enriched_at=now().
 *
 * Usage:
 *   npx tsx scripts/enrich-canonicals.ts            # apply
 *   npx tsx scripts/enrich-canonicals.ts --dry-run  # write report only
 *   npx tsx scripts/enrich-canonicals.ts --pending  # only rows with status=pending
 *   npx tsx scripts/enrich-canonicals.ts --owner-org=<uuid>  # only that bar's user-owned canonicals
 *
 * Requires:
 *   GEMINI_API_KEY in .env
 *   SUPABASE_SERVICE_ROLE_KEY in .env
 *   EXPO_PUBLIC_SUPABASE_URL in .env
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { enrichBatch, enrichSingleWithFeedback, type EnrichmentInput, type EnrichmentOutput } from '../src/lib/gemini-enrich';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BATCH_SIZE = 25;
const REPORT_PATH = path.resolve(__dirname, '../docs/enrich-canonicals-report.json');

interface CanonicalRow {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  abv: number | null;
  description: string | null;
  owner_type: string | null;
  owner_org_id: string | null;
  enrichment_status: string | null;
}

async function fetchTargets(opts: { pending: boolean; ownerOrg?: string }): Promise<CanonicalRow[]> {
  let q = supabase
    .from('canonical_products')
    .select('id, name, brand, category, subcategory, abv, description, owner_type, owner_org_id, enrichment_status')
    .order('created_at', { ascending: true });

  if (opts.pending) q = q.eq('enrichment_status', 'pending');
  if (opts.ownerOrg) q = q.eq('owner_org_id', opts.ownerOrg);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as CanonicalRow[];
}

/**
 * --sample mode: ~50-row curated subset for validation BEFORE committing to
 * a full run. Pulls 5 rows per major Spirit subcategory + 5 wines + 5 beers.
 * Preference order: user-owned (messy POS) rows > system rows, since user-
 * owned rows are the hardest to clean and most useful to inspect.
 * Skips Dairy/Egg/Spice/Herb/Garnish/Mixer/Juice/Syrup/Prepped — those are
 * predictable, not worth the API spend on a sanity check.
 */
async function fetchSample(): Promise<CanonicalRow[]> {
  // Pull all candidates across Spirit/Liqueur/Vermouth/Bitters/Wine/Beer,
  // then sample 5 per (category, subcategory) tuple in JS.
  const { data, error } = await supabase
    .from('canonical_products')
    .select('id, name, brand, category, subcategory, abv, description, owner_type, owner_org_id, enrichment_status')
    .in('category', ['Spirit','Liqueur','Vermouth','Bitters','Wine','Beer'])
    .order('owner_org_id', { ascending: false, nullsFirst: false }); // user-owned first

  if (error) throw new Error(error.message);
  const all = (data ?? []) as CanonicalRow[];

  // Group by (category, subcategory) and take 5 per bucket.
  const buckets = new Map<string, CanonicalRow[]>();
  for (const r of all) {
    const key = `${r.category}|${r.subcategory ?? '_null'}`;
    const arr = buckets.get(key) ?? [];
    if (arr.length < 5) arr.push(r);
    buckets.set(key, arr);
  }
  const sampled: CanonicalRow[] = [];
  for (const arr of buckets.values()) sampled.push(...arr);
  return sampled;
}

function batch<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function applyEnrichment(id: string, e: EnrichmentOutput): Promise<void> {
  const update: Record<string, unknown> = {
    name: e.name,
    brand: e.brand,
    category: e.category,
    subcategory: e.subcategory,
    abv: e.abv,
    origin: e.origin,
    production_region: e.production_region,
    description: e.description,
    flavor_notes: e.flavor_notes,
    parent_company: e.parent_company,
    aging_years: e.aging_years,
    varietal: e.varietal,
    non_alcoholic: e.non_alcoholic,
    enrichment_status: 'complete',
    enriched_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('canonical_products').update(update).eq('id', id);
  if (error) console.warn(`  UPDATE failed for ${id}: ${error.message}`);
}

async function main() {
  if (!GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY in .env');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('--sample');
  const sampleMode = args.includes('--sample');
  const pendingOnly = args.includes('--pending');
  const ownerArg = args.find((a) => a.startsWith('--owner-org='));
  const ownerOrg = ownerArg ? ownerArg.split('=')[1] : undefined;

  console.log('Gemini enrichment — canonical_products');
  console.log('─'.repeat(60));
  console.log(`Mode:         ${sampleMode ? 'SAMPLE (always dry-run, 5/sub)' : dryRun ? 'DRY-RUN (no DB writes)' : 'APPLY'}`);
  if (!sampleMode) {
    console.log(`Filter:       ${pendingOnly ? 'enrichment_status=pending' : 'all rows'}${ownerOrg ? `, owner_org_id=${ownerOrg}` : ''}`);
  }
  console.log(`Batch size:   ${BATCH_SIZE}`);

  const rows = sampleMode
    ? await fetchSample()
    : await fetchTargets({ pending: pendingOnly, ownerOrg });
  console.log(`Targets:      ${rows.length}`);

  if (rows.length === 0) {
    console.log('Nothing to enrich.');
    return;
  }

  const batches = batch(rows, BATCH_SIZE);
  console.log(`Batches:      ${batches.length}`);
  console.log('');

  const report: Array<{ before: CanonicalRow; after: EnrichmentOutput }> = [];
  const dropDetails: Array<{ id: string; name: string; reason: string }> = [];
  const rowsById = new Map(rows.map((r) => [r.id, r]));
  let succeeded = 0;

  // Helper to apply a single enriched result (write to DB unless dry-run).
  const acceptResult = async (canonicalId: string, out: EnrichmentOutput) => {
    const row = rowsById.get(canonicalId);
    if (!row) return;
    report.push({ before: row, after: out });
    if (!dryRun) await applyEnrichment(canonicalId, out);
    succeeded++;
  };

  // Collect failures across batches for per-row retry.
  const failed: Array<{ input: EnrichmentInput; reason: string }> = [];

  for (let b = 0; b < batches.length; b++) {
    const inputs: EnrichmentInput[] = batches[b].map((r) => ({
      id: r.id,
      name: r.name,
      brand: r.brand,
      current_category: r.category,
      current_subcategory: r.subcategory,
      current_abv: r.abv,
      description: r.description,
    }));

    process.stdout.write(`  Batch ${b + 1}/${batches.length} (${inputs.length} rows)… `);
    try {
      const result = await enrichBatch(inputs, GEMINI_API_KEY!);
      console.log(`ok=${result.outputs.length} drops=${result.drops.length} missing=${result.missing.length}`);
      for (const o of result.outputs) await acceptResult(o.id, o);
      for (const d of result.drops) failed.push(d);
      for (const m of result.missing) failed.push({ input: m, reason: 'not present in response' });
    } catch (err: any) {
      console.warn(`  Batch ${b + 1} failed entirely: ${err?.message ?? err}`);
      for (const i of inputs) failed.push({ input: i, reason: `batch error: ${err?.message ?? err}` });
    }
  }

  // Per-row retry pass with explicit failure feedback. Single-row Gemini
  // calls with the failure reason in the prompt — usually rescues most.
  if (failed.length > 0) {
    console.log('');
    console.log(`Retrying ${failed.length} dropped rows with explicit feedback…`);
    for (let i = 0; i < failed.length; i++) {
      const { input, reason } = failed[i];
      process.stdout.write(`  Retry ${i + 1}/${failed.length} "${input.name}"… `);
      try {
        const out = await enrichSingleWithFeedback(input, reason, GEMINI_API_KEY!);
        if (out) {
          console.log('recovered');
          await acceptResult(input.id, out);
        } else {
          console.log('still bad');
          dropDetails.push({ id: input.id, name: input.name, reason });
        }
      } catch (err: any) {
        console.log(`retry error: ${err?.message ?? err}`);
        dropDetails.push({ id: input.id, name: input.name, reason: `retry error: ${err?.message ?? err}` });
      }
    }
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify({
    generated: new Date().toISOString(),
    mode: dryRun ? 'dry-run' : 'apply',
    targets: rows.length,
    succeeded,
    dropped: dropDetails.length,
    drop_details: dropDetails,
    enriched: report,   // FULL list, not truncated
  }, null, 2));

  console.log('');
  console.log('═'.repeat(60));
  console.log('ENRICHMENT COMPLETE');
  console.log('═'.repeat(60));
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Dropped:   ${dropDetails.length}`);
  console.log(`Report:    ${REPORT_PATH}`);
  if (dryRun) console.log(`\nNo DB changes were applied (dry-run mode).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
