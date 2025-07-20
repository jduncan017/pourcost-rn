import React from 'react';
import {
  Platform,
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Link } from 'expo-router';

/**
 * Drawer navigation layout for PourCost
 * Provides side menu navigation matching iOS app structure
 */
function LogoHeader() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      }}
    >
      <Image
        source={require('../../assets/images/PourCost-Logo-Black.png')}
        style={{ width: 120, height: 30 }}
        resizeMode="contain"
      />
    </View>
  );
}

export default function DrawerLayout() {
  // For web, use tabs instead of drawer for better compatibility
  if (Platform.OS === 'web') {
    return (
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#1f2937',
          tabBarStyle: {
            backgroundColor: '#f8fafc',
          },
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#64748b',
        }}
      >
        <Tabs.Screen
          name="calculator"
          options={{
            title: 'Calculator',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calculator" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="ingredients"
          options={{
            title: 'Ingredients',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="flask" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="cocktails"
          options={{
            title: 'Cocktails',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wine" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="about"
          options={{
            title: 'About',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="information-circle" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    );
  }

  // For mobile, use drawer navigation
  const DrawerContent = (
    <Drawer
      screenOptions={{
        drawerStyle: {
          backgroundColor: '#f8fafc',
          width: 280,
        },
        drawerActiveTintColor: '#2563eb',
        drawerInactiveTintColor: '#64748b',
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#1f2937',
        headerTitle: () => <LogoHeader />,
      }}
    >
      <Drawer.Screen
        name="calculator"
        options={{
          drawerLabel: 'Quick Calculator',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="calculator" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="ingredients"
        options={{
          drawerLabel: 'Ingredients',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="flask" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="cocktails"
        options={{
          drawerLabel: 'Cocktails',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="wine" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="about"
        options={{
          drawerLabel: 'About',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="information-circle" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {DrawerContent}
    </GestureHandlerRootView>
  );
}
