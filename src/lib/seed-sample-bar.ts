/**
 * Seeds a user's bar with sample ingredients + cocktails on first sign-in.
 * Marks all seeded rows with `is_sample = true` so they can be cleared in one go.
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

// updated_at gets bumped by an after-insert trigger too (not just edits) on some
// Postgres setups, so we use a small tolerance to be robust.
const EDIT_TOLERANCE_MS = 2000;

function isEdited(row: { created_at: string; updated_at: string }): boolean {
  const created = new Date(row.created_at).getTime();
  const updated = new Date(row.updated_at).getTime();
  return updated - created > EDIT_TOLERANCE_MS;
}

/**
 * Remove sample rows for the current user WITHOUT touching:
 *   - Any user-added ingredients/cocktails (they're never `is_sample=true`)
 *   - Any sample rows the user has edited (updated_at > created_at)
 *   - Any sample ingredients referenced by user-added cocktails
 *
 * The kept rows get "promoted" (is_sample flipped to false) so they're
 * indistinguishable from the user's own data going forward.
 */
export async function clearSampleData(): Promise<void> {
  const userId = await currentUserId();

  // --- Ingredients promotion set ------------------------------------------
  const { data: sampleIngs, error: sampleIngsErr } = await supabase
    .from('ingredients')
    .select('id, created_at, updated_at')
    .eq('user_id', userId)
    .eq('is_sample', true);
  if (sampleIngsErr) throw new Error(`Failed to scan sample ingredients: ${sampleIngsErr.message}`);

  const ingIdsToPromote = new Set<string>();

  // Promote any sample ingredient the user has edited.
  for (const ing of sampleIngs ?? []) {
    if (isEdited(ing as { created_at: string; updated_at: string })) {
      ingIdsToPromote.add(ing.id);
    }
  }

  // Promote any sample ingredient referenced by a user-added cocktail.
  const { data: userCocktails, error: userCocktailsErr } = await supabase
    .from('cocktails')
    .select('id')
    .eq('user_id', userId)
    .eq('is_sample', false);
  if (userCocktailsErr) throw new Error(`Failed to scan user cocktails: ${userCocktailsErr.message}`);

  const userCocktailIds = (userCocktails ?? []).map((c) => c.id);
  if (userCocktailIds.length > 0) {
    const { data: refs, error: refsErr } = await supabase
      .from('cocktail_ingredients')
      .select('ingredient_id')
      .in('cocktail_id', userCocktailIds);
    if (refsErr) throw new Error(`Failed to scan cocktail ingredients: ${refsErr.message}`);
    for (const r of refs ?? []) ingIdsToPromote.add(r.ingredient_id);
  }

  if (ingIdsToPromote.size > 0) {
    const { error: promoteIngErr } = await supabase
      .from('ingredients')
      .update({ is_sample: false })
      .eq('user_id', userId)
      .eq('is_sample', true)
      .in('id', Array.from(ingIdsToPromote));
    if (promoteIngErr) throw new Error(`Failed to promote ingredients: ${promoteIngErr.message}`);
  }

  // --- Cocktails promotion set --------------------------------------------
  const { data: sampleCocktails, error: sampleCocktailsErr } = await supabase
    .from('cocktails')
    .select('id, created_at, updated_at')
    .eq('user_id', userId)
    .eq('is_sample', true);
  if (sampleCocktailsErr) throw new Error(`Failed to scan sample cocktails: ${sampleCocktailsErr.message}`);

  const editedCocktailIds = (sampleCocktails ?? [])
    .filter((c) => isEdited(c as { created_at: string; updated_at: string }))
    .map((c) => c.id);

  if (editedCocktailIds.length > 0) {
    const { error: promoteCocktailErr } = await supabase
      .from('cocktails')
      .update({ is_sample: false })
      .eq('user_id', userId)
      .eq('is_sample', true)
      .in('id', editedCocktailIds);
    if (promoteCocktailErr) throw new Error(`Failed to promote cocktails: ${promoteCocktailErr.message}`);
  }

  // --- Delete remaining sample rows ---------------------------------------
  const { error: cocktailErr } = await supabase
    .from('cocktails')
    .delete()
    .eq('user_id', userId)
    .eq('is_sample', true);
  if (cocktailErr) throw new Error(`Failed to clear sample cocktails: ${cocktailErr.message}`);

  const { error: ingErr } = await supabase
    .from('ingredients')
    .delete()
    .eq('user_id', userId)
    .eq('is_sample', true);
  if (ingErr) throw new Error(`Failed to clear sample ingredients: ${ingErr.message}`);
}

/**
 * Fast yes/no: does the current user have any sample rows left?
 * Used to decide whether to show the "Clear sample data" setting.
 */
export async function hasSampleData(): Promise<boolean> {
  const userId = await currentUserId();
  const { count } = await supabase
    .from('ingredients')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_sample', true);
  return (count ?? 0) > 0;
}
