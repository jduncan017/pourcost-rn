/**
 * Calculation Service for PourCost-RN
 * Matches iOS IngredientVM / CocktailVM calculation logic exactly.
 *
 * iOS formula:
 *   poursPerContainer = productSize.ounces / pourSize.ounces
 *   costPerPour = productCost / poursPerContainer
 *   charge (suggested price) = costPerPour / margin
 *
 * For unit quantities (6-pack, etc.):
 *   costPerUnit = productCost / quantity
 */

import {
  Volume,
  volumeToOunces,
  isUnitQuantity,
  CocktailIngredient,
  IngredientMetrics,
  CocktailMetrics,
  SavedIngredient,
} from '@/src/types/models';
import { round2 } from '@/src/utils/conversions';
import { DEFAULT_VALUES, POUR_COST_THRESHOLDS } from '@/src/constants/appConstants';

// ==========================================
// CORE INGREDIENT CALCULATIONS
// ==========================================

/**
 * Calculate cost per pour for an ingredient.
 * Matches iOS: productCost / (productSize.ounces / pourSize.ounces)
 * For unit quantities: productCost / quantity
 */
export function calculateCostPerPour(
  productSize: Volume,
  productCost: number,
  pourSize: Volume,
): number {
  if (productCost <= 0) return 0;
  if (!productSize?.kind || !pourSize?.kind) return 0;

  // Unit quantity path: cost per individual unit
  if (isUnitQuantity(productSize)) {
    return round2(productCost / productSize.quantity);
  }

  const productOz = volumeToOunces(productSize);
  const pourOz = volumeToOunces(pourSize);
  if (productOz <= 0 || pourOz <= 0) return 0;

  const poursPerContainer = productOz / pourOz;
  return round2(productCost / poursPerContainer);
}

/**
 * Calculate cost per ounce.
 */
export function calculateCostPerOz(
  productSize: Volume,
  productCost: number,
): number {
  if (productCost <= 0) return 0;
  if (!productSize?.kind) return 0;
  const productOz = volumeToOunces(productSize);
  if (productOz <= 0) return 0;
  return round2(productCost / productOz);
}

/**
 * Calculate suggested retail price from pour cost and target margin.
 * iOS formula: charge = costPerPour / margin
 * Default margin 18% (0.18) matches iOS.
 */
export function calculateSuggestedPrice(
  costPerPour: number,
  margin: number = DEFAULT_VALUES.POUR_COST_TARGET,
): number {
  if (margin <= 0 || costPerPour <= 0) return 0;
  return round2(costPerPour / margin);
}

/**
 * Calculate pour cost percentage: costPerPour / retailPrice * 100
 */
export function calculatePourCostPercentage(
  costPerPour: number,
  retailPrice: number,
): number {
  if (retailPrice <= 0) return 0;
  return round2((costPerPour / retailPrice) * 100);
}

/**
 * Calculate all metrics for a single ingredient at a given pour size and retail price.
 */
export function calculateIngredientMetrics(
  ingredient: SavedIngredient,
  pourSize: Volume,
  retailPrice: number,
): IngredientMetrics {
  const costPerOz = calculateCostPerOz(ingredient.productSize, ingredient.productCost);
  const costPerPour = calculateCostPerPour(ingredient.productSize, ingredient.productCost, pourSize);
  const pourCostPercentage = retailPrice > 0 ? calculatePourCostPercentage(costPerPour, retailPrice) : 0;
  const pourCostMargin = round2(retailPrice - costPerPour);

  return { costPerOz, costPerPour, pourCostPercentage, pourCostMargin };
}

// ==========================================
// COCKTAIL CALCULATIONS
// ==========================================

/**
 * Calculate cost for a single cocktail ingredient.
 */
export function calculateIngredientCost(ing: CocktailIngredient): number {
  return calculateCostPerPour(ing.productSize, ing.productCost, ing.pourSize);
}

/**
 * Calculate all metrics for a cocktail.
 * iOS: totalCost = sum of ingredient costs, charge = totalCost / margin
 *
 * profitMargin uses retailPrice when provided (real margin at current price).
 * If retailPrice is omitted or 0, falls back to suggestedPrice - totalCost
 * (hypothetical margin at the target pour-cost %) to keep sort/list behavior
 * stable for cocktails without a set price.
 */
export function calculateCocktailMetrics(
  ingredients: CocktailIngredient[],
  margin: number = DEFAULT_VALUES.POUR_COST_TARGET,
  retailPrice?: number,
): CocktailMetrics {
  const totalCost = round2(
    ingredients.reduce((sum, ing) => sum + calculateIngredientCost(ing), 0)
  );
  const suggestedPrice = calculateSuggestedPrice(totalCost, margin);
  const pourCostPercentage = suggestedPrice > 0
    ? calculatePourCostPercentage(totalCost, suggestedPrice)
    : 0;
  const profitMargin = retailPrice && retailPrice > 0
    ? round2(retailPrice - totalCost)
    : round2(suggestedPrice - totalCost);

  return { totalCost, suggestedPrice, pourCostPercentage, profitMargin };
}

// ==========================================
// PERFORMANCE HELPERS
// ==========================================

export type PourCostLevel = 'excellent' | 'good' | 'warning' | 'poor';

export function getPourCostLevel(percentage: number): PourCostLevel {
  if (percentage <= POUR_COST_THRESHOLDS.EXCELLENT) return 'excellent';
  if (percentage <= POUR_COST_THRESHOLDS.GOOD) return 'good';
  if (percentage <= POUR_COST_THRESHOLDS.ACCEPTABLE) return 'warning';
  return 'poor';
}

export function getPourCostColor(percentage: number): string {
  const level = getPourCostLevel(percentage);
  switch (level) {
    case 'excellent':
    case 'good':
      return 'text-s22';
    case 'warning':
      return 'text-s12';
    case 'poor':
      return 'text-e3';
  }
}

// ==========================================
// FORMATTING
// ==========================================

export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
