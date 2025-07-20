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
    const subscription = Appearance.addChangeListener(({ colorScheme: systemColorScheme }) => {
      // Only update if user hasn't manually set a preference
      // This could be enhanced to have an "auto" mode in the future
      console.log('System color scheme changed to:', systemColorScheme);
    });

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
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
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
    background: isDarkMode ? '#1F2937' : '#FFFFFF',
    surface: isDarkMode ? '#374151' : '#F9FAFB',
    text: isDarkMode ? '#F9FAFB' : '#1F2937',
    textSecondary: isDarkMode ? '#D1D5DB' : '#6B7280',
    border: isDarkMode ? '#4B5563' : '#E5E7EB',
    accent: '#3B82F6', // Blue stays the same in both modes
  };
}