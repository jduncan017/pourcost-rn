import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '@/src/contexts/ThemeContext';
import InfoIcon from './InfoIcon';
import { GlossaryKey } from '@/src/constants/glossary';
import { HapticService } from '@/src/services/haptic-service';

interface AiSuggestionRowProps {
  label: string;
  value: string;
  /** Optional glossary term — adds a small info icon next to the label. */
  infoTermKey?: GlossaryKey;
  /** When provided, renders an Apply button on the right. Tapping fires the
   *  callback (typically writes the suggested value back to the row's
   *  underlying field, e.g. cocktail.retail_price). */
  onApply?: () => void;
  /** Disabled state for the Apply button (e.g. while a save is in flight). */
  applyDisabled?: boolean;
  className?: string;
}

/**
 * Glass-style suggestion card — transparent → bottom-right purple gradient.
 * Optionally actionable via the Apply button when `onApply` is set.
 */
export default function AiSuggestionRow({
  label,
  value,
  infoTermKey,
  onApply,
  applyDisabled,
  className = '',
}: AiSuggestionRowProps) {
  const gradientColors = [
    palette.P3 + '00',
    palette.P3 + '10',
    palette.P3 + '20',
  ] as const;

  return (
    <View
      className={`rounded-xl overflow-hidden ${className}`}
      style={{
        borderWidth: 1,
        borderColor: palette.P3 + '50',
      }}
    >
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.6, 1]}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
      >
        <View className="flex-row items-center p-4 gap-3 flex-1 justify-between">
          <View className="flex-row items-center gap-2">
            <Ionicons name="sparkles" size={16} color={palette.P2} />
            <Text
              className="text-base"
              style={{ color: palette.P2, fontWeight: '500' }}
              numberOfLines={1}
            >
              {`${label}  -`}
            </Text>
            <Text
              className="text-base"
              style={{ color: palette.P2, fontWeight: '700' }}
            >
              {value}
            </Text>
            {infoTermKey && (
              <InfoIcon termKey={infoTermKey} size={18} color={palette.P2} />
            )}
          </View>
          {onApply && (
            <Pressable
              onPress={() => {
                if (applyDisabled) return;
                HapticService.buttonPress();
                onApply();
              }}
              disabled={applyDisabled}
              className="px-5 py-1.5 rounded-md"
              style={{
                backgroundColor: palette.P4,
                opacity: applyDisabled ? 0.4 : 1,
              }}
            >
              <Text
                style={{ color: palette.N1, fontSize: 13, fontWeight: '600' }}
              >
                Apply
              </Text>
            </Pressable>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}
