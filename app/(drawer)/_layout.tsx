import { Pressable, View, Text } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { DrawerActions } from '@react-navigation/native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments, useNavigation } from 'expo-router';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { useNetworkStatus } from '@/src/lib/useNetworkStatus';
import { HapticService } from '@/src/services/haptic-service';
import CustomDrawerContent from '@/src/components/CustomDrawerContent';
import { useAuth } from '@/src/contexts/AuthContext';

/**
 * Drawer navigation layout for PourCost
 * Provides side menu navigation matching iOS app structure
 */

// Hamburger menu icon for header left
function HamburgerIcon() {
  const navigation = useNavigation();
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={() => { HapticService.buttonPress(); navigation.dispatch(DrawerActions.toggleDrawer()); }}
      className="p-2 ml-2 rounded-lg"
    >
      <Ionicons name="menu" size={24} color={colors.text} />
    </Pressable>
  );
}

// Offline badge — shows when disconnected or ops are queued
function OfflineBadge() {
  const { isOnline, pendingOps } = useNetworkStatus();
  const colors = useThemeColors();

  if (isOnline && pendingOps === 0) return null;

  return (
    <View
      className="flex-row items-center gap-1 px-2 py-1 rounded-full"
      style={{ backgroundColor: colors.warningSubtle }}
    >
      <Ionicons
        name={isOnline ? 'cloud-upload-outline' : 'cloud-offline-outline'}
        size={14}
        color={colors.warning}
      />
      {pendingOps > 0 && (
        <Text style={{ color: colors.warning, fontSize: 12, fontWeight: '600' }}>
          {pendingOps}
        </Text>
      )}
    </View>
  );
}

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
      onPress={() => { HapticService.buttonPress(); router.push('/search'); }}
      className="p-2 mr-2 rounded-lg"
    >
      <Ionicons name="search" size={20} color={colors.text} />
    </Pressable>
  );
}

export default function DrawerLayout() {
  const colors = useThemeColors();
  const { isAdmin } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerType: 'front',
          drawerStyle: {
            backgroundColor: colors.surface,
            width: 280,
          },
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          drawerActiveTintColor: palette.N1,
          drawerInactiveTintColor: colors.textSecondary,
          drawerActiveBackgroundColor: colors.accent,
          drawerItemStyle: {
            marginVertical: 4,
            borderRadius: 8,
            marginHorizontal: 0,
          },
          headerStyle: {
            backgroundColor: colors.headerBackground,
            borderBottomWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          headerLeft: () => <HamburgerIcon />,
          headerRight: () => (
            <View className="flex-row items-center gap-1">
              <OfflineBadge />
              <SearchIcon />
            </View>
          ),
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
          name="invoices"
          options={{
            title: 'Invoices',
            drawerLabel: 'Invoices',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="receipt-outline" size={size} color={color} />
            ),
            drawerItemStyle: isAdmin ? undefined : { display: 'none' },
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
          name="batch"
          options={{
            title: 'Batch',
            drawerLabel: 'Batch',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="layers-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            title: 'Settings',
            drawerItemStyle: { display: 'none' },
          }}
        />
      </Drawer>
    </View>
  );
}
