/**
 * Application Constants for PourCost-RN
 * Pour sizes and product sizes match the iOS app exactly.
 */

import { Volume, PourSizeScale, fraction, volumeToOunces } from '@/src/types/models';

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
  { kind: 'namedOunces', name: '32oz Growler', ounces: 32 },
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
  { kind: 'namedOunces', name: '32oz Growler', ounces: 32 },
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
  { kind: 'namedOunces', name: '32oz Growler', ounces: 32 },
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
  // BIB (Bag-in-Box) — yield calculated at 5:1 water:syrup ratio
  { kind: 'namedOunces', name: '2.5 gal BIB', ounces: 1920 },   // 2.5 gal syrup → ~15 gal finished → 1920 oz
  { kind: 'namedOunces', name: '3 gal BIB', ounces: 2304 },     // 3 gal syrup → ~18 gal finished → 2304 oz
  { kind: 'namedOunces', name: '5 gal BIB', ounces: 3840 },     // 5 gal syrup → ~30 gal finished → 3840 oz
];

/** Initial product size: 750ml (matches iOS) */
export const INITIAL_PRODUCT_SIZE: Volume = { kind: 'milliliters', ml: 750 };

/**
 * Maps ingredient types to applicable product size indices.
 * If a type isn't listed, all sizes are shown.
 */
const SPIRIT_SIZES = [
  // Standard bottles: 180ml through 1.75L
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
];

const WINE_SIZES = [
  // Bottles
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
  // Cans & packs (wine in cans is a thing)
  0,  // 1 Can/Bottle
  29, // 4 pack
  30, // 6 pack
  31, // 12 pack
  32, // 24 pack
];

const BEER_DRAFT_SIZES = [
  // Kegs only — what's on tap
  22, // Corny Keg
  23, // Sixth Barrel
  24, // 20L Keg
  25, // Quarter Barrel
  26, // 30L Keg
  27, // 50L Keg
  28, // Half Barrel
];

const BEER_PACKAGED_SIZES = [
  // Cans & packs
  0,  // 1 Can/Bottle
  29, // 4 pack
  30, // 6 pack
  31, // 12 pack
  32, // 24 pack
  33, // 30 pack
  // Bottles & growlers
  4,  // 300ml
  5,  // 330ml
  6,  // 375ml
  7,  // 500ml
  12, // 750ml
  13, // 1L
  18, // 32oz Growler
  19, // 64oz Growler
];

const BEER_ALL_SIZES = [...BEER_PACKAGED_SIZES, ...BEER_DRAFT_SIZES];

const NA_BIB_SIZES = [
  34, // 2.5 gal BIB
  35, // 3 gal BIB
  36, // 5 gal BIB
];

const NA_CANNED_SIZES = [
  0,  // 1 Can/Bottle
  29, // 4 pack
  30, // 6 pack
  31, // 12 pack
  32, // 24 pack
];

const NA_TAP_SIZES = [
  22, // Corny Keg
  23, // Sixth Barrel
  24, // 20L Keg
  25, // Quarter Barrel
  26, // 30L Keg
  27, // 50L Keg
  28, // Half Barrel
];

const PRODUCT_SIZE_MAP: Record<string, number[]> = {
  Spirit: SPIRIT_SIZES,
  Wine: WINE_SIZES,
  Beer: BEER_ALL_SIZES,
  'Non-Alc': [...NA_BIB_SIZES, ...NA_CANNED_SIZES, ...NA_TAP_SIZES],
  // Prepped, Garnish, Other: show all sizes
};

/** Subtype-specific product size overrides */
const SUBTYPE_SIZE_MAP: Record<string, number[]> = {
  'Draft': BEER_DRAFT_SIZES,
  'Packaged': BEER_PACKAGED_SIZES,
  'Soda (BIB)': NA_BIB_SIZES,
  'Soda (Canned)': NA_CANNED_SIZES,
  'Tap': NA_TAP_SIZES,
};

/** Get product sizes filtered by ingredient type and optional subtype */
export function getProductSizesForType(type?: string, subType?: string): Volume[] {
  // Subtype-specific sizes take priority
  if (subType && SUBTYPE_SIZE_MAP[subType]) {
    return SUBTYPE_SIZE_MAP[subType].map(i => PRODUCT_SIZES[i]).filter(Boolean);
  }
  if (!type || !PRODUCT_SIZE_MAP[type]) return PRODUCT_SIZES;
  return PRODUCT_SIZE_MAP[type].map(i => PRODUCT_SIZES[i]).filter(Boolean);
}

