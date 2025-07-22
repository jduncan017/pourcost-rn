import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/contexts/ThemeContext';

interface GradientBackgroundProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
}

export default function GradientBackground({
  children,
  className = '',
  style,
}: GradientBackgroundProps) {
  const { isDarkMode } = useTheme();

  console.log('GradientBackground - isDarkMode:', isDarkMode); // Debug log

  if (!isDarkMode) {
    // Light mode - use regular white background
    console.log('Using light mode background');
    return (
      <LinearGradient
        colors={['#FFFFFF', '#EEEEEE']} // p3 to p4
        start={{ x: 0, y: 0 }} // top-left
        end={{ x: 1, y: 1 }} // bottom-right
        style={[{ flex: 1 }, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  // Dark mode - use gradient from p3 to p4
  console.log('Using dark mode gradient');
  return (
    <LinearGradient
      colors={['#1D273C', '#03080F']} // p3 to p4
      start={{ x: 0, y: 0 }} // top-left
      end={{ x: 1, y: 1 }} // bottom-right
      style={[{ flex: 1 }, style]}
    >
      {children}
    </LinearGradient>
  );
}
