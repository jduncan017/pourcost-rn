/**
 * Supabase data access layer.
 * Handles the mapping between Postgres snake_case rows and TypeScript camelCase models.
 * All Supabase queries go through here — stores should never import supabase directly.
 */

import { supabase } from './supabase';
import { SavedIngredient, Cocktail, CocktailIngredient, Volume, fraction } from '@/src/types/models';
import type { ThemeMode, IngredientOrderPref } from '@/src/stores/app-store';

// ==========================================
// PROFILE TYPES & FUNCTIONS
// ==========================================

interface ProfileRow {
  id: string;
  display_name: string | null;
  pour_cost_goal: number;
  default_pour_size: Volume | null;
  default_retail_price: number;
  ingredient_order_pref: string;
  theme_mode: string;
}

export interface ProfileData {
  pourCostGoal: number;
  defaultPourSize: Volume;
  defaultRetailPrice: number;
  ingredientOrderPref: IngredientOrderPref;
  themeMode: ThemeMode;
  displayName: string;
}

const DEFAULT_POUR_SIZE = fraction(3, 2); // 1.5 oz

export async function fetchProfile(): Promise<ProfileData | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, pour_cost_goal, default_pour_size, default_retail_price, ingredient_order_pref, theme_mode')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  const row = data as ProfileRow;

  return {
    pourCostGoal: Math.round(Number(row.pour_cost_goal) * 100), // DB stores 0.18, app uses 18
    defaultPourSize: row.default_pour_size ?? DEFAULT_POUR_SIZE,
    defaultRetailPrice: Number(row.default_retail_price),
    ingredientOrderPref: (row.ingredient_order_pref as IngredientOrderPref) ?? 'manual',
    themeMode: (row.theme_mode as ThemeMode) ?? 'dark',
    displayName: row.display_name ?? '',
  };
}

export async function updateProfile(profile: Partial<ProfileData>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const row: Record<string, unknown> = {};
  if (profile.pourCostGoal !== undefined) row.pour_cost_goal = profile.pourCostGoal / 100; // app 18 → DB 0.18
  if (profile.defaultPourSize !== undefined) row.default_pour_size = profile.defaultPourSize;
  if (profile.defaultRetailPrice !== undefined) row.default_retail_price = profile.defaultRetailPrice;
  if (profile.ingredientOrderPref !== undefined) row.ingredient_order_pref = profile.ingredientOrderPref;
  if (profile.themeMode !== undefined) row.theme_mode = profile.themeMode;
  if (profile.displayName !== undefined) row.display_name = profile.displayName;

  const { error } = await supabase
    .from('profiles')
    .update(row)
    .eq('id', user.id);

  if (error) throw new Error(error.message);
}

// ==========================================
// ROW TYPES (what Postgres returns)
// ==========================================

interface IngredientRow {
  id: string;
  user_id: string;
  name: string;
  product_cost: number;
  product_size: Volume; // JSONB parses directly to our Volume type
  type: string | null;
  not_for_sale: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface CocktailRow {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  category: string | null;
  description: string | null;
  favorited: boolean;
  retail_price: number | null;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

interface CocktailIngredientRow {
  id: string;
  cocktail_id: string;
  ingredient_id: string;
  pour_size: Volume; // JSONB
  cost: number | null;
  sort_order: number;
  ingredient_name: string | null;
  product_size: Volume | null; // JSONB
  product_cost: number | null;
}

// ==========================================
// ROW → MODEL CONVERTERS
// ==========================================

function rowToIngredient(row: IngredientRow): SavedIngredient {
  return {
    id: row.id,
    name: row.name,
    productSize: row.product_size,
    productCost: Number(row.product_cost),
    type: row.type ?? undefined,
    notForSale: row.not_for_sale,
    description: row.description ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    userId: row.user_id,
  };
}

function cocktailIngredientRowToModel(row: CocktailIngredientRow): CocktailIngredient {
  return {
    ingredientId: row.ingredient_id,
    name: row.ingredient_name ?? '',
    productSize: row.product_size ?? { kind: 'milliliters', ml: 750 },
    productCost: Number(row.product_cost ?? 0),
    pourSize: row.pour_size,
    cost: Number(row.cost ?? 0),
    order: row.sort_order,
  };
}

function rowToCocktail(row: CocktailRow, ingredients: CocktailIngredient[]): Cocktail {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes ?? undefined,
    ingredients,
    category: (row.category as Cocktail['category']) ?? undefined,
    description: row.description ?? undefined,
    imagePath: row.image_path ?? undefined,
    favorited: row.favorited,
    retailPrice: row.retail_price != null ? Number(row.retail_price) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    userId: row.user_id,
  };
}

// ==========================================
// INGREDIENTS CRUD
// ==========================================

export async function fetchIngredients(): Promise<SavedIngredient[]> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as IngredientRow[]).map(rowToIngredient);
}