/** Get section label for a product size (for dropdown grouping) */
export function getProductSizeSection(size: Volume): string {
  if (size.kind === 'unitQuantity') return 'Cans & Packs';
  if (size.kind === 'namedOunces') {
    if (size.name.includes('BIB')) return 'Bag-in-Box (5:1 yield)';
    if (size.name.includes('Growler')) return 'Growlers';
    return 'Kegs';
  }
  return 'Bottles';
}

/**
 * Get contextual pour size options based on ingredient type + product size.
 * The math always works in oz: costPerOz * pourOz = costPerPour.
 * For packs, "1 Can" = totalOz / quantity — the division gives cost per unit.
 */
export function getPourChipsForContext(
  type: string,
  productSize: Volume
): { label: string; oz: number }[] {

  // ── Unit-based products (packs, single cans) — applies to Beer AND Wine ──
  if (productSize.kind === 'unitQuantity') {
    const perUnit = productSize.ounces / productSize.quantity;
    return [{ label: '1 Can', oz: perUnit }];
  }

  // ── Growlers — the whole container is the pour ──
  if (productSize.kind === 'namedOunces' && productSize.name.includes('Growler')) {
    return [{ label: `1 Growler`, oz: productSize.ounces }];
  }

  // ── BIB — soda fountain pours ──
  if (productSize.kind === 'namedOunces' && productSize.name.includes('BIB')) {
    return [
      { label: '8 oz', oz: 8 },
      { label: '10 oz', oz: 10 },
      { label: '12 oz', oz: 12 },
      { label: '16 oz', oz: 16 },
      { label: '20 oz', oz: 20 },
    ];
  }

  // ── Beer / Non-Alc from kegs or bottles ──
  if (type === 'Beer' || type === 'Non-Alc') {
    if (productSize.kind === 'namedOunces') {
      // Kegs — draft pours + growler fills
      return [
        { label: '12 oz', oz: 12 },
        { label: '16 oz', oz: 16 },
        { label: '20 oz', oz: 20 },
        { label: '32 oz (Growler)', oz: 32 },
        { label: '64 oz (Growler)', oz: 64 },
      ];
    }
    // Single bottle (ml/oz)
    const oz = volumeToOunces(productSize);
    return [{ label: '1 Bottle', oz }];
  }

  // ── Wine from bottles ──
  if (type === 'Wine') {
    const bottleOz = volumeToOunces(productSize);
    return [
      { label: '5 oz', oz: 5 },
      { label: '6 oz', oz: 6 },
      { label: '8 oz', oz: 8 },
      { label: '9 oz', oz: 9 },
      { label: '1 Bottle', oz: bottleOz },
    ];
  }

  // ── Spirit ──
  if (type === 'Spirit') {
    return [
      { label: '1 oz', oz: 1 },
      { label: '1.25 oz', oz: 1.25 },
      { label: '1.5 oz', oz: 1.5 },
      { label: '2 oz', oz: 2 },
    ];
  }

  // ── Garnish — unit-based: 1 piece, 2 pieces, etc. ──
  if (type === 'Garnish') {
    // If it's a unit quantity (bag of 50, etc.), pour is by piece
    // We approximate 1 garnish ≈ 0.5oz for cost purposes
    return [
      { label: '1 piece', oz: 0.5 },
      { label: '2 pieces', oz: 1 },
      { label: '3 pieces', oz: 1.5 },
    ];
  }

  // ── Prepped, Other ──
  return [
    { label: '0.5 oz', oz: 0.5 },
    { label: '1 oz', oz: 1 },
    { label: '2 oz', oz: 2 },
  ];
}

// ==========================================
// COCKTAIL QUICK POUR SIZES — fractional ounces for cocktail builder
// ==========================================

