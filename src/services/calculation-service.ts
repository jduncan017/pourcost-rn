/**
 * Centralized calculation service for PourCost-RN
 * Single source of truth for all cost and pricing calculations
 * Eliminates duplicate calculation logic across components
 */

// Performance thresholds for pour cost percentages
export const POUR_COST_THRESHOLDS = {
  excellent: 15, // <= 15% is excellent
  good: 20,      // <= 20% is good
  warning: 25,   // <= 25% is warning
  poor: 100      // > 25% is poor
} as const;

export type PourCostPerformanceLevel = 'excellent' | 'good' | 'warning' | 'poor';

export interface PricingRecommendation {
  currentPerformance: PourCostPerformanceLevel;
  recommendedPrice: number;
  targetPercentage: number;
  potentialProfit: number;
  message: string;
}

/**
 * Core calculation service with all business logic
 */
export class CalculationService {
  
  // ==========================================
  // CORE COST CALCULATIONS
  // ==========================================

  /**
   * Calculate cost per ounce from bottle price and size
   * @param bottlePrice - Price of the bottle in base currency
   * @param bottleSize - Size of bottle in ml
   * @returns Cost per ounce
   */
  static calculateCostPerOz(bottlePrice: number, bottleSize: number): number {
    if (bottleSize <= 0) throw new Error('Bottle size must be greater than 0');
    if (bottlePrice < 0) throw new Error('Bottle price cannot be negative');
    
    const bottleSizeOz = bottleSize / 29.5735; // Convert ml to oz
    return bottlePrice / bottleSizeOz;
  }

  /**
   * Calculate cost for specific pour amount
   * @param costPerOz - Cost per ounce
   * @param pourSize - Pour amount in ounces
   * @returns Total cost for the pour
   */
  static calculatePourCost(costPerOz: number, pourSize: number): number {
    if (costPerOz < 0) throw new Error('Cost per oz cannot be negative');
    if (pourSize <= 0) throw new Error('Pour size must be greater than 0');
    
    return costPerOz * pourSize;
  }

  /**
   * Calculate suggested retail price based on target pour cost percentage
   * @param pourCost - Cost of the pour
   * @param targetPercentage - Target pour cost percentage (default 20%)
   * @returns Suggested retail price
   */
  static calculateSuggestedPrice(pourCost: number, targetPercentage: number = 20): number {
    if (pourCost < 0) throw new Error('Pour cost cannot be negative');
    if (targetPercentage <= 0 || targetPercentage > 100) {
      throw new Error('Target percentage must be between 0 and 100');
    }
    
    return pourCost / (targetPercentage / 100);
  }

  /**
   * Calculate pour cost as percentage of retail price
   * @param pourCost - Cost of the pour
   * @param retailPrice - Retail price of the drink
   * @returns Pour cost percentage
   */
  static calculatePourCostPercentage(pourCost: number, retailPrice: number): number {
    if (pourCost < 0) throw new Error('Pour cost cannot be negative');
    if (retailPrice <= 0) throw new Error('Retail price must be greater than 0');
    
    return (pourCost / retailPrice) * 100;
  }

  /**
   * Calculate profit margin (retail price - pour cost)
   * @param retailPrice - Retail price of the drink
   * @param pourCost - Cost of the pour
   * @returns Profit margin
   */
  static calculateProfitMargin(retailPrice: number, pourCost: number): number {
    if (retailPrice < 0) throw new Error('Retail price cannot be negative');
    if (pourCost < 0) throw new Error('Pour cost cannot be negative');
    
    return retailPrice - pourCost;
  }

  // ==========================================
  // COCKTAIL CALCULATIONS
  // ==========================================

  /**
   * Calculate total cost for a cocktail from its ingredients
   * @param ingredients - Array of cocktail ingredients
   * @returns Total cost
   */
  static calculateCocktailTotalCost(ingredients: Array<{ cost: number }>): number {
    return ingredients.reduce((total, ingredient) => total + ingredient.cost, 0);
  }

