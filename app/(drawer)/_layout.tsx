import React from 'react';
import { Platform, View, Text, Pressable } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { useThemeColors, useTheme } from '@/src/contexts/ThemeContext';
import CustomDrawerContent from '@/src/components/CustomDrawerContent';

/**
 * Drawer navigation layout for PourCost
 * Provides side menu navigation matching iOS app structure
 */
function DynamicHeader() {
  const router = useRouter();
  const colors = useThemeColors();
  const segments = useSegments();

  const handleSearchPress = () => {
    router.push('/search');
  };

  // Get the current route title
  const getPageTitle = () => {
    const currentRoute = segments[segments.length - 1];
    switch (currentRoute) {
      case 'calculator':
        return 'Quick Calculator';
      case 'ingredients':
        return 'Ingredients';
      case 'cocktails':
        return 'Cocktails';
      case 'settings':
        return 'Settings';
      case 'about':
        return 'About';
      case 'search':
        return 'Search';
      default:
        return 'PourCost';
    }
  };

  // Don't show search icon on search screen
  const showSearchIcon = segments[segments.length - 1] !== 'search';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
        paddingHorizontal: 16,
        backgroundColor: colors.headerBackground,
        position: 'relative',
      }}
    >
      {/* Left side - keeps space for hamburger menu */}
      <View style={{ width: 40 }} />

      {/* Absolutely Centered Title */}
      <View>
        <Text
          style={{
            fontFamily: 'Geist',
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
          }}
        >
          {getPageTitle()}
        </Text>
      </View>

      {/* Right-aligned Search Icon */}
      {showSearchIcon ? (
        <Pressable
          onPress={handleSearchPress}
          style={{
            padding: 8,
            borderRadius: 8,
            position: 'relative',
            right: 0,
          }}
        >
          <Ionicons name="search" size={20} color={colors.text} />
        </Pressable>
      ) : (
        <View style={{ width: 40 }} />
      )}
    </View>
  );
}

export default function DrawerLayout() {
  const colors = useThemeColors();

  // For web, use tabs instead of drawer for better compatibility
  if (Platform.OS === 'web') {
    return (
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
          headerTintColor: colors.text,
          tabBarStyle: {
            backgroundColor: colors.surface,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
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
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          backgroundColor: colors.surface,
          width: 280,
        },
        drawerActiveTintColor: colors.accent,
        drawerInactiveTintColor: colors.textSecondary,
        headerStyle: {
          backgroundColor: colors.headerBackground,
        },
        headerTintColor: colors.text,
        headerTitle: () => <DynamicHeader />,
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
