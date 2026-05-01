import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors, useIsDarkMode, palette } from '@/src/contexts/ThemeContext';
import KeyboardDismissButton from './KeyboardDismissButton';

interface GradientBackgroundProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
  /** Set to true to opt out of the global floating keyboard-dismiss button.
   *  Default false; only set on screens where the button conflicts with
   *  another floating element. */
  hideKeyboardDismiss?: boolean;
}

export default function GradientBackground({
  children,
  className = '',
  style,
  hideKeyboardDismiss = false,
}: GradientBackgroundProps) {
  const colors = useThemeColors();
  const isDark = useIsDarkMode();

  const gradientColors = isDark
    ? [colors.background, palette.B8]   // subtle navy warmth at bottom
    : [colors.background, palette.B1];  // subtle blue gradient

  return (
    <LinearGradient
      colors={gradientColors as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[{ flex: 1 }, style]}
    >
      {children}
      {!hideKeyboardDismiss && <KeyboardDismissButton />}
    </LinearGradient>
  );
}
