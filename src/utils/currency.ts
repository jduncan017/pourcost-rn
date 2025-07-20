/**
 * Currency utility functions
 */

export const getCurrencySymbol = (currencyCode: string): string => {
  const symbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '¥',
  };
  
  return symbols[currencyCode] || '$';
};

export const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toFixed(2)}`;
};