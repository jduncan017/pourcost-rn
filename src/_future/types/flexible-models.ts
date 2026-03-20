/**
 * Flexible ingredient models for the new architecture
 * Based on the ingredient strategy document with support for multiple retail configurations
 */

import { FlexibleMeasurement } from '@/src/utils/measurement-utils';

// New ingredient types following the strategy
export type FlexibleIngredientType = 'Spirit' | 'Beer' | 'Wine' | 'Prepped' | 'Other';

// Retail configuration for multiple pour sizes per ingredient
export interface RetailConfiguration {
  id: string;
  pourSize: FlexibleMeasurement;
  retailPrice: number; // USD price
  isDefault: boolean;
  
  // Calculated fields (derived from pourSize and ingredient cost)
  pourCostPercentage: number;
  profitMargin: number;
  costPerPour: number;
  
  // Display metadata
  displayName: string; // "1.5oz pour", "Pint (16oz)", "Wine glass (5oz)"
  description?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Main flexible ingredient model
export interface FlexibleIngredient {
  id: string;
  name: string;
  type: FlexibleIngredientType;
  description?: string;
  
  // Container information (always stored in ml for consistency)
  containerSize: FlexibleMeasurement;
  containerCost: number; // USD cost of entire container
  containerDisplayName?: string; // "750ml bottle", "6-pack"
  
  // Multiple retail configurations
  retailConfigurations: RetailConfiguration[];
  defaultRetailConfigId: string;
  
  // Metadata flags
  notForSale: boolean; // For prepped items like simple syrup
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // For cloud sync
}

// Ingredient with calculated display values
export interface FlexibleIngredientWithCalculations extends FlexibleIngredient {
  // Global calculations (container-level)
  costPerMl: number;
  costPerOz: number;
  
  // Default retail configuration calculations
  defaultPourSize: FlexibleMeasurement;
  defaultRetailPrice: number;
  defaultCostPerPour: number;
  defaultPourCostPercentage: number;
  defaultProfitMargin: number;
  
  // Performance analysis
  performance: IngredientPerformance;
  
  // Display formatting
  currency: string;
  measurementSystem: 'US' | 'Metric';
}

// Performance analysis for ingredients
export interface IngredientPerformance {
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  pourCostRange: {
    min: number;
    max: number;
    average: number;
  };
  profitRange: {
    min: number;
    max: number;
    average: number;
  };
  recommendations: string[];
}

// Factory data for creating new retail configurations
export interface CreateRetailConfigData {
  pourSize: FlexibleMeasurement;
  retailPrice: number;
  displayName: string;
  description?: string;
  isDefault?: boolean;
}

// Factory data for creating new flexible ingredients
export interface CreateFlexibleIngredientData {
  name: string;
  type: FlexibleIngredientType;
  description?: string;
  containerSize: FlexibleMeasurement;
  containerCost: number;
  containerDisplayName?: string;
  retailConfigurations: CreateRetailConfigData[];
  notForSale?: boolean;
}

// Update data for flexible ingredients
export interface UpdateFlexibleIngredientData {
  id: string;
  name?: string;
  type?: FlexibleIngredientType;
  description?: string;
  containerSize?: FlexibleMeasurement;
  containerCost?: number;
  containerDisplayName?: string;
  notForSale?: boolean;
}

// Cocktail ingredient using flexible measurements
export interface FlexibleCocktailIngredient extends FlexibleIngredient {
  // Pour information for this cocktail
  selectedRetailConfigId: string;
  actualPourSize: FlexibleMeasurement; // May differ from retail config
  
  // Cost calculation
  actualCost: number; // Cost for the actual pour size used
  
  // Display order in cocktail
  order?: number;
}

// Migration helpers for converting legacy ingredients
export interface LegacyToFlexibleMigration {
  legacyIngredientId: string;
  newFlexibleIngredient: FlexibleIngredient;
  migrationNotes: string[];
}

// Ingredient import/export format
export interface FlexibleIngredientExport {
  version: string;
  exportDate: Date;
  ingredients: FlexibleIngredient[];
  metadata: {
    totalIngredients: number;
    ingredientTypes: Record<FlexibleIngredientType, number>;
    averagePourCosts: Record<FlexibleIngredientType, number>;
  };
}

// Bulk operations
export interface BulkIngredientOperation {
  operation: 'create' | 'update' | 'delete';
  ingredients: (CreateFlexibleIngredientData | UpdateFlexibleIngredientData | { id: string })[];
  options?: {
    skipValidation?: boolean;
    continueOnError?: boolean;
  };
}

export interface BulkOperationResult {
  successful: number;
  failed: number;
  errors: Array<{
    index: number;
    error: string;
    data: any;
  }>;
}

// Search and filtering
export interface FlexibleIngredientFilter {
  types?: FlexibleIngredientType[];
  nameSearch?: string;
  costRange?: {
    min: number;
    max: number;
  };
  pourCostRange?: {
    min: number;
    max: number;
  };
  notForSale?: boolean;
  hasMultipleConfigs?: boolean;
}

export interface FlexibleIngredientSort {
  field: 'name' | 'type' | 'cost' | 'pourCost' | 'created' | 'updated';
  direction: 'asc' | 'desc';
}

// Analytics and reporting
export interface IngredientAnalytics {
  totalIngredients: number;
  ingredientsByType: Record<FlexibleIngredientType, number>;
  averageCosts: {
    perMl: number;
    perOz: number;
    perPour: number;
  };
  pourCostDistribution: {
    excellent: number; // < 20%
    good: number; // 20-25%
    fair: number; // 25-30%
    poor: number; // > 30%
  };
  topPerformingIngredients: FlexibleIngredientWithCalculations[];
  improvementOpportunities: FlexibleIngredientWithCalculations[];
}

// Configuration validation
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Type guards
export function isFlexibleIngredient(obj: any): obj is FlexibleIngredient {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.containerSize === 'object' &&
    typeof obj.containerCost === 'number' &&
    Array.isArray(obj.retailConfigurations) &&
    typeof obj.defaultRetailConfigId === 'string' &&
    typeof obj.notForSale === 'boolean'
  );
}

export function isRetailConfiguration(obj: any): obj is RetailConfiguration {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.pourSize === 'object' &&
    typeof obj.retailPrice === 'number' &&
    typeof obj.isDefault === 'boolean' &&
    typeof obj.displayName === 'string'
  );
}