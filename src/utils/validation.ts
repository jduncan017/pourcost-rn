/**
 * Form validation utilities
 * Centralized validation logic for forms throughout the app
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate ingredient form data
 */
export const validateIngredient = (data: {
  name: string;
  bottleSize: number;
  bottlePrice: number;
  retailPrice: number;
}): ValidationResult => {
  const errors: string[] = [];

  // Name validation
  if (!data.name?.trim()) {
    errors.push('Ingredient name is required');
  } else if (data.name.trim().length < 2) {
    errors.push('Ingredient name must be at least 2 characters');
  } else if (data.name.trim().length > 100) {
    errors.push('Ingredient name must be less than 100 characters');
  }

  // Bottle size validation
  if (!data.bottleSize || data.bottleSize <= 0) {
    errors.push('Bottle size must be greater than 0');
  } else if (data.bottleSize > 10000) {
    errors.push('Bottle size seems unusually large (max 10L)');
  }

  // Bottle price validation
  if (!data.bottlePrice || data.bottlePrice <= 0) {
    errors.push('Bottle price must be greater than 0');
  } else if (data.bottlePrice > 10000) {
    errors.push('Bottle price seems unusually high (max $10,000)');
  }

  // Retail price validation
  if (!data.retailPrice || data.retailPrice <= 0) {
    errors.push('Retail price must be greater than 0');
  } else if (data.retailPrice > 1000) {
    errors.push('Retail price seems unusually high (max $1,000)');
  }

  // Business logic validation
  const costPer15oz = (data.bottlePrice / (data.bottleSize / 29.5735)) * 1.5;
  if (data.retailPrice < costPer15oz) {
    errors.push('Retail price is lower than cost - you would lose money');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate cocktail form data
 */
export const validateCocktail = (data: {
  name: string;
  ingredients: Array<{ name: string; amount: number }>;
  prepTime?: number;
}): ValidationResult => {
  const errors: string[] = [];

  // Name validation
  if (!data.name?.trim()) {
    errors.push('Cocktail name is required');
  } else if (data.name.trim().length < 2) {
    errors.push('Cocktail name must be at least 2 characters');
  } else if (data.name.trim().length > 100) {
    errors.push('Cocktail name must be less than 100 characters');
  }

  // Ingredients validation
  if (!data.ingredients || data.ingredients.length === 0) {
    errors.push('At least one ingredient is required');
  } else {
    data.ingredients.forEach((ingredient, index) => {
      if (!ingredient.name?.trim()) {
        errors.push(`Ingredient ${index + 1} name is required`);
      }
      if (!ingredient.amount || ingredient.amount <= 0) {
        errors.push(`Ingredient ${index + 1} amount must be greater than 0`);
      } else if (ingredient.amount > 16) {
        errors.push(`Ingredient ${index + 1} amount seems unusually large (max 16oz)`);
      }
    });
  }

  // Prep time validation
  if (data.prepTime !== undefined) {
    if (data.prepTime < 0) {
      errors.push('Prep time cannot be negative');
    } else if (data.prepTime > 60) {
      errors.push('Prep time seems unusually long (max 60 minutes)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (US)
 */
export const validatePhoneUS = (phone: string): boolean => {
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phone);
};

/**
 * Validate pour cost percentage
 */
export const validatePourCost = (pourCost: number): ValidationResult => {
  const errors: string[] = [];

  if (pourCost < 1) {
    errors.push('Pour cost percentage must be at least 1%');
  } else if (pourCost > 100) {
    errors.push('Pour cost percentage cannot exceed 100%');
  } else if (pourCost > 50) {
    errors.push('Pour cost percentage above 50% may indicate pricing issues');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate numerical input within range
 */
export const validateNumber = (
  value: number, 
  min: number, 
  max: number, 
  fieldName: string
): ValidationResult => {
  const errors: string[] = [];

  if (isNaN(value)) {
    errors.push(`${fieldName} must be a valid number`);
  } else if (value < min) {
    errors.push(`${fieldName} must be at least ${min}`);
  } else if (value > max) {
    errors.push(`${fieldName} must be no more than ${max}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize text input (trim whitespace, remove special characters if needed)
 */
export const sanitizeText = (text: string, allowSpecialChars: boolean = true): string => {
  let sanitized = text.trim();
  
  if (!allowSpecialChars) {
    // Remove special characters except spaces, hyphens, and apostrophes
    sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-']/g, '');
  }
  
  return sanitized;
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors: string[]): string => {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  
  return errors.map((error, index) => `${index + 1}. ${error}`).join('\n');
};