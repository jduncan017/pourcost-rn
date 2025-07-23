import React from 'react';
import { View, Text } from 'react-native';
import CurrencyDisplay from './CurrencyDisplay';

export interface HighlightBoxProps {
  label: string;
  value: number | string;
  currency?: string;
  type?: 'currency' | 'percentage' | 'text';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  color?: 'success' | 'warning' | 'danger' | 'neutral';
}

export default function HighlightBox({
  label,
  value,
  currency = 'USD',
  type = 'currency',
  size = 'large',
  className = '',
}: HighlightBoxProps) {
  const renderValue = () => {
    if (type === 'currency' && typeof value === 'number') {
      return (
        <CurrencyDisplay
          amount={value}
          currency={currency}
          size={size}
          color="primary"
          weight="bold"
        />
      );
    }
    
    if (type === 'percentage' && typeof value === 'number') {
      return (
        <Text
          className="text-lg text-p2 dark:text-n1"
          style={{ fontWeight: '700' }}
        >
          {value.toFixed(1)}%
        </Text>
      );
    }
    
    return (
      <Text
        className="text-lg text-p2 dark:text-n1"
        style={{ fontWeight: '700' }}
      >
        {value}
      </Text>
    );
  };

  return (
    <View className={`bg-p1/20 px-3 py-2 rounded-lg border border-p1/40 flex flex-column items-center justify-center ${className}`}>
      <Text
        className="text-xs text-p2 dark:text-n1 mb-1"
        style={{ fontWeight: '500' }}
      >
        {label}
      </Text>
      {renderValue()}
    </View>
  );
}