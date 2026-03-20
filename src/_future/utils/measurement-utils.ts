/**
 * Flexible measurement system utilities for PourCost-RN
 * Based on iOS Volume.swift implementation with support for fractional ounces,
 * named measurements, unit quantities, and flexible unit conversions
 */

// Base measurement units
export type MeasurementUnit = 'ml' | 'oz' | 'L' | 'gal' | 'qt' | 'pt' | 'cup' | 'g' | 'kg' | 'unit' | 'custom';

// Volume conversion constants (all to ml)
export const VOLUME_CONVERSIONS: Record<string, number> = {
  ml: 1,
  oz: 29.5735,
  L: 1000,
  gal: 3785.41,
  qt: 946.353,
  pt: 473.176,
  cup: 236.588,
  // Mass conversions (approx for water-like density)
  g: 1,
  kg: 1000,
  // Special units
  unit: 1,
  custom: 1,
} as const;

// Fractional ounce definitions (iOS Volume.swift inspired)
export const FRACTIONAL_OUNCES = [
  { value: 0.125, display: '1/8 oz', decimal: 0.125 },
  { value: 0.25, display: '1/4 oz', decimal: 0.25 },
  { value: 0.5, display: '1/2 oz', decimal: 0.5 },
  { value: 0.75, display: '3/4 oz', decimal: 0.75 },
  { value: 1, display: '1 oz', decimal: 1.0 },
  { value: 1.5, display: '1.5 oz', decimal: 1.5 },
  { value: 2, display: '2 oz', decimal: 2.0 },
  { value: 2.5, display: '2.5 oz', decimal: 2.5 },
  { value: 3, display: '3 oz', decimal: 3.0 },
] as const;

// Named measurements (iOS Volume.swift inspired)
export const NAMED_MEASUREMENTS = [
  { name: 'drop', value: 0.00169, unit: 'oz', displayName: 'Drop' },
  { name: 'dash', value: 0.01691, unit: 'oz', displayName: 'Dash' },
  { name: 'bar_spoon', value: 0.16907, unit: 'oz', displayName: 'Bar Spoon' },
  { name: 'splash', value: 0.25, unit: 'oz', displayName: 'Splash' },
  { name: 'rinse', value: 0.125, unit: 'oz', displayName: 'Rinse' },
] as const;

// Container size definitions by type
export interface ContainerOption {
  value: number; // Always in ml for storage
  displayName: string;
  unit: MeasurementUnit;
  commonSizes?: boolean; // If true, show in common sizes
}

export interface PourOption {
  value: number; // Always in ml for storage
  displayName: string;
  unit: MeasurementUnit;
  fractionalDisplay?: string; // For US fractional display
}

// Measurement value with flexible units
export interface FlexibleMeasurement {
  value: number;
  unit: MeasurementUnit;
  displayName?: string; // For custom units
  customUnit?: string; // For "1 lemon", "6 leaves", etc.
}

// Convert any measurement to ml (storage format)
export function convertToMl(value: number, unit: MeasurementUnit): number {
  const conversionFactor = VOLUME_CONVERSIONS[unit];
  if (!conversionFactor) {
    throw new Error(`Unknown unit: ${unit}`);
  }
  return value * conversionFactor;
}

// Convert ml to any unit
export function convertFromMl(valueInMl: number, targetUnit: MeasurementUnit): number {
  const conversionFactor = VOLUME_CONVERSIONS[targetUnit];
  if (!conversionFactor) {
    throw new Error(`Unknown unit: ${targetUnit}`);
  }
  return valueInMl / conversionFactor;
}

// Format measurement for display with appropriate precision
export function formatMeasurement(
  value: number,
  unit: MeasurementUnit,
  displaySystem: 'US' | 'Metric' = 'US',
  customUnit?: string
): string {
  if (customUnit) {
    return `${value} ${customUnit}`;
  }

  // Handle fractional ounces for US system
  if (unit === 'oz' && displaySystem === 'US') {
    const fractional = FRACTIONAL_OUNCES.find(f => Math.abs(f.value - value) < 0.01);
    if (fractional) {
      return fractional.display;
    }
  }

  // Handle named measurements
  const namedMeasurement = NAMED_MEASUREMENTS.find(m => 
    m.unit === unit && Math.abs(m.value - value) < 0.001
  );
  if (namedMeasurement) {
    return namedMeasurement.displayName;
  }

  // Standard formatting
  let precision = 0;
  if (unit === 'oz') {
    precision = value < 1 ? 3 : value < 10 ? 2 : 1;
  } else if (unit === 'ml') {
    precision = value < 100 ? 1 : 0;
  } else if (unit === 'g') {
    precision = value < 100 ? 1 : 0;
  } else {
    precision = value < 1 ? 3 : value < 10 ? 2 : 1;
  }

  return `${value.toFixed(precision)} ${unit}`;
}

