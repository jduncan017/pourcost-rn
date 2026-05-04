/**
 * Adopt selected library recipes into the user's bar during onboarding.
 *
 * Direct supabase writes (NOT via the ingredients/cocktails store actions)
 * so we avoid firing the per-row "Created X" toast for every ingredient and
 * cocktail. With 5 missing items + 4 staples + 5 cocktails that'd be 14
 * stacked toasts — looks like the app is glitching. Direct bulk inserts run
 * in two round-trips total + a final store refresh.
 *
 * Stages:
 *   1. Bulk insert all new ingredients (priced missing + auto-staples) in
 *      one round-trip via .insert(rows).select().
 *   2. For each selected recipe, insert the cocktail row + its
 *      cocktail_ingredients in a small transaction-shaped sequence.
 *      (Cocktails can't bulk-insert with their child rows, but recipe count
 *      is small.)
 *   3. Refresh both stores once so the app sees everything we just wrote.
 *
 * Returns counts and any per-cocktail errors for the loader screen to
 * surface (currently swallowed except in dev console; surface if needed).
 */
import { supabase } from '@/src/lib/supabase';
import { Volume } from '@/src/types/models';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import {
  calculateCostPerPour,
  calculateSuggestedPrice,
  roundSuggestedPrice,
  applyPriceFloor,
} from '@/src/services/calculation-service';
import { useAppStore } from '@/src/stores/app-store';
import {
  LibraryRecipe,
  LibraryRecipeIngredient,
  MissingIngredientGroup,
  RecipeAnalysis,
  resolveIngredient,
} from '@/src/lib/library-recipes';
import { subTypeMatches } from '@/src/lib/wells';
import { getStapleDefault } from '@/src/lib/staples';

export interface PricedMissingIngredient {
  group: MissingIngredientGroup;
  productSize: Volume;
  productCost: number;
}

export interface AdoptArgs {
  recipes: LibraryRecipe[];
  /** Pre-analyzed against the user's current inventory. Used to decide which
   *  staples to auto-add and to reach back into the inventory once we've
   *  inserted new rows. */
  analyses: RecipeAnalysis[];
  /** User's filled-in costs from the missing-ingredients screen. */
  pricedMissing: PricedMissingIngredient[];
}

export interface AdoptResult {
  cocktailsCreated: number;
  ingredientsCreated: number;
  errors: string[];
}

const DEFAULT_STAPLE_SIZE: Volume = { kind: 'milliliters', ml: 1000 };

async function currentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

function defaultStapleSize(ing: LibraryRecipeIngredient): Volume {
  if (ing.canonicalDefaultSizes.length > 0) return ing.canonicalDefaultSizes[0];
  return DEFAULT_STAPLE_SIZE;
}

