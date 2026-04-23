import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '@/src/contexts/ThemeContext';
import InfoIcon from './InfoIcon';
import { GlossaryKey } from '@/src/constants/glossary';

interface AiSuggestionRowProps {
  label: string;
  value: string;
  /** Optional glossary term — adds a small info icon next to the label. */
  infoTermKey?: GlossaryKey;
  className?: string;
}

/**
 * Glass-style suggestion card — transparent → bottom-right purple gradient.
 * Passive (no actions). Matches the design-pass glassmorphism direction.
 */
export default function AiSuggestionRow({
  label,
  value,
  infoTermKey,
  className = '',
}: AiSuggestionRowProps) {
  // BR purple → TL fully transparent. TR stays ~40% alpha via biased stops.
  const gradientColors = [
    palette.P3 + '00', // BR strong
    palette.P3 + '10', // mid — keeps TR lit
    palette.P3 + '20', // TL fully transparent
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
        <View className="flex-row justify-between items-center p-4">
          <View className="flex-row items-center gap-2 flex-1">
            <Ionicons name="sparkles" size={16} color={palette.P2} />
            <Text
              className="text-base"
              style={{ color: palette.P2, fontWeight: '500' }}
              numberOfLines={1}
            >
              {label}
            </Text>
            {infoTermKey && <InfoIcon termKey={infoTermKey} size={13} color={palette.P2} />}
          </View>
          <Text
            className="text-base"
            style={{ color: palette.P2, fontWeight: '700' }}
          >
            {value}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}
