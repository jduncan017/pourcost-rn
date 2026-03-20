/**
 * Configuration system for ingredient types
 * Defines type-specific behavior, UI options, and calculation rules
 */

import { 
  FlexibleIngredientType, 
  CreateRetailConfigData 
} from '@/src/types/flexible-models';
import { 
  ContainerOption, 
  PourOption, 
  MeasurementUnit,
  getContainerOptionsForType,
  getPourOptionsForType,
  convertToMl
} from '@/src/utils/measurement-utils';

// Calculation formula types
export type CalculationFormula = 'volume_based' | 'unit_based' | 'custom';

// Special features for ingredient types
export type SpecialFeature = 
  | 'fractional_display'
  | 'keg_calculations'
  | 'wine_pours'
  | 'batch_costing'
  | 'unit_quantities'
  | 'custom_units';

// Main ingredient type configuration
export interface IngredientTypeConfig {
  type: FlexibleIngredientType;
  displayName: string;
  description: string;
  icon: string; // Ionicons name
  
  // Container options
  containerOptions: ContainerOption[];
  defaultContainerIndex: number;
  
  // Pour options
  pourOptions: PourOption[];
  defaultPourIndex: number;
  
  // Measurement settings
  measurementUnits: MeasurementUnit[];
  allowsCustomUnits: boolean;
  primaryUnit: MeasurementUnit; // For display preference
  
  // Calculation settings
  calculationFormula: CalculationFormula;
  specialFeatures: SpecialFeature[];
  
  // Default retail configurations
  defaultRetailConfigs: CreateRetailConfigData[];
  
  // UI customization
  colors: {
    primary: string;
    background: string;
    accent: string;
  };
  
  // Validation rules
  validation: {
    minContainerSize: number; // in ml
    maxContainerSize: number; // in ml
    minRetailPrice: number;
    maxRetailPrice: number;
    requiredFields: string[];
  };
  
  // Help text and examples
  helpText: {
    containerHelp: string;
    pourHelp: string;
    costingHelp: string;
    examples: string[];
  };
}

// Spirit configuration
const SPIRIT_CONFIG: IngredientTypeConfig = {
  type: 'Spirit',
  displayName: 'Spirits',
  description: 'Vodka, whiskey, rum, gin, and other distilled spirits',
  icon: 'wine',
  
  containerOptions: getContainerOptionsForType('spirit'),
  defaultContainerIndex: 1, // 750ml standard bottle
  
  pourOptions: getPourOptionsForType('spirit'),
  defaultPourIndex: 2, // 1.5oz pour
  
  measurementUnits: ['ml', 'oz'],
  allowsCustomUnits: false,
  primaryUnit: 'oz',
  
  calculationFormula: 'volume_based',
  specialFeatures: ['fractional_display'],
  
  defaultRetailConfigs: [
    {
      pourSize: { value: 1, unit: 'oz', displayName: '1 oz' },
      retailPrice: 8.0,
      displayName: 'Well Pour (1oz)',
      description: 'Standard well drink pour'
    },
    {
      pourSize: { value: 1.5, unit: 'oz', displayName: '1.5 oz' },
      retailPrice: 12.0,
      displayName: 'Call Pour (1.5oz)',
      description: 'Standard call drink pour',
      isDefault: true
    },
    {
      pourSize: { value: 2, unit: 'oz', displayName: '2 oz' },
      retailPrice: 16.0,
      displayName: 'Premium Pour (2oz)',
      description: 'Premium or neat pour'
    }
  ],
  
  colors: {
    primary: '#8B5CF6', // purple
    background: '#F3F4F6',
    accent: '#A855F7'
  },
  
  validation: {
    minContainerSize: 100, // 100ml mini bottles
    maxContainerSize: 3000, // 3L bottles
    minRetailPrice: 3.0,
    maxRetailPrice: 100.0,
    requiredFields: ['name', 'containerSize', 'containerCost']
  },
  
  helpText: {
    containerHelp: 'Standard bottle sizes from 375ml to 1.75L. Most common is 750ml.',
    pourHelp: 'Fractional ounce pours from 1/2 oz to 2+ oz. Industry standard is 1.5oz.',
    costingHelp: 'Calculate per-ounce cost from bottle price, then multiply by pour size.',
    examples: [
      'Tito\'s Vodka 750ml - $25 → $1.31/oz → $1.97 for 1.5oz pour',
      'Premium whiskey 750ml - $45 → $2.37/oz → $3.55 for 1.5oz pour'
    ]
  }
};

