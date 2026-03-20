/**
 * Flexible ingredient service
 * Handles business logic for the new flexible ingredient system
 * This is a bridge between the new flexible system and the existing store
 */

import { 
  FlexibleIngredient, 
  CreateFlexibleIngredientData, 
  UpdateFlexibleIngredientData,
  FlexibleIngredientWithCalculations,
  RetailConfiguration
} from '@/src/types/flexible-models';
import { convertToMl, convertFromMl } from '@/src/utils/measurement-utils';
import { v4 as uuidv4 } from 'uuid';

export class FlexibleIngredientService {
  
  /**
   * Create a new flexible ingredient
   */
  static async createIngredient(data: CreateFlexibleIngredientData): Promise<FlexibleIngredient> {
    const now = new Date();
    
    // Generate retail configurations with IDs
    const retailConfigurations = data.retailConfigurations.map((config, index) => ({
      ...config,
      id: uuidv4() as string,
      pourCostPercentage: 0, // Will be calculated
      profitMargin: 0, // Will be calculated
      costPerPour: 0, // Will be calculated
      createdAt: now,
      updatedAt: now,
      isDefault: config.isDefault ?? index === 0
    }));

    // Find default config or use first one
    const defaultConfig = retailConfigurations.find(c => c.isDefault) || retailConfigurations[0];
    
    const ingredient: FlexibleIngredient = {
      id: uuidv4() as string,
      name: data.name,
      type: data.type,
      description: data.description,
      containerSize: data.containerSize,
      containerCost: data.containerCost,
      containerDisplayName: data.containerDisplayName,
      retailConfigurations: retailConfigurations as RetailConfiguration[],
      defaultRetailConfigId: defaultConfig.id,
      notForSale: data.notForSale ?? false,
      createdAt: now,
      updatedAt: now
    };

    // Calculate retail configuration metrics
    ingredient.retailConfigurations = ingredient.retailConfigurations.map(config => 
      this.calculateRetailConfigMetrics(ingredient, config)
    );

    return ingredient;
  }

  /**
   * Update an existing flexible ingredient
   */
  static async updateIngredient(
    existingIngredient: FlexibleIngredient, 
    updates: Partial<UpdateFlexibleIngredientData>
  ): Promise<FlexibleIngredient> {
    const updatedIngredient = {
      ...existingIngredient,
      ...updates,
      updatedAt: new Date()
    };

    // Recalculate metrics if container size or cost changed
    if (updates.containerSize || updates.containerCost) {
      updatedIngredient.retailConfigurations = updatedIngredient.retailConfigurations.map(config =>
        this.calculateRetailConfigMetrics(updatedIngredient, config)
      );
    }

    return updatedIngredient;
  }

  /**
   * Calculate metrics for a retail configuration
   */
  static calculateRetailConfigMetrics(
    ingredient: FlexibleIngredient, 
    config: RetailConfiguration
  ): RetailConfiguration {
    const containerMl = convertToMl(ingredient.containerSize.value, ingredient.containerSize.unit);
    const pourMl = convertToMl(config.pourSize.value, config.pourSize.unit);
    
    const costPerPour = (ingredient.containerCost / containerMl) * pourMl;
    const pourCostPercentage = config.retailPrice > 0 ? (costPerPour / config.retailPrice) * 100 : 0;
    const profitMargin = config.retailPrice - costPerPour;

    return {
      ...config,
      costPerPour,
      pourCostPercentage,
      profitMargin
    };
  }

