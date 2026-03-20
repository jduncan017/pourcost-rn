import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import BottomSheet from './BottomSheet';

export interface DropdownOption<T = any> {
  value: T;
  label: string;
  sublabel?: string;
}

interface DropdownProps<T = any> {
  value: T;
  onValueChange: (value: T) => void;
  options: DropdownOption<T>[];
  label: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function Dropdown<T = any>({
  value,
  onValueChange,
  options,
  label,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const colors = useThemeColors();

  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption?.label || placeholder;

  const handleSelect = (selectedValue: T) => {
    onValueChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <View className={`${className}`}>
      {/* Label */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base font-medium text-g4 dark:text-n1">
          {label}
        </Text>
      </View>

      {/* Trigger Button */}
      <Pressable
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={`rounded-lg p-4 flex-row justify-between items-center border ${
          disabled ? 'opacity-50' : 'active:opacity-80'
        }`}
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        <Text
          className={`font-medium ${
            selectedOption ? 'text-g4 dark:text-n1' : 'text-g3 dark:text-g2'
          }`}
        >
          {displayValue}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </Pressable>

      {/* Bottom Sheet */}
      <BottomSheet
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        title={label}
      >
        <View className="pb-4">
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <View key={`${option.label}-${index}`}>
                {index > 0 && (
                  <View className="h-px mx-4" style={{ backgroundColor: colors.border + '40' }} />
                )}
                <Pressable
                  onPress={() => handleSelect(option.value)}
                  className={`px-4 py-3 flex-row justify-between items-center ${
                    isSelected ? '' : 'active:opacity-80'
                  }`}
                  style={
                    isSelected
                      ? { backgroundColor: colors.accent + '15' }
                      : undefined
                  }
                >
                <View className="flex-1 mr-3">
                  <Text
                    className={`font-medium tracking-wider ${
                      isSelected
                        ? 'text-p1 dark:text-s11'
                        : 'text-g4 dark:text-n1'
                    }`}
                  >
                    {option.label}
                  </Text>
                  {option.sublabel && (
                    <Text
                      className={`text-sm mt-1 ${
                        isSelected
                          ? 'text-p1/70 dark:text-s11/70'
                          : 'text-g3 dark:text-g2'
                      }`}
                    >
                      {option.sublabel}
                    </Text>
                  )}
                </View>
                {isSelected && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={colors.accent}
                  />
                )}
              </Pressable>
              </View>
            );
          })}
        </View>
      </BottomSheet>
    </View>
  );
}