// Beer configuration
const BEER_CONFIG: IngredientTypeConfig = {
  type: 'Beer',
  displayName: 'Beer',
  description: 'Cans, bottles, kegs, and beer packages',
  icon: 'beer',
  
  containerOptions: getContainerOptionsForType('beer'),
  defaultContainerIndex: 7, // Half barrel keg
  
  pourOptions: getPourOptionsForType('beer'),
  defaultPourIndex: 2, // 16oz pint
  
  measurementUnits: ['ml', 'oz', 'unit'],
  allowsCustomUnits: true,
  primaryUnit: 'oz',
  
  calculationFormula: 'volume_based',
  specialFeatures: ['keg_calculations', 'unit_quantities'],
  
  defaultRetailConfigs: [
    {
      pourSize: { value: 355, unit: 'ml', displayName: 'Can (12oz)' },
      retailPrice: 4.0,
      displayName: 'Can',
      description: 'Single can serving'
    },
    {
      pourSize: { value: convertToMl(16, 'oz'), unit: 'ml', displayName: 'Pint (16oz)' },
      retailPrice: 6.0,
      displayName: 'Pint (16oz)',
      description: 'Standard pint pour',
      isDefault: true
    },
    {
      pourSize: { value: convertToMl(20, 'oz'), unit: 'ml', displayName: 'Imperial Pint (20oz)' },
      retailPrice: 7.0,
      displayName: 'Imperial Pint (20oz)',
      description: 'Large pint pour'
    }
  ],
  
  colors: {
    primary: '#F59E0B', // amber
    background: '#FEF3C7',
    accent: '#D97706'
  },
  
  validation: {
    minContainerSize: 330, // Small bottle
    maxContainerSize: 60000, // Large keg
    minRetailPrice: 2.0,
    maxRetailPrice: 50.0,
    requiredFields: ['name', 'containerSize', 'containerCost']
  },
  
  helpText: {
    containerHelp: 'Individual cans, 6-packs, 12-packs, 24-packs, or kegs of various sizes.',
    pourHelp: 'Serving sizes from 12oz cans to 20oz imperial pints.',
    costingHelp: 'Divide package cost by servings, or calculate draft cost per ounce.',
    examples: [
      '24-pack cans - $18 → $0.75 per can',
      'Half barrel keg - $120 → $0.097 per oz → $1.55 for 16oz pint'
    ]
  }
};

// Wine configuration
const WINE_CONFIG: IngredientTypeConfig = {
  type: 'Wine',
  displayName: 'Wine',
  description: 'Wine bottles from splits to magnums',
  icon: 'wine-glass',
  
  containerOptions: getContainerOptionsForType('wine'),
  defaultContainerIndex: 2, // 750ml standard bottle
  
  pourOptions: getPourOptionsForType('wine'),
  defaultPourIndex: 1, // 5oz glass
  
  measurementUnits: ['ml', 'oz'],
  allowsCustomUnits: false,
  primaryUnit: 'oz',
  
  calculationFormula: 'volume_based',
  specialFeatures: ['wine_pours'],
  
  defaultRetailConfigs: [
    {
      pourSize: { value: convertToMl(5, 'oz'), unit: 'ml', displayName: '5oz Glass' },
      retailPrice: 8.0,
      displayName: '5oz Glass',
      description: 'Standard wine glass',
      isDefault: true
    },
    {
      pourSize: { value: convertToMl(6, 'oz'), unit: 'ml', displayName: '6oz Generous' },
      retailPrice: 10.0,
      displayName: '6oz Pour',
      description: 'Generous wine pour'
    },
    {
      pourSize: { value: convertToMl(9, 'oz'), unit: 'ml', displayName: '9oz Large' },
      retailPrice: 14.0,
      displayName: '9oz Large',
      description: 'Large wine pour'
    },
    {
      pourSize: { value: 750, unit: 'ml', displayName: 'Bottle' },
      retailPrice: 32.0,
      displayName: 'Full Bottle',
      description: 'Entire bottle'
    }
  ],
  
  colors: {
    primary: '#DC2626', // red
    background: '#FEE2E2',
    accent: '#EF4444'
  },
  
  validation: {
    minContainerSize: 187, // Split bottle
    maxContainerSize: 3000, // Large format bottles
    minRetailPrice: 4.0,
    maxRetailPrice: 200.0,
    requiredFields: ['name', 'containerSize', 'containerCost']
  },
  
  helpText: {
    containerHelp: 'Wine bottles from 187ml splits to 1.5L magnums. Standard is 750ml.',
    pourHelp: 'Wine pours from 3oz tastings to 9oz large pours, plus full bottles.',
    costingHelp: 'Calculate per-ounce cost from bottle price, multiply by pour size.',
    examples: [
      'House wine 750ml - $16 → $0.67/oz → $3.35 for 5oz glass',
      'Premium wine 750ml - $40 → $1.67/oz → $8.35 for 5oz glass'
    ]
  }
};

