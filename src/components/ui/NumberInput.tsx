import React from 'react';
import { View, Text, TextInput as RNTextInput, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NumberInputProps extends Omit<TextInputProps, 'style' | 'keyboardType' | 'value' | 'onChangeText'> {
  label: string;
  value: number | string;
  onValueChange: (value: number) => void;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  suffix?: string;
  prefix?: string;
  min?: number;
  max?: number;
  step?: number;
  decimalPlaces?: number;
  containerClassName?: string;
  inputClassName?: string;
  required?: boolean;
}

export default function NumberInput({
  label,
  value,
  onValueChange,
  error,
  icon,
  suffix,
  prefix,
  min,
  max,
  step = 0.01,
  decimalPlaces = 2,
  containerClassName = '',
  inputClassName = '',
  required = false,
  ...textInputProps
}: NumberInputProps) {
  const [textValue, setTextValue] = React.useState(value.toString());
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    if (!isFocused) {
      setTextValue(typeof value === 'number' ? value.toFixed(decimalPlaces) : value.toString());
    }
  }, [value, decimalPlaces, isFocused]);

  const handleTextChange = (text: string) => {
    setTextValue(text);
    
    // Remove any non-numeric characters except decimal point
    const cleanedText = text.replace(/[^0-9.]/g, '');
    const numericValue = parseFloat(cleanedText);
    
    if (!isNaN(numericValue)) {
      let finalValue = numericValue;
      
      // Apply min/max constraints
      if (min !== undefined && finalValue < min) finalValue = min;
      if (max !== undefined && finalValue > max) finalValue = max;
      
      onValueChange(finalValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Show the raw numeric value without formatting when focused
    setTextValue(value.toString());
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format the value when not focused
    const numericValue = parseFloat(textValue);
    if (!isNaN(numericValue)) {
      setTextValue(numericValue.toFixed(decimalPlaces));
    }
  };

  return (
    <View className={containerClassName}>
      {/* Label */}
      <Text className="text-base font-medium text-g4 mb-2">
        {label}
        {required && <Text className="text-e3 ml-1">*</Text>}
      </Text>

      {/* Input Container */}
      <View className={`flex-row items-center border rounded-lg px-3 py-3 ${
        error ? 'border-e2/50 bg-e1/20' : 'border-g2/50 bg-n1/80'
      }`}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={error ? '#DC2626' : '#6B7280'} 
            style={{ marginRight: 10 }}
          />
        )}
        
        {prefix && (
          <Text className="text-base text-g3 mr-2">{prefix}</Text>
        )}
        
        <RNTextInput
          className={`flex-1 text-base text-g4 ${inputClassName}`}
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          value={textValue}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...textInputProps}
        />
        
        {suffix && (
          <Text className="text-base text-g3 ml-2">{suffix}</Text>
        )}
      </View>

      {/* Error Message */}
      {error && (
        <Text className="text-e3 text-sm mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}