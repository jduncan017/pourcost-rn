import React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/contexts/ThemeContext';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  autoFocus?: boolean;
}

export default function SearchBar({
  placeholder = 'Search...',
  value,
  onChangeText,
  onClear,
  autoFocus = false,
}: SearchBarProps) {
  const { text, textSecondary } = useThemeColors();

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View className="bg-n1 dark:bg-p4/80 rounded-lg border border-p1/20 flex-row items-center px-4 py-3">
      <Ionicons name="search" size={20} color={text} />

      <TextInput
        className="flex-1 ml-3 text-base text-g4 font-medium leading-5"
        placeholder={placeholder}
        placeholderTextColor={textSecondary}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        clearButtonMode="never"
      />

      {value.length > 0 && (
        <Pressable
          onPress={handleClear}
          className="ml-2 p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={20} color={text} />
        </Pressable>
      )}
    </View>
  );
}
