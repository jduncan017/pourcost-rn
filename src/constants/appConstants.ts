/**
 * Application Constants for PourCost-RN
 * Pour sizes and product sizes match the iOS app exactly.
 */

import { Volume, PourSizeScale, fraction } from '@/src/types/models';

// ==========================================
// POUR SIZES — matches iOS PourSizes-PourCost.swift
// ==========================================

/** US pour sizes — matches iOS USPourSizes.values exactly */
export const US_POUR_SIZES: Volume[] = [
  { kind: 'namedOunces', name: 'drop', ounces: 0.00169 },
  { kind: 'namedOunces', name: 'dash', ounces: 0.01691 },
  { kind: 'namedOunces', name: 'bspn', ounces: 0.16907 },
  fraction(1, 8),
  fraction(1, 4),
  fraction(3, 8),
  fraction(1, 2),
  fraction(3, 4),
  fraction(1, 1),       // 1 oz
  fraction(5, 4),       // 1 1/4
  fraction(3, 2),       // 1 1/2
  fraction(7, 4),       // 1 3/4
  fraction(2, 1),       // 2
  fraction(9, 4),       // 2 1/4
  fraction(5, 2),       // 2 1/2
  fraction(11, 4),      // 2 3/4
  fraction(3, 1),       // 3
  fraction(7, 2),       // 3 1/2
  fraction(4, 1),
  fraction(5, 1),
  fraction(6, 1),
  fraction(7, 1),
  fraction(8, 1),
  fraction(9, 1),
  fraction(10, 1),
  fraction(12, 1),
  fraction(14, 1),
  fraction(16, 1),
  { kind: 'decimalOunces', ounces: 19.2 },
  fraction(20, 1),
  { kind: 'milliliters', ml: 187 },
  { kind: 'milliliters', ml: 500 },
  { kind: 'decimalOunces', ounces: 22.0 },
  { kind: 'decimalOunces', ounces: 25.0 },
  { kind: 'milliliters', ml: 750 },
  { kind: 'milliliters', ml: 1000 },
  { kind: 'milliliters', ml: 1500 },
  { kind: 'namedOunces', name: '32oz Crowler', ounces: 32 },
  { kind: 'namedOunces', name: '64oz Growler', ounces: 64 },
];

/** US initial pour size: 1 oz */
export const US_INITIAL_POUR_SIZE = fraction(1, 1);

/** Metric pour sizes — matches iOS MetricPourSizes.values exactly */
export const METRIC_POUR_SIZES: Volume[] = [
  { kind: 'namedOunces', name: 'drop', ounces: 0.00169 },
  { kind: 'namedOunces', name: 'dash', ounces: 0.01691 },
  { kind: 'namedOunces', name: 'bspn', ounces: 0.16907 },
  { kind: 'milliliters', ml: 5 },
  { kind: 'milliliters', ml: 7.5 },
  { kind: 'milliliters', ml: 10 },
  { kind: 'milliliters', ml: 12.5 },
  { kind: 'milliliters', ml: 15 },
  { kind: 'milliliters', ml: 20 },
  { kind: 'milliliters', ml: 22.5 },
  { kind: 'milliliters', ml: 25 },
  { kind: 'milliliters', ml: 30 },
  { kind: 'milliliters', ml: 35 },
  { kind: 'milliliters', ml: 37.5 },
  { kind: 'milliliters', ml: 40 },
  { kind: 'milliliters', ml: 45 },
  { kind: 'milliliters', ml: 50 },
  { kind: 'milliliters', ml: 60 },
  { kind: 'milliliters', ml: 70 },
  { kind: 'milliliters', ml: 75 },
  { kind: 'milliliters', ml: 90 },
  { kind: 'milliliters', ml: 100 },
  { kind: 'milliliters', ml: 125 },
  { kind: 'milliliters', ml: 150 },
  { kind: 'milliliters', ml: 175 },
  { kind: 'milliliters', ml: 187 },
  { kind: 'milliliters', ml: 200 },
  { kind: 'milliliters', ml: 250 },
  { kind: 'milliliters', ml: 284 },
  { kind: 'milliliters', ml: 300 },
  { kind: 'milliliters', ml: 330 },
  { kind: 'milliliters', ml: 500 },
  { kind: 'milliliters', ml: 560 },
  { kind: 'milliliters', ml: 750 },
  { kind: 'milliliters', ml: 1000 },
  { kind: 'milliliters', ml: 1125 },
  { kind: 'milliliters', ml: 1500 },
  { kind: 'milliliters', ml: 1750 },
  { kind: 'namedOunces', name: '32oz Crowler', ounces: 32 },
  { kind: 'namedOunces', name: '64oz Growler', ounces: 64 },
];

