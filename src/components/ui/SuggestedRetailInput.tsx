import { Pressable, Text, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/src/contexts/ThemeContext';
import TextInput from './TextInput';
import { HapticService } from '@/src/services/haptic-service';

interface SuggestedRetailInputProps
  extends Omit<TextInputProps, 'style' | 'value' | 'onChangeText'> {
  label: string;
  /** Live value displayed in the input. When `isSuggesting` is true, the
   *  parent should pass the computed suggested price formatted as a string;
   *  otherwise the user's typed value. */
  value: string;
  /** Fires on every keystroke. Parent should flip its manual flag the first
   *  time this fires so subsequent renders show user input, not the suggestion. */
  onChangeText: (text: string) => void;
  /** True when the input value is the auto-computed suggestion (no manual
   *  edits yet). Drives the purple border + "Suggested" pill on the right. */
  isSuggesting: boolean;
  /** Tap handler for the "Use Suggested" reset pill — only rendered when
   *  `isSuggesting` is false. Returns the input to suggested mode. */
  onResetToSuggested?: () => void;
  prefix?: string;
  /** Renders a red ` *` after the label. Forwarded to the underlying TextInput. */
  required?: boolean;
  /** Override the suggested-mode pill text. Default: "Suggested". */
  pillLabel?: string;
  /** Override the reset-pill text shown in manual mode. Default: "Use Suggested". */
  resetLabel?: string;
}

/**
 * Retail-price input with a built-in "Suggested" mode.
 *
 *  - Suggested mode (`isSuggesting={true}`): purple border + "Suggested"
 *    pill on the right. The displayed value is the computed suggestion;
 *    typing flips the parent's manual flag and the visual collapses to a
 *    plain input.
 *  - Manual mode (`isSuggesting={false}`): standard styling, plus a small
 *    "Use Suggested" reset pill on the right that calls
 *    `onResetToSuggested` to return to suggested mode.
 *
 * Replaces the previous separate AiSuggestionRow + Apply pattern. One
 * input, one source of truth.
 */
export default function SuggestedRetailInput({
  isSuggesting,
  onResetToSuggested,
  pillLabel = 'Suggested',
  resetLabel = 'Use Suggested',
  ...textInputProps
}: SuggestedRetailInputProps) {
  const adornment = isSuggesting ? (
    <Pressable
      pointerEvents="none"
      className="rounded-full px-2 py-1 ml-2"
      style={{ backgroundColor: palette.P3 + '24' }}
    >
      <Text style={{ color: palette.P2, fontSize: 11, fontWeight: '700' }}>
        {pillLabel}
      </Text>
    </Pressable>
  ) : onResetToSuggested ? (
    <Pressable
      onPress={() => {
        HapticService.buttonPress();
        onResetToSuggested();
      }}
      hitSlop={6}
      className="flex-row items-center gap-1 rounded-full px-2 py-1 ml-2"
      style={{
        backgroundColor: palette.P3 + '14',
        borderWidth: 1,
        borderColor: palette.P3 + '40',
      }}
    >
      <Ionicons name="sparkles" size={11} color={palette.P2} />
      <Text style={{ color: palette.P2, fontSize: 11, fontWeight: '600' }}>
        {resetLabel}
      </Text>
    </Pressable>
  ) : null;

  return (
    <TextInput
      {...textInputProps}
      // While the suggestion is showing, select-all on focus so the first
      // keystroke replaces it cleanly instead of appending to "22.00".
      selectTextOnFocus={isSuggesting || textInputProps.selectTextOnFocus}
      borderColor={isSuggesting ? palette.P3 + '70' : undefined}
      rightAdornment={adornment}
    />
  );
}
