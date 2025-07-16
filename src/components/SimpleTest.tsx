import React from 'react';
import { View, Text } from 'react-native';

/**
 * Simple test component to verify basic styling works
 */
export default function SimpleTest() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 20 }}>
        Inline Styles Test
      </Text>
      
      <View 
        className="bg-blue-500 p-4 rounded-lg mb-4"
        style={{ backgroundColor: '#3B82F6', padding: 16, borderRadius: 8, marginBottom: 16 }}
      >
        <Text 
          className="text-white font-bold"
          style={{ color: 'white', fontWeight: 'bold' }}
        >
          This should be blue with white text
        </Text>
      </View>
      
      <View className="bg-red-500 p-4 rounded-lg">
        <Text className="text-white">
          This should be red with Tailwind classes
        </Text>
      </View>
      
      <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 20 }}>
        If you see colors and styling, NativeWind is working!
      </Text>
    </View>
  );
}