/** Metric initial pour size: 30ml */
export const METRIC_INITIAL_POUR_SIZE: Volume = { kind: 'milliliters', ml: 30 };

/** Get pour sizes for a given scale */
export function getPourSizes(scale: PourSizeScale): Volume[] {
  return scale === 'us' ? US_POUR_SIZES : METRIC_POUR_SIZES;
}

/** Get the default pour size for a scale */
export function getInitialPourSize(scale: PourSizeScale): Volume {
  return scale === 'us' ? US_INITIAL_POUR_SIZE : METRIC_INITIAL_POUR_SIZE;
}

// ==========================================
// PRODUCT (CONTAINER) SIZES — matches iOS PourCostProductSizes exactly
// ==========================================

/** All product/container sizes — matches iOS PourCostProductSizes.generateValues() */
export const PRODUCT_SIZES: Volume[] = [
  { kind: 'unitQuantity', unitType: 'oneThing', name: '1 Can/Bottle', quantity: 1, ounces: 12 },
  { kind: 'milliliters', ml: 180 },
  { kind: 'milliliters', ml: 187 },
  { kind: 'milliliters', ml: 200 },
  { kind: 'milliliters', ml: 300 },
  { kind: 'milliliters', ml: 330 },
  { kind: 'milliliters', ml: 375 },
  { kind: 'milliliters', ml: 500 },
  { kind: 'decimalOunces', ounces: 22.0 },
  { kind: 'decimalOunces', ounces: 25.0 },
  { kind: 'milliliters', ml: 700 },
  { kind: 'milliliters', ml: 720 },
  { kind: 'milliliters', ml: 750 },
  { kind: 'milliliters', ml: 1000 },
  { kind: 'milliliters', ml: 1125 },
  { kind: 'milliliters', ml: 1500 },
  { kind: 'milliliters', ml: 1750 },
  { kind: 'milliliters', ml: 1800 },
  { kind: 'namedOunces', name: '32oz Crowler', ounces: 32 },
  { kind: 'namedOunces', name: '64oz Growler', ounces: 64 },
  { kind: 'milliliters', ml: 3000 },
  { kind: 'milliliters', ml: 5000 },
  { kind: 'namedOunces', name: 'Corny Keg', ounces: 640 },
  { kind: 'namedOunces', name: 'Sixth Barrel', ounces: 660.48 },
  { kind: 'namedOunces', name: '20L Keg', ounces: 676.28 },
  { kind: 'namedOunces', name: 'Quarter Barrel', ounces: 992 },
  { kind: 'namedOunces', name: '30L Keg', ounces: 1014.42 },
  { kind: 'namedOunces', name: '50L Keg', ounces: 1690.7 },
  { kind: 'namedOunces', name: 'Half Barrel', ounces: 1984 },
  { kind: 'unitQuantity', unitType: 'oneCanOrBottle', name: '4 pack', quantity: 4, ounces: 48 },
  { kind: 'unitQuantity', unitType: 'oneCanOrBottle', name: '6 pack', quantity: 6, ounces: 72 },
  { kind: 'unitQuantity', unitType: 'oneCanOrBottle', name: '12 pack', quantity: 12, ounces: 144 },
  { kind: 'unitQuantity', unitType: 'oneCanOrBottle', name: '24 pack', quantity: 24, ounces: 288 },
  { kind: 'unitQuantity', unitType: 'oneCanOrBottle', name: '30 pack', quantity: 30, ounces: 360 },
];

/** Initial product size: 750ml (matches iOS) */
export const INITIAL_PRODUCT_SIZE: Volume = { kind: 'milliliters', ml: 750 };

