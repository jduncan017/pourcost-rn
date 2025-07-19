/**
 * Standard bottle sizes used in the hospitality industry
 * All volumes in milliliters with corresponding ounce conversions
 */

export interface BottleSize {
  ml: number;
  oz: number;
  label: string;
  category?: 'wine' | 'spirits' | 'beer' | 'keg';
}

export const BOTTLE_SIZES: BottleSize[] = [
  // Small bottles & splits
  { ml: 180, oz: 6.1, label: '180ml / 6.1oz', category: 'wine' },
  { ml: 187, oz: 6.3, label: '187ml / 6.3oz (Split)', category: 'wine' },
  { ml: 200, oz: 6.8, label: '200ml / 6.8oz', category: 'spirits' },
  
  // Common beer sizes
  { ml: 300, oz: 10.1, label: '300ml / 10.1oz', category: 'beer' },
  { ml: 330, oz: 11.2, label: '330ml / 11.2oz', category: 'beer' },
  
  // Half bottles
  { ml: 375, oz: 12.7, label: '375ml / 12.7oz (Half)', category: 'spirits' },
  
  // Standard beer & wine
  { ml: 500, oz: 16.9, label: '500ml / 16.9oz', category: 'beer' },
  { ml: 651, oz: 22.0, label: '22oz / 651ml', category: 'beer' },
  { ml: 700, oz: 23.7, label: '700ml / 23.7oz', category: 'spirits' },
  { ml: 720, oz: 24.3, label: '720ml / 24.3oz', category: 'spirits' },
  { ml: 739, oz: 25.0, label: '25oz / 739ml', category: 'beer' },
  
  // Standard bottle (most common)
  { ml: 750, oz: 25.4, label: '750ml / 25.4oz (Standard)', category: 'spirits' },
  
  // Liter bottles
  { ml: 1000, oz: 33.8, label: '1L / 33.8oz', category: 'spirits' },
  { ml: 1125, oz: 38.0, label: '1.125L / 38.0oz', category: 'spirits' },
  
  // Large format bottles
  { ml: 1500, oz: 50.7, label: '1.5L / 50.7oz (Magnum)', category: 'wine' },
  { ml: 1750, oz: 59.2, label: '1.75L / 59.2oz (Handle)', category: 'spirits' },
  { ml: 1800, oz: 60.9, label: '1.8L / 60.9oz', category: 'spirits' },
  
  // Specialty beer containers
  { ml: 946, oz: 32.0, label: '32oz Crowler / 946ml', category: 'beer' },
  { ml: 1893, oz: 64.0, label: '64oz Growler / 1893ml', category: 'beer' },
  
  // Large containers
  { ml: 3000, oz: 101.4, label: '3L / 101.4oz', category: 'wine' },
  { ml: 5000, oz: 169.1, label: '5L / 169.1oz', category: 'wine' },
  
  // Commercial kegs
  { ml: 18927, oz: 640.0, label: 'Corny Keg / 640oz', category: 'keg' },
  { ml: 19543, oz: 660.5, label: 'Sixth Barrel / 660.5oz', category: 'keg' },
  { ml: 20000, oz: 676.3, label: '20L Keg / 676.3oz', category: 'keg' },
  { ml: 29356, oz: 992.0, label: 'Quarter Barrel / 992oz', category: 'keg' },
  { ml: 30000, oz: 1014.4, label: '30L Keg / 1014.4oz', category: 'keg' },
  { ml: 50000, oz: 1690.7, label: '50L Keg / 1690.7oz', category: 'keg' },
  { ml: 58674, oz: 1984.0, label: 'Half Barrel / 1984oz', category: 'keg' },
];

/**
 * Get bottle sizes filtered by category
 */
export const getBottleSizesByCategory = (category?: BottleSize['category']): BottleSize[] => {
  if (!category) return BOTTLE_SIZES;
  return BOTTLE_SIZES.filter(size => size.category === category);
};

/**
 * Get the most common bottle sizes (spirits, wine, beer)
 */
export const getCommonBottleSizes = (): BottleSize[] => {
  return BOTTLE_SIZES.filter(size => 
    size.category !== 'keg' && size.ml <= 2000
  );
};

/**
 * Find bottle size by ml value
 */
export const findBottleSize = (ml: number): BottleSize | undefined => {
  return BOTTLE_SIZES.find(size => size.ml === ml);
};

/**
 * Get default bottle size (750ml standard)
 */
export const getDefaultBottleSize = (): BottleSize => {
  return findBottleSize(750) || BOTTLE_SIZES[11]; // Fallback to index 11 if 750ml not found
};