import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import Card from './Card';

interface SettingsCardProps {
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress?: () => void;
  variant?: 'default' | 'danger';
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
  variant = 'default',
  showCaret,
  disabled = false,
  className = '',
}: SettingsCardProps) {
  const colors = useThemeColors();

  const isDanger = variant === 'danger';
  const resolvedIconColor = iconColor ?? colors.textSecondary;
  const titleColor = isDanger ? colors.error : colors.text;
  const descColor = isDanger ? colors.error : colors.textTertiary;

  const inner = (
    <View className="flex-row items-center gap-3">
      <Ionicons name={iconName} size={22} color={resolvedIconColor} />
      <View className="flex-1">
        <Text className="text-base" style={{ color: titleColor, fontWeight: '500' }}>
          {title}
        </Text>
        <Text className="text-sm" style={{ color: descColor }}>
          {description}
        </Text>
      </View>
      {showCaret && (
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      )}
    </View>
  );

  return (
    <Card
      onPress={disabled ? undefined : onPress}
      padding="medium"
      className={`${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {inner}
    </Card>
  );
}
