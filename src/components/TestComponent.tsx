import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useAppStore } from '../stores/app-store';

/**
 * Test component to verify our setup works
 * Uses NativeWind v4 + Tailwind v3 (stable) + Zustand for state management
 * Structured for easy migration to v5 + v4 when stable
 */
export default function TestComponent() {
  const { measurementSystem, setMeasurementSystem, baseCurrency } = useAppStore();

  const toggleMeasurement = () => {
    setMeasurementSystem(measurementSystem === 'US' ? 'Metric' : 'US');
  };

  return (
    <View className="flex-1 items-center justify-center bg-gray-50 p-4">
      <Text className="text-3xl font-bold text-gray-800 mb-6 text-gradient">
        PourCost Setup ✨
      </Text>
      
      <View className="card mb-6 min-w-[280px]">
        <Text className="text-lg font-semibold text-gray-700 mb-4">
          Current Settings:
        </Text>
        <View className="space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Measurement:</Text>
            <Text className="font-medium text-primary-600">
              {measurementSystem}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Currency:</Text>
            <Text className="font-medium text-primary-600">
              {baseCurrency}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={toggleMeasurement}
        className="btn-primary"
      >
        <Text className="text-white font-semibold text-center">
          Switch to {measurementSystem === 'US' ? 'Metric' : 'US'}
        </Text>
      </Pressable>
      
      <Text className="text-sm text-gray-500 mt-6 text-center">
        NativeWind v4 + Tailwind v3 (stable) + Zustand + TypeScript
      </Text>
      
      <Text className="text-xs text-gray-400 mt-2 text-center">
        Ready for v5 + v4 migration when stable
      </Text>
    </View>
  );
}