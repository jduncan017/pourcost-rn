import { View, Text } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import Card from './Card';

interface SettingsCardProps {
  title: string;
  description: string;
  iconName:
    | keyof typeof Ionicons.glyphMap
    | keyof typeof MaterialCommunityIcons.glyphMap;
  /** Switch icon family. MCI gives access to bottle/liquor icons Ionicons lacks. */
  iconFamily?: 'ionicons' | 'mci';
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
  iconFamily = 'ionicons',
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
  // Tinted background only — border stays uniform across all tones for visual consistency.
  const tintedBg = accentColor ? accentColor + '30' : undefined; // ~19% opacity

  return (
    <Card
      onPress={disabled ? undefined : onPress}
      padding="medium"
      backgroundColor={tintedBg}
      disableGradient={!!accentColor}
      className={`${disabled ? 'opacity-50' : ''} ${className}`}
    >
      <View className="flex-row items-center gap-3">
        {iconFamily === 'mci' ? (
          <MaterialCommunityIcons
            name={iconName as keyof typeof MaterialCommunityIcons.glyphMap}
            size={22}
            color={resolvedIconColor}
          />
        ) : (
          <Ionicons
            name={iconName as keyof typeof Ionicons.glyphMap}
            size={22}
            color={resolvedIconColor}
          />
        )}
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
