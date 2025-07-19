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
  placeholder = "Select an option",
  disabled = false,
  className = '',
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption?.label || placeholder;

  const handleSelect = (selectedValue: T) => {
    onValueChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <View className={`py-4 ${className}`}>
      {/* Label and Value */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base font-medium text-gray-700">
          {label}
        </Text>
        {selectedOption && (
          <Text className="text-base font-semibold text-primary-600">
            {selectedOption.sublabel || selectedOption.label}
          </Text>
        )}
      </View>

      {/* Dropdown Button */}
      <Pressable
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={`bg-white border border-gray-300 rounded-lg p-4 flex-row justify-between items-center ${
          disabled ? 'bg-gray-100 opacity-50' : 'active:bg-gray-50'
        }`}
      >
        <Text className={`font-medium ${
          selectedOption ? 'text-gray-800' : 'text-gray-500'
        }`}>
          {displayValue}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={disabled ? "#9CA3AF" : "#6B7280"} 
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
          className="flex-1 bg-black bg-opacity-50 justify-center items-center"
          onPress={() => setIsOpen(false)}
        >
          <View className="bg-white rounded-xl mx-4 max-h-96 w-80">
            <View className="p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-800 text-center">
                {label}
              </Text>
            </View>
            
            <ScrollView className="max-h-80">
              {options.map((option, index) => (
                <Pressable
                  key={`${option.value}-${index}`}
                  onPress={() => handleSelect(option.value)}
                  className={`p-4 flex-row justify-between items-center border-b border-gray-100 ${
                    option.value === value ? 'bg-primary-50' : 'active:bg-gray-50'
                  }`}
                >
                  <View className="flex-1">
                    <Text className={`font-medium ${
                      option.value === value ? 'text-primary-800' : 'text-gray-800'
                    }`}>
                      {option.label}
                    </Text>
                    {option.sublabel && (
                      <Text className={`text-sm mt-1 ${
                        option.value === value ? 'text-primary-600' : 'text-gray-600'
                      }`}>
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