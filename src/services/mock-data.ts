/**
 * Centralized mock data service for PourCost-RN
 * Single source of truth for all test/demo data
 * Uses canonical types from models.ts
 */

import { 
  SavedIngredient, 
  CocktailIngredient, 
  CocktailWithCalculations,
  IngredientWithCalculations 
} from '@/src/types/models';
import { CalculationService } from './calculation-service';
import { type CocktailCategory } from '@/src/constants/appConstants';

// ==========================================
// SAVED INGREDIENTS - Enhanced mock data for Phase 4
// ==========================================

export const MOCK_SAVED_INGREDIENTS: SavedIngredient[] = [
  // Premium Spirits
  {
    id: '1',
    name: 'Remy Martin V.S.O.P.',
    type: 'Spirit',
    bottleSize: 750,
    bottlePrice: 45.99,
    createdAt: new Date('2025-01-15T10:30:00Z'),
    updatedAt: new Date('2025-01-15T10:30:00Z'),
  },
  {
    id: '2',
    name: 'Grey Goose Vodka',
    type: 'Spirit',
    bottleSize: 750,
    bottlePrice: 24.99,
    createdAt: new Date('2025-01-15T09:15:00Z'),
    updatedAt: new Date('2025-01-15T09:15:00Z'),
  },
  {
    id: '6',
    name: 'Patron Silver Tequila',
    type: 'Spirit',
    bottleSize: 750,
    bottlePrice: 35.99,
    createdAt: new Date('2025-01-14T14:20:00Z'),
    updatedAt: new Date('2025-01-14T14:20:00Z'),
  },
  {
    id: '7',
    name: 'Hendricks Gin',
    type: 'Spirit',
    bottleSize: 750,
    bottlePrice: 28.99,
    createdAt: new Date('2025-01-14T11:45:00Z'),
    updatedAt: new Date('2025-01-14T11:45:00Z'),
  },
  {
    id: '8',
    name: 'Woodford Reserve Bourbon',
    type: 'Spirit',
    bottleSize: 750,
    bottlePrice: 42.99,
    createdAt: new Date('2025-01-13T16:30:00Z'),
    updatedAt: new Date('2025-01-13T16:30:00Z'),
  },
  {
    id: '9',
    name: 'Bacardi Superior Rum',
    type: 'Spirit',
    bottleSize: 750,
    bottlePrice: 18.99,
    createdAt: new Date('2025-01-13T10:20:00Z'),
    updatedAt: new Date('2025-01-13T10:20:00Z'),
  },
  
  // Liqueurs
  {
    id: '5',
    name: 'Cointreau Triple Sec',
    type: 'Liquor',
    bottleSize: 750,
    bottlePrice: 38.99,
    createdAt: new Date('2025-01-12T15:30:00Z'),
    updatedAt: new Date('2025-01-12T15:30:00Z'),
  },
  {
    id: '10',
    name: 'Kahlua Coffee Liqueur',
    type: 'Liquor',
    bottleSize: 750,
    bottlePrice: 22.99,
    createdAt: new Date('2025-01-12T09:15:00Z'),
    updatedAt: new Date('2025-01-12T09:15:00Z'),
  },
  {
    id: '11',
    name: 'Grand Marnier',
    type: 'Liquor',
    bottleSize: 750,
    bottlePrice: 34.99,
    createdAt: new Date('2025-01-11T14:45:00Z'),
    updatedAt: new Date('2025-01-11T14:45:00Z'),
  },
  
  // Mixers & Syrups
  {
    id: '3',
    name: 'Simple Syrup',
    type: 'Prepared',
    bottleSize: 500,
    bottlePrice: 8.99,
    createdAt: new Date('2025-01-11T12:30:00Z'),
    updatedAt: new Date('2025-01-11T12:30:00Z'),
  },
  {
    id: '4',
    name: 'Fresh Lime Juice',
    type: 'Prepared',
    bottleSize: 1000,
    bottlePrice: 4.99,
    createdAt: new Date('2025-01-10T16:20:00Z'),
    updatedAt: new Date('2025-01-10T16:20:00Z'),
  },
  {
    id: '12',
    name: 'Fresh Lemon Juice',
    type: 'Prepared',
    bottleSize: 1000,
    bottlePrice: 4.99,
    createdAt: new Date('2025-01-10T16:20:00Z'),
    updatedAt: new Date('2025-01-10T16:20:00Z'),
  },
  {
    id: '13',
    name: 'Grenadine',
    type: 'Prepared',
    bottleSize: 750,
    bottlePrice: 12.99,
    createdAt: new Date('2025-01-10T11:15:00Z'),
    updatedAt: new Date('2025-01-10T11:15:00Z'),
  },
  
  // Bitters & Garnishes
  {
    id: '14',
    name: 'Angostura Bitters',
    type: 'Garnish',
    bottleSize: 200,
    bottlePrice: 8.99,
    createdAt: new Date('2025-01-09T14:30:00Z'),
    updatedAt: new Date('2025-01-09T14:30:00Z'),
  },
  {
    id: '15',
    name: 'Orange Peel',
    type: 'Garnish',
    bottleSize: 100,
    bottlePrice: 3.99,
    createdAt: new Date('2025-01-09T10:45:00Z'),
    updatedAt: new Date('2025-01-09T10:45:00Z'),
  },
  {
    id: '16',
    name: 'Fresh Mint',
    type: 'Garnish',
    bottleSize: 50,
    bottlePrice: 2.99,
    createdAt: new Date('2025-01-08T15:20:00Z'),
    updatedAt: new Date('2025-01-08T15:20:00Z'),
  },
  
  // Beer & Wine
  {
    id: '17',
    name: 'IPA Beer',
    type: 'Beer',
    bottleSize: 355,
    bottlePrice: 3.99,
    createdAt: new Date('2025-01-08T12:10:00Z'),
    updatedAt: new Date('2025-01-08T12:10:00Z'),
  },
  {
    id: '18',
    name: 'Pinot Grigio',
    type: 'Wine',
    bottleSize: 750,
    bottlePrice: 16.99,
    createdAt: new Date('2025-01-07T18:30:00Z'),
    updatedAt: new Date('2025-01-07T18:30:00Z'),
  },
];

