/**
 * Measurement Service for PourCost-RN
 * Manages measurement system configurations, locale-based settings,
 * and provides unified measurement operations across the app
 */

import { VolumeService, VolumeUnit } from './volume-service';
import { CurrencyService } from './currency-service';

export type MeasurementSystem = 'US' | 'Metric';

export interface MeasurementConfig {
  system: MeasurementSystem;
  primaryVolumeUnit: VolumeUnit;
  secondaryVolumeUnit: VolumeUnit;
  smallVolumeUnit: VolumeUnit;
  bottleSizeUnit: VolumeUnit;
  temperatureUnit: 'F' | 'C';
  weightUnit: 'lbs' | 'kg';
  distanceUnit: 'miles' | 'km';
}

export interface LocaleConfig {
  locale: string;
  measurementSystem: MeasurementSystem;
  currency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  decimalSeparator: string;
  thousandsSeparator: string;
}

export interface BottleSizeOption {
  size: number;
  unit: VolumeUnit;
  label: string;
  common: boolean;
  category: 'Wine' | 'Spirit' | 'Beer' | 'Other';
}

// Predefined measurement configurations
const MEASUREMENT_CONFIGS: Record<MeasurementSystem, MeasurementConfig> = {
  US: {
    system: 'US',
    primaryVolumeUnit: 'oz',
    secondaryVolumeUnit: 'cup',
    smallVolumeUnit: 'tsp',
    bottleSizeUnit: 'ml', // Bottles are often sold in ml even in US
    temperatureUnit: 'F',
    weightUnit: 'lbs',
    distanceUnit: 'miles',
  },
  Metric: {
    system: 'Metric',
    primaryVolumeUnit: 'ml',
    secondaryVolumeUnit: 'L',
    smallVolumeUnit: 'ml',
    bottleSizeUnit: 'ml',
    temperatureUnit: 'C',
    weightUnit: 'kg',
    distanceUnit: 'km',
  },
};

// Common bottle sizes by category and measurement system
const BOTTLE_SIZES: Record<MeasurementSystem, BottleSizeOption[]> = {
  US: [
    // Wine bottles (metric sizes but common in US)
    { size: 187.5, unit: 'ml', label: '187ml (Split)', common: true, category: 'Wine' },
    { size: 375, unit: 'ml', label: '375ml (Half Bottle)', common: true, category: 'Wine' },
    { size: 750, unit: 'ml', label: '750ml (Standard)', common: true, category: 'Wine' },
    { size: 1500, unit: 'ml', label: '1.5L (Magnum)', common: false, category: 'Wine' },
    { size: 3000, unit: 'ml', label: '3L (Double Magnum)', common: false, category: 'Wine' },

    // Spirit bottles
    { size: 50, unit: 'ml', label: '50ml (Airline)', common: false, category: 'Spirit' },
    { size: 100, unit: 'ml', label: '100ml (Miniature)', common: false, category: 'Spirit' },
    { size: 200, unit: 'ml', label: '200ml (Half Pint)', common: false, category: 'Spirit' },
    { size: 375, unit: 'ml', label: '375ml (Pint)', common: true, category: 'Spirit' },
    { size: 500, unit: 'ml', label: '500ml', common: false, category: 'Spirit' },
    { size: 750, unit: 'ml', label: '750ml (Fifth)', common: true, category: 'Spirit' },
    { size: 1000, unit: 'ml', label: '1L (Quart)', common: true, category: 'Spirit' },
    { size: 1750, unit: 'ml', label: '1.75L (Half Gallon)', common: true, category: 'Spirit' },

    // Beer bottles/cans
    { size: 12, unit: 'oz', label: '12oz (Standard)', common: true, category: 'Beer' },
    { size: 16, unit: 'oz', label: '16oz (Pint)', common: true, category: 'Beer' },
    { size: 22, unit: 'oz', label: '22oz (Bomber)', common: true, category: 'Beer' },
    { size: 32, unit: 'oz', label: '32oz (Growler)', common: false, category: 'Beer' },
    { size: 64, unit: 'oz', label: '64oz (Half Gallon)', common: false, category: 'Beer' },
  ],

  Metric: [
    // Wine bottles
    { size: 187.5, unit: 'ml', label: '187ml (Split)', common: true, category: 'Wine' },
    { size: 375, unit: 'ml', label: '375ml (Half Bottle)', common: true, category: 'Wine' },
    { size: 750, unit: 'ml', label: '750ml (Standard)', common: true, category: 'Wine' },
    { size: 1500, unit: 'ml', label: '1.5L (Magnum)', common: false, category: 'Wine' },
    { size: 3000, unit: 'ml', label: '3L (Double Magnum)', common: false, category: 'Wine' },

    // Spirit bottles
    { size: 50, unit: 'ml', label: '50ml (Miniature)', common: false, category: 'Spirit' },
    { size: 100, unit: 'ml', label: '100ml', common: false, category: 'Spirit' },
    { size: 200, unit: 'ml', label: '200ml', common: false, category: 'Spirit' },
    { size: 375, unit: 'ml', label: '375ml', common: true, category: 'Spirit' },
    { size: 500, unit: 'ml', label: '500ml', common: true, category: 'Spirit' },
    { size: 700, unit: 'ml', label: '700ml', common: true, category: 'Spirit' },
    { size: 750, unit: 'ml', label: '750ml', common: true, category: 'Spirit' },
    { size: 1000, unit: 'ml', label: '1L', common: true, category: 'Spirit' },
    { size: 1750, unit: 'ml', label: '1.75L', common: false, category: 'Spirit' },

    // Beer bottles/cans
    { size: 330, unit: 'ml', label: '330ml (Standard)', common: true, category: 'Beer' },
    { size: 355, unit: 'ml', label: '355ml (Can)', common: true, category: 'Beer' },
    { size: 440, unit: 'ml', label: '440ml (Pint Can)', common: true, category: 'Beer' },
    { size: 500, unit: 'ml', label: '500ml (Pint)', common: true, category: 'Beer' },
    { size: 568, unit: 'ml', label: '568ml (Imperial Pint)', common: false, category: 'Beer' },
    { size: 1000, unit: 'ml', label: '1L', common: false, category: 'Beer' },
  ],
};

