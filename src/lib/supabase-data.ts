/**
 * Supabase data access layer.
 * Handles the mapping between Postgres snake_case rows and TypeScript camelCase models.
 * All Supabase queries go through here — stores should never import supabase directly.
 */

import { supabase } from './supabase';
import { SavedIngredient, Cocktail, CocktailIngredient, IngredientConfiguration, Volume, fraction } from '@/src/types/models';
import type { ThemeMode, IngredientOrderPref } from '@/src/stores/app-store';

// ==========================================
// PROFILE TYPES & FUNCTIONS
// ==========================================

interface ProfileRow {
  id: string;
  display_name: string | null;
  pour_cost_goal: number;
  beer_pour_cost_goal: number | null;
  wine_pour_cost_goal: number | null;
  default_pour_size: Volume | null;
  default_retail_price: number;
  min_cocktail_price: number | null;
  min_ingredient_price: number | null;
  ingredient_order_pref: string;
  theme_mode: string;
  default_landing_screen: string | null;
}

export interface ProfileData {
  pourCostGoal: number;
  beerPourCostGoal: number;
  winePourCostGoal: number;
  defaultPourSize: Volume;
  defaultRetailPrice: number;
  minCocktailPrice: number;
  minIngredientPrice: number;
  ingredientOrderPref: IngredientOrderPref;
  themeMode: ThemeMode;
  displayName: string;
  defaultLandingScreen: 'cocktails' | 'ingredients' | 'calculator';
  enabledProductSizes: string[];
}

const DEFAULT_POUR_SIZE = fraction(3, 2); // 1.5 oz

export async function fetchProfile(): Promise<ProfileData | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, pour_cost_goal, beer_pour_cost_goal, wine_pour_cost_goal, default_pour_size, default_retail_price, min_cocktail_price, min_ingredient_price, ingredient_order_pref, theme_mode, default_landing_screen, enabled_product_sizes')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  const row = data as ProfileRow;

  return {
    pourCostGoal: Math.round(Number(row.pour_cost_goal) * 100), // DB stores 0.18, app uses 18
    beerPourCostGoal:
      row.beer_pour_cost_goal != null ? Math.round(Number(row.beer_pour_cost_goal) * 100) : 22,
    winePourCostGoal:
      row.wine_pour_cost_goal != null ? Math.round(Number(row.wine_pour_cost_goal) * 100) : 25,
    defaultPourSize: row.default_pour_size ?? DEFAULT_POUR_SIZE,
    defaultRetailPrice: Number(row.default_retail_price),
    minCocktailPrice: row.min_cocktail_price != null ? Number(row.min_cocktail_price) : 10,
    minIngredientPrice: row.min_ingredient_price != null ? Number(row.min_ingredient_price) : 7,
    ingredientOrderPref: (row.ingredient_order_pref as IngredientOrderPref) ?? 'manual',
    themeMode: (row.theme_mode as ThemeMode) ?? 'dark',
    displayName: row.display_name ?? '',
    defaultLandingScreen: (row.default_landing_screen as ProfileData['defaultLandingScreen']) ?? 'cocktails',
    enabledProductSizes: (row as any).enabled_product_sizes ?? [],
  };
}

