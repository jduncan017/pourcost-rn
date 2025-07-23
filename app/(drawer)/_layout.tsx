import { Pressable } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import CustomDrawerContent from '@/src/components/CustomDrawerContent';

/**
 * Drawer navigation layout for PourCost
 * Provides side menu navigation matching iOS app structure
 */

// Search icon component for header right
function SearchIcon() {
  const router = useRouter();
  const colors = useThemeColors();
  const segments = useSegments();

  // Don't show search icon on search screen
  const showSearchIcon = segments[segments.length - 1] !== 'search';

  if (!showSearchIcon) return null;

  return (
    <Pressable
      onPress={() => router.push('/search')}
      className="p-2 rounded-lg"
    >
      <Ionicons name="search" size={20} color={colors.text} />
    </Pressable>
  );
}

export default function DrawerLayout() {
  const colors = useThemeColors();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerStyle: {
            backgroundColor: colors.surface,
            width: 280,
          },
          drawerActiveTintColor: colors.accent,
          drawerInactiveTintColor: colors.textSecondary,
          drawerItemStyle: {
            marginVertical: 4,
          },
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
          headerTintColor: colors.text,
          headerRight: () => <SearchIcon />,
        }}
      >
        <Drawer.Screen
          name="cocktails"
          options={{
            title: 'Cocktails',
            drawerLabel: 'Cocktails',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="wine" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="ingredients"
          options={{
            title: 'Ingredients',
            drawerLabel: 'Ingredients',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="flask" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="calculator"
          options={{
            title: 'Quick Calculator',
            drawerLabel: 'Quick Calculator',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="calculator" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            title: 'Settings',
            drawerLabel: 'Settings',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="about"
          options={{
            title: 'About',
            drawerLabel: 'About',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="information-circle" size={size} color={color} />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
