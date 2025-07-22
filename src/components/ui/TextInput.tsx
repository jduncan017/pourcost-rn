import React from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomTextInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  containerClassName?: string;
  inputClassName?: string;
  required?: boolean;
}

export default function TextInput({
  label,
  error,
  icon,
  containerClassName = '',
  inputClassName = '',
  required = false,
  ...textInputProps
}: CustomTextInputProps) {
  return (
    <View className={containerClassName}>
      {/* Label */}
      <Text className="text-base font-medium text-g4 dark:text-n1 mb-2">
        {label}
        {required && <Text className="text-e3 ml-1">*</Text>}
      </Text>

      {/* Input Container */}
      <View
        className={`flex-row items-center border rounded-lg px-3 py-3 ${
          error ? 'border-e2/50 bg-e1/20' : 'border-g1 bg-n1'
        }`}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={error ? '#DC2626' : '#6B7280'}
            style={{ marginRight: 10 }}
          />
        )}

        <RNTextInput
          className={`flex-1 text-base text-g3 mb-2 ${inputClassName}`}
          placeholderTextColor="#9CA3AF"
          {...textInputProps}
        />
      </View>

      {/* Error Message */}
      {error && <Text className="text-e3 text-sm mt-1">{error}</Text>}
    </View>
  );
}