  /**
   * Convert flexible ingredient to display format with calculations
   */
  static calculateIngredientWithDisplayMetrics(
    ingredient: FlexibleIngredient,
    currency = 'USD',
    measurementSystem: 'US' | 'Metric' = 'US'
  ): FlexibleIngredientWithCalculations {
    const containerMl = convertToMl(ingredient.containerSize.value, ingredient.containerSize.unit);
    const costPerMl = ingredient.containerCost / containerMl;
    const costPerOz = costPerMl * convertToMl(1, 'oz');

    const defaultConfig = ingredient.retailConfigurations.find(c => c.id === ingredient.defaultRetailConfigId) 
      || ingredient.retailConfigurations[0];

    // Performance analysis
    const pourCostPercentages = ingredient.retailConfigurations.map(c => c.pourCostPercentage);
    const avgPourCost = pourCostPercentages.reduce((a, b) => a + b, 0) / pourCostPercentages.length;

    const performance = {
      rating: (avgPourCost <= 20 ? 'excellent' : 
               avgPourCost <= 25 ? 'good' : 
               avgPourCost <= 30 ? 'fair' : 'poor') as 'excellent' | 'good' | 'fair' | 'poor',
      pourCostRange: {
        min: Math.min(...pourCostPercentages),
        max: Math.max(...pourCostPercentages),
        average: avgPourCost
      },
      profitRange: {
        min: Math.min(...ingredient.retailConfigurations.map(c => c.profitMargin)),
        max: Math.max(...ingredient.retailConfigurations.map(c => c.profitMargin)),
        average: ingredient.retailConfigurations.reduce((a, c) => a + c.profitMargin, 0) / ingredient.retailConfigurations.length
      },
      recommendations: this.generateRecommendations(ingredient, avgPourCost)
    };

    return {
      ...ingredient,
      costPerMl,
      costPerOz,
      defaultPourSize: defaultConfig.pourSize,
      defaultRetailPrice: defaultConfig.retailPrice,
      defaultCostPerPour: defaultConfig.costPerPour,
      defaultPourCostPercentage: defaultConfig.pourCostPercentage,
      defaultProfitMargin: defaultConfig.profitMargin,
      performance,
      currency,
      measurementSystem
    };
  }

  /**
   * Generate recommendations for ingredient optimization
   */
  private static generateRecommendations(ingredient: FlexibleIngredient, avgPourCost: number): string[] {
    const recommendations: string[] = [];

    if (avgPourCost > 30) {
      recommendations.push('Consider increasing retail prices - pour cost is very high');
    } else if (avgPourCost > 25) {
      recommendations.push('Pour cost is above target - consider price adjustment');
    } else if (avgPourCost < 15) {
      recommendations.push('Excellent pour cost - consider promoting this item');
    }

    if (ingredient.retailConfigurations.length === 1) {
      recommendations.push('Consider adding multiple pour sizes for flexibility');
    }

    if (ingredient.type === 'Spirit' && !ingredient.retailConfigurations.some(c => 
      Math.abs(convertFromMl(c.pourSize.value, 'oz') - 1.5) < 0.1)) {
      recommendations.push('Consider adding a 1.5oz pour size (industry standard)');
    }

    return recommendations;
  }

  /**
   * Delete a flexible ingredient
   */
  static async deleteIngredient(id: string): Promise<void> {
    // TODO: Implement deletion logic
    console.log('Deleting flexible ingredient:', id);
  }

  /**
   * Convert legacy ingredient to flexible ingredient
   */
  static convertFromLegacy(legacyIngredient: any): FlexibleIngredient {
    // This would convert existing SavedIngredient to FlexibleIngredient
    // For now, return a basic conversion
    const now = new Date();
    
    const retailConfig: RetailConfiguration = {
      id: uuidv4() as string,
      pourSize: { value: 1.5, unit: 'oz', displayName: '1.5 oz' },
      retailPrice: 8.0, // Default
      isDefault: true,
      displayName: 'Standard Pour',
      pourCostPercentage: 0,
      profitMargin: 0,
      costPerPour: 0,
      createdAt: now,
      updatedAt: now
    };

    return {
      id: legacyIngredient.id || uuidv4() as string,
      name: legacyIngredient.name,
      type: this.inferTypeFromLegacy(legacyIngredient),
      containerSize: { 
        value: legacyIngredient.bottleSize || 750, 
        unit: 'ml', 
        displayName: `${legacyIngredient.bottleSize || 750}ml` 
      },
      containerCost: legacyIngredient.bottlePrice || 0,
      retailConfigurations: [retailConfig],
      defaultRetailConfigId: retailConfig.id,
      notForSale: legacyIngredient.notForSale || false,
      createdAt: legacyIngredient.createdAt || now,
      updatedAt: legacyIngredient.updatedAt || now
    };
  }

  /**
   * Infer ingredient type from legacy data
   */
  private static inferTypeFromLegacy(legacy: any): FlexibleIngredient['type'] {
    const type = legacy.type?.toLowerCase() || '';
    
    if (type.includes('spirit') || type.includes('vodka') || type.includes('whiskey') || 
        type.includes('rum') || type.includes('gin') || type.includes('tequila')) {
      return 'Spirit';
    } else if (type.includes('beer') || type.includes('ale') || type.includes('lager')) {
      return 'Beer';
    } else if (type.includes('wine') || type.includes('champagne') || type.includes('prosecco')) {
      return 'Wine';
    } else if (type.includes('syrup') || type.includes('bitter') || type.includes('prepped')) {
      return 'Prepped';
    } else {
      return 'Other';
    }
  }
}