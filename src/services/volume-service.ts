/**
 * Volume Conversion Service for PourCost-RN
 * Handles all volume unit conversions between metric and US units
 * Provides standardized conversion functions for recipes and ingredients
 */

export type VolumeUnit = 'oz' | 'ml' | 'L' | 'gal' | 'qt' | 'pt' | 'cup' | 'tbsp' | 'tsp' | 'drops' | 'splash';

export interface VolumeConversion {
  value: number;
  unit: VolumeUnit;
}

export interface ConversionResult {
  value: number;
  unit: VolumeUnit;
  formattedValue: string;
}

// Base conversion rates to ml (milliliters)
const VOLUME_TO_ML_CONVERSION = {
  ml: 1,
  L: 1000,
  oz: 29.5735, // US fluid ounce
  cup: 236.588,
  pt: 473.176, // US pint
  qt: 946.353, // US quart  
  gal: 3785.41, // US gallon
  tbsp: 14.7868, // US tablespoon
  tsp: 4.92892, // US teaspoon
  drops: 0.05, // Approximate - 1 drop ≈ 0.05ml
  splash: 5, // Bartending term - approximately 1 tsp
} as const;

/**
 * Volume conversion service class
 */
export class VolumeService {
  
  // ==========================================
  // CORE CONVERSION FUNCTIONS
  // ==========================================

  /**
   * Convert any volume unit to milliliters
   * @param value - Volume value
   * @param fromUnit - Source unit
   * @returns Volume in milliliters
   */
  static toMilliliters(value: number, fromUnit: VolumeUnit): number {
    if (value < 0) throw new Error('Volume cannot be negative');
    if (!VOLUME_TO_ML_CONVERSION[fromUnit]) {
      throw new Error(`Unsupported volume unit: ${fromUnit}`);
    }

    return value * VOLUME_TO_ML_CONVERSION[fromUnit];
  }

  /**
   * Convert milliliters to any volume unit
   * @param mlValue - Volume in milliliters
   * @param toUnit - Target unit
   * @returns Volume in target unit
   */
  static fromMilliliters(mlValue: number, toUnit: VolumeUnit): number {
    if (mlValue < 0) throw new Error('Volume cannot be negative');
    if (!VOLUME_TO_ML_CONVERSION[toUnit]) {
      throw new Error(`Unsupported volume unit: ${toUnit}`);
    }

    return mlValue / VOLUME_TO_ML_CONVERSION[toUnit];
  }

  /**
   * Convert between any two volume units
   * @param value - Source value
   * @param fromUnit - Source unit
   * @param toUnit - Target unit
   * @returns Converted value
   */
  static convert(value: number, fromUnit: VolumeUnit, toUnit: VolumeUnit): number {
    if (fromUnit === toUnit) return value;
    
    const mlValue = this.toMilliliters(value, fromUnit);
    return this.fromMilliliters(mlValue, toUnit);
  }

  /**
   * Convert with formatted result
   * @param value - Source value
   * @param fromUnit - Source unit
   * @param toUnit - Target unit
   * @param precision - Decimal places (default 2)
   * @returns Conversion result with formatting
   */
  static convertWithFormat(
    value: number, 
    fromUnit: VolumeUnit, 
    toUnit: VolumeUnit,
    precision: number = 2
  ): ConversionResult {
    const convertedValue = this.convert(value, fromUnit, toUnit);
    const roundedValue = Math.round(convertedValue * Math.pow(10, precision)) / Math.pow(10, precision);

    return {
      value: roundedValue,
      unit: toUnit,
      formattedValue: this.formatVolume(roundedValue, toUnit),
    };
  }

  // ==========================================
  // MEASUREMENT SYSTEM CONVERSIONS
  // ==========================================

  /**
   * Convert volume based on measurement system preference
   * @param value - Volume value
   * @param fromUnit - Source unit
   * @param measurementSystem - Target system (US or Metric)
   * @returns Best unit for the measurement system
   */
  static convertToPreferredSystem(
    value: number, 
    fromUnit: VolumeUnit, 
    measurementSystem: 'US' | 'Metric'
  ): ConversionResult {
    const mlValue = this.toMilliliters(value, fromUnit);

    if (measurementSystem === 'Metric') {
      // Convert to most appropriate metric unit
      if (mlValue >= 1000) {
        return this.convertWithFormat(value, fromUnit, 'L');
      } else {
        return this.convertWithFormat(value, fromUnit, 'ml');
      }
    } else {
      // Convert to most appropriate US unit
      if (mlValue >= 946.353) { // >= 1 quart
        return this.convertWithFormat(value, fromUnit, 'qt');
      } else if (mlValue >= 236.588) { // >= 1 cup
        return this.convertWithFormat(value, fromUnit, 'cup');
      } else if (mlValue >= 29.5735) { // >= 1 oz
        return this.convertWithFormat(value, fromUnit, 'oz');
      } else if (mlValue >= 14.7868) { // >= 1 tbsp
        return this.convertWithFormat(value, fromUnit, 'tbsp');
      } else {
        return this.convertWithFormat(value, fromUnit, 'tsp');
      }
    }
  }

