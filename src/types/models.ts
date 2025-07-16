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
  productSize: Volume;
  productCost: number;
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // For cloud sync
}

// Cocktail ingredient extends saved ingredient with pour size
export interface CocktailIngredient extends SavedIngredient {
  pourSize: PourSize;
  order: number; // For ingredient ordering in cocktails
}

// Cocktail model
export interface Cocktail {
  id: string;
  name: string;
  ingredients: CocktailIngredient[];
  notes?: string;
  profitMargin: number;
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // For cloud sync
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