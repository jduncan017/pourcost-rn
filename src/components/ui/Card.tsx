import React from 'react';
import { View, Pressable, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  padding?: 'none' | 'small' | 'medium' | 'large';
  className?: string;
}

export default function Card({
  children,
  onPress,
  variant = 'default',
  padding = 'medium',
  className = '',
  ...viewProps
}: CardProps) {
  const getVariantClass = (): string => {
    switch (variant) {
      case 'elevated':
        return 'bg-n1/80 backdrop-blur-sm border border-g1/50 shadow-sm';
      case 'outlined':
        return 'bg-n1/80 backdrop-blur-sm border-2 border-g2/50';
      case 'ghost':
        return 'bg-transparent';
      default:
        return 'bg-g1/80 backdrop-blur-sm border border-g1/50';
    }
  };

  const getPaddingClass = (): string => {
    switch (padding) {
      case 'none':
        return '';
      case 'small':
        return 'p-2';
      case 'medium':
        return 'p-4';
      case 'large':
        return 'p-6';
      default:
        return 'p-4';
    }
  };

  const baseClassName = `rounded-lg ${getVariantClass()} ${getPaddingClass()} ${className}`;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`${baseClassName} active:opacity-70`}
        {...viewProps}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={baseClassName} {...viewProps}>
      {children}
    </View>
  );
}

// Convenience components for common card types
export const FeatureCard = ({
  children,
  onPress,
  className = '',
}: Pick<CardProps, 'children' | 'onPress' | 'className'>) => (
  <Card
    variant="elevated"
    padding="large"
    onPress={onPress}
    className={className}
  >
    {children}
  </Card>
);

export const ListCard = ({
  children,
  onPress,
  className = '',
}: Pick<CardProps, 'children' | 'onPress' | 'className'>) => (
  <Card
    variant="default"
    padding="medium"
    onPress={onPress}
    className={`mb-3 ${className}`}
  >
    {children}
  </Card>
);

export const SummaryCard = ({
  children,
  className = '',
}: Pick<CardProps, 'children' | 'className'>) => (
  <Card
    variant="outlined"
    padding="large"
    className={`bg-p1/20 backdrop-blur-sm border-p1/40 ${className}`}
  >
    {children}
  </Card>
);

export const CompactCard = ({
  children,
  onPress,
  className = '',
}: Pick<CardProps, 'children' | 'onPress' | 'className'>) => (
  <Card
    variant="default"
    padding="small"
    onPress={onPress}
    className={className}
  >
    {children}
  </Card>
);
