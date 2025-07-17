import React from 'react';
import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';

// Navigation items configuration
const navigationItems = [
  {
    name: 'calculator',
    label: 'Quick Calculator',
    icon: 'calculator' as const,
    description: 'Calculate ingredient costs',
  },
  {
    name: 'ingredients',
    label: 'Ingredients',
    icon: 'flask' as const,
    description: 'Manage your inventory',
  },
  {
    name: 'cocktails',
    label: 'Cocktails',
    icon: 'wine' as const,
    description: 'Recipe cost analysis',
  },
  {
    name: 'settings',
    label: 'Settings',
    icon: 'settings' as const,
    description: 'App preferences',
  },
  {
    name: 'about',
    label: 'About',
    icon: 'information-circle' as const,
    description: 'App information',
  },
];

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1] || 'calculator';

  const handleNavigation = (routeName: string) => {
    router.push(`/(drawer)/${routeName}` as any);
  };

  return (
    <DrawerContentScrollView 
      {...props} 
      contentContainerStyle={{ flex: 1 }}
      className="bg-gray-50"
    >
      {/* Header with Logo */}
      <View className="px-6 py-8 bg-white border-b border-gray-200">
        <Image 
          source={require('../../assets/images/PourCost-Logo-Black.png')}
          style={{ width: 140, height: 35 }}
          resizeMode="contain"
        />
        <Text className="text-gray-600 text-sm mt-2">
          Professional cocktail costing
        </Text>
      </View>

      {/* Navigation Items */}
      <View className="flex-1 py-4">
        {navigationItems.map((item) => {
          const isActive = currentRoute === item.name;
          
          return (
            <Pressable
              key={item.name}
              onPress={() => handleNavigation(item.name)}
              className={`mx-3 mb-2 px-4 py-4 rounded-lg ${
                isActive 
                  ? 'bg-primary-100 border border-primary-200' 
                  : 'bg-transparent active:bg-gray-100'
              }`}
            >
              <View className="flex-row items-center">
                <View className={`w-10 h-10 rounded-lg items-center justify-center mr-3 ${
                  isActive ? 'bg-primary-600' : 'bg-gray-200'
                }`}>
                  <Ionicons 
                    name={item.icon} 
                    size={20} 
                    color={isActive ? '#ffffff' : '#6B7280'} 
                  />
                </View>
                
                <View className="flex-1">
                  <Text className={`text-base font-semibold ${
                    isActive ? 'text-primary-800' : 'text-gray-800'
                  }`}>
                    {item.label}
                  </Text>
                  <Text className={`text-sm ${
                    isActive ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {item.description}
                  </Text>
                </View>

                {isActive && (
                  <View className="w-1 h-6 bg-primary-600 rounded-full ml-2" />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Footer */}
      <View className="px-6 py-4 border-t border-gray-200">
        <Text className="text-gray-400 text-xs text-center">
          PourCost v2.0
        </Text>
        <Text className="text-gray-400 text-xs text-center mt-1">
          Built with React Native & Expo
        </Text>
      </View>
    </DrawerContentScrollView>
  );
}