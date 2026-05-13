/**
 * Spot-check Gemini cleanup on a handful of gnarly POS names. No DB writes.
 * Quick one-off — pulls 10 longest user-owned canonical names + runs through
 * Gemini. Use for prompt tuning.
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { enrichBatch } from '../src/lib/gemini-enrich';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const { data } = await supabase
    .from('canonical_products')
    .select('id, name, brand, category, subcategory, abv, description')
    .eq('owner_org_id', '59c65ae6-8bd5-4a8f-a7be-f12fba49cabb')
    .order('name', { ascending: true });

  // Pick the 12 most verbose ones by name length
  const messy = (data ?? [])
    .filter((r: any) => r.name.length > 45)
    .sort((a: any, b: any) => b.name.length - a.name.length)
    .slice(0, 12);

  if (messy.length === 0) {
    console.log('No verbose names found.');
    return;
  }

  console.log(`Sending ${messy.length} messy names to Gemini…\n`);

  const inputs = messy.map((r: any) => ({
    id: r.id,
    name: r.name,
    brand: r.brand,
    current_category: r.category,
    current_subcategory: r.subcategory,
    current_abv: r.abv,
    description: r.description,
  }));

  const result = await enrichBatch(inputs, process.env.GEMINI_API_KEY!);
  for (const o of result.outputs) {
    const before = messy.find((r: any) => r.id === o.id)!;
    console.log(`BEFORE: "${before.name}"`);
    console.log(`  AFTER name:    "${o.name}"`);
    console.log(`  brand:         ${o.brand}`);
    console.log(`  category/sub:  ${o.category} / ${o.subcategory}`);
    console.log(`  abv: ${o.abv}  age: ${o.aging_years}  varietal: ${o.varietal}`);
    console.log(`  region: ${o.production_region}`);
    console.log(`  dedup: ${o.dedup_key}`);
    console.log(`  desc: ${o.description}`);
    console.log('');
  }
  if (result.drops.length > 0 || result.missing.length > 0) {
    console.log(`Drops: ${result.drops.length}, Missing: ${result.missing.length}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
