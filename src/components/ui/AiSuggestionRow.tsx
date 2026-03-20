import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';

interface AiSuggestionRowProps {
  label: string;
  value: string;
  className?: string;
}

export default function AiSuggestionRow({ label, value, className = '' }: AiSuggestionRowProps) {
  const colors = useThemeColors();

  return (
    <View
      className={`flex-row justify-between items-center px-3 py-3 rounded-lg ${className}`}
      style={{ backgroundColor: palette.s31 + '12', borderWidth: 1, borderColor: palette.s31 + '30' }}
    >
      <View className="flex-row items-center gap-2">
        <Ionicons name="sparkles" size={14} color={palette.s31} />
        <Text className="text-base" style={{ color: colors.textSecondary }}>{label}</Text>
      </View>
      <Text className="text-base" style={{ color: colors.text, fontWeight: '500' }}>
        {value}
      </Text>
    </View>
  );
}