// ==========================================
// CALCULATION UTILITIES
// ==========================================

/**
 * Calculate cost per oz from bottle size and price
 * @deprecated Use CalculationService.calculateCostPerOz instead
 */
export function calculateCostPerOz(bottleSize: number, bottlePrice: number): number {
  return CalculationService.calculateCostPerOz(bottlePrice, bottleSize);
}

/**
 * Generate ingredient with calculations for display
 */
export function createIngredientWithCalculations(
  savedIngredient: SavedIngredient,
  pourSize: number = 1.5,
  retailPrice: number = 8.0,
  currency: string = 'USD',
  measurementSystem: 'US' | 'Metric' = 'US'
): IngredientWithCalculations {
  const costPerOz = CalculationService.calculateCostPerOz(savedIngredient.bottlePrice, savedIngredient.bottleSize);
  const costPerPour = CalculationService.calculatePourCost(costPerOz, pourSize);
  const pourCostPercentage = CalculationService.calculatePourCostPercentage(costPerPour, retailPrice);
  const pourCostMargin = CalculationService.calculateProfitMargin(retailPrice, costPerPour);

  return {
    ...savedIngredient,
    pourSize,
    costPerPour,
    costPerOz,
    pourCostMargin,
    pourCostPercentage,
    currency,
    measurementSystem,
  };
}

// ==========================================
// INGREDIENTS WITH CALCULATIONS
// ==========================================

export const MOCK_INGREDIENTS_WITH_CALCULATIONS: IngredientWithCalculations[] = 
  MOCK_SAVED_INGREDIENTS.map(ingredient => 
    createIngredientWithCalculations(ingredient, 1.5, 8.0, 'USD', 'US')
  );

// ==========================================
// COCKTAIL INGREDIENTS
// ==========================================

export const MOCK_COCKTAIL_INGREDIENTS: CocktailIngredient[] = [
  {
    ...MOCK_SAVED_INGREDIENTS[5], // Tequila Blanco
    amount: 2.0,
    unit: 'oz',
    cost: 2.84, // 1.42 * 2.0
  },
  {
    ...MOCK_SAVED_INGREDIENTS[3], // Fresh Lime Juice
    amount: 1.0,
    unit: 'oz',
    cost: 0.15, // 0.15 * 1.0
  },
  {
    ...MOCK_SAVED_INGREDIENTS[4], // Triple Sec
    amount: 1.0,
    unit: 'oz',
    cost: 0.75, // 0.75 * 1.0
  },
];

// ==========================================
// COCKTAILS WITH CALCULATIONS
// ==========================================

