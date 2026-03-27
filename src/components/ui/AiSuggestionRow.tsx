import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useThemeColors,
  useIsDarkMode,
  palette,
} from '@/src/contexts/ThemeContext';

interface AiSuggestionRowProps {
  label: string;
  value: string;
  className?: string;
}

export default function AiSuggestionRow({
  label,
  value,
  className = '',
}: AiSuggestionRowProps) {
  const colors = useThemeColors();
  const isDark = useIsDarkMode();

  const purpleBg = isDark ? palette.P8 + '40' : palette.P1;
  const purpleBorder = isDark ? palette.P4 : palette.P2;
  const purpleIcon = palette.P3;

  return (
    <View
      className={`flex-row justify-between items-center p-4 rounded-lg ${className}`}
      style={{
        backgroundColor: purpleBg,
        borderWidth: 1,
        borderColor: purpleBorder,
      }}
    >
      <View className="flex-row items-center gap-2">
        <Ionicons name="sparkles" size={14} color={purpleIcon} />
        <Text className="text-base" style={{ color: colors.text }}>
          {label}
        </Text>
      </View>
      <Text
        className="text-base"
        style={{ color: colors.text, fontWeight: '500' }}
      >
        {value}
      </Text>
    </View>
  );
}
