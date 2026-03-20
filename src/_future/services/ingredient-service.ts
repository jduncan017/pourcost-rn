/**
 * Ingredient Service for PourCost-RN
 * Centralizes all ingredient-related business logic and operations
 * Provides CRUD operations, calculations, and validation
 */

import { SavedIngredient, IngredientWithCalculations } from '@/src/types/models';
import { CalculationService } from './calculation-service';
import { getSavedIngredients } from './mock-data';

export interface CreateIngredientData {
  name: string;
  bottleSize: number; // ml
  bottlePrice: number; // base currency
  type?: string;
}

export interface UpdateIngredientData extends Partial<CreateIngredientData> {
  id: string;
}

export interface IngredientFilters {
  type?: string;
  minBottleSize?: number;
  maxBottleSize?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export type IngredientSortBy = 'name' | 'cost' | 'created' | 'pourCost' | 'margin';

/**
 * Service class for ingredient management and calculations
 */
export class IngredientService {
  
  // ==========================================
  // CRUD OPERATIONS (Mock Implementation)
  // ==========================================

  /**
   * Create a new ingredient
   * @param data - Ingredient creation data
   * @returns Promise<SavedIngredient>
   */
  static async createIngredient(data: CreateIngredientData): Promise<SavedIngredient> {
    const validation = this.validateIngredientData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const newIngredient: SavedIngredient = {
      id: Date.now().toString(), // Simple ID generation for mock
      name: data.name,
      bottleSize: data.bottleSize,
      bottlePrice: data.bottlePrice,
      type: data.type,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In real implementation, would persist to database
    console.log('Creating ingredient:', newIngredient);
    return newIngredient;
  }

  /**
   * Update an existing ingredient
   * @param data - Ingredient update data
   * @returns Promise<SavedIngredient>
   */
  static async updateIngredient(data: UpdateIngredientData): Promise<SavedIngredient> {
    const validation = this.validateIngredientData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // In real implementation, would fetch existing and update
    const updatedIngredient: SavedIngredient = {
      id: data.id,
      name: data.name || 'Unknown',
      bottleSize: data.bottleSize || 750,
      bottlePrice: data.bottlePrice || 0,
      type: data.type,
      createdAt: new Date(), // Would preserve original
      updatedAt: new Date(),
    };

    console.log('Updating ingredient:', updatedIngredient);
    return updatedIngredient;
  }

  /**
   * Delete an ingredient
   * @param id - Ingredient ID
   * @returns Promise<void>
   */
  static async deleteIngredient(id: string): Promise<void> {
    if (!id) throw new Error('Ingredient ID is required');
    
    // In real implementation, would delete from database
    console.log('Deleting ingredient:', id);
  }

  /**
   * Get ingredient by ID
   * @param id - Ingredient ID
   * @returns Promise<SavedIngredient | null>
   */
  static async getIngredientById(id: string): Promise<SavedIngredient | null> {
    const ingredients = getSavedIngredients();
    return ingredients.find(ingredient => ingredient.id === id) || null;
  }

  /**
   * Get all ingredients with optional filters
   * @param filters - Optional filters
   * @returns Promise<SavedIngredient[]>
   */
  static async getIngredients(filters?: IngredientFilters): Promise<SavedIngredient[]> {
    let ingredients = getSavedIngredients();

    if (filters) {
      ingredients = this.applyFilters(ingredients, filters);
    }

    return ingredients;
  }

  // ==========================================
  // SEARCH & FILTERING
  // ==========================================

  /**
   * Search ingredients by name or type with advanced filtering
   * @param query - Search query
   * @param filters - Optional filters
   * @param limit - Maximum results (default 10)
   * @returns Promise<SavedIngredient[]>
   */
  static async searchIngredients(
    query: string,
    filters?: IngredientFilters,
    limit: number = 10
  ): Promise<SavedIngredient[]> {
    const ingredients = await this.getIngredients(filters);
    
    if (!query.trim()) return ingredients.slice(0, limit);

    const searchTerm = query.toLowerCase();
    const filtered = ingredients.filter(ingredient =>
      ingredient.name.toLowerCase().includes(searchTerm) ||
      (ingredient.type && ingredient.type.toLowerCase().includes(searchTerm))
    );

    return filtered.slice(0, limit);
  }

  /**
   * Apply filters to ingredient list
   * @param ingredients - Ingredient list
   * @param filters - Filters to apply
   * @returns Filtered ingredients
   */
  private static applyFilters(
    ingredients: SavedIngredient[],
    filters: IngredientFilters
  ): SavedIngredient[] {
    return ingredients.filter(ingredient => {
      if (filters.type && ingredient.type !== filters.type) return false;
      if (filters.minBottleSize && ingredient.bottleSize < filters.minBottleSize) return false;
      if (filters.maxBottleSize && ingredient.bottleSize > filters.maxBottleSize) return false;
      if (filters.minPrice && ingredient.bottlePrice < filters.minPrice) return false;
      if (filters.maxPrice && ingredient.bottlePrice > filters.maxPrice) return false;
      return true;
    });
  }

  /**
   * Sort ingredients by specified criteria
   * @param ingredients - Ingredients to sort
   * @param sortBy - Sort criteria
   * @param ascending - Sort direction (default true)
   * @returns Sorted ingredients
   */
  static sortIngredients(
    ingredients: IngredientWithCalculations[],
    sortBy: IngredientSortBy,
    ascending: boolean = true
  ): IngredientWithCalculations[] {
    const sortedIngredients = [...ingredients].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'cost':
          comparison = a.costPerOz - b.costPerOz;
          break;
        case 'pourCost':
          comparison = a.pourCostPercentage - b.pourCostPercentage;
          break;
        case 'margin':
          comparison = a.pourCostMargin - b.pourCostMargin;
          break;
        case 'created':
        default:
          // Handle missing createdAt dates
          const aTime = a.createdAt ? a.createdAt.getTime() : 0;
          const bTime = b.createdAt ? b.createdAt.getTime() : 0;
          comparison = bTime - aTime; // Most recent first
          break;
      }

      return ascending ? comparison : -comparison;
    });