export async function updateProfile(profile: Partial<ProfileData>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const row: Record<string, unknown> = {};
  if (profile.pourCostGoal !== undefined) row.pour_cost_goal = profile.pourCostGoal / 100; // app 18 → DB 0.18
  if (profile.beerPourCostGoal !== undefined) row.beer_pour_cost_goal = profile.beerPourCostGoal / 100;
  if (profile.winePourCostGoal !== undefined) row.wine_pour_cost_goal = profile.winePourCostGoal / 100;
  if (profile.defaultPourSize !== undefined) row.default_pour_size = profile.defaultPourSize;
  if (profile.defaultRetailPrice !== undefined) row.default_retail_price = profile.defaultRetailPrice;
  if (profile.minCocktailPrice !== undefined) row.min_cocktail_price = profile.minCocktailPrice;
  if (profile.minIngredientPrice !== undefined) row.min_ingredient_price = profile.minIngredientPrice;
  if (profile.ingredientOrderPref !== undefined) row.ingredient_order_pref = profile.ingredientOrderPref;
  if (profile.themeMode !== undefined) row.theme_mode = profile.themeMode;
  if (profile.displayName !== undefined) row.display_name = profile.displayName;
  if (profile.defaultLandingScreen !== undefined) row.default_landing_screen = profile.defaultLandingScreen;
  if (profile.enabledProductSizes !== undefined) row.enabled_product_sizes = profile.enabledProductSizes;

  const { error } = await supabase
    .from('profiles')
    .update(row)
    .eq('id', user.id);

  if (error) throw new Error(error.message);

  // Mirror displayName to auth.users.raw_user_meta_data so dashboards, admin tools,
  // and server-side flows (e.g. transactional emails) see the current name.
  // Best-effort: never block the profile write — if offline or the auth call fails,
  // next save will retry via the same path.
  if (
    profile.displayName !== undefined &&
    user.user_metadata?.full_name !== profile.displayName
  ) {
    supabase.auth
      .updateUser({ data: { full_name: profile.displayName } })
      .catch((err) => {
        if (__DEV__) console.warn('updateUser metadata sync failed', err);
      });
  }
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
  sub_type: string | null;
  retail_price: number | null;
  pour_size: Volume | null;
  not_for_sale: boolean;
  description: string | null;
  abv: number | null;
  canonical_product_id: string | null;
  is_well: boolean;
  brand: string | null;
  origin: string | null;
  flavor_notes: string[] | null;
  parent_company: string | null;
  founded_year: number | null;
  production_region: string | null;
  aging_years: number | null;
  education_data: Record<string, unknown> | null;
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
    retailPrice: row.retail_price != null ? Number(row.retail_price) : undefined,
    pourSize: row.pour_size ?? undefined,
    type: row.type ?? undefined,
    subType: row.sub_type ?? undefined,
    abv: row.abv != null ? Number(row.abv) : undefined,
    notForSale: row.not_for_sale,
    description: row.description ?? undefined,
    isWell: row.is_well ?? false,
    canonicalProductId: row.canonical_product_id ?? undefined,
    brand: row.brand ?? undefined,
    origin: row.origin ?? undefined,
    flavorNotes: row.flavor_notes ?? undefined,
    parentCompany: row.parent_company ?? undefined,
    foundedYear: row.founded_year ?? undefined,
    productionRegion: row.production_region ?? undefined,
    agingYears: row.aging_years != null ? Number(row.aging_years) : undefined,
    educationData: row.education_data ?? undefined,
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

interface IngredientConfigurationRow {
  id: string;
  ingredient_id: string;
  product_size: Volume;
  product_cost: number;
  pack_size: number | null;
  pack_cost: number | null;
  source: string | null;
  created_at: string;
}

function rowToConfiguration(row: IngredientConfigurationRow): IngredientConfiguration {
  return {
    id: row.id,
    ingredientId: row.ingredient_id,
    productSize: row.product_size,
    productCost: Number(row.product_cost),
    packSize: row.pack_size ?? undefined,
    packCost: row.pack_cost != null ? Number(row.pack_cost) : undefined,
    source: (row.source as IngredientConfiguration['source']) ?? 'manual',
    createdAt: new Date(row.created_at),
  };
}

export async function fetchIngredients(): Promise<SavedIngredient[]> {
  // Single round-trip: ingredients + their configurations via Supabase nested select.
  const { data, error } = await supabase
    .from('ingredients')
    .select('*, ingredient_configurations(*)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as (IngredientRow & { ingredient_configurations: IngredientConfigurationRow[] })[]).map(
    (row) => {
      const ingredient = rowToIngredient(row);
      const configs = row.ingredient_configurations ?? [];
      ingredient.configurations = configs.length
        ? configs.map(rowToConfiguration)
        : undefined;
      return ingredient;
    }
  );
}

// ==========================================
// INGREDIENT CONFIGURATIONS CRUD
// ==========================================

export async function insertIngredientConfiguration(
  config: Omit<IngredientConfiguration, 'id' | 'createdAt'>
): Promise<IngredientConfiguration> {
  const { data, error } = await supabase
    .from('ingredient_configurations')
    .insert({
      ingredient_id: config.ingredientId,
      product_size: config.productSize,
      product_cost: config.productCost,
      pack_size: config.packSize ?? 1,
      pack_cost: config.packCost ?? null,
      source: config.source ?? 'manual',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToConfiguration(data as IngredientConfigurationRow);
}

export async function updateIngredientConfiguration(
  id: string,
  updates: Partial<Omit<IngredientConfiguration, 'id' | 'ingredientId' | 'createdAt'>>
): Promise<IngredientConfiguration> {
  const row: Record<string, unknown> = {};
  if (updates.productSize !== undefined) row.product_size = updates.productSize;
  if (updates.productCost !== undefined) row.product_cost = updates.productCost;
  if (updates.packSize !== undefined) row.pack_size = updates.packSize;
  if (updates.packCost !== undefined) row.pack_cost = updates.packCost;
  if (updates.source !== undefined) row.source = updates.source;

  const { data, error } = await supabase
    .from('ingredient_configurations')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToConfiguration(data as IngredientConfigurationRow);
}

export async function deleteIngredientConfiguration(id: string): Promise<void> {
  const { error } = await supabase
    .from('ingredient_configurations')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
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
      retail_price: ingredient.retailPrice ?? null,
      pour_size: ingredient.pourSize ?? null,
      type: ingredient.type ?? null,
      sub_type: ingredient.subType ?? null,
      abv: ingredient.abv ?? null,
      not_for_sale: ingredient.notForSale ?? false,
      description: ingredient.description ?? null,
      is_well: ingredient.isWell ?? false,
      canonical_product_id: ingredient.canonicalProductId ?? null,
      brand: ingredient.brand ?? null,
      origin: ingredient.origin ?? null,
      flavor_notes: ingredient.flavorNotes ?? null,
      parent_company: ingredient.parentCompany ?? null,
      founded_year: ingredient.foundedYear ?? null,
      production_region: ingredient.productionRegion ?? null,
      aging_years: ingredient.agingYears ?? null,
      education_data: ingredient.educationData ?? null,
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
  if (updates.retailPrice !== undefined) row.retail_price = updates.retailPrice;
  if (updates.pourSize !== undefined) row.pour_size = updates.pourSize;
  if (updates.type !== undefined) row.type = updates.type;
  if (updates.subType !== undefined) row.sub_type = updates.subType;
  if (updates.abv !== undefined) row.abv = updates.abv ?? null;
  if (updates.notForSale !== undefined) row.not_for_sale = updates.notForSale;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.isWell !== undefined) row.is_well = updates.isWell;
  if (updates.canonicalProductId !== undefined)
    row.canonical_product_id = updates.canonicalProductId ?? null;
  if (updates.brand !== undefined) row.brand = updates.brand ?? null;
  if (updates.origin !== undefined) row.origin = updates.origin ?? null;
  if (updates.flavorNotes !== undefined) row.flavor_notes = updates.flavorNotes ?? null;
  if (updates.parentCompany !== undefined) row.parent_company = updates.parentCompany ?? null;
  if (updates.foundedYear !== undefined) row.founded_year = updates.foundedYear ?? null;
  if (updates.productionRegion !== undefined) row.production_region = updates.productionRegion ?? null;
  if (updates.agingYears !== undefined) row.aging_years = updates.agingYears ?? null;
  if (updates.educationData !== undefined) row.education_data = updates.educationData ?? null;

  const { data, error } = await supabase
    .from('ingredients')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToIngredient(data as IngredientRow);
}

/**
 * Cascade an ingredient update to all cocktail_ingredients rows referencing it.
 * Updates the denormalized name, product_size, product_cost, and recomputes cost.
 */
export async function cascadeIngredientUpdate(ingredient: SavedIngredient): Promise<void> {
  // Find all cocktail_ingredients rows that use this ingredient
  const { data: rows, error: fetchErr } = await supabase
    .from('cocktail_ingredients')
    .select('id, pour_size')
    .eq('ingredient_id', ingredient.id);

  if (fetchErr || !rows || rows.length === 0) return;

  // Lazy import to avoid circular dependency
  const { calculateCostPerPour } = await import('@/src/services/calculation-service');

  // Update each row with current ingredient data
  for (const row of rows) {
    const pourSize = row.pour_size as Volume;
    const cost = calculateCostPerPour(ingredient.productSize, ingredient.productCost, pourSize);

    await supabase
      .from('cocktail_ingredients')
      .update({
        ingredient_name: ingredient.name,
        product_size: ingredient.productSize,
        product_cost: ingredient.productCost,
        cost,
      })
      .eq('id', row.id);
  }
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
