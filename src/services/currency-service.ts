/**
 * Currency Service for PourCost-RN
 * Handles currency formatting, symbols, conversion rates, and localization
 * Provides standardized currency operations across the app
 */

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  symbolPosition: 'before' | 'after';
}

export interface ConversionRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  lastUpdated: Date;
}

export interface FormattedCurrency {
  value: number;
  formatted: string;
  symbol: string;
  code: string;
}

// Common currencies with their information
const CURRENCY_INFO: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2, symbolPosition: 'before' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2, symbolPosition: 'after' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2, symbolPosition: 'before' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2, symbolPosition: 'before' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2, symbolPosition: 'before' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0, symbolPosition: 'before' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimals: 2, symbolPosition: 'before' },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', decimals: 2, symbolPosition: 'after' },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', decimals: 2, symbolPosition: 'after' },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone', decimals: 2, symbolPosition: 'after' },
  PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Złoty', decimals: 2, symbolPosition: 'after' },
  CZK: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', decimals: 2, symbolPosition: 'after' },
  HUF: { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', decimals: 0, symbolPosition: 'after' },
  RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', decimals: 2, symbolPosition: 'after' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimals: 2, symbolPosition: 'before' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2, symbolPosition: 'before' },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimals: 0, symbolPosition: 'before' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimals: 2, symbolPosition: 'before' },
  MXN: { code: 'MXN', symbol: '$', name: 'Mexican Peso', decimals: 2, symbolPosition: 'before' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', decimals: 2, symbolPosition: 'before' },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', decimals: 2, symbolPosition: 'before' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2, symbolPosition: 'before' },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', decimals: 2, symbolPosition: 'before' },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', decimals: 2, symbolPosition: 'before' },
  ILS: { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', decimals: 2, symbolPosition: 'before' },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', decimals: 2, symbolPosition: 'before' },
} as const;

/**
 * Currency service class
 */
export class CurrencyService {
  
  // ==========================================
  // CURRENCY INFORMATION
  // ==========================================

  /**
   * Get currency information by code
   * @param currencyCode - Currency code (e.g., 'USD')
   * @returns Currency information or null if not found
   */
  static getCurrencyInfo(currencyCode: string): CurrencyInfo | null {
    const code = currencyCode.toUpperCase();
    return CURRENCY_INFO[code] || null;
  }

  /**
   * Get currency symbol by code
   * @param currencyCode - Currency code
   * @returns Currency symbol or currency code if not found
   */
  static getCurrencySymbol(currencyCode: string): string {
    const info = this.getCurrencyInfo(currencyCode);
    return info?.symbol || currencyCode;
  }

  /**
   * Get all supported currencies
   * @returns Array of currency information
   */
  static getSupportedCurrencies(): CurrencyInfo[] {
    return Object.values(CURRENCY_INFO);
  }

  /**
   * Get popular currencies for quick selection
   * @returns Array of popular currency codes
   */
  static getPopularCurrencies(): string[] {
    return ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF'];
  }

  /**
   * Check if currency code is supported
   * @param currencyCode - Currency code to check
   * @returns True if supported
   */
  static isSupportedCurrency(currencyCode: string): boolean {
    return currencyCode.toUpperCase() in CURRENCY_INFO;
  }

  // ==========================================
  // FORMATTING FUNCTIONS
  // ==========================================