// ==========================================
// MARGINS — matches iOS Margins-PourCost.swift
// "Note not actually margins" — these are pour cost percentages
// ==========================================

/** Generate all margin values matching iOS (0.0025 to 1.0000) */
function generateMarginValues(): number[] {
  const values: number[] = [];
  // set1: 25 to 3975 by 25
  for (let i = 25; i < 4000; i += 25) values.push(i / 10000);
  // set2: 4000 to 4950 by 50
  for (let i = 4000; i < 5000; i += 50) values.push(i / 10000);
  // set3: 5000 to 6900 by 100
  for (let i = 5000; i < 7000; i += 100) values.push(i / 10000);
  // set4: 7000 to 10000 by 500
  for (let i = 7000; i <= 10000; i += 500) values.push(i / 10000);
  return values;
}

export const MARGIN_VALUES = generateMarginValues();
export const DEFAULT_MARGIN = 0.18; // 18% — matches iOS Margins.isInitial

/** Find the closest margin index for a given value */
export function findClosestMarginIndex(value: number): number {
  if (isNaN(value)) return MARGIN_VALUES.indexOf(DEFAULT_MARGIN);

  const exactIndex = MARGIN_VALUES.indexOf(value);
  if (exactIndex !== -1) return exactIndex;

  let closestIndex = 0;
  let closestDiff = Math.abs(MARGIN_VALUES[0] - value);
  for (let i = 1; i < MARGIN_VALUES.length; i++) {
    const diff = Math.abs(MARGIN_VALUES[i] - value);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = i;
    }
  }
  return closestIndex;
}

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
] as const;

export type CocktailCategoryFilter = (typeof COCKTAIL_CATEGORIES)[number];

// ==========================================
// SORTING OPTIONS
// ==========================================

export const INGREDIENT_SORT_OPTIONS = [
  'name',
  'cost',
  'pourCost',
  'margin',
  'created',
] as const;

export type IngredientSortOption = (typeof INGREDIENT_SORT_OPTIONS)[number];

export const COCKTAIL_SORT_OPTIONS = [
  'name',
  'cost',
  'created',
  'profitMargin',
  'costPercent',
] as const;

export type CocktailSortOption = (typeof COCKTAIL_SORT_OPTIONS)[number];

// ==========================================
// PERFORMANCE THRESHOLDS
// ==========================================

export const POUR_COST_THRESHOLDS = {
  EXCELLENT: 15,
  GOOD: 20,
  ACCEPTABLE: 25,
  HIGH: 30,
} as const;

// ==========================================
// DEFAULT VALUES
// ==========================================

export const DEFAULT_VALUES = {
  POUR_COST_TARGET: 0.18,   // 18% — matches iOS default margin
  CURRENCY: 'USD',
  MEASUREMENT_SYSTEM: 'us' as PourSizeScale,
} as const;

// ==========================================
// VALIDATION CONSTANTS
// ==========================================

export const VALIDATION_LIMITS = {
  MIN_PRODUCT_COST: 0,
  MAX_PRODUCT_COST: 10000,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;

// ==========================================
// STORAGE KEYS
// ==========================================

export const STORAGE_KEYS = {
  COCKTAILS: 'cocktails-store',
  INGREDIENTS: 'ingredients-store',
  APP_SETTINGS: 'app-store',
} as const;

// ==========================================
// UI CONSTANTS
// ==========================================

export const UI_CONSTANTS = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
  SEARCH_MIN_LENGTH: 2,
  MAX_SEARCH_RESULTS: 50,
} as const;

// ==========================================
// HELPERS
// ==========================================

export const getPourCostLevel = (percentage: number): string => {
  if (percentage <= POUR_COST_THRESHOLDS.EXCELLENT) return 'excellent';
  if (percentage <= POUR_COST_THRESHOLDS.GOOD) return 'good';
  if (percentage <= POUR_COST_THRESHOLDS.ACCEPTABLE) return 'acceptable';
  return 'high';
};

export const getPourCostColor = (percentage: number): string => {
  const level = getPourCostLevel(percentage);
  switch (level) {
    case 'excellent':
    case 'good':
      return 'text-s22';
    case 'acceptable':
      return 'text-s12';
    default:
      return 'text-e3';
  }
};
