import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';

/**
 * Test component to verify dark mode is working
 * Shows light/dark mode styling examples
 */
export default function ThemeTestCard() {
  const { isDarkMode } = useTheme();

  return (
    <View className="p-4 mb-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Theme Test Card
      </Text>
      <Text className="text-gray-600 dark:text-gray-300 mb-2">
        Current mode: {isDarkMode ? 'Dark' : 'Light'}
      </Text>
      <Text className="text-sm text-gray-500 dark:text-gray-400">
        This card demonstrates how Tailwind dark mode classes work with our theme system.
      </Text>
      
      {/* Color examples */}
      <View className="mt-3 space-y-2">
        <View className="p-2 bg-p1 rounded">
          <Text className="text-white font-medium">Primary Color (p1)</Text>
        </View>
        <View className="p-2 bg-s21 rounded">
          <Text className="text-white font-medium">Secondary Teal (s21)</Text>
        </View>
        <View className="p-2 bg-g2 dark:bg-g3 rounded">
          <Text className="text-gray-800 dark:text-gray-200 font-medium">
            Adaptive Grey (g2/g3)
          </Text>
        </View>
      </View>
    </View>
  );
}