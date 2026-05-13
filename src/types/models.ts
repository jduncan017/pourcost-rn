/**
 * Core domain models for PourCost application
 * Matches the iOS Swift models for data compatibility
 */

// ==========================================
// VOLUME MODEL — matches iOS Volume enum
// ==========================================

/** Discriminated union matching iOS Volume enum with associated values */
export type Volume =
  | { kind: 'fractionalOunces'; numerator: number; denominator: number }
  | { kind: 'decimalOunces'; ounces: number }
  | { kind: 'namedOunces'; name: string; ounces: number }
  | { kind: 'unitQuantity'; unitType: UnitQuantityType; name: string; quantity: number; ounces: number }
  | { kind: 'milliliters'; ml: number }
  | { kind: 'standardUnit'; si: number }
  /** Free-form label for items sold by weight, jar, or unit — no oz equivalent.
   *  Costing calculations return 0; user must update to a real size before
   *  cost-per-oz or pour-cost math works. label='Update Required' signals
   *  an incomplete import row. */
  | { kind: 'freeForm'; label: string };

export type UnitQuantityType = 'oneCanOrBottle' | 'oneThing';

/** Get the ounce value of any Volume (matches iOS Volume.ounces computed property) */
export function volumeToOunces(v: Volume): number {
  if (!v?.kind) return 0;
  switch (v.kind) {
    case 'fractionalOunces':
      return v.numerator / v.denominator;
    case 'decimalOunces':
      return v.ounces;
    case 'namedOunces':
      return v.ounces;
    case 'unitQuantity':
      return v.ounces;
    case 'milliliters':
      return v.ml * 0.033814; // matches iOS constant
    case 'standardUnit':
      return v.si / 29.0; // matches iOS standardUnitsToOunces
    case 'freeForm':
      return 0;
  }
}

/** Get display label for a Volume */
export function volumeLabel(v: Volume): string {
  if (!v?.kind) return '—';
  switch (v.kind) {
    case 'fractionalOunces': {
      // Render fractional ounces as a decimal so the whole app reads
      // consistently. Common pour-size denominators (2, 4, 8, 16) all
      // produce exact decimals so rounding isn't needed.
      const oz = v.numerator / v.denominator;
      return `${oz} oz`;
    }
    case 'decimalOunces':
      return `${v.ounces} oz`;
    case 'namedOunces':
      return v.name;
    case 'unitQuantity':
      return v.name;
    case 'milliliters':
      if (v.ml >= 1000) {
        const liters = v.ml / 1000;
        // Use enough decimal places to avoid duplicates (1750ml = 1.75L, not 1.8L)
        const decimals = v.ml % 1000 === 0 ? 0 : v.ml % 100 === 0 ? 1 : 2;
        return `${liters.toFixed(decimals)}L`;
      }
      return `${v.ml}ml`;
    case 'standardUnit':
      return `${v.si} units`;
    case 'freeForm':
      return v.label;
  }
}

/** Check if a Volume is a unit quantity (for alternate cost calculation path) */
export function isUnitQuantity(v: Volume): v is Extract<Volume, { kind: 'unitQuantity' }> {
  return v?.kind === 'unitQuantity';
}

/** Check if a Volume is a free-form placeholder (no oz equivalent, costing blocked) */
export function isFreeFormSize(v: Volume): v is Extract<Volume, { kind: 'freeForm' }> {
  return v?.kind === 'freeForm';
}

/** Returns true for freeForm sizes that still need the user to set a real bottle size */
export function needsSizeUpdate(v: Volume): boolean {
  return v?.kind === 'freeForm' && (v as Extract<Volume, { kind: 'freeForm' }>).label === 'Update Required';
}

/** Helper to create fractional ounces (matches iOS Volume(fraction:)) */
export function fraction(numerator: number, denominator: number): Volume {
  return { kind: 'fractionalOunces', numerator, denominator };
}

// ==========================================
// POUR SIZE SCALE — matches iOS PourSizeScale
// ==========================================

export type PourSizeScale = 'us' | 'metric';

// ==========================================
// SAVED INGREDIENT — matches iOS SavedIngredient + DynamoDB record
// ==========================================

