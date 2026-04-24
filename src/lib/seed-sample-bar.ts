/**
 * Seeds a user's bar with sample ingredients + cocktails on first sign-in.
 * Marks all seeded rows with `is_sample = true` so they can be identified in
 * analytics (e.g., which starter items do users engage with or delete).
 *
 * The flag persists across edits by design — flipping it on interaction would
 * destroy the "engaged-with-starter-data" signal we need to tune the seed list
 * post-launch. See `clearSampleData` was removed 2026-04-24 along with the UI
 * that triggered it; users now manage sample items like any other data.
 *
 * Direct Supabase calls (bypasses the offline queue) — this runs at a point
 * where we know the user is online (right after successful onboarding).
 */

import { supabase } from '@/src/lib/supabase';
import { calculateCostPerPour } from '@/src/services/calculation-service';
import {
  SAMPLE_INGREDIENTS,
  SAMPLE_COCKTAILS,
  SampleIngredient,
} from '@/src/lib/sample-bar';

async function currentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

/**
 * Seed the current user's account with the sample bar. No-op if the user already
 * has sample rows.
 */
export async function seedSampleBar(): Promise<void> {
  const userId = await currentUserId();

  // Safety net: ensure a profiles row exists. The `handle_new_user` trigger should
  // create it on signup, but if the trigger is missing or ran too late, this upsert
  // prevents the FK `ingredients.user_id -> profiles.id` from failing.
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });
  if (profileErr) throw new Error(`Could not ensure profile row: ${profileErr.message}`);

  // Guard against duplicate seeding (e.g., user taps "Load sample bar" twice).
  const { count: existingSampleCount } = await supabase
    .from('ingredients')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_sample', true);
  if ((existingSampleCount ?? 0) > 0) return;

  // Insert ingredients in bulk, keep track of generated IDs keyed by sample key.
  const ingredientRows = SAMPLE_INGREDIENTS.map((ing) => ({
    user_id: userId,
    is_sample: true,
    name: ing.name,
    product_cost: ing.productCost,
    product_size: ing.productSize,
    type: ing.type,
    sub_type: ing.subType ?? null,
    description: ing.description ?? null,
    not_for_sale: ing.notForSale ?? false,
  }));

  const { data: insertedIngredients, error: ingErr } = await supabase
    .from('ingredients')
    .insert(ingredientRows)
    .select('id, name');
  if (ingErr) throw new Error(`Failed to seed ingredients: ${ingErr.message}`);

  // Build key → DB row lookup. Match on name since keys aren't persisted.
  const byName = new Map<string, { id: string }>();
  (insertedIngredients ?? []).forEach((row) => byName.set(row.name, { id: row.id }));
  const bySampleKey = new Map<string, SampleIngredient & { id: string }>();
  SAMPLE_INGREDIENTS.forEach((sample) => {
    const match = byName.get(sample.name);
    if (match) bySampleKey.set(sample.key, { ...sample, id: match.id });
  });

  // Insert each cocktail + its ingredient rows.
  for (const cocktail of SAMPLE_COCKTAILS) {
    const { data: cocktailRow, error: cocktailErr } = await supabase
      .from('cocktails')
      .insert({
        user_id: userId,
        is_sample: true,
        name: cocktail.name,
        category: cocktail.category ?? null,
        description: cocktail.description ?? null,
        retail_price: cocktail.retailPrice ?? null,
        favorited: false,
      })
      .select('id')
      .single();

    if (cocktailErr || !cocktailRow) {
      throw new Error(`Failed to seed cocktail "${cocktail.name}": ${cocktailErr?.message}`);
    }

    const ciRows = cocktail.ingredients
      .map((ci, index) => {
        const src = bySampleKey.get(ci.ingredientKey);
        if (!src) return null; // shouldn't happen; defensive
        const cost = calculateCostPerPour(src.productSize, src.productCost, ci.pourSize);
        return {
          cocktail_id: cocktailRow.id,
          ingredient_id: src.id,
          pour_size: ci.pourSize,
          cost,
          sort_order: index,
          ingredient_name: src.name,
          product_size: src.productSize,
          product_cost: src.productCost,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (ciRows.length > 0) {
      const { error: ciErr } = await supabase.from('cocktail_ingredients').insert(ciRows);
      if (ciErr) throw new Error(`Failed to seed cocktail ingredients: ${ciErr.message}`);
    }
  }
}