  /**
   * Format currency value with proper symbol and positioning
   * @param value - Numeric value
   * @param currencyCode - Currency code
   * @param options - Formatting options
   * @returns Formatted currency string
   */
  static formatCurrency(
    value: number,
    currencyCode: string = 'USD',
    options: {
      showSymbol?: boolean;
      precision?: number;
      locale?: string;
      compact?: boolean;
    } = {}
  ): string {
    const {
      showSymbol = true,
      precision,
      locale = 'en-US',
      compact = false
    } = options;

    const currencyInfo = this.getCurrencyInfo(currencyCode);
    const decimals = precision !== undefined ? precision : (currencyInfo?.decimals || 2);
    
    // Handle compact formatting for large numbers
    if (compact && Math.abs(value) >= 1000) {
      return this.formatCompactCurrency(value, currencyCode, { showSymbol, locale });
    }

    // Round to specified decimal places
    const roundedValue = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    
    if (!showSymbol) {
      return roundedValue.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }

    // Use Intl.NumberFormat for proper localization
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode.toUpperCase(),
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(roundedValue);
    } catch (error) {
      // Fallback to manual formatting if currency not supported by Intl
      const symbol = this.getCurrencySymbol(currencyCode);
      const formattedNumber = roundedValue.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

      if (currencyInfo?.symbolPosition === 'after') {
        return `${formattedNumber}${symbol}`;
      } else {
        return `${symbol}${formattedNumber}`;
      }
    }
  }

  /**
   * Format currency in compact notation (K, M, B)
   * @param value - Numeric value
   * @param currencyCode - Currency code
   * @param options - Formatting options
   * @returns Compact formatted currency
   */
  static formatCompactCurrency(
    value: number,
    currencyCode: string = 'USD',
    options: {
      showSymbol?: boolean;
      locale?: string;
    } = {}
  ): string {
    const { showSymbol = true, locale = 'en-US' } = options;
    
    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: showSymbol ? 'currency' : 'decimal',
        currency: showSymbol ? currencyCode.toUpperCase() : undefined,
        notation: 'compact',
        compactDisplay: 'short',
      });
      
      return formatter.format(value);
    } catch (error) {
      // Manual compact formatting fallback
      const absValue = Math.abs(value);
      let compactValue: number;
      let suffix: string;

      if (absValue >= 1e9) {
        compactValue = value / 1e9;
        suffix = 'B';
      } else if (absValue >= 1e6) {
        compactValue = value / 1e6;
        suffix = 'M';
      } else if (absValue >= 1e3) {
        compactValue = value / 1e3;
        suffix = 'K';
      } else {
        return this.formatCurrency(value, currencyCode, { showSymbol, locale });
      }

      const formattedCompact = compactValue.toFixed(1).replace(/\.0$/, '') + suffix;
      
      if (!showSymbol) {
        return formattedCompact;
      }

      const symbol = this.getCurrencySymbol(currencyCode);
      const currencyInfo = this.getCurrencyInfo(currencyCode);
      
      if (currencyInfo?.symbolPosition === 'after') {
        return `${formattedCompact}${symbol}`;
      } else {
        return `${symbol}${formattedCompact}`;
      }
    }
  }

  /**
   * Format currency range (e.g., "$5 - $10")
   * @param minValue - Minimum value
   * @param maxValue - Maximum value
   * @param currencyCode - Currency code
   * @param options - Formatting options
   * @returns Formatted range string
   */
  static formatCurrencyRange(
    minValue: number,
    maxValue: number,
    currencyCode: string = 'USD',
    options: {
      locale?: string;
      precision?: number;
      compact?: boolean;
    } = {}
  ): string {
    const minFormatted = this.formatCurrency(minValue, currencyCode, options);
    const maxFormatted = this.formatCurrency(maxValue, currencyCode, options);
    
    return `${minFormatted} - ${maxFormatted}`;
  }

  /**
   * Format percentage with currency context
   * @param percentage - Percentage value
   * @param decimals - Decimal places (default 1)
   * @returns Formatted percentage
   */
  static formatPercentage(percentage: number, decimals: number = 1): string {
    return `${percentage.toFixed(decimals)}%`;
  }

  // ==========================================
  // CONVERSION UTILITIES
  // ==========================================

  /**
   * Convert amount between currencies (mock implementation)
   * In production, this would fetch real-time rates from an API
   * @param amount - Amount to convert
   * @param fromCurrency - Source currency
   * @param toCurrency - Target currency
   * @param rate - Exchange rate (optional, uses mock rate if not provided)
   * @returns Converted amount
   */
  static convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rate?: number
  ): number {
    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
      return amount;
    }

    // Mock conversion rates (in production, fetch from API)
    const mockRates: Record<string, number> = {
      'USD-EUR': 0.85,
      'USD-GBP': 0.73,
      'USD-CAD': 1.25,
      'USD-AUD': 1.35,
      'USD-JPY': 110,
      'EUR-USD': 1.18,
      'GBP-USD': 1.37,
      'CAD-USD': 0.80,
      'AUD-USD': 0.74,
      'JPY-USD': 0.009,
    };

    const rateKey = `${fromCurrency.toUpperCase()}-${toCurrency.toUpperCase()}`;
    const conversionRate = rate || mockRates[rateKey] || 1;

    return amount * conversionRate;
  }

  /**
   * Get formatted currency with conversion
   * @param amount - Amount to convert and format
   * @param fromCurrency - Source currency
   * @param toCurrency - Target currency
   * @param rate - Exchange rate (optional)
   * @returns Formatted converted currency
   */
  static convertAndFormat(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rate?: number
  ): FormattedCurrency {
    const convertedAmount = this.convertCurrency(amount, fromCurrency, toCurrency, rate);
    const formatted = this.formatCurrency(convertedAmount, toCurrency);
    const symbol = this.getCurrencySymbol(toCurrency);

    return {
      value: convertedAmount,
      formatted,
      symbol,
      code: toCurrency.toUpperCase(),
    };
  }

  // ==========================================
  // VALIDATION & PARSING
  // ==========================================

  /**
   * Parse currency string to numeric value
   * @param currencyString - String like "$12.34" or "12.34 USD"
   * @returns Parsed value and currency code
   */
  static parseCurrencyString(currencyString: string): {
    value: number;
    currency: string;
  } | null {
    const cleaned = currencyString.trim();
    
    // Pattern for symbol-prefixed amounts (e.g., "$12.34", "€15.50")
    const symbolPatterns = Object.entries(CURRENCY_INFO).map(([code, info]) => ({
      code,
      pattern: new RegExp(`^\\${info.symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\d,]+(?:\\.\\d{1,2})?)$`)
    }));

    for (const { code, pattern } of symbolPatterns) {
      const match = cleaned.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(value)) {
          return { value, currency: code };
        }
      }
    }

    // Pattern for amounts with currency codes (e.g., "12.34 USD", "15.50EUR")
    const codePattern = /^([\d,]+(?:\.\d{1,2})?)\s*([A-Z]{3})$/;
    const codeMatch = cleaned.toUpperCase().match(codePattern);
    if (codeMatch) {
      const value = parseFloat(codeMatch[1].replace(/,/g, ''));
      const currency = codeMatch[2];
      if (!isNaN(value) && this.isSupportedCurrency(currency)) {
        return { value, currency };
      }
    }

    // Pattern for plain numbers (assume USD)
    const numberPattern = /^([\d,]+(?:\.\d{1,2})?)$/;
    const numberMatch = cleaned.match(numberPattern);
    if (numberMatch) {
      const value = parseFloat(numberMatch[1].replace(/,/g, ''));
      if (!isNaN(value)) {
        return { value, currency: 'USD' };
      }
    }

    return null;
  }

  /**
   * Validate currency code
   * @param currencyCode - Currency code to validate
   * @returns True if valid
   */
  static isValidCurrencyCode(currencyCode: string): boolean {
    return /^[A-Z]{3}$/.test(currencyCode) && this.isSupportedCurrency(currencyCode);
  }

  /**
   * Validate currency amount
   * @param amount - Amount to validate
   * @param currencyCode - Currency code
   * @returns Validation result
   */
  static validateCurrencyAmount(amount: number, currencyCode: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (isNaN(amount)) {
      errors.push('Amount must be a valid number');
    } else if (amount < 0) {
      errors.push('Amount cannot be negative');
    } else if (amount > 999999999) {
      errors.push('Amount is too large');
    }

    if (!this.isValidCurrencyCode(currencyCode)) {
      errors.push('Invalid currency code');
    }

    const currencyInfo = this.getCurrencyInfo(currencyCode);
    if (currencyInfo && currencyInfo.decimals === 0 && amount % 1 !== 0) {
      errors.push(`${currencyInfo.name} does not support decimal places`);
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
   * Get currencies grouped by region
   * @returns Currencies grouped by geographical region
   */
  static getCurrenciesByRegion(): Record<string, CurrencyInfo[]> {
    const regions = {
      'North America': ['USD', 'CAD', 'MXN'],
      'Europe': ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF'],
      'Asia Pacific': ['JPY', 'CNY', 'KRW', 'INR', 'THB', 'SGD', 'HKD', 'AUD', 'NZD'],
      'Other': ['BRL', 'ZAR', 'RUB', 'ILS', 'TRY'],
    };

    const result: Record<string, CurrencyInfo[]> = {};
    
    for (const [region, codes] of Object.entries(regions)) {
      result[region] = codes
        .map(code => this.getCurrencyInfo(code))
        .filter((info): info is CurrencyInfo => info !== null);
    }

    return result;
  }

  /**
   * Get appropriate decimal places for calculations
   * @param currencyCode - Currency code
   * @returns Number of decimal places for calculations
   */
  static getCalculationPrecision(currencyCode: string): number {
    const info = this.getCurrencyInfo(currencyCode);
    return info?.decimals || 2;
  }

  /**
   * Round amount to currency-appropriate precision
   * @param amount - Amount to round
   * @param currencyCode - Currency code
   * @returns Rounded amount
   */
  static roundToCurrencyPrecision(amount: number, currencyCode: string): number {
    const precision = this.getCalculationPrecision(currencyCode);
    return Math.round(amount * Math.pow(10, precision)) / Math.pow(10, precision);
  }
}