export const MOCK_COCKTAILS_WITH_CALCULATIONS: CocktailWithCalculations[] = [
  {
    id: '1',
    name: 'Classic Margarita',
    description: 'The perfect balance of tequila, lime, and orange liqueur',
    category: 'Tequila' as CocktailCategory,
    imagePath: 'margarita.jpg',
    ingredients: [
      {
        ...MOCK_SAVED_INGREDIENTS[2], // Patron Silver Tequila
        amount: 2.0,
        unit: 'oz',
        cost: 2.84,
      },
      {
        ...MOCK_SAVED_INGREDIENTS[9], // Fresh Lime Juice
        amount: 1.0,
        unit: 'oz',
        cost: 0.15,
      },
      {
        ...MOCK_SAVED_INGREDIENTS[6], // Cointreau Triple Sec
        amount: 1.0,
        unit: 'oz',
        cost: 1.54,
      },
    ],
    notes: 'Serve in salt-rimmed glass with lime wheel',
    profitMargin: 7.47,
    createdAt: new Date('2025-01-15T10:30:00Z'),
    updatedAt: new Date('2025-01-15T10:30:00Z'),
    favorited: true,
    totalCost: 4.53,
    suggestedPrice: 12.0,
    pourCostPercentage: 37.8,
  },
  {
    id: '2',
    name: 'Old Fashioned',
    description: 'Classic whiskey cocktail with muddled sugar and bitters',
    category: 'Whiskey' as CocktailCategory,
    // imagePath: 'old-fashioned.jpg', // No image available, will show fallback icon
    ingredients: [
      {
        ...MOCK_SAVED_INGREDIENTS[4], // Woodford Reserve Bourbon
        amount: 2.0,
        unit: 'oz',
        cost: 3.38,
      },
      {
        ...MOCK_SAVED_INGREDIENTS[8], // Simple Syrup
        amount: 0.25,
        unit: 'oz',
        cost: 0.13,
      },
      {
        ...MOCK_SAVED_INGREDIENTS[11], // Angostura Bitters
        amount: 0.125,
        unit: 'oz',
        cost: 0.15,
      },
      {
        ...MOCK_SAVED_INGREDIENTS[12], // Orange Peel
        amount: 1,
        unit: 'oz',
        cost: 0.06,
      },
    ],
    notes: 'Express orange oils over drink, garnish with peel',
    profitMargin: 10.28,
    createdAt: new Date('2025-01-14T16:45:00Z'),
    updatedAt: new Date('2025-01-14T16:45:00Z'),
    favorited: false,
    totalCost: 3.72,
    suggestedPrice: 14.0,
    pourCostPercentage: 26.6,
  },
  {
    id: '3',
    name: 'Mojito',
    description: 'Refreshing Cuban cocktail with mint, lime, and rum',
    category: 'Rum' as CocktailCategory,
    imagePath: 'mojito.jpg',
    ingredients: [
      {
        ...MOCK_SAVED_INGREDIENTS[5], // Bacardi Superior Rum
        amount: 2.0,
        unit: 'oz',
        cost: 1.50,
      },
      {
        ...MOCK_SAVED_INGREDIENTS[13], // Fresh Mint
        amount: 0.5,
        unit: 'oz',
        cost: 0.45,
      },
      {
        ...MOCK_SAVED_INGREDIENTS[9], // Fresh Lime Juice
        amount: 0.5,
        unit: 'oz',
        cost: 0.08,
      },
      {
        ...MOCK_SAVED_INGREDIENTS[8], // Simple Syrup
        amount: 0.25,
        unit: 'oz',
        cost: 0.13,
      },
    ],
    notes: 'Muddle mint gently, top with soda water',
    profitMargin: 7.84,
    createdAt: new Date('2025-01-13T14:20:00Z'),
    updatedAt: new Date('2025-01-13T14:20:00Z'),
    favorited: true,
    totalCost: 2.16,
    suggestedPrice: 10.0,
    pourCostPercentage: 21.6,
  },
  {
    id: '4',
    name: 'Espresso Martini',
    description: 'Modern coffee cocktail with vodka and coffee liqueur',
    category: 'Modern' as CocktailCategory,
    imagePath: 'espresso-martini.jpg',
    ingredients: [
      {
        ...MOCK_SAVED_INGREDIENTS[1], // Grey Goose Vodka
        amount: 2.0,
        unit: 'oz',
        cost: 1.96,
      },
      {
        ...MOCK_SAVED_INGREDIENTS[7], // Kahlua Coffee Liqueur
        amount: 1.0,
        unit: 'oz',
        cost: 0.91,
      },
      {
        ...MOCK_SAVED_INGREDIENTS[8], // Simple Syrup (as espresso substitute)
        amount: 1.0,
        unit: 'oz',
        cost: 0.27,
      },
    ],
    notes: 'Shake vigorously for proper foam, garnish with coffee beans',
    profitMargin: 11.86,
    createdAt: new Date('2025-01-12T19:30:00Z'),
    updatedAt: new Date('2025-01-12T19:30:00Z'),
    favorited: false,
    totalCost: 3.14,
    suggestedPrice: 15.0,
    pourCostPercentage: 20.9,
  },
  {
    id: '5',
    name: 'Gin & Tonic',
    description: 'Classic British cocktail with premium gin and tonic',
    category: 'Gin' as CocktailCategory,
    imagePath: 'gin-and-tonic.jpg',
    ingredients: [
      {
        ...MOCK_SAVED_INGREDIENTS[3], // Hendricks Gin
        amount: 2.0,
        unit: 'oz',
        cost: 2.28,
      },
    ],
    notes: 'Serve with cucumber garnish and lime wheel',
    profitMargin: 5.72,
    createdAt: new Date('2025-01-11T12:15:00Z'),
    updatedAt: new Date('2025-01-11T12:15:00Z'),
    favorited: true,
    totalCost: 2.28,
    suggestedPrice: 8.0,
    pourCostPercentage: 28.5,
  },
  {
    id: '6',
    name: 'Manhattan',
    description: 'Classic whiskey cocktail with sweet vermouth and bitters',
    category: 'Whiskey' as CocktailCategory,
    imagePath: 'manhattan.jpg',
    ingredients: [
      {
        ...MOCK_SAVED_INGREDIENTS[4], // Woodford Reserve Bourbon
        amount: 2.0,
        unit: 'oz',
        cost: 3.38,
      },
      {
        ...MOCK_SAVED_INGREDIENTS[11], // Angostura Bitters
        amount: 0.125,
        unit: 'oz',
        cost: 0.15,
      },
    ],
    notes: 'Stir with ice, strain, garnish with cherry',
    profitMargin: 9.47,
    createdAt: new Date('2025-01-10T15:30:00Z'),
    updatedAt: new Date('2025-01-10T15:30:00Z'),
    favorited: false,
    totalCost: 3.53,
    suggestedPrice: 13.0,
    pourCostPercentage: 27.2,
  },
];

