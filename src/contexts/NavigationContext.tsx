import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useSegments } from 'expo-router';

interface NavigationState {
  currentRoute: string;
  previousRoute: string | null;
  navigationHistory: string[];
  isLoading: boolean;
}

interface NavigationContextType extends NavigationState {
  // Navigation state methods
  setCurrentRoute: (route: string) => void;
  addToHistory: (route: string) => void;
  clearHistory: () => void;
  setLoading: (loading: boolean) => void;
  
  // Utility methods
  canGoBack: () => boolean;
  getPreviousRoute: () => string | null;
  getRouteTitle: (route: string) => string;
  isActiveRoute: (route: string) => boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Route title mapping
const routeTitles: Record<string, string> = {
  calculator: 'Quick Calculator',
  ingredients: 'Ingredients',
  cocktails: 'Cocktails',
  settings: 'Settings',
  about: 'About PourCost',
  index: 'PourCost',
  modal: 'Modal',
};

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const segments = useSegments();
  const currentSegment = segments[segments.length - 1] || 'calculator';

  const [state, setState] = useState<NavigationState>({
    currentRoute: currentSegment,
    previousRoute: null,
    navigationHistory: [currentSegment],
    isLoading: false,
  });

  const setCurrentRoute = useCallback((route: string) => {
    setState(prev => ({
      ...prev,
      previousRoute: prev.currentRoute,
      currentRoute: route,
    }));
  }, []);

  const addToHistory = useCallback((route: string) => {
    setState(prev => {
      const newHistory = [...prev.navigationHistory];
      
      // Remove route if it exists and add it to the end
      const existingIndex = newHistory.indexOf(route);
      if (existingIndex !== -1) {
        newHistory.splice(existingIndex, 1);
      }
      
      newHistory.push(route);
      
      // Keep history to last 10 items
      if (newHistory.length > 10) {
        newHistory.shift();
      }
      
      return {
        ...prev,
        navigationHistory: newHistory,
        previousRoute: prev.currentRoute,
        currentRoute: route,
      };
    });
  }, []);

  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      navigationHistory: [prev.currentRoute],
      previousRoute: null,
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const canGoBack = useCallback(() => {
    return state.navigationHistory.length > 1;
  }, [state.navigationHistory]);

  const getPreviousRoute = useCallback(() => {
    if (state.navigationHistory.length > 1) {
      return state.navigationHistory[state.navigationHistory.length - 2];
    }
    return state.previousRoute;
  }, [state.navigationHistory, state.previousRoute]);

  const getRouteTitle = useCallback((route: string) => {
    return routeTitles[route] || route.charAt(0).toUpperCase() + route.slice(1);
  }, []);

  const isActiveRoute = useCallback((route: string) => {
    return state.currentRoute === route;
  }, [state.currentRoute]);

  // Update current route when segments change
  React.useEffect(() => {
    if (currentSegment !== state.currentRoute) {
      addToHistory(currentSegment);
    }
  }, [currentSegment, state.currentRoute, addToHistory]);

  const contextValue: NavigationContextType = {
    ...state,
    setCurrentRoute,
    addToHistory,
    clearHistory,
    setLoading,
    canGoBack,
    getPreviousRoute,
    getRouteTitle,
    isActiveRoute,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationContext() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigationContext must be used within a NavigationProvider');
  }
  return context;
}

// Convenience hooks
export function useRouteTitle(route?: string) {
  const { currentRoute, getRouteTitle } = useNavigationContext();
  return getRouteTitle(route || currentRoute);
}

export function useIsActiveRoute(route: string) {
  const { isActiveRoute } = useNavigationContext();
  return isActiveRoute(route);
}

export function useNavigationHistory() {
  const { navigationHistory, canGoBack, getPreviousRoute } = useNavigationContext();
  return {
    history: navigationHistory,
    canGoBack: canGoBack(),
    previousRoute: getPreviousRoute(),
  };
}