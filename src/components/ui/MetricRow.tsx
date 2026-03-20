import { View, Text } from 'react-native';
import { useThemeColors } from '@/src/contexts/ThemeContext';

interface MetricRowProps {
  label: string;
  value: string;
  valueColor?: string;
  className?: string;
}

export default function MetricRow({
  label,
  value,
  valueColor,
  className = '',
}: MetricRowProps) {
  const colors = useThemeColors();
  return (
    <View className={`flex-row justify-between items-center ${className}`}>
      <Text style={{ color: colors.textSecondary }}>{label}</Text>
      <Text style={{ color: valueColor || colors.text, fontWeight: '500' }}>{value}</Text>
    </View>
  );
}