// Prepped configuration
const PREPPED_CONFIG: IngredientTypeConfig = {
  type: 'Prepped',
  displayName: 'House-Made',
  description: 'Syrups, bitters, and other house-prepared ingredients',
  icon: 'flask',
  
  containerOptions: getContainerOptionsForType('prepped'),
  defaultContainerIndex: 1, // 750ml bottle
  
  pourOptions: getPourOptionsForType('prepped'),
  defaultPourIndex: 2, // 1oz
  
  measurementUnits: ['ml', 'oz'],
  allowsCustomUnits: false,
  primaryUnit: 'oz',
  
  calculationFormula: 'volume_based',
  specialFeatures: ['batch_costing', 'fractional_display'],
  
  defaultRetailConfigs: [
    {
      pourSize: { value: convertToMl(0.5, 'oz'), unit: 'ml', displayName: '1/2 oz' },
      retailPrice: 0, // Often not for sale
      displayName: '1/2 oz Recipe',
      description: 'Small recipe amount',
      isDefault: true
    },
    {
      pourSize: { value: convertToMl(1, 'oz'), unit: 'ml', displayName: '1 oz' },
      retailPrice: 0,
      displayName: '1 oz Recipe',
      description: 'Standard recipe amount'
    }
  ],
  
  colors: {
    primary: '#059669', // emerald
    background: '#D1FAE5',
    accent: '#10B981'
  },
  
  validation: {
    minContainerSize: 100, // Small batch
    maxContainerSize: 2000, // Large batch
    minRetailPrice: 0, // Can be not for sale
    maxRetailPrice: 20.0,
    requiredFields: ['name', 'containerSize', 'containerCost']
  },
  
  helpText: {
    containerHelp: 'Batch containers from 500ml to 1L. Consider ingredient costs and time.',
    pourHelp: 'Small recipe amounts from 1/4 oz to 2 oz. Often not sold individually.',
    costingHelp: 'Include ingredient costs, time, and overhead in batch cost calculation.',
    examples: [
      'Simple syrup 750ml batch - $3 ingredients → $0.13/oz → $0.065 for 1/2oz',
      'House bitters 500ml batch - $15 ingredients → $0.90/oz → $0.45 for 1/2oz'
    ]
  }
};

