/**
 * Cocktail Service for PourCost-RN
 * Centralizes all cocktail-related business logic and operations
 * Provides CRUD operations, recipe management, and cost calculations
 */

import { 
  Cocktail, 
  CocktailWithCalculations, 
  CocktailIngredient, 
  SavedIngredient 
} from '@/src/types/models';
import { CalculationService } from './calculation-service';
import { getCocktailsWithCalculations, createCocktailIngredient } from './mock-data';

export interface CreateCocktailData {
  name: string;
  description?: string;
  category?: 'Classic' | 'Modern' | 'Tropical' | 'Whiskey' | 'Vodka' | 'Rum' | 'Gin' | 'Tequila' | 'Other';
  ingredients: CocktailIngredient[];
  notes?: string;
}

export interface UpdateCocktailData extends Partial<CreateCocktailData> {
  id: string;
  favorited?: boolean;
}

export interface CocktailFilters {
  category?: string;
  maxCost?: number;
  minCost?: number;
  maxPourCost?: number;
  minPourCost?: number;
  favorited?: boolean;
}

export type CocktailSortBy = 'name' | 'cost' | 'created' | 'profitMargin' | 'costPercent';

export interface CocktailPerformanceMetrics {
  totalCost: number;
  suggestedPrice: number;
  pourCostPercentage: number;
  profitMargin: number;
  performanceLevel: 'excellent' | 'good' | 'warning' | 'poor';
  costPerServing: number;
  ingredientCount: number;
  mostExpensiveIngredient: CocktailIngredient;
}

/**
 * Service class for cocktail management and calculations
 */
export class CocktailService {
  
  // ==========================================
  // CRUD OPERATIONS (Mock Implementation)
  // ==========================================