// Locale-based configurations
const LOCALE_CONFIGS: Record<string, Partial<LocaleConfig>> = {
  'en-US': {
    measurementSystem: 'US',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  'en-GB': {
    measurementSystem: 'Metric',
    currency: 'GBP',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  'en-CA': {
    measurementSystem: 'Metric',
    currency: 'CAD',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  'en-AU': {
    measurementSystem: 'Metric',
    currency: 'AUD',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  'de-DE': {
    measurementSystem: 'Metric',
    currency: 'EUR',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  'fr-FR': {
    measurementSystem: 'Metric',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    decimalSeparator: ',',
    thousandsSeparator: ' ',
  },
  'es-ES': {
    measurementSystem: 'Metric',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  'it-IT': {
    measurementSystem: 'Metric',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  'ja-JP': {
    measurementSystem: 'Metric',
    currency: 'JPY',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: '24h',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  'zh-CN': {
    measurementSystem: 'Metric',
    currency: 'CNY',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: '24h',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
};

/**
 * Measurement service class
 */
export class MeasurementService {
  
  // ==========================================
  // CONFIGURATION MANAGEMENT
  // ==========================================

  /**
   * Get measurement configuration for a system
   * @param system - Measurement system
   * @returns Measurement configuration
   */
  static getMeasurementConfig(system: MeasurementSystem): MeasurementConfig {
    return { ...MEASUREMENT_CONFIGS[system] };
  }

  /**
   * Get locale configuration
   * @param locale - Locale string (e.g., 'en-US')
   * @returns Locale configuration
   */
  static getLocaleConfig(locale: string): LocaleConfig {
    const config = LOCALE_CONFIGS[locale] || LOCALE_CONFIGS['en-US'];
    return {
      locale,
      measurementSystem: 'US',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      decimalSeparator: '.',
      thousandsSeparator: ',',
      ...config,
    };
  }

  /**
   * Detect measurement system from locale
   * @param locale - Locale string
   * @returns Detected measurement system
   */
  static detectMeasurementSystemFromLocale(locale: string): MeasurementSystem {
    const config = this.getLocaleConfig(locale);
    return config.measurementSystem;
  }

  /**
   * Get supported locales
   * @returns Array of supported locale codes
   */
  static getSupportedLocales(): string[] {
    return Object.keys(LOCALE_CONFIGS);
  }

  // ==========================================
  // BOTTLE SIZE MANAGEMENT
  // ==========================================

  /**
   * Get bottle size options for measurement system
   * @param system - Measurement system
   * @param category - Optional category filter
   * @param commonOnly - Show only common sizes
   * @returns Array of bottle size options
   */
  static getBottleSizeOptions(
    system: MeasurementSystem,
    category?: 'Wine' | 'Spirit' | 'Beer' | 'Other',
    commonOnly: boolean = false
  ): BottleSizeOption[] {
    let sizes = [...BOTTLE_SIZES[system]];

    if (category) {
      sizes = sizes.filter(size => size.category === category);
    }

    if (commonOnly) {
      sizes = sizes.filter(size => size.common);
    }

    return sizes;
  }

  /**
   * Get bottle size options grouped by category
   * @param system - Measurement system
   * @param commonOnly - Show only common sizes
   * @returns Bottle sizes grouped by category
   */
  static getBottleSizesByCategory(
    system: MeasurementSystem,
    commonOnly: boolean = false
  ): Record<string, BottleSizeOption[]> {
    const allSizes = this.getBottleSizeOptions(system, undefined, commonOnly);
    const grouped: Record<string, BottleSizeOption[]> = {};

    allSizes.forEach(size => {
      if (!grouped[size.category]) {
        grouped[size.category] = [];
      }
      grouped[size.category].push(size);
    });

    return grouped;
  }

  /**
   * Find closest standard bottle size
   * @param value - Target size value
   * @param unit - Target size unit
   * @param system - Measurement system
   * @returns Closest standard bottle size
   */
  static findClosestBottleSize(
    value: number,
    unit: VolumeUnit,
    system: MeasurementSystem
  ): BottleSizeOption | null {
    const sizes = this.getBottleSizeOptions(system);
    
    // Convert target to ml for comparison
    const targetMl = VolumeService.toMilliliters(value, unit);
    
    let closest: BottleSizeOption | null = null;
    let smallestDiff = Infinity;

    sizes.forEach(size => {
      const sizeMl = VolumeService.toMilliliters(size.size, size.unit);
      const diff = Math.abs(sizeMl - targetMl);
      
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closest = size;
      }
    });

    return closest;
  }

  // ==========================================
  // MEASUREMENT CONVERSION HELPERS
  // ==========================================

  /**
   * Convert volume to measurement system's preferred unit
   * @param value - Volume value
   * @param fromUnit - Source unit
   * @param system - Target measurement system
   * @param useCase - Specific use case for unit selection
   * @returns Converted volume with appropriate unit
   */
  static convertToPreferredUnit(
    value: number,
    fromUnit: VolumeUnit,
    system: MeasurementSystem,
    useCase: 'cocktail' | 'bottle' | 'recipe' = 'cocktail'
  ) {
    const config = this.getMeasurementConfig(system);
    
    let targetUnit: VolumeUnit;
    
    switch (useCase) {
      case 'bottle':
        targetUnit = config.bottleSizeUnit;
        break;
      case 'recipe':
        // Use appropriate unit based on size
        const mlValue = VolumeService.toMilliliters(value, fromUnit);
        if (system === 'US') {
          targetUnit = mlValue < 15 ? 'tsp' : mlValue < 60 ? 'oz' : 'cup';
        } else {
          targetUnit = mlValue < 1000 ? 'ml' : 'L';
        }
        break;
      case 'cocktail':
      default:
        targetUnit = config.primaryVolumeUnit;
        break;
    }

    return VolumeService.convertWithFormat(value, fromUnit, targetUnit);
  }

  /**
   * Format measurement with appropriate precision and unit
   * @param value - Measurement value
   * @param unit - Measurement unit
   * @param system - Measurement system
   * @returns Formatted measurement string
   */
  static formatMeasurement(
    value: number,
    unit: VolumeUnit,
    system: MeasurementSystem
  ): string {
    return VolumeService.formatVolume(value, unit);
  }

  /**
   * Get smart measurement recommendations
   * @param volume - Volume in ml
   * @param system - Measurement system
   * @param context - Context for recommendations
   * @returns Recommended measurements
   */
  static getSmartMeasurementRecommendations(
    volume: number,
    system: MeasurementSystem,
    context: 'ingredient' | 'cocktail' | 'batch'
  ) {
    const config = this.getMeasurementConfig(system);
    const recommendations: Array<{
      value: number;
      unit: VolumeUnit;
      formatted: string;
      precision: 'exact' | 'rounded' | 'approximate';
    }> = [];

    if (system === 'US') {
      // US recommendations
      const ozValue = VolumeService.fromMilliliters(volume, 'oz');
      const tbspValue = VolumeService.fromMilliliters(volume, 'tbsp');
      const tspValue = VolumeService.fromMilliliters(volume, 'tsp');

      if (volume >= 29.5735) { // >= 1 oz
        recommendations.push({
          value: ozValue,
          unit: 'oz',
          formatted: VolumeService.formatVolume(ozValue, 'oz'),
          precision: ozValue % 0.25 === 0 ? 'exact' : 'rounded',
        });
      }

      if (volume >= 14.7868 && volume < 59.1471) { // 1 tbsp to 2 oz
        recommendations.push({
          value: tbspValue,
          unit: 'tbsp',
          formatted: VolumeService.formatVolume(tbspValue, 'tbsp'),
          precision: tbspValue % 0.5 === 0 ? 'exact' : 'rounded',
        });
      }

      if (volume < 29.5735) { // < 1 oz
        recommendations.push({
          value: tspValue,
          unit: 'tsp',
          formatted: VolumeService.formatVolume(tspValue, 'tsp'),
          precision: tspValue % 0.25 === 0 ? 'exact' : 'rounded',
        });
      }
    } else {
      // Metric recommendations
      if (volume >= 1000) {
        const lValue = volume / 1000;
        recommendations.push({
          value: lValue,
          unit: 'L',
          formatted: VolumeService.formatVolume(lValue, 'L'),
          precision: lValue % 0.1 === 0 ? 'exact' : 'rounded',
        });
      }

      recommendations.push({
        value: volume,
        unit: 'ml',
        formatted: VolumeService.formatVolume(volume, 'ml'),
        precision: volume % 1 === 0 ? 'exact' : 'rounded',
      });
    }

    return recommendations;
  }

  // ==========================================
  // VALIDATION & UTILITIES
  // ==========================================

  /**
   * Validate measurement value for system
   * @param value - Measurement value
   * @param unit - Measurement unit
   * @param system - Measurement system
   * @returns Validation result
   */
  static validateMeasurement(
    value: number,
    unit: VolumeUnit,
    system: MeasurementSystem
  ): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let isValid = true;

    // Basic value validation
    if (value <= 0) {
      isValid = false;
      warnings.push('Measurement value must be greater than 0');
    }

    if (value > 10000) {
      warnings.push('Measurement value seems unusually large');
    }

    // Unit appropriateness for system
    const config = this.getMeasurementConfig(system);
    const supportedUnits = VolumeService.getSupportedUnits(system);
    
    if (!supportedUnits.includes(unit)) {
      warnings.push(`${unit} is not commonly used in ${system} system`);
      suggestions.push(`Consider using ${config.primaryVolumeUnit} instead`);
    }

    // Precision warnings
    const mlValue = VolumeService.toMilliliters(value, unit);
    if (mlValue < 1 && unit !== 'drops') {
      warnings.push('Very small measurements may be impractical');
      suggestions.push('Consider using drops for very small amounts');
    }

    return { isValid, warnings, suggestions };
  }

  /**
   * Get measurement system preferences for region
   * @param countryCode - ISO country code
   * @returns Measurement system preference
   */
  static getMeasurementSystemForCountry(countryCode: string): MeasurementSystem {
    // Countries that primarily use US measurements
    const usCountries = ['US', 'LR', 'MM']; // USA, Liberia, Myanmar
    
    return usCountries.includes(countryCode.toUpperCase()) ? 'US' : 'Metric';
  }

  /**
   * Auto-detect locale from device settings (mock implementation)
   * In a real app, this would use device locale detection
   * @returns Detected locale configuration
   */
  static autoDetectLocale(): LocaleConfig {
    // Mock detection - in real app, use:
    // import { getLocales } from 'expo-localization';
    // const deviceLocale = getLocales()[0].languageTag;
    
    const mockDeviceLocale = 'en-US';
    return this.getLocaleConfig(mockDeviceLocale);
  }
}