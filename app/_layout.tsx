// Import global CSS for NativeWind FIRST
import '../global.css';

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useTheme, useThemeColors } from '@/src/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import { ToastContainer } from '@/src/components/ui/Toast';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(drawer)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Geist: require('../assets/fonts/Geist-VariableFont_wght.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const { isDarkMode } = useTheme();
  const colors = useThemeColors();
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Redirect based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
    } else if (session && inAuthGroup) {
      router.replace('/(drawer)/cocktails' as any);
    }
  }, [session, isLoading, segments]);

  // Show nothing while checking auth (splash screen is still visible)
  if (isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.headerBackground,
            },
            headerTintColor: colors.text,
            headerBackButtonDisplayMode: 'minimal',
            headerShadowVisible: false,
            headerLeft: ({ canGoBack }) =>
              canGoBack ? (
                <Pressable onPress={() => router.back()} className="py-2 pr-4">
                  <Ionicons name="arrow-back" size={22} color={colors.text} />
                </Pressable>
              ) : null,
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
          <Stack.Screen name="cocktail-detail" options={{ title: '' }} />
          <Stack.Screen name="ingredient-detail" options={{ title: '' }} />
          <Stack.Screen name="cocktail-form" options={{ title: '' }} />
          <Stack.Screen name="ingredient-form" options={{ title: '' }} />
          <Stack.Screen name="ingredient-selector" options={{ title: 'Add Ingredients' }} />
          <Stack.Screen name="search" options={{ title: 'Search' }} />
        </Stack>
        <ToastContainer />
      </NavigationThemeProvider>
    </GestureHandlerRootView>
  );
}
