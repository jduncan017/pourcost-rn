import React from 'react';
import { View, Text, TextInput as RNTextInput, TextInputProps } from 'react-native';
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
    <View className={`mb-4 ${containerClassName}`}>
      {/* Label */}
      <Text className="text-base font-medium text-gray-700 mb-2">
        {label}
        {required && <Text className="text-red-500 ml-1">*</Text>}
      </Text>

      {/* Input Container */}
      <View className={`flex-row items-center border rounded-lg px-3 py-3 ${
        error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
      }`}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={error ? '#DC2626' : '#6B7280'} 
            style={{ marginRight: 10 }}
          />
        )}
        
        <RNTextInput
          className={`flex-1 text-base text-gray-800 ${inputClassName}`}
          placeholderTextColor="#9CA3AF"
          {...textInputProps}
        />
      </View>

      {/* Error Message */}
      {error && (
        <Text className="text-red-600 text-sm mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}