  /**
   * Get standard bartending unit for measurement system
   * @param measurementSystem - US or Metric
   * @returns Standard unit for bartending
   */
  static getStandardBartendingUnit(measurementSystem: 'US' | 'Metric'): VolumeUnit {
    return measurementSystem === 'Metric' ? 'ml' : 'oz';
  }

  /**
   * Convert to standard bartending measurement
   * @param value - Volume value
   * @param fromUnit - Source unit
   * @param measurementSystem - Target system
   * @returns Converted to standard bartending unit
   */
  static toStandardBartendingUnit(
    value: number, 
    fromUnit: VolumeUnit, 
    measurementSystem: 'US' | 'Metric'
  ): ConversionResult {
    const targetUnit = this.getStandardBartendingUnit(measurementSystem);
    return this.convertWithFormat(value, fromUnit, targetUnit);
  }

  // ==========================================
  // FORMATTING & DISPLAY
  // ==========================================

  /**
   * Format volume value with appropriate precision and unit
   * @param value - Volume value
   * @param unit - Volume unit
   * @param precision - Decimal places (auto-determined if not provided)
   * @returns Formatted string
   */
  static formatVolume(value: number, unit: VolumeUnit, precision?: number): string {
    let actualPrecision = precision;
    
    if (actualPrecision === undefined) {
      // Auto-determine precision based on unit and value
      switch (unit) {
        case 'drops':
          actualPrecision = 0; // Whole drops only
          break;
        case 'tsp':
        case 'tbsp':
          actualPrecision = value < 1 ? 2 : 1;
          break;
        case 'oz':
          actualPrecision = value < 1 ? 2 : 1;
          break;
        case 'ml':
          actualPrecision = value < 10 ? 1 : 0;
          break;
        case 'L':
          actualPrecision = 2;
          break;
        case 'cup':
        case 'pt':
        case 'qt':
        case 'gal':
          actualPrecision = value < 1 ? 2 : 1;
          break;
        case 'splash':
          actualPrecision = 0;
          break;
        default:
          actualPrecision = 2;
      }
    }

    const roundedValue = Math.round(value * Math.pow(10, actualPrecision)) / Math.pow(10, actualPrecision);
    const formattedNumber = actualPrecision === 0 ? 
      roundedValue.toString() : 
      roundedValue.toFixed(actualPrecision).replace(/\.?0+$/, '');
    
    return `${formattedNumber}${this.getUnitAbbreviation(unit)}`;
  }

  /**
   * Get unit abbreviation for display
   * @param unit - Volume unit
   * @returns Abbreviated unit string
   */
  static getUnitAbbreviation(unit: VolumeUnit): string {
    const abbreviations = {
      ml: 'ml',
      L: 'L',
      oz: 'oz',
      cup: ' cup',
      pt: ' pt',
      qt: ' qt',
      gal: ' gal',
      tbsp: ' tbsp',
      tsp: ' tsp',
      drops: ' drops',
      splash: ' splash',
    };

    return abbreviations[unit] || unit;
  }

  /**
   * Get full unit name for display
   * @param unit - Volume unit
   * @param value - Value (for pluralization)
   * @returns Full unit name
   */
  static getUnitName(unit: VolumeUnit, value: number = 1): string {
    const names = {
      ml: 'milliliter',
      L: 'liter',
      oz: 'fluid ounce',
      cup: 'cup',
      pt: 'pint',
      qt: 'quart',
      gal: 'gallon',
      tbsp: 'tablespoon',
      tsp: 'teaspoon',
      drops: 'drop',
      splash: 'splash',
    };

    const baseName = names[unit] || unit;
    
    // Pluralize if needed
    if (Math.abs(value) !== 1) {
      if (unit === 'drops' || unit === 'splash') {
        return baseName + 's';
      } else {
        return baseName + 's';
      }
    }
    
    return baseName;
  }

  // ==========================================
  // VALIDATION & UTILITY
  // ==========================================

