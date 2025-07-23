// Import global CSS for NativeWind FIRST
import '../global.css';

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useTheme } from '@/src/contexts/ThemeContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(drawer)/calculator',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Geist variable font (supports all weights)
    Geist: require('../assets/fonts/Geist-VariableFont_wght.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
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
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { isDarkMode } = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
          <Stack.Screen name="cocktail-form" options={{ headerShown: false }} />
          <Stack.Screen
            name="ingredient-form"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ingredient-detail"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="cocktail-detail"
            options={{ headerShown: false }}
          />
        </Stack>
      </NavigationThemeProvider>
    </GestureHandlerRootView>
  );
}
