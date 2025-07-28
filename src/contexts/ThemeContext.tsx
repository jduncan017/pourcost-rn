import React, { createContext, useContext, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { useColorScheme as useNativewindColorScheme } from 'nativewind';
import { useAppStore } from '@/src/stores/app-store';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  colorScheme: ColorSchemeName;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { isDarkMode, setDarkMode } = useAppStore();
  const { colorScheme, setColorScheme } = useNativewindColorScheme();

  // Sync NativeWind color scheme with our app store
  useEffect(() => {
    setColorScheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode, setColorScheme]);

  // Listen to system theme changes if user hasn't set a preference
  useEffect(() => {
    const subscription = Appearance.addChangeListener(
      ({ colorScheme: systemColorScheme }) => {
        // Only update if user hasn't manually set a preference
        // This could be enhanced to have an "auto" mode in the future
      }
    );

    return () => subscription?.remove();
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setDarkMode(newDarkMode);
  };

  const setTheme = (isDark: boolean) => {
    setDarkMode(isDark);
  };

  const value: ThemeContextType = {
    isDarkMode,
    toggleTheme,
    setTheme,
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
  g2: '#AFAFAF',
  g3: '#585858',
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
    textSecondary: isDarkMode ? themeColors.n1 : '#6B7280',
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
