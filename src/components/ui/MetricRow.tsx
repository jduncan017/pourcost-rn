import { View, Text } from 'react-native';

interface MetricRowProps {
  label: string;
  value: string;
  valueColor?: string;
  className?: string;
}

export default function MetricRow({
  label,
  value,
  valueColor = 'text-g4 dark:text-n1',
  className = '',
}: MetricRowProps) {
  return (
    <View className={`flex-row justify-between items-center ${className}`}>
      <Text className="text-g3 dark:text-n1">{label}</Text>
      <Text className={`${valueColor}`} style={{ fontWeight: '500' }}>
        {value}
      </Text>
    </View>
  );
}