// Get display measurement based on user preference and context
export function getDisplayMeasurement(
  valueInMl: number,
  preferredSystem: 'US' | 'Metric',
  context: 'container' | 'pour' | 'recipe' = 'pour'
): FlexibleMeasurement {
  if (preferredSystem === 'US') {
    // US users see oz for pours, ml for large containers
    if (context === 'pour' || valueInMl < 500) {
      const ozValue = convertFromMl(valueInMl, 'oz');
      return {
        value: ozValue,
        unit: 'oz',
        displayName: formatMeasurement(ozValue, 'oz', 'US')
      };
    } else {
      // Large containers show ml with oz equivalent
      return {
        value: valueInMl,
        unit: 'ml',
        displayName: `${Math.round(valueInMl)}ml (${convertFromMl(valueInMl, 'oz').toFixed(1)}oz)`
      };
    }
  } else {
    // Metric users see ml for everything
    return {
      value: valueInMl,
      unit: 'ml',
      displayName: formatMeasurement(valueInMl, 'ml', 'Metric')
    };
  }
}

// Parse user input to flexible measurement
export function parseMeasurementInput(input: string): FlexibleMeasurement | null {
  // Clean the input
  const cleanInput = input.trim().toLowerCase();
  
  // Check for fractional ounces
  const fractionalMatch = FRACTIONAL_OUNCES.find(f => 
    cleanInput.includes(f.display.toLowerCase()) || 
    cleanInput.includes(f.value.toString())
  );
  if (fractionalMatch) {
    return {
      value: fractionalMatch.value,
      unit: 'oz',
      displayName: fractionalMatch.display
    };
  }

  // Check for named measurements
  const namedMatch = NAMED_MEASUREMENTS.find(m => 
    cleanInput.includes(m.name.replace('_', ' ')) ||
    cleanInput.includes(m.displayName.toLowerCase())
  );
  if (namedMatch) {
    return {
      value: namedMatch.value,
      unit: namedMatch.unit as MeasurementUnit,
      displayName: namedMatch.displayName
    };
  }

  // Parse standard format: "number unit"
  const match = cleanInput.match(/^(\d*\.?\d+)\s*([a-z]+)$/);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2] as MeasurementUnit;
    
    if (VOLUME_CONVERSIONS[unit]) {
      return {
        value,
        unit,
        displayName: formatMeasurement(value, unit)
      };
    }
  }

  return null;
}

// Calculate cost per unit based on flexible measurements
export function calculateFlexibleCost(
  containerSize: FlexibleMeasurement,
  containerCost: number,
  pourSize: FlexibleMeasurement
): number {
  // Convert both to ml for calculation
  const containerMl = convertToMl(containerSize.value, containerSize.unit);
  const pourMl = convertToMl(pourSize.value, pourSize.unit);
  
  // Handle unit-based calculations (like "1 lemon" costs)
  if (containerSize.unit === 'unit' || pourSize.unit === 'unit') {
    // For unit-based items, calculate directly
    if (containerSize.unit === 'unit' && pourSize.unit === 'unit') {
      return (containerCost / containerSize.value) * pourSize.value;
    }
    // Mixed unit/volume calculations need special handling
    throw new Error('Mixed unit/volume calculations require custom logic');
  }
  
  return (containerCost / containerMl) * pourMl;
}

