import { Ref, useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TextInputProps,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/contexts/ThemeContext';

interface CustomTextInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  prefix?: string;
  containerClassName?: string;
  inputClassName?: string;
  required?: boolean;
  /** Override the default border color. Used by the suggested-retail wrapper
   *  to render a purple-tinted border when the value is auto-computed. */
  borderColor?: string;
  /** Optional content rendered after the input (before the secure-toggle if
   *  any). Used for "Suggested" pills and the like. */
  rightAdornment?: React.ReactNode;
  /** Forwarded to the underlying RN TextInput. React 19 ref-as-prop pattern —
   *  no forwardRef needed and avoids the NativeWind cssInterop incompatibility
   *  with ForwardRefExoticComponent objects. */
  ref?: Ref<RNTextInput>;
}

export default function TextInput({
  label,
  error,
  icon,
  prefix,
  containerClassName = '',
  inputClassName = '',
  required = false,
  secureTextEntry,
  borderColor,
  rightAdornment,
  ref,
  ...textInputProps
}: CustomTextInputProps) {
  const colors = useThemeColors();
  const [revealed, setRevealed] = useState(false);
  const isSecure = !!secureTextEntry;
  // When `secureTextEntry` is true, render an eye toggle to peek the password.
  const effectiveSecure = isSecure && !revealed;

  return (
    <View className={containerClassName}>
      {label && (
        <Text
          className="text-[11px] tracking-widest uppercase mb-2"
          style={{ color: colors.textTertiary, fontWeight: '600' }}
        >
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}

      <View
        className="flex-row items-center rounded-lg p-4"
        style={{
          backgroundColor: error ? colors.errorSubtle : colors.surface,
          borderWidth: 1,
          borderColor: error
            ? colors.error + '60'
            : (borderColor ?? colors.border),
        }}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={error ? colors.error : colors.textTertiary}
            style={{ marginRight: 10 }}
          />
        )}

        {prefix && (
          <Text style={{ color: colors.textTertiary, fontSize: 15, marginRight: 4 }}>
            {prefix}
          </Text>
        )}

        <RNTextInput
          ref={ref}
          className={`flex-1 ${inputClassName}`}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={effectiveSecure}
          style={{
            color: colors.text,
            fontSize: 15,
            padding: 0,
            margin: 0,
          }}
          {...textInputProps}
        />

        {rightAdornment}

        {isSecure && (
          <Pressable
            onPress={() => setRevealed((r) => !r)}
            hitSlop={10}
            style={{ marginLeft: 8 }}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textTertiary}
            />
          </Pressable>
        )}
      </View>

      {error && (
        <Text style={{ color: colors.error }} className="text-sm mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}