export async function insertIngredient(
  ingredient: Omit<SavedIngredient, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
): Promise<SavedIngredient> {
  // Get current user ID for RLS
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('ingredients')
    .insert({
      user_id: user.id,
      name: ingredient.name,
      product_cost: ingredient.productCost,
      product_size: ingredient.productSize,
      type: ingredient.type ?? null,
      not_for_sale: ingredient.notForSale ?? false,
      description: ingredient.description ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToIngredient(data as IngredientRow);
}

export async function updateIngredientById(
  id: string,
  updates: Partial<SavedIngredient>
): Promise<SavedIngredient> {
  const row: Record<string, unknown> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.productCost !== undefined) row.product_cost = updates.productCost;
  if (updates.productSize !== undefined) row.product_size = updates.productSize;
  if (updates.type !== undefined) row.type = updates.type;
  if (updates.notForSale !== undefined) row.not_for_sale = updates.notForSale;
  if (updates.description !== undefined) row.description = updates.description;

  const { data, error } = await supabase
    .from('ingredients')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToIngredient(data as IngredientRow);
}

export async function deleteIngredientById(id: string): Promise<void> {
  const { error } = await supabase
    .from('ingredients')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ==========================================
// COCKTAILS CRUD
// ==========================================

export async function fetchCocktails(): Promise<Cocktail[]> {
  // Fetch cocktails
  const { data: cocktailRows, error: cocktailError } = await supabase
    .from('cocktails')
    .select('*')
    .order('created_at', { ascending: false });

  if (cocktailError) throw new Error(cocktailError.message);
  if (!cocktailRows || cocktailRows.length === 0) return [];

  // Fetch all cocktail ingredients in one query
  const cocktailIds = cocktailRows.map((c: CocktailRow) => c.id);
  const { data: ciRows, error: ciError } = await supabase
    .from('cocktail_ingredients')
    .select('*')
    .in('cocktail_id', cocktailIds)
    .order('sort_order', { ascending: true });

  if (ciError) throw new Error(ciError.message);

  // Group ingredients by cocktail_id
  const ingredientsByCocktail = new Map<string, CocktailIngredient[]>();
  for (const row of (ciRows as CocktailIngredientRow[]) ?? []) {
    const list = ingredientsByCocktail.get(row.cocktail_id) ?? [];
    list.push(cocktailIngredientRowToModel(row));
    ingredientsByCocktail.set(row.cocktail_id, list);
  }

  return (cocktailRows as CocktailRow[]).map(row =>
    rowToCocktail(row, ingredientsByCocktail.get(row.id) ?? [])
  );
}

export async function insertCocktail(
  cocktail: Omit<Cocktail, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
): Promise<Cocktail> {
  // Get current user ID for RLS
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Insert the cocktail
  const { data: cocktailData, error: cocktailError } = await supabase
    .from('cocktails')
    .insert({
      user_id: user.id,
      name: cocktail.name,
      notes: cocktail.notes ?? null,
      category: cocktail.category ?? null,
      description: cocktail.description ?? null,
      favorited: cocktail.favorited ?? false,
      retail_price: cocktail.retailPrice ?? null,
      image_path: cocktail.imagePath ?? null,
    })
    .select()
    .single();

  if (cocktailError) throw new Error(cocktailError.message);
  const cocktailRow = cocktailData as CocktailRow;

  // Insert cocktail ingredients
  if (cocktail.ingredients.length > 0) {
    const ciInserts = cocktail.ingredients.map((ing, index) => ({
      cocktail_id: cocktailRow.id,
      ingredient_id: ing.ingredientId,
      pour_size: ing.pourSize,
      cost: ing.cost,
      sort_order: ing.order ?? index,
      ingredient_name: ing.name,
      product_size: ing.productSize,
      product_cost: ing.productCost,
    }));

    const { error: ciError } = await supabase
      .from('cocktail_ingredients')
      .insert(ciInserts);

    if (ciError) throw new Error(ciError.message);
  }

  return rowToCocktail(cocktailRow, cocktail.ingredients);
}

export async function updateCocktailById(
  id: string,
  updates: Partial<Cocktail>
): Promise<Cocktail> {
  const row: Record<string, unknown> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.notes !== undefined) row.notes = updates.notes;
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.favorited !== undefined) row.favorited = updates.favorited;
  if (updates.retailPrice !== undefined) row.retail_price = updates.retailPrice;
  if (updates.imagePath !== undefined) row.image_path = updates.imagePath;

  const { data, error } = await supabase
    .from('cocktails')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // If ingredients were updated, replace them
  if (updates.ingredients !== undefined) {
    // Delete existing
    await supabase
      .from('cocktail_ingredients')
      .delete()
      .eq('cocktail_id', id);

    // Insert new
    if (updates.ingredients.length > 0) {
      const ciInserts = updates.ingredients.map((ing, index) => ({
        cocktail_id: id,
        ingredient_id: ing.ingredientId,
        pour_size: ing.pourSize,
        cost: ing.cost,
        sort_order: ing.order ?? index,
        ingredient_name: ing.name,
        product_size: ing.productSize,
        product_cost: ing.productCost,
      }));

      const { error: ciError } = await supabase
        .from('cocktail_ingredients')
        .insert(ciInserts);

      if (ciError) throw new Error(ciError.message);
    }
  }

  // Re-fetch to get the full cocktail with ingredients
  const cocktailRow = data as CocktailRow;
  const { data: ciRows } = await supabase
    .from('cocktail_ingredients')
    .select('*')
    .eq('cocktail_id', id)
    .order('sort_order', { ascending: true });

  const ingredients = ((ciRows as CocktailIngredientRow[]) ?? []).map(cocktailIngredientRowToModel);
  return rowToCocktail(cocktailRow, ingredients);
}

export async function deleteCocktailById(id: string): Promise<void> {
  // cocktail_ingredients cascade-deletes automatically
  const { error } = await supabase
    .from('cocktails')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