export interface SavedIngredient {
  id: string;
  name: string;
  productSize: Volume;     // Default-configuration size, mirrored on the row for cocktail_ingredients lookups
  productCost: number;     // Default-configuration cost
  retailPrice?: number;    // Sell price per pour (for pour cost % calculation)
  pourSize?: Volume;       // Per-ingredient pour size (overrides global default)
  type?: string;
  subType?: string;        // Spirit subcategory (Vodka, Whiskey, etc.)
  abv?: number;            // Alcohol by volume as % (e.g. 40 for 40% ABV). Optional.
  notForSale?: boolean;
  description?: string;
  /** True for ingredients seeded by the wells onboarding picker. The cocktail
   *  picker substitutes a generic recipe slot ("any vodka") with the user's
   *  well brand of that subtype. Defaults to false for normal ingredients. */
  isWell?: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  /** Link to the global canonical_products catalog. Set when the user chose
   *  this ingredient via catalog autocomplete or via invoice scan match.
   *  Drives the education panel on ingredient-detail and unlocks library
   *  recipe matching. Null = user typed the ingredient by hand. */
  canonicalProductId?: string;
  /** Canonical subcategory denormalized from the linked canonical_products row.
   *  Drives the L3 chip filter (Bourbon/Rye/Scotch under Whiskey, etc.). NULL
   *  for ingredients with no canonical link or whose canonical has no sub yet. */
  canonicalSubcategory?: string;
  /** Per-user overrides on canonical-derived fields. Display falls back to
   *  the linked canonical_products row when the override is null. Surfaced
   *  via the Detailed-mode toggle on ingredient-form. */
  brand?: string;
  origin?: string;
  flavorNotes?: string[];
  parentCompany?: string;
  foundedYear?: number;
  productionRegion?: string;
  agingYears?: number;
  educationData?: Record<string, unknown>;
  /** Additional purchase configurations (different bottle sizes / pack deals).
   *  The default size lives on the row's productSize/productCost. Configurations
   *  hold the SECONDARY sizes only — adding a second config doesn't duplicate
   *  the default. Empty / undefined when the ingredient is single-size. */
  configurations?: IngredientConfiguration[];
}

/** Alternate purchase size for an ingredient (e.g. Tito's 750ml + 1.75L).
 *  Schema: ingredient_configurations table (migration 001_invoice_scanning.sql).
 *  The ingredient's own productSize/productCost is the primary; configurations
 *  hold any additional sizes the user has loaded into their library. */
export interface IngredientConfiguration {
  id: string;
  ingredientId: string;
  productSize: Volume;
  productCost: number;
  packSize?: number;          // 1 = single bottle; 6 = six-pack; 12 = case
  packCost?: number;          // Total case/pack price (vs unit productCost)
  distributorName?: string;   // Who supplies this size/pack
  source?: 'manual' | 'invoice' | 'barcode' | 'csv_import';
  isDefault?: boolean;        // True for the config row that mirrors the ingredient's default size
  createdAt: Date;
}

// ==========================================
// COCKTAIL INGREDIENT — matches iOS CocktailIngredient
// ==========================================

export interface CocktailIngredient {
  ingredientId: string;
  name: string;
  productSize: Volume;
  productCost: number;
  pourSize: Volume;        // How much of the ingredient goes in the drink
  cost: number;            // Calculated cost for this pour
  order?: number;
}

// ==========================================
// COCKTAIL — matches iOS Cocktail + DynamoDB record
// ==========================================

export interface Cocktail {
  id: string;
  name: string;
  notes?: string;
  ingredients: CocktailIngredient[];
  category?: CocktailCategory;
  description?: string;
  imagePath?: string;
  favorited?: boolean;
  retailPrice?: number;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

export type CocktailCategory =
  | 'Whiskey'
  | 'Vodka'
  | 'Rum'
  | 'Gin'
  | 'Tequila'
  | 'Other';

// ==========================================
// DISPLAY TYPES (computed on-demand, never stored)
// ==========================================

export interface IngredientMetrics {
  costPerOz: number;
  costPerPour: number;
  pourCostPercentage: number;
  pourCostMargin: number;
}

export interface CocktailMetrics {
  totalCost: number;
  suggestedPrice: number;
  pourCostPercentage: number;
  profitMargin: number;
}

// ==========================================
// CURRENCY & USER
// ==========================================

export interface CurrencySymbol {
  code: string;
  symbol: string;
  name: string;
}

export interface ConversionRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  lastUpdated: Date;
}

export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  authProvider: 'facebook' | 'google' | 'apple' | 'cognito';
  baseCurrency: string;
  measurementSystem: PourSizeScale;
  createdAt: Date;
  lastLoginAt: Date;
}
