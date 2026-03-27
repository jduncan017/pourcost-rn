import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors, useIsDarkMode, palette } from '@/src/contexts/ThemeContext';

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
  const colors = useThemeColors();
  const isDark = useIsDarkMode();

  if (!isDark) {
    // Light mode: subtle blue gradient
    return (
      <LinearGradient
        colors={[colors.background, palette.B1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[{ flex: 1 }, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  // Dark mode: subtle gradient — base at top with a hint of navy warmth at bottom
  return (
    <LinearGradient
      colors={[colors.background, palette.B8]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </LinearGradient>
  );
}