  /**
   * Create a new cocktail
   * @param data - Cocktail creation data
   * @returns Promise<Cocktail>
   */
  static async createCocktail(data: CreateCocktailData): Promise<Cocktail> {
    const validation = this.validateCocktailData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const totalCost = CalculationService.calculateCocktailTotalCost(data.ingredients);
    const suggestedPrice = CalculationService.calculateCocktailSuggestedPrice(totalCost);
    const profitMargin = CalculationService.calculateCocktailProfitMargin(suggestedPrice, totalCost);

    const newCocktail: Cocktail = {
      id: Date.now().toString(), // Simple ID generation for mock
      name: data.name,
      description: data.description,
      category: data.category || 'Other',
      ingredients: data.ingredients,
      notes: data.notes,
      profitMargin,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In real implementation, would persist to database
    console.log('Creating cocktail:', newCocktail);
    return newCocktail;
  }

  /**
   * Update an existing cocktail
   * @param data - Cocktail update data
   * @returns Promise<Cocktail>
   */
  static async updateCocktail(data: UpdateCocktailData): Promise<Cocktail> {
    const validation = this.validateCocktailData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Recalculate metrics if ingredients changed
    let profitMargin = 0;
    if (data.ingredients && data.ingredients.length > 0) {
      const totalCost = CalculationService.calculateCocktailTotalCost(data.ingredients);
      const suggestedPrice = CalculationService.calculateCocktailSuggestedPrice(totalCost);
      profitMargin = CalculationService.calculateCocktailProfitMargin(suggestedPrice, totalCost);
    }

    const updatedCocktail: Cocktail = {
      id: data.id,
      name: data.name || 'Untitled Cocktail',
      description: data.description,
      category: data.category || 'Other',
      ingredients: data.ingredients || [],
      notes: data.notes,
      profitMargin,
      createdAt: new Date(), // Would preserve original
      updatedAt: new Date(),
    };

    console.log('Updating cocktail:', updatedCocktail);
    return updatedCocktail;
  }

  /**
   * Delete a cocktail
   * @param id - Cocktail ID
   * @returns Promise<void>
   */
  static async deleteCocktail(id: string): Promise<void> {
    if (!id) throw new Error('Cocktail ID is required');
    
    // In real implementation, would delete from database
    console.log('Deleting cocktail:', id);
  }

  /**
   * Get cocktail by ID
   * @param id - Cocktail ID
   * @returns Promise<CocktailWithCalculations | null>
   */
  static async getCocktailById(id: string): Promise<CocktailWithCalculations | null> {
    const cocktails = getCocktailsWithCalculations();
    return cocktails.find(cocktail => cocktail.id === id) || null;
  }

  /**
   * Get all cocktails with optional filters
   * @param filters - Optional filters
   * @returns Promise<CocktailWithCalculations[]>
   */
  static async getCocktails(filters?: CocktailFilters): Promise<CocktailWithCalculations[]> {
    let cocktails = getCocktailsWithCalculations();

    if (filters) {
      cocktails = this.applyFilters(cocktails, filters);
    }

    return cocktails;
  }

  /**
   * Duplicate an existing cocktail
   * @param id - Original cocktail ID
   * @param newName - Name for the duplicate
   * @returns Promise<Cocktail>
   */
  static async duplicateCocktail(id: string, newName?: string): Promise<Cocktail> {
    const original = await this.getCocktailById(id);
    if (!original) {
      throw new Error('Cocktail not found');
    }

    const duplicateData: CreateCocktailData = {
      name: newName || `${original.name} (Copy)`,
      description: original.description,
      category: original.category,
      ingredients: [...original.ingredients], // Deep copy ingredients
      notes: original.notes,
    };

    return this.createCocktail(duplicateData);
  }

  // ==========================================
  // RECIPE MANAGEMENT
  // ==========================================

  /**
   * Add ingredient to cocktail
   * @param cocktailId - Cocktail ID
   * @param ingredient - SavedIngredient to add
   * @param amount - Amount in oz
   * @param unit - Unit of measurement
   * @returns Promise<Cocktail>
   */
  static async addIngredientToCocktail(
    cocktailId: string,
    ingredient: SavedIngredient,
    amount: number = 1.5,
    unit: 'oz' | 'ml' | 'drops' | 'splash' = 'oz'
  ): Promise<Cocktail> {
    const cocktail = await this.getCocktailById(cocktailId);
    if (!cocktail) {
      throw new Error('Cocktail not found');
    }

    const cocktailIngredient = createCocktailIngredient(ingredient, amount, unit);
    
    // Add order index
    cocktailIngredient.order = cocktail.ingredients.length;

    const updatedIngredients = [...cocktail.ingredients, cocktailIngredient];

    return this.updateCocktail({
      id: cocktailId,
      ingredients: updatedIngredients,
    });
  }

  /**
   * Remove ingredient from cocktail
   * @param cocktailId - Cocktail ID
   * @param ingredientId - Ingredient ID to remove
   * @returns Promise<Cocktail>
   */
  static async removeIngredientFromCocktail(
    cocktailId: string,
    ingredientId: string
  ): Promise<Cocktail> {
    const cocktail = await this.getCocktailById(cocktailId);
    if (!cocktail) {
      throw new Error('Cocktail not found');
    }

    const updatedIngredients = cocktail.ingredients.filter(
      ingredient => ingredient.id !== ingredientId
    );

    // Reorder remaining ingredients
    updatedIngredients.forEach((ingredient, index) => {
      ingredient.order = index;
    });

    return this.updateCocktail({
      id: cocktailId,
      ingredients: updatedIngredients,
    });
  }

  /**
   * Update ingredient amount in cocktail
   * @param cocktailId - Cocktail ID
   * @param ingredientId - Ingredient ID
   * @param newAmount - New amount
   * @returns Promise<Cocktail>
   */
  static async updateIngredientAmount(
    cocktailId: string,
    ingredientId: string,
    newAmount: number
  ): Promise<Cocktail> {
    const cocktail = await this.getCocktailById(cocktailId);
    if (!cocktail) {
      throw new Error('Cocktail not found');
    }

    const updatedIngredients = cocktail.ingredients.map(ingredient => {
      if (ingredient.id === ingredientId) {
        const costPerOz = CalculationService.calculateCostPerOz(
          ingredient.bottlePrice,
          ingredient.bottleSize
        );
        const newCost = CalculationService.calculatePourCost(costPerOz, newAmount);
        
        return {
          ...ingredient,
          amount: newAmount,
          cost: newCost,
        };
      }
      return ingredient;
    });

    return this.updateCocktail({
      id: cocktailId,
      ingredients: updatedIngredients,
    });
  }

  // ==========================================
  // SEARCH & FILTERING
  // ==========================================

  /**
   * Search cocktails by name, description, or ingredients
   * @param query - Search query
   * @param filters - Optional filters
   * @param limit - Maximum results (default 10)
   * @returns Promise<CocktailWithCalculations[]>
   */
  static async searchCocktails(
    query: string,
    filters?: CocktailFilters,
    limit: number = 10
  ): Promise<CocktailWithCalculations[]> {
    const cocktails = await this.getCocktails(filters);
    
    if (!query.trim()) return cocktails.slice(0, limit);

    const searchTerm = query.toLowerCase();
    const filtered = cocktails.filter(cocktail =>
      cocktail.name.toLowerCase().includes(searchTerm) ||
      (cocktail.description && cocktail.description.toLowerCase().includes(searchTerm)) ||
      cocktail.ingredients.some(ingredient =>
        ingredient.name.toLowerCase().includes(searchTerm)
      )
    );

    return filtered.slice(0, limit);
  }

  /**
   * Apply filters to cocktail list
   * @param cocktails - Cocktail list
   * @param filters - Filters to apply
   * @returns Filtered cocktails
   */
  private static applyFilters(
    cocktails: CocktailWithCalculations[],
    filters: CocktailFilters
  ): CocktailWithCalculations[] {
    return cocktails.filter(cocktail => {
      if (filters.category && cocktail.category !== filters.category) return false;
      if (filters.minCost && cocktail.totalCost < filters.minCost) return false;
      if (filters.maxCost && cocktail.totalCost > filters.maxCost) return false;
      if (filters.minPourCost && cocktail.pourCostPercentage < filters.minPourCost) return false;
      if (filters.maxPourCost && cocktail.pourCostPercentage > filters.maxPourCost) return false;
      if (filters.favorited !== undefined && cocktail.favorited !== filters.favorited) return false;
      return true;
    });
  }

  /**
   * Sort cocktails by specified criteria
   * @param cocktails - Cocktails to sort
   * @param sortBy - Sort criteria
   * @param ascending - Sort direction (default false for most recent first)
   * @returns Sorted cocktails
   */
  static sortCocktails(
    cocktails: CocktailWithCalculations[],
    sortBy: CocktailSortBy,
    ascending: boolean = false
  ): CocktailWithCalculations[] {
    const sortedCocktails = [...cocktails].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'cost':
          comparison = a.totalCost - b.totalCost;
          break;
        case 'profitMargin':
          comparison = a.profitMargin - b.profitMargin;
          break;
        case 'costPercent':
          comparison = a.pourCostPercentage - b.pourCostPercentage;
          break;
        case 'created':
        default:
          // Handle missing createdAt dates
          const aTime = a.createdAt ? a.createdAt.getTime() : 0;
          const bTime = b.createdAt ? b.createdAt.getTime() : 0;
          comparison = aTime - bTime;
          break;
      }

      return ascending ? comparison : -comparison;
    });

    return sortedCocktails;
  }

  // ==========================================
  // CALCULATIONS & METRICS
  // ==========================================

  /**
   * Calculate comprehensive performance metrics for a cocktail
   * @param cocktail - Cocktail to analyze
   * @param targetPourCost - Target pour cost percentage (default 22%)
   * @returns Performance metrics
   */
  static calculateCocktailMetrics(
    cocktail: Cocktail,
    targetPourCost: number = 22
  ): CocktailPerformanceMetrics {
    const totalCost = CalculationService.calculateCocktailTotalCost(cocktail.ingredients);
    const suggestedPrice = CalculationService.calculateCocktailSuggestedPrice(totalCost, targetPourCost);
    const pourCostPercentage = CalculationService.calculateCocktailPourCostPercentage(totalCost, suggestedPrice);
    const profitMargin = CalculationService.calculateCocktailProfitMargin(suggestedPrice, totalCost);
    const performanceLevel = CalculationService.getPourCostPerformanceLevel(pourCostPercentage);

    // Find most expensive ingredient
    const mostExpensiveIngredient = cocktail.ingredients.reduce((prev, current) => 
      (prev.cost > current.cost) ? prev : current
    );

    return {
      totalCost,
      suggestedPrice,
      pourCostPercentage,
      profitMargin,
      performanceLevel,
      costPerServing: totalCost,
      ingredientCount: cocktail.ingredients.length,
      mostExpensiveIngredient,
    };
  }

  /**
   * Toggle cocktail favorite status
   * @param id - Cocktail ID
   * @returns Promise<Cocktail>
   */
  static async toggleCocktailFavorite(id: string): Promise<Cocktail> {
    const cocktail = await this.getCocktailById(id);
    if (!cocktail) {
      throw new Error('Cocktail not found');
    }

    return this.updateCocktail({
      id,
      favorited: !(cocktail.favorited || false),
    });
  }

  // ==========================================
  // VALIDATION
  // ==========================================

  /**
   * Validate cocktail data
   * @param data - Cocktail data to validate
   * @returns Validation result
   */
  static validateCocktailData(data: Partial<CreateCocktailData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Name validation
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Cocktail name is required');
    } else if (data.name.length < 2) {
      errors.push('Cocktail name must be at least 2 characters');
    } else if (data.name.length > 100) {
      errors.push('Cocktail name must be less than 100 characters');
    }

    // Ingredients validation
    if (!data.ingredients || data.ingredients.length === 0) {
      errors.push('At least one ingredient is required');
    } else if (data.ingredients.length > 20) {
      errors.push('Maximum 20 ingredients allowed');
    } else {
      // Validate each ingredient
      data.ingredients.forEach((ingredient, index) => {
        if (!ingredient.name || ingredient.name.trim().length === 0) {
          errors.push(`Ingredient ${index + 1}: Name is required`);
        }
        if (ingredient.amount <= 0) {
          errors.push(`Ingredient ${index + 1}: Amount must be greater than 0`);
        }
        if (ingredient.cost < 0) {
          errors.push(`Ingredient ${index + 1}: Cost cannot be negative`);
        }
      });
    }

    // Description validation (optional)
    if (data.description && data.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }

    // Notes validation (optional)
    if (data.notes && data.notes.length > 1000) {
      errors.push('Notes must be less than 1000 characters');
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
   * Get unique cocktail categories from the database
   * @returns Promise<string[]>
   */
  static async getCocktailCategories(): Promise<string[]> {
    const cocktails = await this.getCocktails();
    const categories = new Set<string>();
    
    cocktails.forEach(cocktail => {
      if (cocktail.category) {
        categories.add(cocktail.category);
      }
    });

    return Array.from(categories).sort();
  }

  /**
   * Get cocktail cost statistics
   * @returns Cost statistics
   */
  static async getCostStatistics() {
    const cocktails = await this.getCocktails();
    const costs = cocktails.map(cocktail => cocktail.totalCost);

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

  /**
   * Get ingredient usage statistics
   * @returns Most/least used ingredients
   */
  static async getIngredientUsageStatistics() {
    const cocktails = await this.getCocktails();
    const ingredientUsage = new Map<string, number>();

    cocktails.forEach(cocktail => {
      cocktail.ingredients.forEach(ingredient => {
        const current = ingredientUsage.get(ingredient.name) || 0;
        ingredientUsage.set(ingredient.name, current + 1);
      });
    });

    const sortedUsage = Array.from(ingredientUsage.entries())
      .sort((a, b) => b[1] - a[1]);

    return {
      mostUsed: sortedUsage.slice(0, 5),
      leastUsed: sortedUsage.slice(-5).reverse(),
      totalUniqueIngredients: sortedUsage.length,
    };
  }
}