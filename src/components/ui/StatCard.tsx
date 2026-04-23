import { View, Text } from 'react-native';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import Card from './Card';
import InfoIcon from './InfoIcon';
import { GlossaryKey } from '@/src/constants/glossary';

interface StatCardProps {
  label: string;
  value: string;
  valueColor?: string;
  /** Optional glossary term — adds a small info icon next to the label. */
  infoTermKey?: GlossaryKey;
  className?: string;
}

/**
 * Twin-column-friendly big-number stat card. Uses the shared Card chrome
 * (same look as the inputs card) for app-wide consistency.
 */
export default function StatCard({
  label,
  value,
  valueColor,
  infoTermKey,
  className = '',
}: StatCardProps) {
  const colors = useThemeColors();

  return (
    <Card padding="medium" className={`flex-1 ${className}`}>
      <View className="flex-col gap-1.5">
        <View className="flex-row items-center gap-1">
          <Text
            className="flex-1 text-[11px] tracking-widest uppercase"
            style={{ color: colors.textTertiary, fontWeight: '600' }}
            numberOfLines={1}
          >
            {label}
          </Text>
          {infoTermKey && <InfoIcon termKey={infoTermKey} size={13} />}
        </View>
        <Text
          className="text-2xl"
          style={{ color: valueColor ?? colors.text, fontWeight: '700' }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value}
        </Text>
      </View>
    </Card>
  );
}
