import { View, Text, Pressable } from 'react-native';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { useAppStore, DetailLevel } from '@/src/stores/app-store';
import { HapticService } from '@/src/services/haptic-service';

interface DetailLevelToggleProps {
  /** Label for the "simple" detailLevel value. Defaults to INFO. */
  simpleLabel?: string;
  /** Label for the "detailed" detailLevel value. Defaults to NUMBERS. */
  detailedLabel?: string;
  className?: string;
}

/**
 * Two-state pill toggle controlling the global `detailLevel`. Same shared
 * state is used across detail pages, but labels differ per surface:
 *   - Ingredient detail uses INFO / NUMBERS
 *   - Cocktail detail uses SPECS / NUMBERS
 *
 * The underlying enum values stay 'simple' / 'detailed' (semantic ≈ info /
 * numbers) — labels are cosmetic per page.
 */
export default function DetailLevelToggle({
  simpleLabel = 'INFO',
  detailedLabel = 'NUMBERS',
  className = '',
}: DetailLevelToggleProps) {
  const colors = useThemeColors();
  const detailLevel = useAppStore((s) => s.detailLevel);
  const setDetailLevel = useAppStore((s) => s.setDetailLevel);

  const options: { value: DetailLevel; label: string }[] = [
    { value: 'simple', label: simpleLabel },
    { value: 'detailed', label: detailedLabel },
  ];

  return (
    <View
      className={`flex-row rounded-full self-start ${className}`}
      style={{
        backgroundColor: colors.inputBg,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      }}
    >
      {options.map((opt) => {
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
