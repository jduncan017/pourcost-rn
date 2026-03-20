import { createContext, useContext, useEffect, useMemo } from 'react';
import { ColorSchemeName, useColorScheme as useRNColorScheme } from 'react-native';
import { useColorScheme as useNativewindColorScheme } from 'nativewind';
import { useAppStore, ThemeMode } from '@/src/stores/app-store';

// ==========================================
// RAW PALETTE
// ==========================================

export const palette = {
  p1: '#3262C2',
  p2: '#2C3E63',
  p3: '#1D273C',
  p4: '#041021',

  n1: '#FFFFFF',
  n2: '#FCF9ED',
  n3: '#ECE7D1',
  n4: '#CEC59D',

  g1: '#EEEEEE',
  g2: '#AFAFAF',
  g3: '#585858',
  g4: '#111111',

  s11: '#FBE09D',
  s12: '#DCB962',
  s13: '#AF8827',
  s14: '#694920',

  s21: '#51CCAE',
  s22: '#439883',
  s23: '#286052',
  s24: '#062920',

  s31: '#7663E7',
  s32: '#594DA5',
  s33: '#382E78',
  s34: '#251C5F',

  e1: '#D63663',
  e2: '#B0244B',
  e3: '#780A29',
  e4: '#4C0015',
} as const;

export const themeColors = palette;

// ==========================================
// FLAT THEME COLORS — no nesting, no complexity
// ==========================================

interface ThemeColors {
  background: string;
  surface: string;
  elevated: string;
  inputBg: string;

  text: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;

  border: string;
  borderSubtle: string;
  borderStrong: string;

  accent: string;
  gold: string;
  go: string;

  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
  error: string;
  errorSubtle: string;
  info: string;
  infoSubtle: string;

  headerBackground: string;
  colors: typeof palette;
}

const dark: ThemeColors = {
  // Depth layers — each visibly distinct
  background: '#0B1120',      // screen fill — very dark navy
  surface: '#162238',         // cards — clearly lighter than bg
  elevated: '#1E3050',        // bottom sheets — another step up
  inputBg: '#0E1726',         // inputs — darker than surface, "inset"

  // Text — clean whites and grays
  text: '#F1F2F4',            // primary — near-white, high contrast
  textSecondary: '#C4CBD8',   // labels — readable gray-blue
  textTertiary: '#8E99AB',    // metadata — subdued
  textMuted: '#4A5568',       // placeholders

  // Borders — actually visible
  border: 'rgba(255, 255, 255, 0.12)',
  borderSubtle: 'rgba(255, 255, 255, 0.07)',
  borderStrong: 'rgba(255, 255, 255, 0.20)',

  // Accents
  accent: palette.p1,
  gold: palette.s12,
  go: palette.s22,

  // Semantic
  success: palette.s21,
  successSubtle: 'rgba(81, 204, 174, 0.12)',
  warning: palette.s11,
  warningSubtle: 'rgba(251, 224, 157, 0.12)',
  error: palette.e1,
  errorSubtle: 'rgba(214, 54, 99, 0.12)',
  info: palette.s31,
  infoSubtle: 'rgba(118, 99, 231, 0.10)',

  headerBackground: '#0B1120',
  colors: palette,
};

const light: ThemeColors = {
  background: '#F0F2F5',
  surface: '#FFFFFF',
  elevated: '#FFFFFF',
  inputBg: '#E4E7EB',

  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textMuted: '#CBD5E1',

  border: 'rgba(0, 0, 0, 0.08)',
  borderSubtle: 'rgba(0, 0, 0, 0.04)',
  borderStrong: 'rgba(0, 0, 0, 0.14)',

  accent: palette.p1,
  gold: palette.s14,
  go: '#0D9373',

  success: '#0D9373',
  successSubtle: 'rgba(13, 147, 115, 0.08)',
  warning: '#B45309',
  warningSubtle: 'rgba(180, 83, 9, 0.08)',
  error: '#DC2626',
  errorSubtle: 'rgba(220, 38, 38, 0.06)',
  info: palette.p1,
  infoSubtle: 'rgba(50, 98, 194, 0.06)',

  headerBackground: '#FFFFFF',
  colors: palette,
};

// ==========================================
// CONTEXT
// ==========================================

interface ThemeContextType {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colorScheme: ColorSchemeName;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeMode, setThemeMode } = useAppStore();
  const { colorScheme, setColorScheme } = useNativewindColorScheme();
  const systemColorScheme = useRNColorScheme();

  const isDarkMode = useMemo(() => {
    if (themeMode === 'auto') return systemColorScheme === 'dark';
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  useEffect(() => {
    setColorScheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode, setColorScheme]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, themeMode, setThemeMode, colorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}

export function useIsDarkMode() {
  return useTheme().isDarkMode;
}

export function useThemeColors(): ThemeColors {
  const { isDarkMode } = useTheme();
  return isDarkMode ? dark : light;
}
