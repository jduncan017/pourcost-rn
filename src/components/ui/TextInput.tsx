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
  containerClassName?: string;
  inputClassName?: string;
  required?: boolean;
  size?: 'default' | 'large';
}

export default function TextInput({
  label,
  error,
  icon,
  containerClassName = '',
  inputClassName = '',
  required = false,
  size = 'default',
  ...textInputProps
}: CustomTextInputProps) {
  const colors = useThemeColors();

  const textSize = size === 'large' ? 'text-xl' : 'text-base';
  const labelSize = size === 'large' ? 'text-lg font-semibold' : 'text-base font-medium';

  return (
    <View className={containerClassName}>
      {/* Label */}
      {label && (
        <Text className={`${labelSize} tracking-tight text-g4 dark:text-n1 mb-2`}>
          {label}
          {required && <Text className="text-e3 ml-1">*</Text>}
        </Text>
      )}

      {/* Input Container */}
      <View
        className={`flex-row items-center rounded-lg px-3 py-2.5 border ${
          error ? 'border-e2/50' : ''
        }`}
        style={
          error
            ? { backgroundColor: colors.error + '15', borderColor: colors.error + '50' }
            : { backgroundColor: colors.colors.g2, borderColor: colors.border }
        }
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={error ? colors.error : colors.textSecondary}
            style={{ marginRight: 10 }}
          />
        )}

        <RNTextInput
          className={`p-1 flex-1 leading-tight ${textSize} text-g4 dark:text-n1 ${inputClassName}`}
          placeholderTextColor={colors.textSecondary}
          style={{ color: colors.text }}
          {...textInputProps}
        />
      </View>

      {/* Error Message */}
      {error && <Text className="text-e3 text-sm mt-1">{error}</Text>}
    </View>
  );
}
