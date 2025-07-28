/**
 * Application Constants for PourCost-RN
 * Centralized definitions for data types, categories, and global constants
 * used throughout the application to ensure consistency.
 */

// ==========================================
// INGREDIENT TYPES
// ==========================================

export const INGREDIENT_TYPES = [
  'Beer',
  'Wine',
  'Spirit',
  'Liquor',
  'Prepared',
  'Garnish',
] as const;

export type IngredientType = (typeof INGREDIENT_TYPES)[number];

// Legacy ingredient types (for backward compatibility)
export const LEGACY_INGREDIENT_TYPES = [
  'Beer',
  'Wine',
  'Liquor',
  'Mixer',
  'Syrup',
  'Juice',
  'Other',
] as const;

export type LegacyIngredientType = (typeof LEGACY_INGREDIENT_TYPES)[number];

// ==========================================
// COCKTAIL CATEGORIES
// ==========================================

export const COCKTAIL_CATEGORIES = [
  'All',
  'Whiskey',
  'Vodka',
  'Rum',
  'Gin',
  'Tequila',
  'Other',
];

export type CocktailCategory = (typeof COCKTAIL_CATEGORIES)[number];

// ==========================================
// MEASUREMENT UNITS
// ==========================================

export const MEASUREMENT_UNITS = [
  'oz',
  'ml',
  'drops',
  'splash',
  'dash',
  'tsp',
  'tbsp',
] as const;

export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];

// Primary units for most ingredients
export const PRIMARY_UNITS = ['oz', 'ml'] as const;
export type PrimaryUnit = (typeof PRIMARY_UNITS)[number];

// ==========================================
// SORTING OPTIONS
// ==========================================

export const COCKTAIL_SORT_OPTIONS = [
  'name',
  'cost',
  'created',
  'profitMargin',
  'costPercent',
] as const;

export type CocktailSortOption = (typeof COCKTAIL_SORT_OPTIONS)[number];

export const INGREDIENT_SORT_OPTIONS = [
  'name',
  'cost',
  'pourCost',
  'margin',
  'created',
] as const;

export type IngredientSortOption = (typeof INGREDIENT_SORT_OPTIONS)[number];

// ==========================================
// PERFORMANCE THRESHOLDS
// ==========================================

export const POUR_COST_THRESHOLDS = {
  EXCELLENT: 15,
  GOOD: 20,
  ACCEPTABLE: 25,
  HIGH: 30,
} as const;

export const PROFIT_MARGIN_THRESHOLDS = {
  LOW: 5,
  GOOD: 10,
  EXCELLENT: 15,
} as const;

// ==========================================
// DEFAULT VALUES
// ==========================================

export const DEFAULT_VALUES = {
  POUR_SIZE: 1.5, // oz
  BOTTLE_SIZE: 750, // ml
  BOTTLE_PRICE: 25.0, // USD
  RETAIL_PRICE: 8.0, // USD
  TARGET_POUR_COST: 20, // percentage
  CURRENCY: 'USD',
  MEASUREMENT_SYSTEM: 'US',
} as const;

// ==========================================
// VALIDATION CONSTANTS
// ==========================================

export const VALIDATION_LIMITS = {
  MIN_BOTTLE_PRICE: 1,
  MAX_BOTTLE_PRICE: 1000,
  MIN_POUR_SIZE: 0.25,
  MAX_POUR_SIZE: 10,
  MIN_RETAIL_PRICE: 1,
  MAX_RETAIL_PRICE: 100,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;

// ==========================================
// UI CONSTANTS
// ==========================================

export const UI_CONSTANTS = {
  ITEM_HEIGHT: 80,
  CARD_BORDER_RADIUS: 12,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
  SEARCH_MIN_LENGTH: 2,
  MAX_SEARCH_RESULTS: 50,
} as const;

// ==========================================
// STORAGE KEYS
// ==========================================

export const STORAGE_KEYS = {
  COCKTAILS: 'cocktails-store',
  INGREDIENTS: 'ingredients-store',
  APP_SETTINGS: 'app-store',
  USER_PREFERENCES: 'user-preferences',
  THEME: 'theme-preference',
} as const;

// ==========================================
// ERROR MESSAGES
// ==========================================

export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_NUMBER: 'Please enter a valid number',
  INVALID_EMAIL: 'Please enter a valid email address',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  ITEM_NOT_FOUND: 'Item not found',
  PERMISSION_DENIED: 'Permission denied',
} as const;

// ==========================================
// SUCCESS MESSAGES
// ==========================================

export const SUCCESS_MESSAGES = {
  ITEM_CREATED: 'Item created successfully',
  ITEM_UPDATED: 'Item updated successfully',
  ITEM_DELETED: 'Item deleted successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
  DATA_EXPORTED: 'Data exported successfully',
  DATA_IMPORTED: 'Data imported successfully',
} as const;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Check if a value is a valid cocktail category
 */
export const isValidCocktailCategory = (
  value: string
): value is CocktailCategory => {
  return COCKTAIL_CATEGORIES.includes(value as CocktailCategory);
};

/**
 * Check if a value is a valid ingredient type
 */
export const isValidIngredientType = (
  value: string
): value is IngredientType => {
  return INGREDIENT_TYPES.includes(value as IngredientType);
};

/**
 * Get pour cost performance level based on percentage
 */
export const getPourCostLevel = (percentage: number): string => {
  if (percentage <= POUR_COST_THRESHOLDS.EXCELLENT) return 'excellent';
  if (percentage <= POUR_COST_THRESHOLDS.GOOD) return 'good';
  if (percentage <= POUR_COST_THRESHOLDS.ACCEPTABLE) return 'acceptable';
  return 'high';
};

/**
 * Get pour cost color based on performance level
 */
export const getPourCostColor = (percentage: number): string => {
  const level = getPourCostLevel(percentage);
  switch (level) {
    case 'excellent':
    case 'good':
      return 'text-s22'; // success green
    case 'acceptable':
      return 'text-s12'; // warning yellow
    default:
      return 'text-e3'; // error red
  }
};
