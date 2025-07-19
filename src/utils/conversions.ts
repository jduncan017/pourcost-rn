/**
 * Volume conversion utilities
 * Handles conversions between metric and imperial measurements
 */

// Standard conversion constants
export const ML_TO_OZ = 29.5735;
export const OZ_TO_ML = 1 / ML_TO_OZ;
export const LITERS_TO_ML = 1000;
export const GALLON_TO_ML = 3785.41;
export const PINT_TO_ML = 473.176;

/**
 * Convert milliliters to fluid ounces
 */
export const mlToOz = (ml: number): number => {
  return ml / ML_TO_OZ;
};

/**
 * Convert fluid ounces to milliliters
 */
export const ozToMl = (oz: number): number => {
  return oz * ML_TO_OZ;
};

/**
 * Convert liters to milliliters
 */
export const litersToMl = (liters: number): number => {
  return liters * LITERS_TO_ML;
};

/**
 * Convert milliliters to liters
 */
export const mlToLiters = (ml: number): number => {
  return ml / LITERS_TO_ML;
};

/**
 * Convert gallons to milliliters
 */
export const gallonsToMl = (gallons: number): number => {
  return gallons * GALLON_TO_ML;
};

/**
 * Convert milliliters to gallons
 */
export const mlToGallons = (ml: number): number => {
  return ml / GALLON_TO_ML;
};

/**
 * Format volume with appropriate unit based on measurement system
 */
export const formatVolume = (
  volumeMl: number, 
  measurementSystem: 'US' | 'Metric' = 'US',
  includeUnit: boolean = true
): string => {
  if (measurementSystem === 'Metric') {
    if (volumeMl >= 1000) {
      const liters = mlToLiters(volumeMl);
      return `${liters.toFixed(1)}${includeUnit ? 'L' : ''}`;
    }
    return `${volumeMl}${includeUnit ? 'ml' : ''}`;
  } else {
    const oz = mlToOz(volumeMl);
    return `${oz.toFixed(1)}${includeUnit ? 'oz' : ''}`;
  }
};

/**
 * Calculate cost per unit volume
 */
export const calculateCostPerOz = (bottlePrice: number, bottleSizeMl: number): number => {
  const bottleSizeOz = mlToOz(bottleSizeMl);
  return bottlePrice / bottleSizeOz;
};

/**
 * Calculate cost per milliliter
 */
export const calculateCostPerMl = (bottlePrice: number, bottleSizeMl: number): number => {
  return bottlePrice / bottleSizeMl;
};

/**
 * Calculate pour cost for a given volume
 */
export const calculatePourCost = (
  bottlePrice: number, 
  bottleSizeMl: number, 
  pourSizeOz: number
): number => {
  const costPerOz = calculateCostPerOz(bottlePrice, bottleSizeMl);
  return costPerOz * pourSizeOz;
};

/**
 * Common bottle sizes in milliliters
 */
export const COMMON_BOTTLE_SIZES = {
  // Spirits
  MINI: 50,
  SPLIT: 187,
  HALF_BOTTLE: 375,
  STANDARD: 750,
  LITER: 1000,
  MAGNUM: 1500,
  DOUBLE_MAGNUM: 3000,
  
  // Beer
  BEER_BOTTLE: 355,
  BEER_CAN: 355,
  BEER_PINT: 473,
  BEER_BOMBER: 650,
  
  // Wine
  WINE_SPLIT: 187,
  WINE_HALF: 375,
  WINE_STANDARD: 750,
  WINE_LITER: 1000,
  WINE_MAGNUM: 1500,
} as const;

/**
 * Get display name for bottle size
 */
export const getBottleSizeDisplay = (sizeMl: number): string => {
  const size = Object.entries(COMMON_BOTTLE_SIZES).find(([, ml]) => ml === sizeMl);
  if (size) {
    const [name] = size;
    return name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
  return `${sizeMl}ml`;
};