export async function adoptLibraryRecipes(args: AdoptArgs): Promise<AdoptResult> {
  const userId = await currentUserId();
  const result: AdoptResult = { cocktailsCreated: 0, ingredientsCreated: 0, errors: [] };

  // FK safety net (mirrors seedWells / seedSampleBar): ensure profile exists
  // in case handle_new_user trigger was slow.
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });
  if (profileErr) throw new Error(`Could not ensure profile row: ${profileErr.message}`);

  // Snapshot current inventory + map by canonical id for fast lookups.
  const ingStore = useIngredientsStore.getState();
  const inventoryByCanonical = new Map<string, string>();
  for (const i of ingStore.ingredients) {
    if (i.canonicalProductId) inventoryByCanonical.set(i.canonicalProductId, i.id);
  }

  // ================================================================
  // STAGE 1: Build all new ingredient rows + bulk insert
  // ================================================================
  const ingredientRows: Array<{
    user_id: string;
    name: string;
    product_size: Volume;
    product_cost: number;
    type: string;
    sub_type: string | null;
    not_for_sale: boolean;
    canonical_product_id: string | null;
  }> = [];

  // Track which logical ingredient (by group key or canonical id) maps to
  // its index in ingredientRows, so we can find the resulting DB id later.
  const indexByKey = new Map<string, number>();

  // 1a. Priced missing ingredients (user-set cost/size).
  for (const item of args.pricedMissing) {
    const idx = ingredientRows.length;
    ingredientRows.push({
      user_id: userId,
      name: item.group.displayName,
      product_size: item.productSize,
      product_cost: item.productCost,
      type: mapCategoryToIngredientType(item.group.canonicalCategory),
      sub_type: item.group.canonicalSubcategory ?? null,
      not_for_sale: shouldDefaultNotForSale(item.group.canonicalCategory),
      canonical_product_id: item.group.canonicalProductId ?? null,
    });
    indexByKey.set(item.group.key, idx);
  }

  // 1b. Auto-add deduped staples (skip ones already in inventory).
  const stapleNeeded = new Map<string, LibraryRecipeIngredient>();
  for (const a of args.analyses) {
    for (const r of a.resolutions) {
      if (r.kind !== 'staple') continue;
      const key =
        r.ingredient.canonicalProductId ??
        (r.displayName ? `name:${r.displayName.toLowerCase()}` : `unknown:${r.ingredient.id}`);
      // Already in user inventory? Skip.
      if (
        r.ingredient.canonicalProductId &&
        inventoryByCanonical.has(r.ingredient.canonicalProductId)
      ) {
        continue;
      }
      if (!stapleNeeded.has(key)) stapleNeeded.set(key, r.ingredient);
    }
  }
  for (const [key, ing] of stapleNeeded.entries()) {
    const name = ing.canonicalName ?? ing.displayName ?? 'Staple';
    // Prefer the curated default (jar of cherries at $8, lime juice 32oz/$8,
    // etc.) over the canonical's per-pour-unit default size + $0. Bar
    // managers don't know the cost of a single cherry.
    const stapleDefault = getStapleDefault(name);
    const productSize = stapleDefault?.productSize ?? defaultStapleSize(ing);
    const productCost = stapleDefault?.productCost ?? 0;
    const notForSale =
      stapleDefault?.notForSale ??
      (isFreeGarnish(name) || shouldDefaultNotForSale(ing.canonicalCategory));
    const idx = ingredientRows.length;
    ingredientRows.push({
      user_id: userId,
      name,
      product_size: productSize,
      product_cost: productCost,
      type: mapCategoryToIngredientType(ing.canonicalCategory),
      sub_type: ing.canonicalSubcategory ?? null,
      not_for_sale: notForSale,
      canonical_product_id: ing.canonicalProductId ?? null,
    });
    indexByKey.set(key, idx);
  }

  // Single bulk insert.
  if (ingredientRows.length > 0) {
    const { data: inserted, error: insErr } = await supabase
      .from('ingredients')
      .insert(ingredientRows)
      .select('id, name, sub_type, canonical_product_id, product_size, product_cost');

    if (insErr) {
      result.errors.push(`Adding ingredients failed: ${insErr.message}`);
      // Even on partial failure we'll attempt cocktails — they'll skip rows
      // they can't resolve, so worst case is a lighter bar than expected.
    } else {
      result.ingredientsCreated = inserted?.length ?? 0;
      // Populate inventoryByCanonical with the new rows so cocktail resolution
      // in stage 2 sees them.
      for (const row of inserted ?? []) {
        if (row.canonical_product_id) {
          inventoryByCanonical.set(row.canonical_product_id, row.id);
        }
      }
    }
  }

  // ================================================================
  // STAGE 2: Per-cocktail insert with resolved ingredient IDs
  // ================================================================

  // Re-fetch inventory so resolution picks up everything we just inserted
  // (subType-based lookups need the full updated list).
  const { data: freshInventory, error: invErr } = await supabase
    .from('ingredients')
    .select('id, name, sub_type, canonical_product_id, product_size, product_cost')
    .eq('user_id', userId);

  if (invErr) {
    result.errors.push(`Could not refresh inventory after writes: ${invErr.message}`);
    // Fall back to the pre-write store snapshot.
  }

  type SimpleInv = {
    id: string;
    name: string;
    sub_type: string | null;
    canonical_product_id: string | null;
    product_size: Volume;
    product_cost: number;
  };
  const inv: SimpleInv[] = (freshInventory as SimpleInv[]) ?? [];

  const resolveAgainstFresh = (
    ing: LibraryRecipeIngredient,
  ): SimpleInv | null => {
    if (ing.canonicalProductId) {
      const exact = inv.find((i) => i.canonical_product_id === ing.canonicalProductId);
      if (exact) return exact;
    }
    if (ing.canonicalSubcategory) {
      const subMatch = inv.find(
        (i) => i.sub_type && subTypeMatches(ing.canonicalSubcategory!, i.sub_type),
      );
      if (subMatch) return subMatch;
    }
    return null;
  };

  for (const recipe of args.recipes) {
    try {
      const ciRowsData = recipe.ingredients
        .map((ing) => {
          const userIng = resolveAgainstFresh(ing);
          if (!userIng) return null;
          const cost = calculateCostPerPour(userIng.product_size, Number(userIng.product_cost), ing.pourSize);
          return {
            ingredient_id: userIng.id,
            pour_size: ing.pourSize,
            cost,
            sort_order: ing.sortOrder,
            ingredient_name: userIng.name,
            product_size: userIng.product_size,
            product_cost: Number(userIng.product_cost),
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      if (ciRowsData.length === 0) {
        result.errors.push(`Skipped "${recipe.name}". No ingredients could be resolved.`);
        continue;
      }

      // Auto-price the cocktail at the user's pour-cost suggestion (rounded
      // up to their preferred increment, $1 by default). The library recipe
      // ships its own suggested retail but the user's actual cost stack
      // determines the right price for THEIR bar.
      const totalCost = ciRowsData.reduce((sum, row) => sum + row.cost, 0);
      const appState = useAppStore.getState();
      const goalDecimal = appState.pourCostGoal / 100;
      const autoSuggested = applyPriceFloor(
        roundSuggestedPrice(
          calculateSuggestedPrice(totalCost, goalDecimal),
          appState.suggestedPriceRounding,
        ),
        appState.minCocktailPrice,
      );
      const retailPrice =
        autoSuggested > 0 ? autoSuggested : recipe.suggestedRetailPrice ?? null;

      const { data: cocktailRow, error: cocktailErr } = await supabase
        .from('cocktails')
        .insert({
          user_id: userId,
          name: recipe.name,
          category: recipe.category ?? null,
          description: recipe.description ?? null,
          notes: recipe.notes ?? null,
          retail_price: retailPrice,
          favorited: false,
        })
        .select('id')
        .single();

      if (cocktailErr || !cocktailRow) {
        result.errors.push(`Creating "${recipe.name}" failed: ${cocktailErr?.message ?? 'unknown'}`);
        continue;
      }

      const ciInserts = ciRowsData.map((row) => ({ cocktail_id: cocktailRow.id, ...row }));
      const { error: ciErr } = await supabase.from('cocktail_ingredients').insert(ciInserts);
      if (ciErr) {
        result.errors.push(`Adding ingredients to "${recipe.name}" failed: ${ciErr.message}`);
        continue;
      }

      result.cocktailsCreated += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push(`Failed adopting "${recipe.name}": ${msg}`);
    }
  }

  // ================================================================
  // STAGE 3: Single store refresh so the app sees everything
  // ================================================================
  await Promise.all([
    useCocktailsStore.getState().loadCocktails(true),
    useIngredientsStore.getState().loadIngredients(true),
  ]);

  return result;
}

// ============================================================
// Helpers
// ============================================================

function mapCategoryToIngredientType(canonicalCategory: string | null): string {
  if (!canonicalCategory) return 'Other';
  switch (canonicalCategory) {
    case 'Spirit':
    case 'Liqueur':
    case 'Vermouth':
    case 'Bitters':
    case 'Absinthe':
      return 'Spirit';
    case 'Beer':
      return 'Beer';
    case 'Wine':
      return 'Wine';
    case 'Juice':
    case 'Syrup':
    case 'Mixer':
    case 'Garnish':
    case 'Dairy':
    case 'Egg':
    case 'Spice':
    case 'Herb':
    case 'Prepped':
      return 'Prepped';
    default:
      return 'Other';
  }
}

function shouldDefaultNotForSale(canonicalCategory: string | null): boolean {
  if (!canonicalCategory) return false;
  return ['Bitters', 'Garnish', 'Spice', 'Herb', 'Egg', 'Prepped', 'Juice', 'Syrup', 'Mixer', 'Dairy'].includes(
    canonicalCategory,
  );
}

function isFreeGarnish(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes('peel') ||
    lower.includes('twist') ||
    lower.includes('wedge') ||
    lower.includes('mint sprig') ||
    lower.includes('mint leaves')
  );
}
