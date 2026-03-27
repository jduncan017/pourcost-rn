import React from 'react';
import { View, Pressable, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform } from 'react-native';
import {
  useThemeColors,
  useIsDarkMode,
  palette,
} from '@/src/contexts/ThemeContext';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: 'none' | 'small' | 'medium' | 'large';
  className?: string;
  displayClasses?: string;
}

export default function Card({
  children,
  onPress,
  padding = 'medium',
  className = '',
  displayClasses = '',
  ...viewProps
}: CardProps) {
  const colors = useThemeColors();
  const isDark = useIsDarkMode();

  const getPaddingClass = (): string => {
    switch (padding) {
      case 'none':
        return '';
      case 'small':
        return 'p-3';
      case 'medium':
        return 'p-4';
      case 'large':
        return 'p-6';
      default:
        return 'p-4';
    }
  };

  // Dark: blue-tinted gradient. Light: no gradient (clean white)
  const gradientColors = isDark
    ? ([palette.B5 + '30', palette.B7 + '40'] as const)
    : (['transparent', 'transparent'] as const);

  const shadowStyle =
    !isDark && Platform.OS !== 'web'
      ? {
          shadowColor: '#1a2a4a',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }
      : {};

  const cardContent = (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 12 }}
    >
      <View className={`${getPaddingClass()} ${displayClasses}`}>
        {children}
      </View>
    </LinearGradient>
  );

  const cardStyle = {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden' as const,
    ...shadowStyle,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={cardStyle}
        className={`${className}`}
        {...viewProps}
      >
        {cardContent}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} className={className} {...viewProps}>
      {cardContent}
    </View>
  );
}
