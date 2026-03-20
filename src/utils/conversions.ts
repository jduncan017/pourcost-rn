/**
 * Volume conversion utilities
 * Constants match iOS app exactly
 */

// iOS constant: mL * 0.033814 = oz
export const ML_TO_OZ_FACTOR = 0.033814;

export const mlToOz = (ml: number): number => ml * ML_TO_OZ_FACTOR;
export const ozToMl = (oz: number): number => oz / ML_TO_OZ_FACTOR;
export const litersToMl = (liters: number): number => liters * 1000;
export const mlToLiters = (ml: number): number => ml / 1000;

/**
 * Format volume for display based on measurement system
 */
export const formatVolume = (
  volumeMl: number,
  measurementSystem: 'us' | 'metric' = 'us',
  includeUnit: boolean = true
): string => {
  if (measurementSystem === 'metric') {
    if (volumeMl >= 1000) {
      const liters = mlToLiters(volumeMl);
      return `${liters.toFixed(volumeMl % 1000 === 0 ? 0 : 1)}${includeUnit ? 'L' : ''}`;
    }
    return `${volumeMl}${includeUnit ? 'ml' : ''}`;
  } else {
    const oz = mlToOz(volumeMl);
    return `${oz.toFixed(1)}${includeUnit ? 'oz' : ''}`;
  }
};

/**
 * Round to 2 decimal places (matches iOS NSDecimalNumber rounding behavior)
 */
export const round2 = (value: number): number =>
  Math.round(value * 100) / 100;
