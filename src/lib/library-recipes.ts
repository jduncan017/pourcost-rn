/**
 * Library recipe loading + analysis for the onboarding cocktail picker.
 *
 * Recipes live in `received_recipes` (source='library', user_id=NULL) and
 * their ingredients in `received_recipe_ingredients`. RLS allows any
 * authenticated user to read library rows (see migration 011).
 *
 * Analysis bucketizes a recipe's ingredients against the user's current
 * inventory + wells:
 *   - matched   → already in the bar (resolved by canonical_product_id, then
 *                 by exact subType for generic spirit slots)
 *   - staple    → universal item we'll auto-add at $0 (lime juice, simple
 *                 syrup, angostura, club soda, etc.)
 *   - needsPrice → specific canonical not in the bar; user enters cost in
 *                  step 2 of the onboarding picker
 *   - unresolved → no canonical_product_id and no subType match; rare,
 *                  surface a warning
 */
import { supabase } from '@/src/lib/supabase';
import { Volume, SavedIngredient } from '@/src/types/models';
import { isStapleName } from '@/src/lib/staples';
import { subTypeMatches } from '@/src/lib/wells';

/**
 * Library recipes that should NOT appear in the onboarding picker yet.
 * Bloody Mary depends on the prep builder (mix-vs-scratch costing) which
 * isn't shipped. Add others here if a recipe needs infra we haven't built.
 */
const HIDDEN_RECIPE_NAMES: ReadonlySet<string> = new Set([
  'Bloody Mary',
]);

export interface LibraryRecipe {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  notes: string | null;
  suggestedRetailPrice: number | null;
  ingredients: LibraryRecipeIngredient[];
}

export interface LibraryRecipeIngredient {
  id: string;
  /** Specific canonical (a particular brand/product). Null for generic slots. */
  canonicalProductId: string | null;
  /** Category for generic slots (e.g. 'Spirit', 'Vermouth'). */
  canonicalCategory: string | null;
  /** Subcategory for generic slots (e.g. 'Whiskey', 'Sweet'). */
  canonicalSubcategory: string | null;
  /** Author-typed name when no canonical lookup. */
  displayName: string | null;
  pourSize: Volume;
  sortOrder: number;
  notes: string | null;
  /** Joined-in canonical fields (when canonical_product_id is set). */
  canonicalName: string | null;
  canonicalDefaultSizes: Volume[];
}

interface RecipeRow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  notes: string | null;
  suggested_retail_price: number | null;
}

interface IngredientRow {
  id: string;
  received_recipe_id: string;
  canonical_product_id: string | null;
  canonical_category: string | null;
  canonical_subcategory: string | null;
  display_name: string | null;
  pour_size: Volume;
  sort_order: number;
  ingredient_notes: string | null;
  canonical_products?: {
    name: string | null;
    default_sizes: Volume[] | null;
  } | null;
}

/**
 * Fetch all library recipes with their ingredients in one round-trip.
 * Returns recipes in alphabetical order; ingredients sorted by sort_order.
 */
export async function fetchLibraryRecipes(): Promise<LibraryRecipe[]> {
  const { data: recipes, error: recipesErr } = await supabase
    .from('received_recipes')
    .select('id, name, description, category, notes, suggested_retail_price')
    .eq('source', 'library')
    .is('user_id', null)
    .order('name');
  if (recipesErr) throw new Error(`Failed to load library recipes: ${recipesErr.message}`);

  const recipeIds = (recipes ?? []).map((r) => r.id);
  if (recipeIds.length === 0) return [];

  const { data: ingredients, error: ingErr } = await supabase
    .from('received_recipe_ingredients')
    .select(
      `id, received_recipe_id, canonical_product_id, canonical_category,
       canonical_subcategory, display_name, pour_size, sort_order, ingredient_notes,
       canonical_products(name, default_sizes)`,
    )
    .in('received_recipe_id', recipeIds)
    .order('sort_order');
  if (ingErr) throw new Error(`Failed to load library recipe ingredients: ${ingErr.message}`);

  const byRecipe = new Map<string, LibraryRecipeIngredient[]>();
  for (const row of (ingredients as unknown as IngredientRow[]) ?? []) {
    const list = byRecipe.get(row.received_recipe_id) ?? [];
    list.push({
      id: row.id,
      canonicalProductId: row.canonical_product_id,
      canonicalCategory: row.canonical_category,
      canonicalSubcategory: row.canonical_subcategory,
      displayName: row.display_name,
      pourSize: row.pour_size,
      sortOrder: row.sort_order,
      notes: row.ingredient_notes,
      canonicalName: row.canonical_products?.name ?? null,
      canonicalDefaultSizes: row.canonical_products?.default_sizes ?? [],
    });
    byRecipe.set(row.received_recipe_id, list);
  }

  return (recipes as RecipeRow[])
    .filter((r) => !HIDDEN_RECIPE_NAMES.has(r.name))
    .map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      category: r.category,
      notes: r.notes,
      suggestedRetailPrice: r.suggested_retail_price != null ? Number(r.suggested_retail_price) : null,
      ingredients: byRecipe.get(r.id) ?? [],
    }));
}

// ============================================================
// Analysis: bucketize each recipe ingredient
// ============================================================

export type ResolutionKind = 'matched' | 'staple' | 'needsPrice' | 'unresolved';

export interface IngredientResolution {
  ingredient: LibraryRecipeIngredient;
  kind: ResolutionKind;
  /** Set when kind === 'matched'. */
  matchedIngredientId?: string;
  /** Display name surfaced in the UI (canonical name preferred, falls back
   *  to display_name from the recipe row). */
  displayName: string;
  /** Recipes that include this ingredient (populated by collectMissing). */
  usedInRecipes?: string[];
}