  /**
   * Validate if unit is supported
   * @param unit - Unit to validate
   * @returns True if supported
   */
  static isSupportedUnit(unit: string): unit is VolumeUnit {
    return unit in VOLUME_TO_ML_CONVERSION;
  }

  /**
   * Get all supported units for a measurement system
   * @param measurementSystem - US or Metric
   * @returns Array of supported units
   */
  static getSupportedUnits(measurementSystem: 'US' | 'Metric' | 'All' = 'All'): VolumeUnit[] {
    const metricUnits: VolumeUnit[] = ['ml', 'L'];
    const usUnits: VolumeUnit[] = ['oz', 'cup', 'pt', 'qt', 'gal', 'tbsp', 'tsp'];
    const bartendingUnits: VolumeUnit[] = ['drops', 'splash'];

    switch (measurementSystem) {
      case 'Metric':
        return [...metricUnits, ...bartendingUnits];
      case 'US':
        return [...usUnits, ...bartendingUnits];
      case 'All':
      default:
        return [...metricUnits, ...usUnits, ...bartendingUnits];
    }
  }

  /**
   * Get common cocktail measurements
   * @param measurementSystem - US or Metric
   * @returns Common measurements with their values
   */
  static getCommonCocktailMeasurements(measurementSystem: 'US' | 'Metric' = 'US') {
    if (measurementSystem === 'Metric') {
      return [
        { label: '15ml (1/2 oz)', value: 15, unit: 'ml' as VolumeUnit },
        { label: '30ml (1 oz)', value: 30, unit: 'ml' as VolumeUnit },
        { label: '45ml (1.5 oz)', value: 45, unit: 'ml' as VolumeUnit },
        { label: '60ml (2 oz)', value: 60, unit: 'ml' as VolumeUnit },
        { label: '90ml (3 oz)', value: 90, unit: 'ml' as VolumeUnit },
        { label: '120ml (4 oz)', value: 120, unit: 'ml' as VolumeUnit },
      ];
    } else {
      return [
        { label: '0.5oz', value: 0.5, unit: 'oz' as VolumeUnit },
        { label: '0.75oz', value: 0.75, unit: 'oz' as VolumeUnit },
        { label: '1oz', value: 1, unit: 'oz' as VolumeUnit },
        { label: '1.5oz', value: 1.5, unit: 'oz' as VolumeUnit },
        { label: '2oz', value: 2, unit: 'oz' as VolumeUnit },
        { label: '3oz', value: 3, unit: 'oz' as VolumeUnit },
        { label: '4oz', value: 4, unit: 'oz' as VolumeUnit },
        { label: '1 tbsp', value: 1, unit: 'tbsp' as VolumeUnit },
        { label: '1 tsp', value: 1, unit: 'tsp' as VolumeUnit },
        { label: '3-5 drops', value: 4, unit: 'drops' as VolumeUnit },
        { label: '1 splash', value: 1, unit: 'splash' as VolumeUnit },
      ];
    }
  }

  /**
   * Parse volume string (e.g., "1.5oz", "30ml") into value and unit
   * @param volumeString - String to parse
   * @returns Parsed volume or null if invalid
   */
  static parseVolumeString(volumeString: string): VolumeConversion | null {
    const cleaned = volumeString.trim().toLowerCase();
    
    // Common patterns
    const patterns = [
      /^(\d+(?:\.\d+)?)\s*oz$/,
      /^(\d+(?:\.\d+)?)\s*ml$/,
      /^(\d+(?:\.\d+)?)\s*l$/,
      /^(\d+(?:\.\d+)?)\s*cup$/,
      /^(\d+(?:\.\d+)?)\s*cups$/,
      /^(\d+(?:\.\d+)?)\s*tbsp$/,
      /^(\d+(?:\.\d+)?)\s*tsp$/,
      /^(\d+(?:\.\d+)?)\s*drops?$/,
      /^(\d+(?:\.\d+)?)\s*splash(?:es)?$/,
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        let unit: VolumeUnit;
        
        if (cleaned.includes('oz')) unit = 'oz';
        else if (cleaned.includes('ml')) unit = 'ml';
        else if (cleaned.includes('l')) unit = 'L';
        else if (cleaned.includes('cup')) unit = 'cup';
        else if (cleaned.includes('tbsp')) unit = 'tbsp';
        else if (cleaned.includes('tsp')) unit = 'tsp';
        else if (cleaned.includes('drop')) unit = 'drops';
        else if (cleaned.includes('splash')) unit = 'splash';
        else continue;

        return { value, unit };
      }
    }

    return null;
  }
}