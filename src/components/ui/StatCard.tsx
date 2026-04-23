import { View, Text } from 'react-native';
import { useThemeColors } from '@/src/contexts/ThemeContext';

interface StatCardProps {
  label: string;
  value: string;
  valueColor?: string;
  className?: string;
}

/**
 * Glass twin-column stat card — subtle, closer to bg than standard Card.
 * Usage: <View className="flex-row gap-3"><StatCard ... /><StatCard ... /></View>
 */
export default function StatCard({
  label,
  value,
  valueColor,
  className = '',
}: StatCardProps) {
  const colors = useThemeColors();

  return (
    <View
      className={`flex-1 p-4 rounded-xl ${className}`}
      style={{
        backgroundColor: colors.surface + '66', // ~40% opacity for glass feel
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      }}
    >
      <View className="flex-col gap-1.5">
        <Text
          className="text-[11px] tracking-widest uppercase"
          style={{ color: colors.textTertiary, fontWeight: '600' }}
        >
          {label}
        </Text>
        <Text
          className="text-2xl"
          style={{ color: valueColor ?? colors.text, fontWeight: '700' }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>
      </View>
    </View>
  );
}
