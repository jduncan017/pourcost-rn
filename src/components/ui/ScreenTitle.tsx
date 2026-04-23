import React from 'react';
import { Text, TextStyle } from 'react-native';
import { useThemeColors } from '@/src/contexts/ThemeContext';

interface ScreenTitleProps {
  title: string;
  variant?: 'main' | 'section' | 'page' | 'group' | 'muted';
  className?: string;
  style?: TextStyle;
}

export default function ScreenTitle({
  title,
  variant = 'main',
  className = '',
  style,
}: ScreenTitleProps) {
  const colors = useThemeColors();

  const getStylesForVariant = () => {
    switch (variant) {
      case 'main':
        return {
          textClassName: 'text-2xl',
          fontWeight: '700' as const,
          color: colors.text,
        };
      case 'section':
        return {
          textClassName: 'text-lg',
          fontWeight: '600' as const,
          color: colors.text,
        };
      case 'page':
        return {
          textClassName: 'text-2xl tracking-wide',
          fontWeight: '500' as const,
          color: colors.text,
        };
      case 'group':
        return {
          textClassName: 'text-sm tracking-widest uppercase',
          fontWeight: '600' as const,
          color: colors.gold,
        };
      case 'muted':
        return {
          textClassName: 'text-xs tracking-widest uppercase',
          fontWeight: '600' as const,
          color: colors.textTertiary,
        };
      default:
        return {
          textClassName: 'text-2xl',
          fontWeight: '700' as const,
          color: colors.text,
        };
    }
  };

  const { textClassName, fontWeight, color } = getStylesForVariant();

  return (
    <Text
      className={`${textClassName} ${className}`}
      style={{
        fontWeight,
        color,
        ...style,
      }}
    >
      {title}
    </Text>
  );
}