// ==========================================
// SERVICE FUNCTIONS
// ==========================================

/**
 * Get all saved ingredients
 */
export function getSavedIngredients(): SavedIngredient[] {
  return MOCK_SAVED_INGREDIENTS;
}

/**
 * Get ingredients with calculations for display
 */
export function getIngredientsWithCalculations(): IngredientWithCalculations[] {
  return MOCK_INGREDIENTS_WITH_CALCULATIONS;
}

/**
 * Get cocktails with calculations for display
 */
export function getCocktailsWithCalculations(): CocktailWithCalculations[] {
  return MOCK_COCKTAILS_WITH_CALCULATIONS;
}

/**
 * Search ingredients by name or type
 */
export function searchIngredients(
  query: string, 
  ingredients: SavedIngredient[] = MOCK_SAVED_INGREDIENTS
): SavedIngredient[] {
  if (!query.trim()) return [];

  const searchTerm = query.toLowerCase();
  return ingredients.filter(
    (ingredient) =>
      ingredient.name.toLowerCase().includes(searchTerm) ||
      (ingredient.type && ingredient.type.toLowerCase().includes(searchTerm))
  ).slice(0, 5); // Limit to 5 results
}

/**
 * Convert SavedIngredient to CocktailIngredient
 */
export function createCocktailIngredient(
  savedIngredient: SavedIngredient,
  amount: number = 1.5,
  unit: 'oz' | 'ml' | 'drops' | 'splash' = 'oz'
): CocktailIngredient {
  const costPerOz = CalculationService.calculateCostPerOz(savedIngredient.bottlePrice, savedIngredient.bottleSize);
  const cost = CalculationService.calculatePourCost(costPerOz, amount);

  return {
    ...savedIngredient,
    amount,
    unit,
    cost,
  };
}