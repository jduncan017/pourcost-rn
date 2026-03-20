/**
 * Realistic ingredient database for the 6 cocktails
 * Based on actual bar costs and ingredient relationships
 */

import { SavedIngredient } from '@/src/types/models';
import { CalculationService } from './calculation-service';

export const REALISTIC_MOCK_INGREDIENTS: SavedIngredient[] = [
  // Premium Spirits for our cocktails
  {
    id: '1',
    name: 'Patron Silver Tequila',
    type: 'Spirit',
    bottleSize: 750,
    bottlePrice: 35.99,
    description: 'Premium 100% blue agave tequila, perfect for margaritas and other tequila cocktails.',
    notForSale: false,
    createdAt: new Date('2025-01-15T10:30:00Z'),
    updatedAt: new Date('2025-01-15T10:30:00Z'),
  },
  {
    id: '2',
    name: 'Woodford Reserve Bourbon',
    type: 'Spirit',
    bottleSize: 750,
    bottlePrice: 42.99,
    description: 'Kentucky straight bourbon whiskey aged in charred oak barrels, ideal for Old Fashioned and Manhattan.',
    notForSale: false,
    createdAt: new Date('2025-01-15T09:15:00Z'),
    updatedAt: new Date('2025-01-15T09:15:00Z'),
  },
  {
    id: '3',
    name: 'Bacardi Superior White Rum',
    type: 'Spirit',
    bottleSize: 750,
    bottlePrice: 18.99,
    description: 'Light, crisp white rum aged for 1-2 years, perfect for mojitos and tropical cocktails.',
    notForSale: false,
    createdAt: new Date('2025-01-14T14:20:00Z'),
    updatedAt: new Date('2025-01-14T14:20:00Z'),
  },
  {
    id: '4',
    name: 'Grey Goose Vodka',
    type: 'Spirit',
    bottleSize: 750,
    bottlePrice: 24.99,
    description: 'Premium French vodka distilled from French wheat, smooth and clean for martinis.',
    notForSale: false,
    createdAt: new Date('2025-01-14T11:45:00Z'),
    updatedAt: new Date('2025-01-14T11:45:00Z'),
  },
  {
    id: '5',
    name: 'Hendricks Gin',
    type: 'Spirit',
    bottleSize: 750,
    bottlePrice: 28.99,
    description: 'Scottish gin infused with cucumber and rose petals, distinctive and refreshing.',
    notForSale: false,
    createdAt: new Date('2025-01-13T16:30:00Z'),
    updatedAt: new Date('2025-01-13T16:30:00Z'),
  },
  
  // Liqueurs
  {
    id: '6',
    name: 'Cointreau Triple Sec',
    type: 'Liquor',
    bottleSize: 750,
    bottlePrice: 38.99,
    description: 'Premium French orange liqueur made from sweet and bitter orange peels, essential for margaritas.',
    notForSale: false,
    createdAt: new Date('2025-01-12T15:30:00Z'),
    updatedAt: new Date('2025-01-12T15:30:00Z'),
  },
  {
    id: '7',
    name: 'Kahlua Coffee Liqueur',
    type: 'Liquor',
    bottleSize: 750,
    bottlePrice: 22.99,
    description: 'Mexican coffee liqueur with rich vanilla and coffee flavors, perfect for espresso martinis.',
    notForSale: false,
    createdAt: new Date('2025-01-12T09:15:00Z'),
    updatedAt: new Date('2025-01-12T09:15:00Z'),
  },
  {
    id: '8',
    name: 'Sweet Vermouth',
    type: 'Liquor',
    bottleSize: 750,
    bottlePrice: 16.99,
    description: 'Italian sweet vermouth fortified wine, essential for Manhattan cocktails.',
    notForSale: false,
    createdAt: new Date('2025-01-11T14:45:00Z'),
    updatedAt: new Date('2025-01-11T14:45:00Z'),
  },
  
  // House-made Prepared Ingredients (Not for sale)
  {
    id: '9',
    name: 'Simple Syrup',
    type: 'Prepared',
    bottleSize: 1000,
    bottlePrice: 3.50, // Cost to make (sugar + water + labor)
    description: 'House-made 1:1 simple syrup, used to sweeten cocktails without granulated sugar texture.',
    notForSale: true,
    createdAt: new Date('2025-01-11T12:30:00Z'),
    updatedAt: new Date('2025-01-11T12:30:00Z'),
  },
  {
    id: '10',
    name: 'Fresh Lime Juice',
    type: 'Prepared',
    bottleSize: 500,
    bottlePrice: 8.75, // Cost of limes + labor for juicing
    description: 'Freshly squeezed lime juice, prepared daily for optimal flavor in cocktails.',
    notForSale: true,
    createdAt: new Date('2025-01-10T16:20:00Z'),
    updatedAt: new Date('2025-01-10T16:20:00Z'),
  },
  {
    id: '11',
    name: 'Fresh Espresso Shot',
    type: 'Prepared',
    bottleSize: 250,
    bottlePrice: 12.50, // Cost of coffee beans + equipment usage
    description: 'Freshly pulled espresso shots for espresso martinis, prepared to order.',
    notForSale: true,
    createdAt: new Date('2025-01-10T16:20:00Z'),
    updatedAt: new Date('2025-01-10T16:20:00Z'),
  },
  
  // Bitters & Garnishes (Typically not sold individually)
  {
    id: '12',
    name: 'Angostura Bitters',
    type: 'Garnish',
    bottleSize: 200,
    bottlePrice: 8.99,
    description: 'Classic aromatic bitters from Trinidad, essential for Old Fashioned and Manhattan cocktails.',
    notForSale: true,
    createdAt: new Date('2025-01-09T14:30:00Z'),
    updatedAt: new Date('2025-01-09T14:30:00Z'),
  },
  {
    id: '13',
    name: 'Fresh Mint',
    type: 'Garnish',
    bottleSize: 100, // Measured in grams equivalent
    bottlePrice: 4.25, // Weekly fresh mint purchase
    description: 'Fresh mint leaves for mojitos and garnishes, delivered weekly for optimal freshness.',
    notForSale: true,
    createdAt: new Date('2025-01-08T15:20:00Z'),
    updatedAt: new Date('2025-01-08T15:20:00Z'),
  },
  {
    id: '14',
    name: 'Orange Peel',
    type: 'Garnish',
    bottleSize: 200, // Measured in grams equivalent
    bottlePrice: 3.75, // Cost of fresh oranges for peels
    description: 'Fresh orange peels for expressing oils over cocktails, adds citrus aroma to drinks.',
    notForSale: true,
    createdAt: new Date('2025-01-09T10:45:00Z'),
    updatedAt: new Date('2025-01-09T10:45:00Z'),
  },
  {
    id: '15',
    name: 'Tonic Water',
    type: 'Mixer',
    bottleSize: 200, // Per serving bottle
    bottlePrice: 2.25, // Premium tonic water cost
    description: 'Premium tonic water with natural quinine, perfect complement to gin.',
    notForSale: false,
    createdAt: new Date('2025-01-08T12:30:00Z'),
    updatedAt: new Date('2025-01-08T12:30:00Z'),
  },
  {
    id: '16',
    name: 'Maraschino Cherry',
    type: 'Garnish',
    bottleSize: 300, // Jar measured in ml equivalent
    bottlePrice: 6.50, // Premium cocktail cherries
    description: 'Premium maraschino cherries for Manhattan garnish, preserved in syrup.',
    notForSale: true,
    createdAt: new Date('2025-01-07T14:15:00Z'),
    updatedAt: new Date('2025-01-07T14:15:00Z'),
  },
];

/**
 * Generate ingredient with proper calculations using CalculationService
 */
export function createIngredientWithCalculations(
  savedIngredient: SavedIngredient,
  pourSize: number = 1.5,
  retailPrice: number = 8.0,
  currency: string = 'USD',
  measurementSystem: 'US' | 'Metric' = 'US'
) {
  // Only calculate retail-based metrics if ingredient is for sale
  const costPerOz = CalculationService.calculateCostPerOz(savedIngredient.bottlePrice, savedIngredient.bottleSize);
  const costPerPour = CalculationService.calculatePourCost(costPerOz, pourSize);
  
  // Only calculate retail-dependent values if item is for sale
  const pourCostPercentage = savedIngredient.notForSale 
    ? 0 
    : CalculationService.calculatePourCostPercentage(costPerPour, retailPrice);
  const pourCostMargin = savedIngredient.notForSale 
    ? 0 
    : CalculationService.calculateProfitMargin(retailPrice, costPerPour);

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