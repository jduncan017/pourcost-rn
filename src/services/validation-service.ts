/**
 * Validation Service for PourCost-RN
 * Centralizes all validation logic across the application
 * Provides comprehensive validation for ingredients, cocktails, and business rules
 */

import { SavedIngredient, Cocktail, CocktailIngredient } from '@/src/types/models';
import { VolumeService, VolumeUnit } from './volume-service';
import { CurrencyService } from './currency-service';
import { MeasurementService, MeasurementSystem } from './measurement-service';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface FieldValidationResult {
  isValid: boolean;
  message?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface BusinessValidationResult extends ValidationResult {
  criticalErrors: string[];
  businessWarnings: string[];
  recommendedActions: string[];
}

/**
 * Validation service class
 */
export class ValidationService {
  
  // ==========================================
  // BASIC FIELD VALIDATION
  // ==========================================

  /**
   * Validate ingredient name
   * @param name - Ingredient name
   * @returns Validation result
   */
  static validateIngredientName(name: string): FieldValidationResult {
    if (!name || name.trim().length === 0) {
      return {
        isValid: false,
        message: 'Ingredient name is required',
        severity: 'error',
      };
    }

    if (name.trim().length < 2) {
      return {
        isValid: false,
        message: 'Ingredient name must be at least 2 characters',
        severity: 'error',
      };
    }

    if (name.length > 100) {
      return {
        isValid: false,
        message: 'Ingredient name must be less than 100 characters',
        severity: 'error',
      };
    }

    // Check for special characters that might cause issues
    if (/[<>\"'&]/.test(name)) {
      return {
        isValid: false,
        message: 'Ingredient name contains invalid characters',
        severity: 'error',
      };
    }

    // Warning for very long names
    if (name.length > 50) {
      return {
        isValid: true,
        message: 'Long ingredient names may be truncated in some views',
        severity: 'warning',
      };
    }

    return { isValid: true, severity: 'info' };
  }

  /**
   * Validate cocktail name
   * @param name - Cocktail name
   * @returns Validation result
   */
  static validateCocktailName(name: string): FieldValidationResult {
    if (!name || name.trim().length === 0) {
      return {
        isValid: false,
        message: 'Cocktail name is required',
        severity: 'error',
      };
    }

    if (name.trim().length < 2) {
      return {
        isValid: false,
        message: 'Cocktail name must be at least 2 characters',
        severity: 'error',
      };
    }

    if (name.length > 100) {
      return {
        isValid: false,
        message: 'Cocktail name must be less than 100 characters',
        severity: 'error',
      };
    }

    return { isValid: true, severity: 'info' };
  }

  /**
   * Validate bottle size
   * @param size - Bottle size in ml
   * @param measurementSystem - Measurement system context
   * @returns Validation result
   */
  static validateBottleSize(size: number, measurementSystem: MeasurementSystem = 'US'): FieldValidationResult {
    if (isNaN(size) || size <= 0) {
      return {
        isValid: false,
        message: 'Bottle size must be greater than 0',
        severity: 'error',
      };
    }

    if (size > 10000) {
      return {
        isValid: false,
        message: 'Bottle size cannot exceed 10,000ml (10L)',
        severity: 'error',
      };
    }

    // Warning for unusual sizes
    if (size < 50) {
      return {
        isValid: true,
        message: 'Very small bottle size - please verify this is correct',
        severity: 'warning',
      };
    }

    if (size > 5000) {
      return {
        isValid: true,
        message: 'Large bottle size - please verify this is correct',
        severity: 'warning',
      };
    }

    // Check if it's a standard size
    const closestStandard = MeasurementService.findClosestBottleSize(size, 'ml', measurementSystem);
    if (closestStandard) {
      const standardMl = VolumeService.toMilliliters(closestStandard.size, closestStandard.unit);
      const diff = Math.abs(size - standardMl);
      
      if (diff > 50 && diff / standardMl > 0.1) {
        return {
          isValid: true,
          message: `Consider using standard size: ${closestStandard.label}`,
          severity: 'info',
        };
      }
    }

    return { isValid: true, severity: 'info' };
  }

  /**
   * Validate bottle price
   * @param price - Bottle price
   * @param currencyCode - Currency code
   * @returns Validation result
   */
  static validateBottlePrice(price: number, currencyCode: string = 'USD'): FieldValidationResult {
    if (isNaN(price) || price < 0) {
      return {
        isValid: false,
        message: 'Bottle price cannot be negative',
        severity: 'error',
      };
    }

    if (price === 0) {
      return {
        isValid: true,
        message: 'Zero price - ensure this is intentional',
        severity: 'warning',
      };
    }

    if (price > 10000) {
      return {
        isValid: false,
        message: 'Bottle price seems unreasonably high',
        severity: 'error',
      };
    }

    // Currency-specific validation
    const currencyValidation = CurrencyService.validateCurrencyAmount(price, currencyCode);
    if (!currencyValidation.isValid) {
      return {
        isValid: false,
        message: currencyValidation.errors[0],
        severity: 'error',
      };
    }

    // Warning for unusual prices
    if (price < 1) {
      return {
        isValid: true,
        message: 'Very low price - please verify this is correct',
        severity: 'warning',
      };
    }

    if (price > 1000) {
      return {
        isValid: true,
        message: 'High price - please verify this is correct',
        severity: 'warning',
      };
    }

    return { isValid: true, severity: 'info' };
  }

  /**
   * Validate pour amount
   * @param amount - Pour amount
   * @param unit - Volume unit
   * @param context - Context (cocktail, tasting, etc.)
   * @returns Validation result
   */
  static validatePourAmount(
    amount: number,
    unit: VolumeUnit,
    context: 'cocktail' | 'tasting' | 'batch' = 'cocktail'
  ): FieldValidationResult {
    if (isNaN(amount) || amount <= 0) {
      return {
        isValid: false,
        message: 'Pour amount must be greater than 0',
        severity: 'error',
      };
    }

    // Convert to ml for range checking
    const mlAmount = VolumeService.toMilliliters(amount, unit);

    // Context-specific validation
    switch (context) {
      case 'tasting':
        if (mlAmount > 30) {
          return {
            isValid: true,
            message: 'Large amount for tasting - consider reducing',
            severity: 'warning',
          };
        }
        break;

      case 'cocktail':
        if (mlAmount > 120) {
          return {
            isValid: true,
            message: 'Very large pour for cocktail - please verify',
            severity: 'warning',
          };
        }
        if (mlAmount < 1 && unit !== 'drops') {
          return {
            isValid: true,
            message: 'Very small pour - consider using drops',
            severity: 'info',
          };
        }
        break;

      case 'batch':
        if (mlAmount < 50) {
          return {
            isValid: true,
            message: 'Small amount for batch - consider if this is per serving',
            severity: 'info',
          };
        }
        break;
    }

    // Maximum reasonable amount
    if (mlAmount > 1000) {
      return {
        isValid: false,
        message: 'Pour amount is unreasonably large',
        severity: 'error',
      };
    }

    return { isValid: true, severity: 'info' };
  }

  // ==========================================
  // INGREDIENT VALIDATION
  // ==========================================

  /**
   * Validate complete ingredient data
   * @param ingredient - Ingredient data
   * @param measurementSystem - Measurement system
   * @param currencyCode - Currency code
   * @returns Comprehensive validation result
   */
  static validateIngredient(
    ingredient: Partial<SavedIngredient>,
    measurementSystem: MeasurementSystem = 'US',
    currencyCode: string = 'USD'
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Name validation
    const nameValidation = this.validateIngredientName(ingredient.name || '');
    if (!nameValidation.isValid) {
      errors.push(nameValidation.message || 'Invalid name');
    } else if (nameValidation.severity === 'warning') {
      warnings.push(nameValidation.message || '');
    }

    // Bottle size validation
    if (ingredient.bottleSize !== undefined) {
      const sizeValidation = this.validateBottleSize(ingredient.bottleSize, measurementSystem);
      if (!sizeValidation.isValid) {
        errors.push(sizeValidation.message || 'Invalid bottle size');
      } else if (sizeValidation.severity === 'warning') {
        warnings.push(sizeValidation.message || '');
      } else if (sizeValidation.severity === 'info' && sizeValidation.message) {
        suggestions.push(sizeValidation.message);
      }
    }

    // Price validation
    if (ingredient.bottlePrice !== undefined) {
      const priceValidation = this.validateBottlePrice(ingredient.bottlePrice, currencyCode);
      if (!priceValidation.isValid) {
        errors.push(priceValidation.message || 'Invalid bottle price');
      } else if (priceValidation.severity === 'warning') {
        warnings.push(priceValidation.message || '');
      }
    }

    // Type validation
    if (ingredient.type && ingredient.type.length > 50) {
      errors.push('Ingredient type must be less than 50 characters');
    }

    // Business logic validation
    if (ingredient.bottleSize && ingredient.bottlePrice) {
      const costPerOz = ingredient.bottlePrice / (ingredient.bottleSize / 29.5735);
      
      if (costPerOz > 50) {
        warnings.push('Very expensive ingredient - cost per oz is over $50');
      }
      
      if (costPerOz < 0.01) {
        warnings.push('Very inexpensive ingredient - please verify pricing');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  // ==========================================
  // COCKTAIL VALIDATION
  // ==========================================

  /**
   * Validate cocktail ingredient
   * @param ingredient - Cocktail ingredient
   * @returns Validation result
   */
  static validateCocktailIngredient(ingredient: Partial<CocktailIngredient>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Name validation
    const nameValidation = this.validateIngredientName(ingredient.name || '');
    if (!nameValidation.isValid) {
      errors.push(nameValidation.message || 'Invalid ingredient name');
    }

    // Amount validation
    if (ingredient.amount !== undefined && ingredient.unit) {
      const amountValidation = this.validatePourAmount(ingredient.amount, ingredient.unit);
      if (!amountValidation.isValid) {
        errors.push(amountValidation.message || 'Invalid amount');
      } else if (amountValidation.severity === 'warning') {
        warnings.push(amountValidation.message || '');
      }
    }

    // Cost validation
    if (ingredient.cost !== undefined) {
      if (ingredient.cost < 0) {
        errors.push('Ingredient cost cannot be negative');
      }
      if (ingredient.cost > 100) {
        warnings.push('Very expensive ingredient in cocktail');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Validate complete cocktail data
   * @param cocktail - Cocktail data
   * @returns Comprehensive validation result
   */
  static validateCocktail(cocktail: Partial<Cocktail>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Name validation
    const nameValidation = this.validateCocktailName(cocktail.name || '');
    if (!nameValidation.isValid) {
      errors.push(nameValidation.message || 'Invalid cocktail name');
    }

    // Ingredients validation
    if (!cocktail.ingredients || cocktail.ingredients.length === 0) {
      errors.push('At least one ingredient is required');
    } else if (cocktail.ingredients.length > 20) {
      warnings.push('Very complex cocktail with many ingredients');
    } else {
      // Validate each ingredient
      cocktail.ingredients.forEach((ingredient, index) => {
        const ingredientValidation = this.validateCocktailIngredient(ingredient);
        if (!ingredientValidation.isValid) {
          errors.push(`Ingredient ${index + 1}: ${ingredientValidation.errors[0]}`);
        }
        ingredientValidation.warnings.forEach(warning => {
          warnings.push(`Ingredient ${index + 1}: ${warning}`);
        });
      });

      // Check for duplicate ingredients
      const ingredientNames = cocktail.ingredients.map(ing => ing.name.toLowerCase());
      const duplicates = ingredientNames.filter((name, index) => 
        ingredientNames.indexOf(name) !== index
      );
      if (duplicates.length > 0) {
        warnings.push('Cocktail contains duplicate ingredients');
      }
    }

    // Description validation
    if (cocktail.description && cocktail.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }

    // Notes validation
    if (cocktail.notes && cocktail.notes.length > 1000) {
      errors.push('Notes must be less than 1000 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  // ==========================================
  // BUSINESS RULE VALIDATION
  // ==========================================

  /**
   * Validate business rules for ingredient pricing
   * @param ingredient - Ingredient with calculations
   * @param targetPourCost - Target pour cost percentage
   * @returns Business validation result
   */
  static validateIngredientBusinessRules(
    ingredient: {
      name: string;
      bottlePrice: number;
      bottleSize: number;
      costPerOz?: number;
      pourCostPercentage?: number;
    },
    targetPourCost: number = 20
  ): BusinessValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const criticalErrors: string[] = [];
    const businessWarnings: string[] = [];
    const recommendedActions: string[] = [];

    // Calculate metrics if not provided
    const costPerOz = ingredient.costPerOz || 
      ingredient.bottlePrice / (ingredient.bottleSize / 29.5735);

    // Critical business rules
    if (costPerOz > 100) {
      criticalErrors.push('Cost per ounce exceeds $100 - verify pricing');
    }

    if (ingredient.bottlePrice / ingredient.bottleSize > 10) {
      criticalErrors.push('Price per ml is extremely high - verify unit of measurement');
    }

    // Pour cost analysis
    if (ingredient.pourCostPercentage !== undefined) {
      if (ingredient.pourCostPercentage > 50) {
        businessWarnings.push('Pour cost exceeds 50% - profitability at risk');
        recommendedActions.push('Consider finding a less expensive alternative or increasing prices');
      } else if (ingredient.pourCostPercentage > targetPourCost * 1.5) {
        businessWarnings.push(`Pour cost exceeds target by ${Math.round((ingredient.pourCostPercentage / targetPourCost - 1) * 100)}%`);
        recommendedActions.push('Review pricing strategy or portion sizes');
      }

      if (ingredient.pourCostPercentage < 10) {
        suggestions.push('Very low pour cost - opportunity to increase margins or improve quality');
      }
    }

    // Market positioning warnings
    if (costPerOz > 20) {
      businessWarnings.push('Premium ingredient pricing - ensure value proposition is clear');
    }

    if (costPerOz < 0.50) {
      warnings.push('Low-cost ingredient - verify quality meets standards');
    }

    return {
      isValid: criticalErrors.length === 0 && errors.length === 0,
      errors: [...errors, ...criticalErrors],
      warnings: [...warnings, ...businessWarnings],
      suggestions,
      criticalErrors,
      businessWarnings,
      recommendedActions,
    };
  }

  /**
   * Validate cocktail business rules
   * @param cocktail - Cocktail with calculations
   * @param targetPourCost - Target pour cost percentage
   * @returns Business validation result
   */
  static validateCocktailBusinessRules(
    cocktail: {
      name: string;
      totalCost: number;
      suggestedPrice: number;
      pourCostPercentage: number;
      profitMargin: number;
      ingredients: Array<{ cost: number; name: string }>;
    },
    targetPourCost: number = 22
  ): BusinessValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const criticalErrors: string[] = [];
    const businessWarnings: string[] = [];
    const recommendedActions: string[] = [];

    // Critical business rules
    if (cocktail.totalCost > 50) {
      criticalErrors.push('Total ingredient cost exceeds $50 - verify recipe');
    }

    if (cocktail.profitMargin < 0) {
      criticalErrors.push('Negative profit margin - recipe is unprofitable');
      recommendedActions.push('Increase price or reduce ingredient costs');
    }

    // Pour cost analysis
    if (cocktail.pourCostPercentage > 40) {
      criticalErrors.push('Pour cost exceeds 40% - serious profitability concern');
      recommendedActions.push('Immediate recipe or pricing review required');
    } else if (cocktail.pourCostPercentage > targetPourCost * 1.3) {
      businessWarnings.push(`Pour cost ${Math.round(cocktail.pourCostPercentage)}% exceeds target of ${targetPourCost}%`);
      recommendedActions.push('Adjust recipe or pricing to improve margins');
    }

    // Ingredient cost distribution
    if (cocktail.ingredients.length > 0) {
      const maxIngredientCost = Math.max(...cocktail.ingredients.map(ing => ing.cost));
      const maxCostPercentage = (maxIngredientCost / cocktail.totalCost) * 100;

      if (maxCostPercentage > 70) {
        const expensiveIngredient = cocktail.ingredients.find(ing => ing.cost === maxIngredientCost);
        businessWarnings.push(`Single ingredient (${expensiveIngredient?.name}) dominates cost at ${Math.round(maxCostPercentage)}%`);
        recommendedActions.push('Consider reducing portion or finding alternative');
      }
    }

    // Price positioning
    if (cocktail.suggestedPrice > 25) {
      businessWarnings.push('High-end cocktail pricing - ensure market positioning supports this');
    }

    if (cocktail.suggestedPrice < 5) {
      suggestions.push('Low pricing may undervalue the cocktail - consider premium positioning');
    }

    // Profitability insights
    if (cocktail.profitMargin > 15) {
      suggestions.push('Excellent profit margins - consider this for signature cocktails');
    }

    return {
      isValid: criticalErrors.length === 0 && errors.length === 0,
      errors: [...errors, ...criticalErrors],
      warnings: [...warnings, ...businessWarnings],
      suggestions,
      criticalErrors,
      businessWarnings,
      recommendedActions,
    };
  }

  // ==========================================
  // UTILITY VALIDATION FUNCTIONS
  // ==========================================

  /**
   * Validate email address
   * @param email - Email address
   * @returns Validation result
   */
  static validateEmail(email: string): FieldValidationResult {
    if (!email || email.trim().length === 0) {
      return {
        isValid: false,
        message: 'Email address is required',
        severity: 'error',
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        message: 'Please enter a valid email address',
        severity: 'error',
      };
    }

    return { isValid: true, severity: 'info' };
  }

  /**
   * Validate URL
   * @param url - URL string
   * @returns Validation result
   */
  static validateUrl(url: string): FieldValidationResult {
    if (!url || url.trim().length === 0) {
      return { isValid: true, severity: 'info' }; // URLs are typically optional
    }

    try {
      new URL(url);
      return { isValid: true, severity: 'info' };
    } catch {
      return {
        isValid: false,
        message: 'Please enter a valid URL',
        severity: 'error',
      };
    }
  }

  /**
   * Validate phone number
   * @param phone - Phone number
   * @returns Validation result
   */
  static validatePhoneNumber(phone: string): FieldValidationResult {
    if (!phone || phone.trim().length === 0) {
      return { isValid: true, severity: 'info' }; // Phone numbers are typically optional
    }

    // Basic phone number validation (international format)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    if (!phoneRegex.test(cleanPhone)) {
      return {
        isValid: false,
        message: 'Please enter a valid phone number',
        severity: 'error',
      };
    }

    return { isValid: true, severity: 'info' };
  }

  /**
   * Validate batch of items with progress callback
   * @param items - Items to validate
   * @param validator - Validation function
   * @param onProgress - Progress callback
   * @returns Batch validation results
   */
  static async validateBatch<T>(
    items: T[],
    validator: (item: T) => ValidationResult | Promise<ValidationResult>,
    onProgress?: (progress: number, current: T, result: ValidationResult) => void
  ): Promise<{
    results: Array<{ item: T; validation: ValidationResult }>;
    summary: {
      total: number;
      valid: number;
      invalid: number;
      warnings: number;
    };
  }> {
    const results: Array<{ item: T; validation: ValidationResult }> = [];
    let valid = 0;
    let invalid = 0;
    let warnings = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const validation = await validator(item);
      
      results.push({ item, validation });

      if (validation.isValid) {
        valid++;
      } else {
        invalid++;
      }

      if (validation.warnings.length > 0) {
        warnings++;
      }

      if (onProgress) {
        onProgress((i + 1) / items.length, item, validation);
      }
    }

    return {
      results,
      summary: {
        total: items.length,
        valid,
        invalid,
        warnings,
      },
    };
  }
}