export const QUICK_POUR_SIZES: { label: string; volume: Volume }[] = [
  { label: '¼', volume: fraction(1, 4) },
  { label: '½', volume: fraction(1, 2) },
  { label: '¾', volume: fraction(3, 4) },
  { label: '1', volume: fraction(1, 1) },
  { label: '1¼', volume: fraction(5, 4) },
  { label: '1½', volume: fraction(3, 2) },
  { label: '2', volume: fraction(2, 1) },
  { label: '2½', volume: fraction(5, 2) },
];

/** "Other" pour sizes shown in bottom sheet (dashes, barspoons, larger pours) */
export const OTHER_POUR_SIZES: { label: string; volume: Volume }[] = [
  { label: '1 dash', volume: { kind: 'namedOunces', name: 'dash', ounces: 0.01691 } },
  { label: '2 dash', volume: { kind: 'namedOunces', name: '2 dash', ounces: 0.01691 * 2 } },
  { label: '3 dash', volume: { kind: 'namedOunces', name: '3 dash', ounces: 0.01691 * 3 } },
  { label: '1 bspn', volume: { kind: 'namedOunces', name: 'bspn', ounces: 0.16907 } },
  { label: '2 bspn', volume: { kind: 'namedOunces', name: '2 bspn', ounces: 0.16907 * 2 } },
  { label: '3 bspn', volume: { kind: 'namedOunces', name: '3 bspn', ounces: 0.16907 * 3 } },
  { label: '3 oz', volume: fraction(3, 1) },
  { label: '4 oz', volume: fraction(4, 1) },
  { label: '5 oz', volume: fraction(5, 1) },
  { label: '6 oz', volume: fraction(6, 1) },
];

// ==========================================
// DEFAULT PRODUCT SIZES BY TYPE — for calculator/form defaults
// ==========================================

/** Default product size label per ingredient type */
export const DEFAULT_PRODUCT_SIZE: Record<string, string> = {
  Spirit: '750ml',
  Beer: 'Half Barrel',
  Wine: '750ml',
  'Non-Alc': '5 gal BIB',
  Prepped: '500ml',
  Garnish: '',
  Other: '500ml',
};

/** Override default product size when a subtype is selected */
export const DEFAULT_PRODUCT_SIZE_BY_SUBTYPE: Record<string, string> = {
  Draft: 'Half Barrel',
  Packaged: '6 pack',
  'Soda (BIB)': '5 gal BIB',
  'Soda (Canned)': '6 pack',
  Tap: 'Corny Keg',
};

// ==========================================
// PERFORMANCE BAR THRESHOLDS — ratio distance from goal
// ==========================================

export const PERFORMANCE_DISTANCE_THRESHOLDS = {
  ON_TARGET: 0.15,
  CLOSE: 0.35,
  DRIFTING: 0.6,
} as const;

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
  'Non-Alc',
  'Prepped',
  'Garnish',
  'Other',
] as const;

export type IngredientType = (typeof INGREDIENT_TYPES)[number];

export const SPIRIT_SUBTYPES = [
  'Vodka',
  'Whiskey', // umbrella — covers bourbon, scotch, rye, Irish, Canadian, etc.
  'Rum',
  'Gin',
  'Tequila',
  'Mezcal',
  'Brandy',
  'Cognac',
  'Absinthe',
  'Liqueur',
  'Amaro',
  'Cordial',
  'Bitters',
  'Other Spirit',
] as const;

export type SpiritSubtype = (typeof SPIRIT_SUBTYPES)[number];

export const BEER_SUBTYPES = [
  'Draft',
  'Packaged',
] as const;

export type BeerSubtype = (typeof BEER_SUBTYPES)[number];

export const WINE_SUBTYPES = [
  'Red',
  'White',
  'Rosé',
  'Sparkling',
  'Orange',
] as const;

export type WineSubtype = (typeof WINE_SUBTYPES)[number];

export const NA_SUBTYPES = [
  'Soda (BIB)',
  'Soda (Canned)',
  'Tap',
  'Other',
] as const;

export type NASubtype = (typeof NA_SUBTYPES)[number];

/** Map of ingredient types that have subtypes */
export const SUBTYPES_BY_TYPE: Record<string, readonly string[]> = {
  Spirit: SPIRIT_SUBTYPES,
  Beer: BEER_SUBTYPES,
  Wine: WINE_SUBTYPES,
  'Non-Alc': NA_SUBTYPES,
};

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
