import { useRouter, useSegments, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

/**
 * Custom navigation hook providing convenient navigation utilities
 * Built on top of Expo Router
 */
export function useNavigation() {
  const router = useRouter();
  const segments = useSegments();
  const params = useLocalSearchParams();

  // Get current route info
  const currentRoute = segments[segments.length - 1] || 'calculator';
  const isDrawerRoute = segments.includes('(drawer)');

  // Navigation helpers
  const navigateTo = useCallback((route: string, options?: { replace?: boolean }) => {
    const fullRoute = isDrawerRoute ? `/(drawer)/${route}` : `/${route}`;
    
    if (options?.replace) {
      router.replace(fullRoute as any);
    } else {
      router.push(fullRoute as any);
    }
  }, [router, isDrawerRoute]);

  const navigateToCalculator = useCallback(() => {
    navigateTo('calculator');
  }, [navigateTo]);

  const navigateToIngredients = useCallback(() => {
    navigateTo('ingredients');
  }, [navigateTo]);

  const navigateToCocktails = useCallback(() => {
    navigateTo('cocktails');
  }, [navigateTo]);

  const navigateToSettings = useCallback(() => {
    navigateTo('settings');
  }, [navigateTo]);

  const navigateToAbout = useCallback(() => {
    navigateTo('about');
  }, [navigateTo]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback to calculator if can't go back
      navigateToCalculator();
    }
  }, [router, navigateToCalculator]);

  const openModal = useCallback((modalRoute: string) => {
    router.push(`/modal?screen=${modalRoute}` as any);
  }, [router]);

  const closeModal = useCallback(() => {
    router.back();
  }, [router]);

  return {
    // Current route info
    currentRoute,
    segments,
    params,
    isDrawerRoute,
    
    // Navigation methods
    navigateTo,
    navigateToCalculator,
    navigateToIngredients,
    navigateToCocktails,
    navigateToSettings,
    navigateToAbout,
    goBack,
    
    // Modal methods
    openModal,
    closeModal,
    
    // Router access
    router,
  };
}

/**
 * Hook for checking if we're currently on a specific route
 */
export function useCurrentRoute() {
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1] || 'calculator';

  const isRoute = useCallback((routeName: string) => {
    return currentRoute === routeName;
  }, [currentRoute]);

  const isCalculator = isRoute('calculator');
  const isIngredients = isRoute('ingredients');
  const isCocktails = isRoute('cocktails');
  const isSettings = isRoute('settings');
  const isAbout = isRoute('about');

  return {
    currentRoute,
    isRoute,
    isCalculator,
    isIngredients,
    isCocktails,
    isSettings,
    isAbout,
  };
}

/**
 * Hook for drawer navigation state
 */
export function useDrawerState() {
  const segments = useSegments();
  
  const isDrawerOpen = false; // This would need to be connected to actual drawer state
  
  // These would need to be connected to the actual drawer implementation
  const openDrawer = useCallback(() => {
    // Implementation depends on how drawer is accessed
    console.log('Open drawer');
  }, []);

  const closeDrawer = useCallback(() => {
    // Implementation depends on how drawer is accessed
    console.log('Close drawer');
  }, []);

  const toggleDrawer = useCallback(() => {
    if (isDrawerOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }, [isDrawerOpen, openDrawer, closeDrawer]);

  return {
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
  };
}