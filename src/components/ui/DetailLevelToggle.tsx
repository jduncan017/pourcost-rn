import { View, Text, Pressable } from 'react-native';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { useAppStore, DetailLevel } from '@/src/stores/app-store';
import { HapticService } from '@/src/services/haptic-service';

interface DetailLevelToggleProps {
  className?: string;
}

const OPTIONS: { value: DetailLevel; label: string }[] = [
  { value: 'simple', label: 'SIMPLE' },
  { value: 'detailed', label: 'DETAIL' },
];

/**
 * Small inline pill toggle — matches mockup #1 sizing (not full-width).
 * Caller controls placement (usually right-aligned in a header row).
 */
export default function DetailLevelToggle({ className = '' }: DetailLevelToggleProps) {
  const colors = useThemeColors();
  const { detailLevel, setDetailLevel } = useAppStore();

  return (
    <View
      className={`flex-row rounded-full self-start ${className}`}
      style={{
        backgroundColor: colors.inputBg,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      }}
    >
      {OPTIONS.map((opt) => {
        const active = detailLevel === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              if (active) return;
              HapticService.toggle();
              setDetailLevel(opt.value);
            }}
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: active ? colors.elevated : 'transparent' }}
          >
            <Text
              className="text-[11px] tracking-widest"
              style={{
                color: active ? colors.text : colors.textTertiary,
                fontWeight: '700',
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
