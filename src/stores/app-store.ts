import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the app state interface
interface AppState {
  // User preferences
  isFirstLaunch: boolean;
  measurementSystem: 'US' | 'Metric';
  baseCurrency: string;
  pourCostGoal: number; // Target pour cost percentage
  
  // App state
  isLoading: boolean;
  
  // Actions
  setFirstLaunch: (isFirst: boolean) => void;
  setMeasurementSystem: (system: 'US' | 'Metric') => void;
  setBaseCurrency: (currency: string) => void;
  setPourCostGoal: (goal: number) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Main app store using Zustand
 * Handles global app state and user preferences
 * Persisted to AsyncStorage for consistency across app launches
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      isFirstLaunch: true,
      measurementSystem: 'US',
      baseCurrency: 'USD',
      pourCostGoal: 20, // Default 20% pour cost goal
      isLoading: false,
      
      // Actions
      setFirstLaunch: (isFirst) => set({ isFirstLaunch: isFirst }),
      setMeasurementSystem: (system) => set({ measurementSystem: system }),
      setBaseCurrency: (currency) => set({ baseCurrency: currency }),
      setPourCostGoal: (goal) => set({ pourCostGoal: goal }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);