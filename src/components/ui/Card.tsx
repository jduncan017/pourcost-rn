import React from 'react';
import { View, Pressable, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/src/contexts/ThemeContext';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost' | 'gradient';
  padding?: 'none' | 'small' | 'medium' | 'large';
  className?: string;
}

export default function Card({
  children,
  onPress,
  variant = 'default',
  padding = 'medium', // Default to none for gradient
  className = '',
  ...viewProps
}: CardProps) {
  const { colors } = useThemeColors();
  const getVariantClass = (): string => {
    switch (variant) {
      case 'elevated':
        return 'bg-g2/15 dark:bg-p1/15 backdrop-blur-sm border border-g1/50 dark:border-p3/40 shadow-sm';
      case 'outlined':
        return 'bg-g2/15 dark:bg-p1/15 backdrop-blur-sm border-2 border-g2/50 dark:border-p3/40';
      case 'ghost':
        return 'bg-transparent dark:bg-transparent';
      case 'gradient':
        return 'border border-g1/50 dark:border-p1/20 rounded-xl overflow-hidden shadow-4'; // No background, handled by LinearGradient
      default:
        return 'bg-g2/15 dark:bg-p1/15 backdrop-blur-sm border border-g1/50 dark:border-p3/40';
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

  const baseClassName = `rounded-lg ${getVariantClass()} ${variant === 'gradient' ? '' : getPaddingClass()} ${className}`;

  // Define gradient colors for the gradient variant with opacity
  const gradientColors = [`${colors.p1}50`, `${colors.p3}50`] as const; // 80% and 90% opacity

  if (variant === 'gradient') {
    if (onPress) {
      return (
        <Pressable
          onPress={onPress}
          className={`${baseClassName} active:opacity-70`}
          {...viewProps}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-1"
          >
            <View className={getPaddingClass()}>{children}</View>
          </LinearGradient>
        </Pressable>
      );
    }

    return (
      <View className={baseClassName} {...viewProps}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-lg flex-1"
        >
          <View className={getPaddingClass()}>{children}</View>
        </LinearGradient>
      </View>
    );
  }

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
    className={`bg-p1/20 dark:bg-n1/15 backdrop-blur-sm border-p1/40 dark:border-n1/30 ${className}`}
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

export const GradientCard = ({
  children,
  onPress,
  className = '',
}: Pick<CardProps, 'children' | 'onPress' | 'className'>) => (
  <Card
    variant="gradient"
    padding="medium" // Explicit padding for GradientCard
    onPress={onPress}
    className={className}
  >
    {children}
  </Card>
);
