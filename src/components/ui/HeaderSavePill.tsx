import { Pressable, Text } from 'react-native';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';

interface HeaderSavePillProps {
  onPress: () => void;
  /** Shown as muted + non-pressable when false. */
  disabled?: boolean;
  /** Replaces the label with "Saving..." and dims while true. */
  isSaving?: boolean;
  /** Label when idle. Defaults to "Save". */
  label?: string;
}

/**
 * Nav-header Save pill shared across the edit-form screens. Full-size pill so
 * iOS 26 treats this as the button itself rather than wrapping a smaller inner
 * pill in a liquid-glass shell.
 */
export default function HeaderSavePill({
  onPress,
  disabled = false,
  isSaving = false,
  label = 'Save',
}: HeaderSavePillProps) {
  const colors = useThemeColors();
  const inactive = disabled || isSaving;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={{
        backgroundColor: inactive ? colors.textMuted : colors.go,
        opacity: isSaving ? 0.6 : 1,
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 999,
        minHeight: 36,
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: palette.N1, fontWeight: '600', fontSize: 15 }}>
        {isSaving ? 'Saving...' : label}
      </Text>
    </Pressable>
  );
}
