import { createContext, useContext, useEffect } from 'react';
import { ColorSchemeName } from 'react-native';
import { useColorScheme as useNativewindColorScheme } from 'nativewind';
import { useAppStore, ThemeMode } from '@/src/stores/app-store';

// ==========================================
// EXPANDED PALETTE — 9 shades per family
// 1 = lightest, 9 = darkest
// ==========================================

export const palette = {
  // Blues — H:220 S:59 | hero: B5
  B1: '#EFF1F5', // L:95
  B2: '#C3CEE4', // L:83
  B3: '#8DAAE2', // L:72
  B4: '#5D85D5', // L:60
  B5: '#3262C3', // L:48 — primary CTA
  B6: '#284E9A', // L:38
  B7: '#1D3972', // L:28 — elevated surfaces
  B8: '#12274D', // L:18 — card surfaces dark
  B9: '#0C121D', // L:8  — deepest bg

  // Neutrals — pure gray, zero saturation
  N1: '#FFFFFF', // L:100
  N2: '#EDEDED', // L:93
  N3: '#D1D1D1', // L:82
  N4: '#B3B3B3', // L:70
  N5: '#8F8F8F', // L:56
  N6: '#6B6B6B', // L:42
  N7: '#4D4D4D', // L:30
  N8: '#262626', // L:15
  N9: '#0D0D0D', // L:5

  // Yellows / Golds — H:43 S:64 | hero: Y4 (brand gold, warm creams at Y1-Y3)
  Y1: '#F6F4EF', // L:95 — lightest cream
  Y2: '#E7DEC5', // L:84 — warm off-white
  Y3: '#E6CD8E', // L:73 — cream
  Y4: '#DCB960', // L:62 — brand gold
  Y5: '#D2A532', // L:51
  Y6: '#A78225', // L:40
  Y7: '#7D621C', // L:30
  Y8: '#4F3E11', // L:19
  Y9: '#1E180B', // L:8

  // Greens / Teals — H:165 S:55 | hero: G3
  G1: '#EFF5F4', // L:95
  G2: '#ACD8CD', // L:76
  G3: '#51CDAE', // L:56 — primary success
  G4: '#37BE9C', // L:48
  G5: '#2E9E82', // L:40
  G6: '#257E68', // L:32
  G7: '#1C5F4E', // L:24
  G8: '#123F34', // L:16
  G9: '#0D1C18', // L:8

  // Purples — H:249 S:73 | hero: P3
  P1: '#F0EFF6', // L:95
  P2: '#BBB4E4', // L:80
  P3: '#7865E7', // L:65 — AI/intelligence
  P4: '#553DE1', // L:56
  P5: '#3920CB', // L:46
  P6: '#2E19A3', // L:37
  P7: '#221377', // L:27
  P8: '#160C4F', // L:18
  P9: '#0D0A1F', // L:8

  // Reds / Pinks — H:343 S:66 | hero: R3
  R1: '#F6EFF1', // L:95
  R2: '#E891AA', // L:74
  R3: '#D63865', // L:53 — primary danger
  R4: '#C32854', // L:46
  R5: '#A12145', // L:38
  R6: '#831B38', // L:31
  R7: '#61142A', // L:23
  R8: '#440E1D', // L:16
  R9: '#1E0B10', // L:8

  // Oranges — H:28 S:80 | hero: O4
  O1: '#F6F2EE', // L:95
  O2: '#E8CDB5', // L:81
  O3: '#EEA463', // L:66
  O4: '#E77E23', // L:52 — primary caution
  O5: '#C56816', // L:43
  O6: '#9C5211', // L:34
  O7: '#773F0D', // L:26
  O8: '#4E2909', // L:17
  O9: '#201409', // L:8
} as const;

// Legacy alias
export const themeColors = palette;

// ==========================================
// FLAT THEME COLORS
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
  background: '#0B1120',
  surface: '#162238',
  elevated: '#1E3050',
  inputBg: '#0E1726',

  text: '#F1F2F4',
  textSecondary: '#C4CBD8',
  textTertiary: '#8E99AB',
  textMuted: '#4A5568',

  border: 'rgba(255, 255, 255, 0.12)',
  borderSubtle: 'rgba(255, 255, 255, 0.07)',
  borderStrong: 'rgba(255, 255, 255, 0.20)',

  accent: palette.B5,
  gold: palette.Y4,
  go: palette.G5,

  success: palette.G3,
  successSubtle: palette.G9,
  warning: palette.Y2,
  warningSubtle: palette.Y9,
  error: palette.R3,
  errorSubtle: palette.R9,
  info: palette.P3,
  infoSubtle: palette.P9,

  headerBackground: '#0B1120',
  colors: palette,
};

const light: ThemeColors = {
  background: '#E6ECF2',
  surface: '#FFFFFF',
  elevated: '#FFFFFF',
  inputBg: '#F0F3F7',

  text: '#0C1425',
  textSecondary: '#3D4F6A',
  textTertiary: '#7889A0',
  textMuted: '#A8B5C6',

  border: palette.N3,
  borderSubtle: palette.N2,
  borderStrong: palette.N4,

  accent: palette.B5,
  gold: palette.B5, // blue instead of gold in light mode
  go: palette.G6,

  success: palette.G6,
  successSubtle: palette.G1,
  warning: palette.O5,
  warningSubtle: palette.O1,
  error: palette.R3,
  errorSubtle: palette.R1,
  info: palette.B5,
  infoSubtle: palette.B1,

  headerBackground: '#EDF1F7',
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

  // MVP: dark-only. Ignore themeMode/system until toggle re-enabled.
  const isDarkMode = true;

  useEffect(() => {
    setColorScheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode, setColorScheme]);

  return (
    <ThemeContext.Provider
      value={{ isDarkMode, themeMode, setThemeMode, colorScheme }}
    >
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
