import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import BottomSheet from './BottomSheet';

export interface DropdownOption<T = any> {
  value: T;
  label: string;
  sublabel?: string;
  section?: string; // Section header — renders before this option when section changes
}

interface DropdownProps<T = any> {
  value: T;
  onValueChange: (value: T) => void;
  options: DropdownOption<T>[];
  label: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  sheetHeaderRight?: React.ReactNode | ((close: () => void) => React.ReactNode);
}

export default function Dropdown<T = any>({
  value,
  onValueChange,
  options,
  label,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  sheetHeaderRight,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const colors = useThemeColors();

  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption?.label || placeholder;

  const handleSelect = (selectedValue: T) => {
    onValueChange(selectedValue);
    setIsOpen(false);
  };

  let lastSection: string | undefined;

  return (
    <View className={`${className}`}>
      {/* Label */}
      {label ? (
        <Text
          className="text-[11px] tracking-widest uppercase mb-2"
          style={{ color: colors.textTertiary, fontWeight: '600' }}
        >
          {label}
        </Text>
      ) : null}

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
          className="font-medium"
          style={{ color: selectedOption ? colors.text : colors.textTertiary }}
        >
          {displayValue}
        </Text>
        <Ionicons name="chevron-expand-outline" size={18} color={colors.textTertiary} />
      </Pressable>

      {/* Bottom Sheet */}
      <BottomSheet
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        title={label}
        headerRight={typeof sheetHeaderRight === 'function' ? sheetHeaderRight(() => setIsOpen(false)) : sheetHeaderRight}
      >
        <View className="pb-4">
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const showSectionHeader = option.section && option.section !== lastSection;
            lastSection = option.section;

            return (
              <View key={`${option.label}-${index}`}>
                {/* Section header */}
                {showSectionHeader && (
                  <View
                    className="px-4 pt-4 pb-2"
                    style={index > 0 ? { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4 } : undefined}
                  >
                    <Text
                      className="text-xs tracking-widest uppercase"
                      style={{ color: colors.gold, fontWeight: '600' }}
                    >
                      {option.section}
                    </Text>
                  </View>
                )}
                {/* Divider between items in same section */}
                {!showSectionHeader && index > 0 && (
                  <View className="h-px mx-4" style={{ backgroundColor: colors.border + '40' }} />
                )}
                <Pressable
                  onPress={() => handleSelect(option.value)}
                  className={`px-4 py-3 flex-row justify-between items-center ${
                    isSelected ? '' : 'active:opacity-80'
                  }`}
                  style={
                    isSelected
                      ? { backgroundColor: colors.accent }
                      : undefined
                  }
                >
                <View className="flex-1 mr-3">
                  <Text
                    className="font-medium tracking-wider"
                    style={{ color: isSelected ? palette.N1 : colors.text }}
                  >
                    {option.label}
                  </Text>
                  {option.sublabel && (
                    <Text
                      className="text-sm mt-1"
                      style={{ color: isSelected ? palette.N2 : colors.textTertiary }}
                    >
                      {option.sublabel}
                    </Text>
                  )}
                </View>
                {isSelected && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={palette.N1}
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
