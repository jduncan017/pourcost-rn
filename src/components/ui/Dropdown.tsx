import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption?.label || placeholder;

  const handleSelect = (selectedValue: T) => {
    onValueChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <View className={`${className}`}>
      {/* Label and Value */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base font-medium text-g4 dark:text-n1">
          {label}
        </Text>
      </View>

      {/* Dropdown Button */}
      <Pressable
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={`bg-n1/80 dark:bg-g1 border border-g2/50 rounded-lg p-4 flex-row justify-between items-center ${
          disabled ? 'bg-g1/60 opacity-50' : 'active:bg-n1'
        }`}
      >
        <Text
          className={`font-medium ${selectedOption ? 'text-g4' : 'text-g3'}`}
        >
          {displayValue}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={disabled ? '#9CA3AF' : '#6B7280'}
        />
      </Pressable>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1 bg-p4/90 bg-opacity-50 justify-center items-center"
          onPress={() => setIsOpen(false)}
        >
          <View className="bg-n1 dark:bg-g1 rounded-xl mx-4 max-h-96 w-80">
            <View className="p-4 border-b border-g/50 dark:border-g2/50">
              <Text className="text-xl font-bold text-g4 text-center">
                {label}
              </Text>
            </View>

            <ScrollView className="max-h-80">
              {options.map((option, index) => (
                <Pressable
                  key={`${option.value}-${index}`}
                  onPress={() => handleSelect(option.value)}
                  className={`p-4 flex-row justify-between items-center border-b border-g1/40 dark:border-g2/20 ${
                    option.value === value ? 'bg-p1/20' : 'active:bg-n1'
                  }`}
                >
                  <View className="flex-1">
                    <Text
                      className={`font-medium tracking-wider ${
                        option.value === value ? 'text-p3' : 'text-g4'
                      }`}
                    >
                      {option.label}
                    </Text>
                    {option.sublabel && (
                      <Text
                        className={`text-sm mt-1 ${
                          option.value === value ? 'text-p2' : 'text-g3'
                        }`}
                      >
                        {option.sublabel}
                      </Text>
                    )}
                  </View>
                  {option.value === value && (
                    <Ionicons name="checkmark" size={20} color="#2563EB" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