// Get appropriate pour options for ingredient type
export function getPourOptionsForType(type: string): PourOption[] {
  switch (type.toLowerCase()) {
    case 'spirit':
      return [
        { value: convertToMl(0.5, 'oz'), displayName: '1/2 oz', unit: 'oz', fractionalDisplay: '1/2 oz' },
        { value: convertToMl(1, 'oz'), displayName: '1 oz', unit: 'oz', fractionalDisplay: '1 oz' },
        { value: convertToMl(1.5, 'oz'), displayName: '1.5 oz', unit: 'oz', fractionalDisplay: '1.5 oz' },
        { value: convertToMl(2, 'oz'), displayName: '2 oz', unit: 'oz', fractionalDisplay: '2 oz' },
      ];
    
    case 'beer':
      return [
        { value: 355, displayName: 'Can (12oz)', unit: 'ml' },
        { value: convertToMl(12, 'oz'), displayName: '12oz', unit: 'oz' },
        { value: convertToMl(16, 'oz'), displayName: 'Pint (16oz)', unit: 'oz' },
        { value: convertToMl(20, 'oz'), displayName: 'Imperial Pint (20oz)', unit: 'oz' },
      ];
    
    case 'wine':
      return [
        { value: convertToMl(3, 'oz'), displayName: '3oz Tasting', unit: 'oz' },
        { value: convertToMl(5, 'oz'), displayName: '5oz Glass', unit: 'oz' },
        { value: convertToMl(6, 'oz'), displayName: '6oz Generous', unit: 'oz' },
        { value: convertToMl(9, 'oz'), displayName: '9oz Large', unit: 'oz' },
        { value: 750, displayName: 'Bottle', unit: 'ml' },
      ];
    
    case 'prepped':
      return [
        { value: convertToMl(0.25, 'oz'), displayName: '1/4 oz', unit: 'oz', fractionalDisplay: '1/4 oz' },
        { value: convertToMl(0.5, 'oz'), displayName: '1/2 oz', unit: 'oz', fractionalDisplay: '1/2 oz' },
        { value: convertToMl(1, 'oz'), displayName: '1 oz', unit: 'oz', fractionalDisplay: '1 oz' },
        { value: convertToMl(2, 'oz'), displayName: '2 oz', unit: 'oz', fractionalDisplay: '2 oz' },
      ];
    
    default:
      return [
        { value: convertToMl(0.5, 'oz'), displayName: '1/2 oz', unit: 'oz' },
        { value: convertToMl(1, 'oz'), displayName: '1 oz', unit: 'oz' },
        { value: convertToMl(1.5, 'oz'), displayName: '1.5 oz', unit: 'oz' },
        { value: 30, displayName: '30ml', unit: 'ml' },
        { value: 50, displayName: '50ml', unit: 'ml' },
      ];
  }
}

// Get appropriate container options for ingredient type
export function getContainerOptionsForType(type: string): ContainerOption[] {
  switch (type.toLowerCase()) {
    case 'spirit':
      return [
        { value: 375, displayName: '375ml (Half Bottle)', unit: 'ml', commonSizes: true },
        { value: 750, displayName: '750ml (Standard)', unit: 'ml', commonSizes: true },
        { value: 1000, displayName: '1L', unit: 'ml', commonSizes: true },
        { value: 1750, displayName: '1.75L (Handle)', unit: 'ml', commonSizes: true },
      ];
    
    case 'beer':
      return [
        { value: 355, displayName: '355ml Can', unit: 'ml', commonSizes: true },
        { value: 355 * 6, displayName: '6-Pack', unit: 'ml', commonSizes: true },
        { value: 355 * 12, displayName: '12-Pack', unit: 'ml', commonSizes: true },
        { value: 355 * 24, displayName: '24-Pack', unit: 'ml', commonSizes: true },
        { value: convertToMl(640, 'oz'), displayName: 'Corny Keg (5 gal)', unit: 'ml' },
        { value: convertToMl(660, 'oz'), displayName: 'Sixth Barrel', unit: 'ml' },
        { value: convertToMl(992, 'oz'), displayName: 'Quarter Barrel', unit: 'ml' },
        { value: convertToMl(1984, 'oz'), displayName: 'Half Barrel (15.5 gal)', unit: 'ml' },
      ];
    
    case 'wine':
      return [
        { value: 187, displayName: '187ml Split', unit: 'ml', commonSizes: true },
        { value: 375, displayName: '375ml Half Bottle', unit: 'ml', commonSizes: true },
        { value: 750, displayName: '750ml Standard', unit: 'ml', commonSizes: true },
        { value: 1500, displayName: '1.5L Magnum', unit: 'ml', commonSizes: true },
      ];
    
    case 'prepped':
      return [
        { value: 500, displayName: '500ml Batch', unit: 'ml', commonSizes: true },
        { value: 750, displayName: '750ml Bottle', unit: 'ml', commonSizes: true },
        { value: 1000, displayName: '1L Batch', unit: 'ml', commonSizes: true },
      ];
    
    case 'other':
      return [
        { value: 100, displayName: '100g', unit: 'g', commonSizes: true },
        { value: 500, displayName: '500g', unit: 'g', commonSizes: true },
        { value: 1000, displayName: '1kg', unit: 'kg', commonSizes: true },
        { value: 1, displayName: '1 unit', unit: 'unit', commonSizes: true },
        { value: 1, displayName: 'Custom', unit: 'custom', commonSizes: true },
      ];
    
    default:
      return [
        { value: 750, displayName: '750ml', unit: 'ml', commonSizes: true },
        { value: 1000, displayName: '1L', unit: 'ml', commonSizes: true },
      ];
  }
}