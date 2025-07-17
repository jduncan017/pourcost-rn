import React from 'react';
import { Text, TextProps } from 'react-native';

interface CurrencyDisplayProps extends Omit<TextProps, 'children'> {
  amount: number;
  currency: string;
  showSymbol?: boolean;
  showCode?: boolean;
  decimalPlaces?: number;
  size?: 'small' | 'medium' | 'large' | 'xl';
  color?: 'primary' | 'success' | 'warning' | 'error' | 'gray' | 'white';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

// Comprehensive currency symbols matching original PourCost iOS app
// Based on Fixer.io API symbols used in the original app
const CURRENCY_SYMBOLS: Record<string, string> = {
  // Major currencies
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF ',
  CNY: '¥',
  
  // European currencies
  SEK: 'kr ',
  NOK: 'kr ',
  DKK: 'kr ',
  PLN: 'zł ',
  CZK: 'Kč ',
  HUF: 'Ft ',
  RON: 'lei ',
  BGN: 'лв ',
  HRK: 'kn ',
  ISK: 'kr ',
  
  // Asian currencies
  INR: '₹',
  KRW: '₩',
  SGD: 'S$',
  HKD: 'HK$',
  TWD: 'NT$',
  THB: '฿',
  MYR: 'RM ',
  IDR: 'Rp ',
  PHP: '₱',
  VND: '₫',
  
  // Middle Eastern currencies
  AED: 'د.إ ',
  SAR: '﷼',
  QAR: '﷼',
  KWD: 'د.ك ',
  BHD: '.د.ب ',
  OMR: '﷼',
  JOD: 'د.ا ',
  LBP: '£',
  SYP: '£',
  IQD: 'ع.د ',
  
  // American currencies
  BRL: 'R$',
  MXN: '$',
  ARS: '$',
  CLP: '$',
  COP: '$',
  PEN: 'S/.',
  UYU: '$U ',
  BOB: 'Bs.',
  PYG: '₲',
  VES: 'Bs.',
  
  // African currencies
  ZAR: 'R',
  EGP: '£',
  NGN: '₦',
  KES: 'KSh ',
  GHS: '₵',
  ETB: 'Br ',
  UGX: 'USh ',
  TZS: 'TSh ',
  ZMW: 'ZK ',
  BWP: 'P ',
  
  // Other notable currencies
  TRY: '₺',
  RUB: '₽',
  UAH: '₴',
  ILS: '₪',
  NZD: 'NZ$',
  
  // Crypto and precious metals (from original app)
  BTC: '₿',
  XAU: 'oz ',
  XAG: 'oz ',
  
  // Pacific currencies
  FJD: 'FJ$',
  PGK: 'K ',
  SBD: 'SI$',
  TOP: 'T$',
  VUV: 'VT ',
  WST: 'WS$',
  
  // Additional world currencies
  AFN: '؋',
  ALL: 'L ',
  AMD: '֏',
  AOA: 'Kz ',
  AZN: '₼',
  BAM: 'КМ ',
  BDT: '৳',
  BIF: 'FBu ',
  BND: 'B$',
  BSD: 'B$',
  BTN: 'Nu.',
  BYN: 'Br ',
  BZD: 'BZ$',
  CDF: 'FC ',
  CRC: '₡',
  CUP: '₱',
  CVE: '$',
  DJF: 'Fdj ',
  DOP: 'RD$',
  DZD: 'دج ',
  ERN: 'Nfk ',
  GEL: '₾',
  GGP: '£',
  GIP: '£',
  GMD: 'D ',
  GNF: 'FG ',
  GTQ: 'Q ',
  GYD: 'G$ ',
  HNL: 'L ',
  HTG: 'G ',
  IMP: '£',
  IRR: '﷼',
  JEP: '£',
  JMD: 'J$',
  KGS: 'лв ',
  KHR: '៛',
  KMF: 'CF ',
  KPW: '₩',
  KZT: '₸',
  LAK: '₭',
  LKR: '₨',
  LRD: 'L$',
  LSL: 'M ',
  LYD: 'ل.د ',
  MAD: 'د.م. ',
  MDL: 'lei ',
  MGA: 'Ar ',
  MKD: 'ден ',
  MMK: 'K ',
  MNT: '₮',
  MOP: 'MOP$',
  MRU: 'UM ',
  MUR: '₨',
  MVR: '.ރ ',
  MWK: 'MK ',
  MZN: 'MT ',
  NAD: 'N$',
  NIO: 'C$',
  NPR: '₨',
  PAB: 'B/.',
  PKR: '₨',
  RSD: 'дин. ',
  RWF: 'RF ',
  SCR: '₨',
  SDG: 'ج.س.',
  SHP: '£',
  SLE: 'Le ',
  SOS: 'S ',
  SRD: '$',
  STN: 'Db ',
  SZL: 'E ',
  TJS: 'SM ',
  TMT: 'T ',
  TND: 'د.ت ',
  TTD: 'TT$',
  TVD: 'TV$',
  UZS: 'лв ',
  XCD: 'EC$',
  XOF: 'CFA ',
  XPF: '₣',
  YER: '﷼',
  ZWL: 'Z$',
};

export default function CurrencyDisplay({
  amount,
  currency,
  showSymbol = true,
  showCode = false,
  decimalPlaces = 2,
  size = 'medium',
  color = 'gray',
  weight = 'normal',
  className = '',
  ...textProps
}: CurrencyDisplayProps) {
  const formatAmount = (value: number): string => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  };

  const getSymbol = (): string => {
    return CURRENCY_SYMBOLS[currency] || currency + ' ';
  };

  const getSizeClass = (): string => {
    switch (size) {
      case 'small': return 'text-sm';
      case 'medium': return 'text-base';
      case 'large': return 'text-lg';
      case 'xl': return 'text-xl';
      default: return 'text-base';
    }
  };

  const getColorClass = (): string => {
    switch (color) {
      case 'primary': return 'text-primary-600';
      case 'success': return 'text-green-600';
      case 'warning': return 'text-amber-600';
      case 'error': return 'text-red-600';
      case 'gray': return 'text-gray-600';
      case 'white': return 'text-white';
      default: return 'text-gray-600';
    }
  };

  const getWeightClass = (): string => {
    switch (weight) {
      case 'normal': return 'font-normal';
      case 'medium': return 'font-medium';
      case 'semibold': return 'font-semibold';
      case 'bold': return 'font-bold';
      default: return 'font-normal';
    }
  };

  const displayText = `${showSymbol ? getSymbol() : ''}${formatAmount(amount)}${showCode ? ` ${currency}` : ''}`;

  return (
    <Text
      className={`${getSizeClass()} ${getColorClass()} ${getWeightClass()} ${className}`}
      {...textProps}
    >
      {displayText}
    </Text>
  );
}

// Convenience components for common use cases
export const PrimaryCurrency = (props: Omit<CurrencyDisplayProps, 'color'>) => (
  <CurrencyDisplay {...props} color="primary" />
);

export const SuccessCurrency = (props: Omit<CurrencyDisplayProps, 'color'>) => (
  <CurrencyDisplay {...props} color="success" />
);

export const ErrorCurrency = (props: Omit<CurrencyDisplayProps, 'color'>) => (
  <CurrencyDisplay {...props} color="error" />
);

export const LargeCurrency = (props: Omit<CurrencyDisplayProps, 'size'>) => (
  <CurrencyDisplay {...props} size="large" />
);

export const BoldCurrency = (props: Omit<CurrencyDisplayProps, 'weight'>) => (
  <CurrencyDisplay {...props} weight="bold" />
);