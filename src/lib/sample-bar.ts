/**
 * Sample bar data — seeded on opt-in after onboarding.
 *
 * Goals:
 *   - Cover a realistic cross-section of spirits, modifiers, juices, bitters
 *   - Each cocktail uses only ingredients defined here (no dangling references)
 *   - Prices approximate wholesale / restaurant-supply costs (USD)
 *
 * Ingredient keys are stable identifiers used to wire the cocktail recipes below
 * to their ingredient records at seed time. They don't persist in the DB.
 */

import { Volume, fraction } from '@/src/types/models';

export interface SampleIngredient {
  key: string;
  name: string;
  type: string;
  subType?: string;
  productSize: Volume;
  productCost: number;
  description?: string;
  notForSale?: boolean;
}

export interface SampleCocktailIngredient {
  ingredientKey: string;
  pourSize: Volume;
}

export interface SampleCocktail {
  name: string;
  category?: 'Whiskey' | 'Vodka' | 'Rum' | 'Gin' | 'Tequila' | 'Other';
  description?: string;
  retailPrice?: number;
  ingredients: SampleCocktailIngredient[];
}

const bottle = (ml: number): Volume => ({ kind: 'milliliters', ml });
const ounces = (oz: number): Volume => ({ kind: 'decimalOunces', ounces: oz });

export const SAMPLE_INGREDIENTS: SampleIngredient[] = [
  { key: 'bulleit_rye', name: 'Bulleit Rye Whiskey', type: 'Spirit', subType: 'Whiskey', productSize: bottle(750), productCost: 30 },
  { key: 'don_julio', name: 'Don Julio Blanco Tequila', type: 'Spirit', subType: 'Tequila', productSize: bottle(750), productCost: 45 },
  { key: 'tanqueray', name: 'Tanqueray Gin', type: 'Spirit', subType: 'Gin', productSize: bottle(750), productCost: 25 },
  { key: 'titos', name: "Tito's Handmade Vodka", type: 'Spirit', subType: 'Vodka', productSize: bottle(750), productCost: 22 },
  { key: 'bacardi', name: 'Bacardi Superior Rum', type: 'Spirit', subType: 'Rum', productSize: bottle(750), productCost: 18 },
  { key: 'sweet_vermouth', name: 'Carpano Antica Sweet Vermouth', type: 'Spirit', subType: 'Fortified Wine', productSize: bottle(750), productCost: 30 },
  { key: 'dry_vermouth', name: 'Dolin Dry Vermouth', type: 'Spirit', subType: 'Fortified Wine', productSize: bottle(750), productCost: 15 },
  { key: 'campari', name: 'Campari', type: 'Spirit', subType: 'Liqueur', productSize: bottle(750), productCost: 28 },
  { key: 'st_germain', name: 'St-Germain Elderflower Liqueur', type: 'Spirit', subType: 'Liqueur', productSize: bottle(750), productCost: 35 },
  { key: 'angostura', name: 'Angostura Aromatic Bitters', type: 'Other', productSize: bottle(118), productCost: 10, description: '4 oz bottle', notForSale: true },
  { key: 'simple_syrup', name: 'Simple Syrup', type: 'Prepped', productSize: ounces(32), productCost: 3, description: '1:1 sugar to water', notForSale: true },
  { key: 'lime_juice', name: 'Fresh Lime Juice', type: 'Prepped', productSize: ounces(32), productCost: 8, notForSale: true },
  { key: 'lemon_juice', name: 'Fresh Lemon Juice', type: 'Prepped', productSize: ounces(32), productCost: 7, notForSale: true },
  { key: 'orgeat', name: 'Orgeat Almond Syrup', type: 'Prepped', productSize: bottle(750), productCost: 28, notForSale: true },
];

export const SAMPLE_COCKTAILS: SampleCocktail[] = [
  {
    name: 'Old Fashioned',
    category: 'Whiskey',
    description: 'Rye, sugar, bitters, orange peel.',
    retailPrice: 14,
    ingredients: [
      { ingredientKey: 'bulleit_rye', pourSize: fraction(2, 1) },
      { ingredientKey: 'simple_syrup', pourSize: fraction(1, 4) },
      { ingredientKey: 'angostura', pourSize: { kind: 'decimalOunces', ounces: 0.125 } },
    ],
  },
  {
    name: 'Negroni',
    category: 'Gin',
    description: 'Equal parts gin, Campari, sweet vermouth. Stir, orange peel.',
    retailPrice: 13,
    ingredients: [
      { ingredientKey: 'tanqueray', pourSize: fraction(1, 1) },
      { ingredientKey: 'campari', pourSize: fraction(1, 1) },
      { ingredientKey: 'sweet_vermouth', pourSize: fraction(1, 1) },
    ],
  },
  {
    name: 'Margarita',
    category: 'Tequila',
    description: 'Tequila, fresh lime, simple syrup. Salt rim optional.',
    retailPrice: 13,
    ingredients: [
      { ingredientKey: 'don_julio', pourSize: fraction(2, 1) },
      { ingredientKey: 'lime_juice', pourSize: fraction(3, 4) },
      { ingredientKey: 'simple_syrup', pourSize: fraction(1, 2) },
    ],
  },
  {
    name: 'Daiquiri',
    category: 'Rum',
    description: 'The classic — rum, lime, sugar. Shaken, served up.',
    retailPrice: 12,
    ingredients: [
      { ingredientKey: 'bacardi', pourSize: fraction(2, 1) },
      { ingredientKey: 'lime_juice', pourSize: fraction(1, 1) },
      { ingredientKey: 'simple_syrup', pourSize: fraction(3, 4) },
    ],
  },
  {
    name: 'Dry Martini',
    category: 'Gin',
    description: 'Gin forward, whisper of vermouth. Stir, lemon twist.',
    retailPrice: 14,
    ingredients: [
      { ingredientKey: 'tanqueray', pourSize: { kind: 'decimalOunces', ounces: 2.5 } },
      { ingredientKey: 'dry_vermouth', pourSize: fraction(1, 2) },
    ],
  },
];