    return sortedIngredients;
  }

  // ==========================================
  // CALCULATIONS & METRICS
  // ==========================================

  /**
   * Calculate all metrics for an ingredient
   * @param ingredient - Base ingredient data
   * @param pourSize - Pour size in oz (default 1.5)
   * @param retailPrice - Retail price (default 8.0)
   * @param currency - Currency code (default USD)
   * @param measurementSystem - Measurement system (default US)
   * @returns Ingredient with calculations
   */
  static calculateIngredientMetrics(
    ingredient: SavedIngredient,
    pourSize: number = 1.5,
    retailPrice: number = 8.0,
    currency: string = 'USD',
    measurementSystem: 'US' | 'Metric' = 'US'
  ): IngredientWithCalculations {
    const costPerOz = CalculationService.calculateCostPerOz(
      ingredient.bottlePrice,
      ingredient.bottleSize
    );
    const costPerPour = CalculationService.calculatePourCost(costPerOz, pourSize);
    const pourCostPercentage = CalculationService.calculatePourCostPercentage(
      costPerPour,
      retailPrice
    );
    const pourCostMargin = CalculationService.calculateProfitMargin(
      retailPrice,
      costPerPour
    );

    return {
      ...ingredient,
      pourSize,
      costPerPour,
      costPerOz,
      pourCostMargin,
      pourCostPercentage,
      currency,
      measurementSystem,
    };
  }

  /**
   * Get performance analysis for an ingredient
   * @param ingredient - Ingredient with calculations
   * @returns Performance analysis
   */
  static getIngredientPerformanceAnalysis(ingredient: IngredientWithCalculations) {
    const performanceLevel = CalculationService.getPourCostPerformanceLevel(
      ingredient.pourCostPercentage
    );
    const colorClass = CalculationService.getPourCostColor(ingredient.pourCostPercentage);
    const recommendation = CalculationService.getOptimalPricingRecommendation(
      ingredient.costPerPour,
      ingredient.costPerPour / (ingredient.pourCostPercentage / 100), // Calculate current retail price
      20 // Target 20% pour cost
    );

    return {
      performanceLevel,
      colorClass,
      recommendation,
      costEfficiency: performanceLevel === 'excellent' || performanceLevel === 'good',
      needsPriceAdjustment: performanceLevel === 'warning' || performanceLevel === 'poor',
    };
  }

  // ==========================================
  // VALIDATION
  // ==========================================

  /**
   * Validate ingredient data
   * @param data - Ingredient data to validate
   * @returns Validation result
   */
  static validateIngredientData(data: Partial<CreateIngredientData>): ValidationResult {
    const errors: string[] = [];

    // Name validation
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Ingredient name is required');
    } else if (data.name.length < 2) {
      errors.push('Ingredient name must be at least 2 characters');
    } else if (data.name.length > 100) {
      errors.push('Ingredient name must be less than 100 characters');
    }

    // Bottle size validation
    if (data.bottleSize !== undefined) {
      if (data.bottleSize <= 0) {
        errors.push('Bottle size must be greater than 0');
      } else if (data.bottleSize > 10000) {
        errors.push('Bottle size cannot exceed 10,000ml');
      }
    }

    // Bottle price validation
    if (data.bottlePrice !== undefined) {
      if (data.bottlePrice < 0) {
        errors.push('Bottle price cannot be negative');
      } else if (data.bottlePrice > 10000) {
        errors.push('Bottle price cannot exceed $10,000');
      }
    }

    // Type validation (optional but if provided, must be valid)
    if (data.type && data.type.length > 50) {
      errors.push('Ingredient type must be less than 50 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  /**
   * Get unique ingredient types from the database
   * @returns Promise<string[]>
   */
  static async getIngredientTypes(): Promise<string[]> {
    const ingredients = await this.getIngredients();
    const types = new Set<string>();
    
    ingredients.forEach(ingredient => {
      if (ingredient.type) {
        types.add(ingredient.type);
      }
    });

    return Array.from(types).sort();
  }

  /**
   * Get cost distribution statistics
   * @returns Cost statistics
   */
  static async getCostStatistics() {
    const ingredients = await this.getIngredients();
    const costs = ingredients.map(ing => 
      CalculationService.calculateCostPerOz(ing.bottlePrice, ing.bottleSize)
    );

    if (costs.length === 0) {
      return {
        min: 0,
        max: 0,
        average: 0,
        median: 0,
        count: 0,
      };
    }

    costs.sort((a, b) => a - b);
    const sum = costs.reduce((acc, cost) => acc + cost, 0);
    const median = costs.length % 2 === 0
      ? (costs[costs.length / 2 - 1] + costs[costs.length / 2]) / 2
      : costs[Math.floor(costs.length / 2)];

    return {
      min: costs[0],
      max: costs[costs.length - 1],
      average: sum / costs.length,
      median,
      count: costs.length,
    };
  }
}