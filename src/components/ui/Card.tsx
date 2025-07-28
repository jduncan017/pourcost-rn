import React from 'react';
import { View, Pressable, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/src/contexts/ThemeContext';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'gradient' | 'custom';
  padding?: 'none' | 'small' | 'medium' | 'large';
  className?: string;
  displayClasses?: string;
}

export default function Card({
  children,
  onPress,
  variant = 'gradient',
  padding = 'medium', // Default to none for gradient
  className = '',
  displayClasses = '',
  ...viewProps
}: CardProps) {
  const { colors } = useThemeColors();
  const getVariantClass = (): string => {
    switch (variant) {
      case 'custom':
        return ''; // No default styles, use className for full customization
      case 'gradient':
      default:
        return 'border border-g1/50 dark:border-p1/50 rounded-xl overflow-hidden shadow-4'; // No background, handled by LinearGradient
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

  const baseClassName = `rounded-lg ${className} ${getVariantClass()} ${variant === 'gradient' || !variant ? '' : getPaddingClass()}`;

  // Define gradient colors for the gradient variant with opacity
  const gradientColors = [`${colors.p1}50`, `${colors.p3}50`] as const;

  // Default behavior is gradient, only render non-gradient for ghost and custom variants
  if (variant === 'gradient' || !variant) {
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
            <View
              className={`CardContent ${getPaddingClass()} ${displayClasses}`}
            >
              {children}
            </View>
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
          <View
            className={`CardContent ${getPaddingClass()} ${displayClasses}`}
          >
            {children}
          </View>
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
