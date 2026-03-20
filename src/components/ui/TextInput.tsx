import {
  View,
  Text,
  TextInput as RNTextInput,
  TextInputProps,
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
}

export default function TextInput({
  label,
  error,
  icon,
  prefix,
  containerClassName = '',
  inputClassName = '',
  required = false,
  ...textInputProps
}: CustomTextInputProps) {
  const colors = useThemeColors();

  return (
    <View className={containerClassName}>
      {label && (
        <Text
          className="text-lg mb-2"
          style={{ color: colors.textSecondary, fontWeight: '500' }}
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
          borderColor: error ? colors.error + '60' : colors.border,
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
          className={`flex-1 ${inputClassName}`}
          placeholderTextColor={colors.textMuted}
          style={{
            color: colors.text,
            fontSize: 15,
            padding: 0,
            margin: 0,
          }}
          {...textInputProps}
        />
      </View>

      {error && (
        <Text style={{ color: colors.error }} className="text-sm mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}
