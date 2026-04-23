import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import Card from './Card';

interface SettingsCardProps {
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress?: () => void;
  /**
   * Color tone for the whole card's accented elements (icon, title tint).
   *  - `default`: neutral — title/description in theme text, icon in textSecondary
   *  - `gold`: highlighted features (Account hub, Verify Email, Clear Sample)
   *  - `danger`: destructive actions (Delete Account)
   *  - `success`: completed / confirming actions (rare)
   */
  tone?: 'default' | 'gold' | 'danger' | 'success';
  showCaret?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function SettingsCard({
  title,
  description,
  iconName,
  iconColor,
  onPress,
  tone = 'default',
  showCaret,
  disabled = false,
  className = '',
}: SettingsCardProps) {
  const colors = useThemeColors();

  // Tone → accent color mapping. Accent drives border + background tint + icon.
  // Text (title/description) stays neutral/white so tinted cards read as
  // highlighted variants of the default, not full color swaps.
  const accentColor = (() => {
    switch (tone) {
      case 'gold':    return colors.colors.Y4;
      case 'danger':  return colors.colors.R3;
      case 'success': return colors.colors.G3;
      default:        return null;
    }
  })();

  // Icon: explicit iconColor prop wins, else tone accent, else textSecondary
  const resolvedIconColor = iconColor ?? accentColor ?? colors.textSecondary;
  // Tinted background + border — text stays white for readability.
  const tintedBg = accentColor ? accentColor + '30' : undefined; // ~19% opacity
  const tintedBorder = accentColor ? accentColor + 'CC' : undefined; // 80% opacity

  return (
    <Card
      onPress={disabled ? undefined : onPress}
      padding="medium"
      backgroundColor={tintedBg}
      borderColor={tintedBorder}
      disableGradient={!!accentColor}
      className={`${disabled ? 'opacity-50' : ''} ${className}`}
    >
      <View className="flex-row items-center gap-3">
        <Ionicons name={iconName} size={22} color={resolvedIconColor} />
        <View className="flex-1">
          <Text className="text-base" style={{ color: colors.text, fontWeight: '500' }}>
            {title}
          </Text>
          <Text className="text-sm" style={{ color: colors.textTertiary }}>
            {description}
          </Text>
        </View>
        {showCaret && (
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        )}
      </View>
    </Card>
  );
}
