/**
 * Application Constants for PourCost-RN
 * Centralized definitions for data types, categories, and global constants
 * used throughout the application to ensure consistency.
 */

// ==========================================
// INGREDIENT TYPES
// ==========================================

export const INGREDIENT_TYPES = [
  'Spirit',
  'Beer',
  'Wine',
  'Prepped',
  'Garnish',
  'Other',
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
// CONTAINER SIZES BY INGREDIENT TYPE
// ==========================================

export interface ContainerSize {
  value: number; // Size in ml
  label: string;
  isCommon: boolean; // Whether this is a common size for the type
}

export const CONTAINER_SIZES_BY_TYPE: Record<IngredientType, ContainerSize[]> =
  {
    Spirit: [
      { value: 375, label: '375ml', isCommon: true },
      { value: 750, label: '750ml', isCommon: true },
      { value: 1000, label: '1000ml', isCommon: true },
      { value: 1750, label: '1750ml', isCommon: true },
    ],
    Beer: [
      { value: 19550, label: '1/2 Keg (15.5 gal)', isCommon: true }, // Keep descriptions for beer
      { value: 5870, label: '1/6 Keg (5 gal)', isCommon: true },
      { value: 8500, label: '24 Pack', isCommon: true },
      { value: 355, label: 'Single Can/Bottle', isCommon: true },
    ],
    Wine: [
      { value: 187, label: '187ml', isCommon: true },
      { value: 375, label: '375ml', isCommon: true },
      { value: 750, label: '750ml', isCommon: true },
      { value: 1500, label: '1500ml', isCommon: true },
    ],
    Prepped: [
      { value: 200, label: '200ml', isCommon: true },
      { value: 500, label: '500ml', isCommon: true },
      { value: 750, label: '750ml', isCommon: true },
      { value: 1000, label: '1000ml', isCommon: true },
    ],
    Garnish: [
      { value: 50, label: '50g', isCommon: true },
      { value: 100, label: '100g', isCommon: true },
      { value: 200, label: '200g', isCommon: true },
      { value: 500, label: '500g', isCommon: true },
    ],
    Other: [
      { value: 250, label: '250ml', isCommon: true },
      { value: 500, label: '500ml', isCommon: true },
      { value: 750, label: '750ml', isCommon: true },
      { value: 1000, label: '1000ml', isCommon: true },
    ],
  };

// All container sizes for "Other" dropdown
export const ALL_CONTAINER_SIZES: ContainerSize[] = [
  // Small sizes
  { value: 50, label: '50ml/g', isCommon: false },
  { value: 100, label: '100ml/g', isCommon: false },
  { value: 150, label: '150ml/g', isCommon: false },
  { value: 187, label: '187ml (Split)', isCommon: false },
  { value: 200, label: '200ml/g', isCommon: false },
  { value: 250, label: '250ml/g', isCommon: false },
  { value: 330, label: '330ml (Can)', isCommon: false },
  { value: 355, label: '355ml (Can)', isCommon: false },
  { value: 375, label: '375ml (Half Bottle)', isCommon: false },
  { value: 440, label: '440ml (Pint Can)', isCommon: false },
  { value: 500, label: '500ml', isCommon: false },
  { value: 568, label: '568ml (Imperial Pint)', isCommon: false },
  { value: 650, label: '650ml', isCommon: false },
  { value: 700, label: '700ml', isCommon: false },
  { value: 750, label: '750ml (Standard)', isCommon: false },
  { value: 1000, label: '1L', isCommon: false },
  { value: 1125, label: '1.125L', isCommon: false },
  { value: 1500, label: '1.5L (Magnum)', isCommon: false },
  { value: 1750, label: '1.75L (Handle)', isCommon: false },
  { value: 3000, label: '3L', isCommon: false },
  { value: 5000, label: '5L', isCommon: false },
  // Beer kegs
  { value: 5870, label: '1/6 Keg (5 gal)', isCommon: false },
  { value: 7750, label: '1/4 Keg (7.75 gal)', isCommon: false },
  { value: 15500, label: '1/2 Keg (15.5 gal)', isCommon: false },
  // Bulk sizes
  { value: 8500, label: '24 Pack Beer', isCommon: false },
  { value: 12750, label: '36 Pack Beer', isCommon: false },
];

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
