import React from 'react';
import { Text, TextStyle } from 'react-native';

interface ScreenTitleProps {
  title: string;
  variant?: 'main' | 'section' | 'page';
  className?: string;
  style?: TextStyle;
}

export default function ScreenTitle({
  title,
  variant = 'main',
  className = '',
  style,
}: ScreenTitleProps) {
  const getStylesForVariant = () => {
    switch (variant) {
      case 'main':
        return {
          textClassName: 'text-2xl text-g4 dark:text-n1',
          fontWeight: '700' as const,
        };
      case 'section':
        return {
          textClassName: 'text-lg text-g4 dark:text-n1',
          fontWeight: '600' as const,
        };
      case 'page':
        return {
          textClassName: 'text-2xl tracking-wide text-g4 dark:text-n1',
          fontWeight: '500' as const,
        };
      default:
        return {
          textClassName: 'text-2xl text-g4 dark:text-n1',
          fontWeight: '700' as const,
        };
    }
  };

  const { textClassName, fontWeight } = getStylesForVariant();

  return (
    <Text
      className={`${textClassName} ${className}`}
      style={{
        fontFamily: 'Geist',
        fontWeight,
        ...style,
      }}
    >
      {title}
    </Text>
  );
}