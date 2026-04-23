// Import global CSS for NativeWind FIRST
import '../global.css';
// WebCrypto polyfills for supabase-js PKCE (needs getRandomValues + subtle.digest).
// react-native-get-random-values ships the former; expo-crypto backs our manual
// subtle.digest shim below so supabase-js can use SHA256 instead of plain PKCE.
import 'react-native-get-random-values';
import * as ExpoCrypto from 'expo-crypto';
if (typeof globalThis.crypto !== 'undefined' && !(globalThis.crypto as any).subtle) {
  (globalThis.crypto as any).subtle = {
    digest: async (
      algorithm: string | { name: string },
      data: ArrayBuffer | ArrayBufferView,
    ): Promise<ArrayBuffer> => {
      const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
      const map: Record<string, ExpoCrypto.CryptoDigestAlgorithm> = {
        'SHA-1': ExpoCrypto.CryptoDigestAlgorithm.SHA1,
        'SHA-256': ExpoCrypto.CryptoDigestAlgorithm.SHA256,
        'SHA-384': ExpoCrypto.CryptoDigestAlgorithm.SHA384,
        'SHA-512': ExpoCrypto.CryptoDigestAlgorithm.SHA512,
      };
      const algo = map[name];
      if (!algo) throw new Error(`Unsupported digest algorithm: ${name}`);
      return ExpoCrypto.digest(algo, data as ArrayBuffer);
    },
  };
}

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
import { HapticService } from '@/src/services/haptic-service';
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
  // Track which user ID we've loaded data for. Only reload when the user
  // actually changes — not on every session object refresh (token refresh,
  // resend email, updateUser, etc.), which would flash the LoadingScreen.
  const [initializedUserId, setInitializedUserId] = useState<string | null>(null);

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
    const currentUserId = session?.user?.id ?? null;

    if (currentUserId && !isNewSignUp) {
      // Only reinitialize if this is a different user (cold boot or switch).
      // Subsequent session refreshes for the same user should be silent.
      if (currentUserId !== initializedUserId) {
        initializeUserData().then(() => setInitializedUserId(currentUserId));
      }
    } else if (!currentUserId) {
      useAppStore.getState().resetToDefaults();
      useIngredientsStore.getState().reset();
      useCocktailsStore.getState().reset();
      setInitializedUserId(null);
    }
  }, [session, authLoading, isNewSignUp, initializeUserData, initializedUserId]);

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
                  <Pressable
                    onPress={() => { HapticService.buttonPress(); router.back(); }}
                    // Equal padding so the icon centers inside iOS 26's liquid-glass
                    // back-button circle. Asymmetric padding shifts it visually off-center.
                    hitSlop={10}
                    style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
                  >
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
            <Stack.Screen name="settings-account" options={{ title: 'Account' }} />
            <Stack.Screen name="settings-calculations" options={{ title: 'Calculations' }} />
            <Stack.Screen name="change-password" options={{ title: 'Change Password' }} />
            <Stack.Screen name="invoice-review" options={{ title: 'Review Invoice' }} />
            <Stack.Screen name="invoice-line-edit" options={{ title: 'Edit Line Item' }} />
            <Stack.Screen name="invoice-ingredient-setup" options={{ title: 'Set Up Ingredients' }} />
          </Stack>
        </View>
        <ToastContainer />
      </NavigationThemeProvider>
    </GestureHandlerRootView>
  );
}
