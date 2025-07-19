import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import Card from '@/src/components/ui/Card';

/**
 * About screen
 * Information about PourCost, help, and support
 */
export default function AboutScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            About PourCost
          </Text>
          <Text className="text-gray-600">
            Your professional cocktail cost calculator
          </Text>
        </View>

        {/* App Info */}
        <View className="card mb-6">
          <View className="items-center mb-4">
            <View className="w-16 h-16 bg-primary-600 rounded-xl items-center justify-center mb-3">
              <Text className="text-white text-2xl font-bold">PC</Text>
            </View>
            <Text className="text-xl font-bold text-gray-800">PourCost</Text>
            <Text className="text-gray-600">Version 1.0.0</Text>
          </View>
          <Text className="text-gray-700 text-center leading-relaxed">
            PourCost helps bartenders, bar owners, and cocktail enthusiasts calculate 
            accurate drink costs and set profitable pricing. Built with precision and 
            ease of use in mind.
          </Text>
        </View>

        {/* Features */}
        <View className="card mb-6">
          <Text className="text-lg font-semibold text-gray-700 mb-3">
            Features
          </Text>
          <View className="space-y-2">
            <Text className="text-gray-700">• Calculate cost per pour for any ingredient</Text>
            <Text className="text-gray-700">• Create and save complex cocktail recipes</Text>
            <Text className="text-gray-700">• Set profit margins and suggested pricing</Text>
            <Text className="text-gray-700">• Support for US and Metric measurements</Text>
            <Text className="text-gray-700">• Multi-currency support</Text>
            <Text className="text-gray-700">• Cloud sync across devices</Text>
          </View>
        </View>

        {/* Help */}
        <View className="card mb-6">
          <Text className="text-lg font-semibold text-gray-700 mb-3">
            Getting Started
          </Text>
          <View className="space-y-3">
            <View className="bg-gray-50 p-4 rounded-lg">
              <Text className="font-medium text-gray-800 mb-1">
                1. Add Your Ingredients
              </Text>
              <Text className="text-sm text-gray-600">
                Start by adding the ingredients you use most often
              </Text>
            </View>
            <View className="bg-gray-50 p-4 rounded-lg">
              <Text className="font-medium text-gray-800 mb-1">
                2. Calculate Costs
              </Text>
              <Text className="text-sm text-gray-600">
                Use the calculator to determine cost per pour
              </Text>
            </View>
            <View className="bg-gray-50 p-4 rounded-lg">
              <Text className="font-medium text-gray-800 mb-1">
                3. Create Cocktails
              </Text>
              <Text className="text-sm text-gray-600">
                Combine ingredients to create profitable cocktail recipes
              </Text>
            </View>
          </View>
        </View>

        {/* Support */}
        <Card>
          <Text className="text-lg font-semibold text-gray-700 mb-3">
            Support
          </Text>
          <Text className="text-gray-700 leading-relaxed">
            Need help? Have suggestions? We'd love to hear from you! 
            Contact us for support and feedback.
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
}