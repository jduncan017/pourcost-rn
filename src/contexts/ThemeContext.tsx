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

// Hook to get theme-aware colors
export function useThemeColors() {
  const { isDarkMode } = useTheme();

  return {
    background: isDarkMode ? '#03080F' : '#FFFFFF', // p4 in dark mode
    surface: isDarkMode ? '#1D273C' : '#F9FAFB', // p3 in dark mode
    headerBackground: isDarkMode ? '#041021' : '#FFFFFF', // p4 for header in dark mode
    text: isDarkMode ? '#FFFFFF' : '#1F2937', // n1 (white) in dark mode
    textSecondary: isDarkMode ? '#FFFFFF' : '#6B7280', // n1 (white) in dark mode too
    border: isDarkMode ? '#2C3E63' : '#E5E7EB', // p2 borders in dark mode
    accent: isDarkMode ? '#FBE09D' : '#3262C2', // p1 primary color
    
    // Additional colors for feedback system
    primary: isDarkMode ? '#3B82F6' : '#2563EB',
    success: isDarkMode ? '#10B981' : '#059669',
    error: isDarkMode ? '#EF4444' : '#DC2626',
    warning: isDarkMode ? '#F59E0B' : '#D97706',
    info: isDarkMode ? '#3B82F6' : '#2563EB',
  };
}
