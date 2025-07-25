import React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View className="bg-n1 dark:bg-g1 rounded-lg border border-g1/50 flex-row items-center px-4 py-3">
      <Ionicons name="search" size={20} color="#111111" />

      <TextInput
        className="flex-1 ml-3 text-base text-g4 font-medium leading-5"
        placeholder={placeholder}
        placeholderTextColor={'#AFAFAF'}
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
          <Ionicons name="close-circle" size={20} color="#111111" />
        </Pressable>
      )}
    </View>
  );
}
