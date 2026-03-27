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
  | { kind: 'standardUnit'; si: number };

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
  }
}

/** Get display label for a Volume */
export function volumeLabel(v: Volume): string {
  if (!v?.kind) return '—';
  switch (v.kind) {
    case 'fractionalOunces': {
      const whole = Math.floor(v.numerator / v.denominator);
      const remainder = v.numerator % v.denominator;
      if (remainder === 0) return `${whole} oz`;
      if (whole === 0) return `${v.numerator}/${v.denominator} oz`;
      return `${whole} ${remainder}/${v.denominator} oz`;
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
  }
}

/** Check if a Volume is a unit quantity (for alternate cost calculation path) */
export function isUnitQuantity(v: Volume): v is Extract<Volume, { kind: 'unitQuantity' }> {
  return v?.kind === 'unitQuantity';
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
  productSize: Volume;     // Container/bottle size (was bottleSize: number in ml)
  productCost: number;     // Price paid for the container (was bottlePrice)
  retailPrice?: number;    // Sell price per pour (for pour cost % calculation)
  pourSize?: Volume;       // Per-ingredient pour size (overrides global default)
  type?: string;
  subType?: string;        // Spirit subcategory (Vodka, Whiskey, etc.)
  notForSale?: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
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
