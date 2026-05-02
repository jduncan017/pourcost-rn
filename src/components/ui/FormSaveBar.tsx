import { Pressable, Text } from 'react-native';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';

interface FormSaveBarProps {
  onPress: () => void;
  /** Shown as muted + non-pressable when false. */
  disabled?: boolean;
  /** Replaces label with "Saving..." and dims while true. */
  isSaving?: boolean;
  /** Label when idle. Defaults to "Save". */
  label?: string;
}

/**
 * Inline form save button — full-width solid pill placed at the bottom of
 * the form content (NOT sticky, NOT in the navigation header). Lives outside
 * the header on purpose: iOS 26 auto-wraps interactive headerRight items in
 * a liquid-glass capsule that mutes the green "do this now" signal.
 */
export default function FormSaveBar({
  onPress,
  disabled = false,
  isSaving = false,
  label = 'Save',
}: FormSaveBarProps) {
  const colors = useThemeColors();
  const inactive = disabled || isSaving;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={{
        backgroundColor: inactive ? colors.textMuted : colors.go,
        opacity: isSaving ? 0.6 : 1,
        paddingVertical: 14,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: palette.N1, fontWeight: '600', fontSize: 16 }}>
        {isSaving ? 'Saving...' : label}
      </Text>
    </Pressable>
  );
}