// Other configuration
const OTHER_CONFIG: IngredientTypeConfig = {
  type: 'Other',
  displayName: 'Other',
  description: 'Garnishes, specialty items, and flexible ingredients',
  icon: 'ellipsis-horizontal',
  
  containerOptions: getContainerOptionsForType('other'),
  defaultContainerIndex: 3, // 1 unit
  
  pourOptions: [
    { value: 1, displayName: '1 unit', unit: 'unit' },
    { value: 0.5, displayName: '1/2 unit', unit: 'unit' },
    { value: 0.25, displayName: '1/4 unit', unit: 'unit' },
    { value: 0.125, displayName: '1/8 unit', unit: 'unit' },
    { value: convertToMl(0.5, 'oz'), displayName: '1/2 oz', unit: 'oz' },
    { value: convertToMl(1, 'oz'), displayName: '1 oz', unit: 'oz' },
  ],
  defaultPourIndex: 0, // 1 unit
  
  measurementUnits: ['ml', 'oz', 'g', 'kg', 'unit', 'custom'],
  allowsCustomUnits: true,
  primaryUnit: 'unit',
  
  calculationFormula: 'custom',
  specialFeatures: ['custom_units', 'unit_quantities'],
  
  defaultRetailConfigs: [
    {
      pourSize: { value: 1, unit: 'unit', displayName: '1 unit' },
      retailPrice: 0.50,
      displayName: 'Single Use',
      description: 'One unit usage',
      isDefault: true
    }
  ],
  
  colors: {
    primary: '#6B7280', // gray
    background: '#F9FAFB',
    accent: '#9CA3AF'
  },
  
  validation: {
    minContainerSize: 0.1, // Very flexible
    maxContainerSize: 10000, // Very flexible
    minRetailPrice: 0,
    maxRetailPrice: 1000.0,
    requiredFields: ['name', 'containerSize', 'containerCost']
  },
  
  helpText: {
    containerHelp: 'Completely flexible - can be weight, volume, units, or custom measurements.',
    pourHelp: 'Define your own usage amounts - pieces, portions, custom quantities.',
    costingHelp: 'Flexible calculation based on your container and usage definitions.',
    examples: [
      '1 lemon = $0.50 → 1 wheel = 1/8 lemon = $0.0625',
      '1 bunch mint = $2.00 → 6 leaves = 0.1 bunch = $0.20',
      '500g olives = $8.00 → 3 olives = 15g = $0.24'
    ]
  }
};

// Configuration registry
export const INGREDIENT_TYPE_CONFIGS: Record<FlexibleIngredientType, IngredientTypeConfig> = {
  Spirit: SPIRIT_CONFIG,
  Beer: BEER_CONFIG,
  Wine: WINE_CONFIG,
  Prepped: PREPPED_CONFIG,
  Other: OTHER_CONFIG,
};

// Helper functions
export function getConfigForType(type: FlexibleIngredientType): IngredientTypeConfig {
  return INGREDIENT_TYPE_CONFIGS[type];
}

export function getAllConfigs(): IngredientTypeConfig[] {
  return Object.values(INGREDIENT_TYPE_CONFIGS);
}

export function getConfigByDisplayName(displayName: string): IngredientTypeConfig | undefined {
  return getAllConfigs().find(config => config.displayName === displayName);
}

export function getDefaultContainerForType(type: FlexibleIngredientType): ContainerOption {
  const config = getConfigForType(type);
  return config.containerOptions[config.defaultContainerIndex];
}

export function getDefaultPourForType(type: FlexibleIngredientType): PourOption {
  const config = getConfigForType(type);
  return config.pourOptions[config.defaultPourIndex];
}

export function validateIngredientForType(
  type: FlexibleIngredientType,
  data: any
): { isValid: boolean; errors: string[] } {
  const config = getConfigForType(type);
  const errors: string[] = [];

  // Check required fields
  for (const field of config.validation.requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`${field} is required`);
    }
  }

  // Validate container size
  if (data.containerSize) {
    const containerMl = typeof data.containerSize === 'object' 
      ? convertToMl(data.containerSize.value, data.containerSize.unit)
      : data.containerSize;
    
    if (containerMl < config.validation.minContainerSize) {
      errors.push(`Container size must be at least ${config.validation.minContainerSize}ml`);
    }
    if (containerMl > config.validation.maxContainerSize) {
      errors.push(`Container size must be no more than ${config.validation.maxContainerSize}ml`);
    }
  }

  // Validate retail price
  if (data.retailPrice !== undefined && data.retailPrice !== null) {
    if (data.retailPrice < config.validation.minRetailPrice) {
      errors.push(`Retail price must be at least $${config.validation.minRetailPrice}`);
    }
    if (data.retailPrice > config.validation.maxRetailPrice) {
      errors.push(`Retail price must be no more than $${config.validation.maxRetailPrice}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// UI utility functions
export function getIngredientTypeIcon(type: FlexibleIngredientType): string {
  return getConfigForType(type).icon;
}

export function getIngredientTypeColor(type: FlexibleIngredientType): string {
  return getConfigForType(type).colors.primary;
}

export function getIngredientTypeOptions(): Array<{ value: FlexibleIngredientType; label: string; icon: string }> {
  return getAllConfigs().map(config => ({
    value: config.type,
    label: config.displayName,
    icon: config.icon,
  }));
}