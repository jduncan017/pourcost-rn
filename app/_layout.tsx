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
import { useEffect, useState, useCallback } from 'react';
import 'react-native-reanimated';
import { View, Image, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useTheme, useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import { ToastContainer } from '@/src/components/ui/Toast';
import { useAppStore } from '@/src/stores/app-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { initNetworkMonitor } from '@/src/lib/network-monitor';
import { initOfflineQueue } from '@/src/lib/offline-queue';

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

  // Initialize network monitoring and offline queue
  useEffect(() => {
    const cleanupNetwork = initNetworkMonitor();
    const cleanupQueue = initOfflineQueue();
    return () => {
      cleanupNetwork();
      cleanupQueue();
    };
  }, []);

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

function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: palette.B9, alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={require('@/assets/images/PC-Logo-Gold.png')}
        style={{ width: 260, height: 65, marginBottom: 32 }}
        resizeMode="contain"
      />
      <ActivityIndicator size="small" color={palette.N4} />
    </View>
  );
}

function RootLayoutNav() {
  const { isDarkMode } = useTheme();
  const colors = useThemeColors();
  const { session, isLoading: authLoading, isNewSignUp } = useAuth();
  const isOnboarding = isNewSignUp && !!session;
  const router = useRouter();
  const segments = useSegments();
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize user data when session becomes available, clear on sign-out
  const initializeUserData = useCallback(async () => {
    setIsInitializing(true);
    try {
      await Promise.all([
        useAppStore.getState().loadProfile(),
        useIngredientsStore.getState().loadIngredients(true),
        useCocktailsStore.getState().loadCocktails(true),
      ]);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (session && !isNewSignUp) {
      // Only load data for returning users, not during onboarding
      initializeUserData();
    } else if (!session) {
      useAppStore.getState().resetToDefaults();
      useIngredientsStore.getState().reset();
      useCocktailsStore.getState().reset();
    }
  }, [session, authLoading, isNewSignUp, initializeUserData]);

  // Redirect based on auth state — wait for initialization to complete
  useEffect(() => {
    if (authLoading || isInitializing) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/landing' as any);
    } else if (session && inAuthGroup && !isOnboarding) {
      // Only redirect out of auth when not mid-onboarding
      router.replace('/(drawer)/cocktails' as any);
    }
  }, [session, authLoading, isInitializing, isOnboarding, segments]);

  const isReady = !authLoading && !isInitializing;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
        {!isReady && <LoadingScreen />}
        <View style={{ flex: 1, display: isReady ? 'flex' : 'none' }}>
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
            <Stack.Screen name="container-sizes" options={{ title: 'Container Sizes' }} />
            <Stack.Screen name="invoice-review" options={{ title: 'Review Invoice' }} />
            <Stack.Screen name="invoice-line-edit" options={{ title: 'Edit Line Item' }} />
          </Stack>
        </View>
        <ToastContainer />
      </NavigationThemeProvider>
    </GestureHandlerRootView>
  );
}
