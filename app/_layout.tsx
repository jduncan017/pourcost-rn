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
import { PlayfairDisplay_400Regular_Italic, PlayfairDisplay_600SemiBold_Italic } from '@expo-google-fonts/playfair-display';
import { Stack, useSegments } from 'expo-router';
import { useGuardedRouter } from '@/src/lib/guarded-router';
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
import { getPostHog, setAnalyticsUser } from '@/src/services/analytics-service';
import { PostHogProvider } from 'posthog-react-native';

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
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_600SemiBold_Italic,
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

  // Singleton PostHog client. Returns null when EXPO_PUBLIC_POSTHOG_KEY isn't
  // set, in which case PostHogProvider becomes a passthrough.
  const posthogClient = getPostHog();

  const tree = (
    <AuthProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </AuthProvider>
  );

  return posthogClient ? (
    <PostHogProvider client={posthogClient} autocapture={{ captureTouches: true, captureScreens: true }}>
      {tree}
    </PostHogProvider>
  ) : (
    tree
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
  const router = useGuardedRouter();
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
    setAnalyticsUser(session?.user?.id ?? null);
  }, [session?.user?.id]);

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

  // Redirect based on auth state. We DON'T wait for data initialization —
  // the app renders as soon as auth is settled, and each screen shows its
  // own skeleton (SkeletonLoader on the lists) while ingredients/cocktails
  // fetch in the background. Faster perceived boot than blocking on a
  // full LoadingScreen.
  useEffect(() => {
    if (authLoading) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/landing' as any);
    } else if (session && inAuthGroup && !isOnboarding) {
      // Only redirect out of auth when not mid-onboarding
      const landing = useAppStore.getState().defaultLandingScreen;
      const route =
        landing === 'ingredients'
          ? '/(drawer)/ingredients'
          : landing === 'calculator'
            ? '/(drawer)/calculator'
            : '/(drawer)/cocktails';
      router.replace(route as any);
    }
  }, [session, authLoading, isInitializing, isOnboarding, segments]);

  // Only block render on auth check — data initialization runs in parallel
  // and screens handle their own loading states. Means the user lands inside
  // the app instantly after auth and sees skeletons fill in vs staring at a
  // blank loader for the full data round-trip.
  const isReady = !authLoading;

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
            <Stack.Screen name="ingredient-create" options={{ title: 'Add Ingredient' }} />
            <Stack.Screen name="ingredient-preview" options={{ title: '' }} />
            <Stack.Screen name="cocktails-browse" options={{ title: 'Browse Library' }} />
            <Stack.Screen name="cocktails-browse-prices" options={{ title: 'Set Prices', headerShown: false }} />
            <Stack.Screen name="cocktails-browse-adopting" options={{ headerShown: false }} />
            <Stack.Screen name="wells-setup" options={{ title: 'Manage Wells' }} />
            <Stack.Screen name="ingredient-size-form" options={{ title: '' }} />
            <Stack.Screen name="ingredient-selector" options={{ title: 'Add Ingredients' }} />
            <Stack.Screen name="search" options={{ title: 'Search' }} />
            <Stack.Screen name="container-sizes" options={{ title: 'Container Sizes' }} />
            <Stack.Screen name="settings-account" options={{ title: 'Account' }} />
            <Stack.Screen name="settings-calculations" options={{ title: 'Calculations' }} />
            <Stack.Screen name="settings-pour-sizes" options={{ title: 'Default Pour Sizes' }} />
            <Stack.Screen name="settings-retail-prices" options={{ title: 'Default Retail Prices' }} />
            <Stack.Screen name="settings-tiers" options={{ title: 'Pour Cost Targets' }} />
            <Stack.Screen name="getting-started" options={{ title: 'Getting Started' }} />
            <Stack.Screen name="settings-glossary" options={{ title: 'Glossary' }} />
            <Stack.Screen name="settings-pro-tips" options={{ title: 'Pro Tips' }} />
            <Stack.Screen name="settings-pro-tip" options={{ title: 'Pro Tip' }} />
            <Stack.Screen name="settings-conversions" options={{ title: 'Conversions' }} />
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