/**
 * Resolve a single recipe ingredient against the user's bar.
 *
 * Match priority:
 *   1. canonical_product_id exact match (specific brand the user has)
 *   2. canonical_subcategory match via subTypeMatches (handles vermouth aliases
 *      and family fallbacks — "Bourbon" recipe accepts a "Whiskey" well)
 *   3. NOT matched → staple (auto-add at $0) vs needsPrice (user enters)
 *
 * Subcategory match runs even when canonical_product_id IS set. That covers
 * the common case where a recipe references a specific brand the user
 * doesn't carry, but they have something else of the same subcategory in
 * their bar. Onboarding should pick the user's product, not ask them to add
 * the exact brand the recipe author chose.
 */
export function resolveIngredient(
  ing: LibraryRecipeIngredient,
  inventory: SavedIngredient[],
): IngredientResolution {
  const displayName =
    ing.canonicalName ?? ing.displayName ?? ing.canonicalSubcategory ?? 'Ingredient';

  // 1. Specific canonical match — user has this exact brand.
  if (ing.canonicalProductId) {
    const match = inventory.find((i) => i.canonicalProductId === ing.canonicalProductId);
    if (match) {
      return { ingredient: ing, kind: 'matched', matchedIngredientId: match.id, displayName };
    }
  }

  // 2. Subcategory match (with aliases + family fallbacks). Runs whether or
  //    not canonical match was attempted, so brand-specific recipes still
  //    resolve to the user's same-category product.
  if (ing.canonicalSubcategory) {
    const match = inventory.find(
      (i) => i.subType && subTypeMatches(ing.canonicalSubcategory!, i.subType),
    );
    if (match) {
      return { ingredient: ing, kind: 'matched', matchedIngredientId: match.id, displayName };
    }
  }

  // 3. Not in bar — staple or needsPrice
  if (isStapleName(ing.canonicalName ?? ing.displayName)) {
    return { ingredient: ing, kind: 'staple', displayName };
  }

  if (!ing.canonicalProductId && !ing.canonicalSubcategory) {
    return { ingredient: ing, kind: 'unresolved', displayName };
  }

  return { ingredient: ing, kind: 'needsPrice', displayName };
}

export interface RecipeAnalysis {
  recipe: LibraryRecipe;
  resolutions: IngredientResolution[];
  matchedCount: number;
  stapleCount: number;
  needsPriceCount: number;
  unresolvedCount: number;
}

export function analyzeRecipe(
  recipe: LibraryRecipe,
  inventory: SavedIngredient[],
): RecipeAnalysis {
  const resolutions = recipe.ingredients.map((ing) => resolveIngredient(ing, inventory));
  return {
    recipe,
    resolutions,
    matchedCount: resolutions.filter((r) => r.kind === 'matched').length,
    stapleCount: resolutions.filter((r) => r.kind === 'staple').length,
    needsPriceCount: resolutions.filter((r) => r.kind === 'needsPrice').length,
    unresolvedCount: resolutions.filter((r) => r.kind === 'unresolved').length,
  };
}

// ============================================================
// Across-selection deduplication for the missing-ingredients form
// ============================================================

export interface MissingIngredientGroup {
  /** Stable key — canonicalProductId if known, else lowercased displayName. */
  key: string;
  displayName: string;
  /** Pulled from the first occurrence; all others should match. */
  canonicalProductId: string | null;
  canonicalCategory: string | null;
  canonicalSubcategory: string | null;
  /** Available sizes from the canonical, drives the size picker. Empty when
   *  the recipe ingredient has no canonical link. */
  canonicalDefaultSizes: Volume[];
  /** Names of selected recipes that include this ingredient. */
  usedInRecipes: string[];
}

/**
 * Collect every needsPrice / unresolved ingredient across the user's selected
 * recipes, deduped by canonical id (or name fallback). Used to drive the
 * missing-ingredients pricing screen.
 */
export function collectMissing(
  analyses: RecipeAnalysis[],
): MissingIngredientGroup[] {
  const groups = new Map<string, MissingIngredientGroup>();

  for (const a of analyses) {
    for (const r of a.resolutions) {
      if (r.kind !== 'needsPrice' && r.kind !== 'unresolved') continue;
      const key =
        r.ingredient.canonicalProductId ??
        (r.displayName ? `name:${r.displayName.toLowerCase()}` : `unknown:${r.ingredient.id}`);
      const existing = groups.get(key);
      if (existing) {
        if (!existing.usedInRecipes.includes(a.recipe.name)) {
          existing.usedInRecipes.push(a.recipe.name);
        }
      } else {
        groups.set(key, {
          key,
          displayName: r.displayName,
          canonicalProductId: r.ingredient.canonicalProductId,
          canonicalCategory: r.ingredient.canonicalCategory,
          canonicalSubcategory: r.ingredient.canonicalSubcategory,
          canonicalDefaultSizes: r.ingredient.canonicalDefaultSizes,
          usedInRecipes: [a.recipe.name],
        });
      }
    }
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName),
  );
}

/** Group library recipes by their `category` (Whiskey, Gin, etc.). Used by
 *  the picker UI to render section headers. Recipes with no category fall
 *  into 'Other'. */
export function groupByCategory(recipes: LibraryRecipe[]): Record<string, LibraryRecipe[]> {
  const out: Record<string, LibraryRecipe[]> = {};
  for (const r of recipes) {
    const cat = r.category ?? 'Other';
    if (!out[cat]) out[cat] = [];
    out[cat].push(r);
  }
  return out;
}