  /**
   * Calculate cocktail suggested price based on total cost and target percentage
   * @param totalCost - Total cost of all ingredients
   * @param targetPercentage - Target pour cost percentage (default 22%)
   * @returns Suggested cocktail price
   */
  static calculateCocktailSuggestedPrice(totalCost: number, targetPercentage: number = 22): number {
    return this.calculateSuggestedPrice(totalCost, targetPercentage);
  }

  /**
   * Calculate cocktail pour cost percentage
   * @param totalCost - Total cost of all ingredients
   * @param retailPrice - Retail price of the cocktail
   * @returns Pour cost percentage
   */
  static calculateCocktailPourCostPercentage(totalCost: number, retailPrice: number): number {
    return this.calculatePourCostPercentage(totalCost, retailPrice);
  }

  /**
   * Calculate cocktail profit margin
   * @param retailPrice - Retail price of the cocktail
   * @param totalCost - Total cost of all ingredients
   * @returns Profit margin
   */
  static calculateCocktailProfitMargin(retailPrice: number, totalCost: number): number {
    return this.calculateProfitMargin(retailPrice, totalCost);
  }

  // ==========================================
  // BUSINESS RULES & PERFORMANCE ANALYSIS
  // ==========================================

  /**
   * Get performance level based on pour cost percentage
   * @param percentage - Pour cost percentage
   * @returns Performance level
   */
  static getPourCostPerformanceLevel(percentage: number): PourCostPerformanceLevel {
    if (percentage <= POUR_COST_THRESHOLDS.excellent) return 'excellent';
    if (percentage <= POUR_COST_THRESHOLDS.good) return 'good';
    if (percentage <= POUR_COST_THRESHOLDS.warning) return 'warning';
    return 'poor';
  }

  /**
   * Get color for pour cost percentage display
   * @param percentage - Pour cost percentage
   * @returns Tailwind CSS color class
   */
  static getPourCostColor(percentage: number): string {
    const level = this.getPourCostPerformanceLevel(percentage);
    
    switch (level) {
      case 'excellent':
      case 'good':
        return 'text-s22'; // Teal - good performance
      case 'warning':
        return 'text-s12'; // Yellow - caution
      case 'poor':
        return 'text-e3'; // Red - poor performance
      default:
        return 'text-g3'; // Default gray
    }
  }

  /**
   * Get optimal pricing recommendation
   * @param currentCost - Current pour cost
   * @param currentPrice - Current retail price
   * @param targetPercentage - Desired pour cost percentage
   * @returns Pricing recommendation
   */
  static getOptimalPricingRecommendation(
    currentCost: number,
    currentPrice: number,
    targetPercentage: number = 20
  ): PricingRecommendation {
    const currentPercentage = this.calculatePourCostPercentage(currentCost, currentPrice);
    const currentPerformance = this.getPourCostPerformanceLevel(currentPercentage);
    const recommendedPrice = this.calculateSuggestedPrice(currentCost, targetPercentage);
    const potentialProfit = this.calculateProfitMargin(recommendedPrice, currentCost);
    
    let message = '';
    if (currentPerformance === 'excellent') {
      message = 'Excellent pour cost! Consider if price can be optimized further.';
    } else if (currentPerformance === 'good') {
      message = 'Good pour cost ratio. Minor price adjustment could improve margins.';
    } else if (currentPerformance === 'warning') {
      message = 'Pour cost is getting high. Consider raising price or finding cost savings.';
    } else {
      message = 'Pour cost is too high! Significant price increase or cost reduction needed.';
    }

    return {
      currentPerformance,
      recommendedPrice,
      targetPercentage,
      potentialProfit,
      message
    };
  }

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  /**
   * Format currency value for display
   * @param value - Numeric value
   * @param currency - Currency code (default USD)
   * @returns Formatted currency string
   */
  static formatCurrency(value: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  }

  /**
   * Format percentage for display
   * @param value - Percentage value
   * @param decimals - Number of decimal places (default 1)
   * @returns Formatted percentage string
   */
  static formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  /**
   * Round value to specified decimal places
   * @param value - Value to round
   * @param decimals - Number of decimal places (default 2)
   * @returns Rounded value
   */
  static roundToDecimal(value: number, decimals: number = 2): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}