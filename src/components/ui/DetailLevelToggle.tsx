import { View, Text, Pressable } from 'react-native';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { useAppStore, DetailLevel } from '@/src/stores/app-store';
import { HapticService } from '@/src/services/haptic-service';

interface DetailLevelToggleProps {
  /** Label for the "simple" detailLevel value. Defaults to INFO. */
  simpleLabel?: string;
  /** Label for the "detailed" detailLevel value. Defaults to NUMBERS. */
  detailedLabel?: string;
  /** When provided, the toggle becomes controlled — uses these instead of
   *  the global detailLevel store. Used by ingredient-form so the form's
   *  Simple/Detailed mode is local, not tied to the detail-screen toggle. */
  value?: DetailLevel;
  onChange?: (next: DetailLevel) => void;
  className?: string;
}

/**
 * Two-state pill toggle. Defaults to the global `detailLevel` store but
 * accepts controlled props for screens that want local state (forms).
 * Labels differ per surface:
 *   - Ingredient detail: INFO / NUMBERS
 *   - Cocktail detail: SPECS / NUMBERS
 *   - Ingredient form: SIMPLE / DETAILED
 */
export default function DetailLevelToggle({
  simpleLabel = 'INFO',
  detailedLabel = 'NUMBERS',
  value,
  onChange,
  className = '',
}: DetailLevelToggleProps) {
  const colors = useThemeColors();
  const globalDetailLevel = useAppStore((s) => s.detailLevel);
  const setGlobalDetailLevel = useAppStore((s) => s.setDetailLevel);
  const detailLevel = value ?? globalDetailLevel;
  const setDetailLevel = onChange ?? setGlobalDetailLevel;

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
