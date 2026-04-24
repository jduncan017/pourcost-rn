import { View, Text } from 'react-native';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import InfoIcon from './InfoIcon';
import { GlossaryKey } from '@/src/constants/glossary';

interface LedgerRowProps {
  label: string;
  value: string;
  /** Override for the value text color (e.g. colors.success on a "pour cost" row). */
  valueColor?: string;
  /** Adds a small info icon next to the label that opens the glossary term. */
  infoTermKey?: GlossaryKey;
}

/**
 * One row of the Ledger section at the bottom of detail pages.
 * Label left / value right, no dividers between rows (the Ledger has a single
 * top hairline; this row is a flat li).
 */
export default function LedgerRow({
  label,
  value,
  valueColor,
  infoTermKey,
}: LedgerRowProps) {
  const colors = useThemeColors();
  return (
    <View className="flex-row justify-between items-center py-2">
      <View className="flex-row items-center gap-1">
        <Text className="text-base" style={{ color: colors.textSecondary }}>
          {label}
        </Text>
        {infoTermKey && <InfoIcon termKey={infoTermKey} size={13} />}
      </View>
      <Text
        className="text-base"
        style={{ color: valueColor ?? colors.text, fontWeight: '600' }}
      >
        {value}
      </Text>
    </View>
  );
}
