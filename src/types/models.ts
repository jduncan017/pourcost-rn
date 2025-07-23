/**
 * Core domain models for PourCost application
 * These match the Swift models from the original iOS app
 */

// Volume measurement types
export interface Volume {
  value: number;
  unit: VolumeUnit;
}

export type VolumeUnit = 'oz' | 'ml' | 'L' | 'gal' | 'qt' | 'pt' | 'cup';

// Pour size types
export interface PourSize {
  volume: Volume;
  type: PourType;
}

export type PourType = 'volume' | 'unit';

// Saved ingredient model
export interface SavedIngredient {
  id: string;
  name: string;
  bottleSize: number; // Size in ml (matches component usage)
  bottlePrice: number; // Price in base currency (matches component usage)
  type?: string; // Ingredient type (Beer, Wine, Liquor, etc.)
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // For cloud sync
}

// Cocktail ingredient extends saved ingredient with pour amount and cost
export interface CocktailIngredient extends SavedIngredient {
  amount: number; // Pour amount in oz
  unit: 'oz' | 'ml' | 'drops' | 'splash';
  cost: number; // Cost for this amount
  order?: number; // For ingredient ordering in cocktails
}

// Display ingredient with calculated values (for lists)
export interface IngredientWithCalculations extends SavedIngredient {
  pourSize: number; // Current pour size in oz
  costPerPour: number;
  costPerOz: number;
  pourCostMargin: number;
  pourCostPercentage: number;
  currency: string;
  measurementSystem: 'US' | 'Metric';
}

// Cocktail model
export interface Cocktail {
  id: string;
  name: string;
  description?: string;
  category?: 'Classic' | 'Modern' | 'Tropical' | 'Whiskey' | 'Vodka' | 'Rum' | 'Gin' | 'Tequila' | 'Other';
  ingredients: CocktailIngredient[];
  notes?: string;
  profitMargin: number;
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // For cloud sync
  favorited?: boolean;
}

// Cocktail with calculated values (for display)
export interface CocktailWithCalculations extends Cocktail {
  totalCost: number;
  suggestedPrice: number;
  pourCostPercentage: number;
}

// Currency models
export interface CurrencySymbol {
  code: string;
  symbol: string;
  name: string;
}

export interface ConversionRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  lastUpdated: Date;
}

// User profile model
export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  authProvider: 'facebook' | 'google' | 'cognito';
  baseCurrency: string;
  measurementSystem: 'US' | 'Metric';
  createdAt: Date;
  lastLoginAt: Date;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// Calculation result types
export interface CostCalculation {
  costPerPour: number;
  totalCost: number;
  profitMargin: number;
  suggestedPrice: number;
  currency: string;
}