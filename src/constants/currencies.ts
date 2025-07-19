/**
 * Comprehensive currency symbols matching original PourCost iOS app
 * Based on Fixer.io API symbols used in the original app
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
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

/**
 * Get currency symbol for a given currency code
 */
export const getCurrencySymbol = (currency: string): string => {
  return CURRENCY_SYMBOLS[currency] || currency + ' ';
};

/**
 * List of supported currency codes
 */
export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_SYMBOLS);

/**
 * Major currencies commonly used in the app
 */
export const MAJOR_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'] as const;