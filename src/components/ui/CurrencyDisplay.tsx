import React from 'react';
import { Text, TextProps } from 'react-native';
import { getCurrencySymbol } from '@/src/constants/currencies';

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
    return getCurrencySymbol(currency);
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
      case 'primary': return 'text-p2';
      case 'success': return 'text-s22';
      case 'warning': return 'text-amber-600';
      case 'error': return 'text-e3';
      case 'gray': return 'text-g3';
      case 'white': return 'text-white';
      default: return 'text-g3';
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