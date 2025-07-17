import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useAppStore } from '@/src/stores/app-store';

/**
 * Settings screen
 * Manages app preferences, currency, measurements, and account settings
 */
export default function SettingsScreen() {
  const { measurementSystem, setMeasurementSystem, baseCurrency } = useAppStore();

  const toggleMeasurementSystem = () => {
    setMeasurementSystem(measurementSystem === 'US' ? 'Metric' : 'US');
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Settings
          </Text>
          <Text className="text-gray-600">
            Customize your PourCost experience
          </Text>
        </View>

        {/* Measurement System */}
        <View className="card mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-3">
            Measurement System
          </Text>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-medium text-gray-800">
                Current: {measurementSystem}
              </Text>
              <Text className="text-sm text-gray-600">
                {measurementSystem === 'US' ? 'Fluid ounces, cups, etc.' : 'Milliliters, liters, etc.'}
              </Text>
            </View>
            <Pressable
              onPress={toggleMeasurementSystem}
              className="bg-primary-600 px-4 py-2 rounded-lg active:bg-primary-700"
            >
              <Text className="text-white font-medium">
                Switch to {measurementSystem === 'US' ? 'Metric' : 'US'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Currency */}
        <View className="card mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-3">
            Currency
          </Text>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-medium text-gray-800">
                Base Currency: {baseCurrency}
              </Text>
              <Text className="text-sm text-gray-600">
                All prices will be displayed in this currency
              </Text>
            </View>
            <Pressable className="bg-gray-200 px-4 py-2 rounded-lg active:bg-gray-300">
              <Text className="text-gray-700 font-medium">
                Change
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Account */}
        <View className="card mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-3">
            Account
          </Text>
          <View className="space-y-3">
            <Pressable className="bg-gray-50 p-4 rounded-lg active:bg-gray-100">
              <Text className="font-medium text-gray-800">
                Sign In / Sign Up
              </Text>
              <Text className="text-sm text-gray-600">
                Sync your data across devices
              </Text>
            </Pressable>
            <Pressable className="bg-gray-50 p-4 rounded-lg active:bg-gray-100">
              <Text className="font-medium text-gray-800">
                Backup & Restore
              </Text>
              <Text className="text-sm text-gray-600">
                Manage your data backup
              </Text>
            </Pressable>
          </View>
        </View>

        {/* About */}
        <View className="card">
          <Text className="text-lg font-semibold text-gray-700 mb-3">
            About
          </Text>
          <View className="space-y-3">
            <View className="bg-gray-50 p-4 rounded-lg">
              <Text className="font-medium text-gray-800 mb-1">
                Version
              </Text>
              <Text className="text-sm text-gray-600">
                1.0.0 (React Native)
              </Text>
            </View>
            <Pressable className="bg-gray-50 p-4 rounded-lg active:bg-gray-100">
              <Text className="font-medium text-gray-800">
                Help & Support
              </Text>
              <Text className="text-sm text-gray-600">
                Get help using PourCost
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}