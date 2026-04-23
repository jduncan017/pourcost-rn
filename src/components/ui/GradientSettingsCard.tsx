import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/src/contexts/ThemeContext';

interface GradientSettingsCardProps {
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  disabled?: boolean;
  showCaret?: boolean;
  /**
   * Gradient hue preset. Defaults to gold. "blue" is used for primary actions,
   * "gold" for setup/highlighted features, "green" for success-y confirmations.
   */
  tone?: 'gold' | 'blue' | 'green';
}

const TONE_GRADIENTS: Record<NonNullable<GradientSettingsCardProps['tone']>, [string, string, string]> = {
  gold:  [palette.Y3, palette.Y4, palette.Y5],
  blue:  [palette.B4, palette.B5, palette.B6],
  green: [palette.G3, palette.G4, palette.G5],
};

/**
 * Prominent settings row for primary actions (Account hub, Verify Email, etc.).
 * Uses a diagonal gradient fill + white icon/text for strong visual weight vs
 * the standard SettingsCard. Same layout footprint so they drop in alongside
 * normal SettingsCard rows.
 */
export default function GradientSettingsCard({
  title,
  description,
  iconName,
  onPress,
  disabled = false,
  showCaret = false,
  tone = 'gold',
}: GradientSettingsCardProps) {
  const colors = TONE_GRADIENTS[tone];

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 14, padding: 14 }}
      >
        <View className="flex-row items-center gap-3">
          <Ionicons name={iconName} size={22} color={palette.N1} />
          <View className="flex-1">
            <Text
              className="text-base"
              style={{ color: palette.N1, fontWeight: '600' }}
            >
              {title}
            </Text>
            <Text
              className="text-sm"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              {description}
            </Text>
          </View>
          {showCaret && (
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.85)" />
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}
