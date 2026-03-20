import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { Appearance, ColorSchemeName, useColorScheme as useRNColorScheme } from 'react-native';
import { useColorScheme as useNativewindColorScheme } from 'nativewind';
import { useAppStore, ThemeMode } from '@/src/stores/app-store';

interface ThemeContextType {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colorScheme: ColorSchemeName;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { themeMode, setThemeMode } = useAppStore();
  const { colorScheme, setColorScheme } = useNativewindColorScheme();
  const systemColorScheme = useRNColorScheme();

  // Resolve the effective dark mode state
  const isDarkMode = useMemo(() => {
    if (themeMode === 'auto') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  // Sync NativeWind color scheme
  useEffect(() => {
    setColorScheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode, setColorScheme]);

  const value: ThemeContextType = {
    isDarkMode,
    themeMode,
    setThemeMode,
    colorScheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook to get the current theme for conditional styling
export function useIsDarkMode() {
  const { isDarkMode } = useTheme();
  return isDarkMode;
}

// Theme colors matching Tailwind config naming
export const themeColors = {
  // Primary colors
  p1: '#3262C2',
  p2: '#2C3E63',
  p3: '#1D273C',
  p4: '#041021',

  // Neutral colors
  n1: '#FFFFFF',
  n2: '#FCF9ED',
  n3: '#ECE7D1',
  n4: '#CEC59D',

  // Grey colors
  g1: '#EEEEEE',
  g2: '#73777F',
  g3: '#43474E',
  g4: '#111111',

  // Secondary yellows
  s11: '#FBE09D',
  s12: '#DCB962',
  s13: '#AF8827',
  s14: '#694920',

  // Secondary teals
  s21: '#51CCAE',
  s22: '#439883',
  s23: '#286052',
  s24: '#062920',

  // Secondary purples
  s31: '#7663E7',
  s32: '#594DA5',
  s33: '#382E78',
  s34: '#251C5F',

  // Error/caution colors (reds)
  e1: '#D63663',
  e2: '#B0244B',
  e3: '#780A29',
  e4: '#4C0015',
} as const;

// Hook to get theme-aware colors
export function useThemeColors() {
  const { isDarkMode } = useTheme();

  return {
    // Legacy compatibility colors
    background: isDarkMode ? themeColors.p4 : themeColors.n1,
    surface: isDarkMode ? themeColors.p3 : '#F9FAFB',
    headerBackground: isDarkMode ? themeColors.p4 : themeColors.n1,
    text: isDarkMode ? themeColors.n1 : '#1F2937',
    textSecondary: isDarkMode ? themeColors.g2 : '#6B7280',
    border: isDarkMode ? themeColors.p2 : '#E5E7EB',
    accent: isDarkMode ? themeColors.s11 : themeColors.p1,

    // Additional colors for feedback system
    primary: isDarkMode ? '#3B82F6' : '#2563EB',
    success: isDarkMode ? '#10B981' : '#059669',
    error: isDarkMode ? '#EF4444' : '#DC2626',
    warning: isDarkMode ? '#F59E0B' : '#D97706',
    info: isDarkMode ? '#3B82F6' : '#2563EB',

    // Direct access to theme colors
    colors: themeColors,
  };
}
