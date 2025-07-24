import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MeasurementService, MeasurementSystem } from '@/src/services/measurement-service';
import { CurrencyService } from '@/src/services/currency-service';
import { ValidationService } from '@/src/services/validation-service';

// Define the app state interface
interface AppState {
  // User preferences
  isFirstLaunch: boolean;
  measurementSystem: MeasurementSystem;
  baseCurrency: string;
  pourCostGoal: number; // Target pour cost percentage
  isDarkMode: boolean; // Dark mode preference
  locale: string; // User locale (e.g., 'en-US')
  
  // App state
  isLoading: boolean;
  lastSyncDate: Date | null;
  
  // Actions - User Preferences
  setFirstLaunch: (isFirst: boolean) => void;
  setMeasurementSystem: (system: MeasurementSystem) => void;
  setBaseCurrency: (currency: string) => void;
  setPourCostGoal: (goal: number) => void;
  setDarkMode: (isDark: boolean) => void;
  setLocale: (locale: string) => void;
  
  // Actions - App State
  setLoading: (loading: boolean) => void;
  updateLastSync: () => void;
  
  // Computed/Helper Actions
  getSupportedCurrencies: () => Array<{code: string; symbol: string; name: string}>;
  getLocaleConfig: () => ReturnType<typeof MeasurementService.getLocaleConfig>;
  getMeasurementConfig: () => ReturnType<typeof MeasurementService.getMeasurementConfig>;
  validateSettings: () => {isValid: boolean; errors: string[]};
  autoDetectLocale: () => void;
  resetToDefaults: () => void;
}

/**
 * Main app store using Zustand
 * Handles global app state and user preferences
 * Integrates with business logic services for validation and configuration
 * Persisted to AsyncStorage for consistency across app launches
 */
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      isFirstLaunch: true,
      measurementSystem: 'US' as MeasurementSystem,
      baseCurrency: 'USD',
      pourCostGoal: 20, // Default 20% pour cost goal
      isDarkMode: false, // Default to light mode
      locale: 'en-US',
      isLoading: false,
      lastSyncDate: null,
      
      // Actions - User Preferences
      setFirstLaunch: (isFirst) => set({ isFirstLaunch: isFirst }),
      
      setMeasurementSystem: (system) => {
        const config = MeasurementService.getMeasurementConfig(system);
        set({ 
          measurementSystem: system,
          // Auto-adjust locale if needed
          locale: system === 'US' ? 'en-US' : get().locale
        });
      },
      
      setBaseCurrency: (currency) => {
        if (CurrencyService.isSupportedCurrency(currency)) {
          set({ baseCurrency: currency.toUpperCase() });
        } else {
          console.warn(`Unsupported currency: ${currency}`);
        }
      },
      
      setPourCostGoal: (goal) => {
        // Validate pour cost goal
        if (goal >= 10 && goal <= 50) {
          set({ pourCostGoal: goal });
        } else {
          console.warn(`Invalid pour cost goal: ${goal}%. Must be between 10% and 50%.`);
        }
      },
      
      setDarkMode: (isDark) => set({ isDarkMode: isDark }),
      
      setLocale: (locale) => {
        const localeConfig = MeasurementService.getLocaleConfig(locale);
        set({ 
          locale,
          measurementSystem: localeConfig.measurementSystem,
          baseCurrency: localeConfig.currency
        });
      },
      
      // Actions - App State
      setLoading: (loading) => set({ isLoading: loading }),
      
      updateLastSync: () => set({ lastSyncDate: new Date() }),
      
      // Computed/Helper Actions
      getSupportedCurrencies: () => {
        return CurrencyService.getSupportedCurrencies().map(currency => ({
          code: currency.code,
          symbol: currency.symbol,
          name: currency.name
        }));
      },
      
      getLocaleConfig: () => {
        const state = get();
        return MeasurementService.getLocaleConfig(state.locale);
      },
      
      getMeasurementConfig: () => {
        const state = get();
        return MeasurementService.getMeasurementConfig(state.measurementSystem);
      },
      
      validateSettings: () => {
        const state = get();
        const errors: string[] = [];
        
        // Validate currency
        if (!CurrencyService.isSupportedCurrency(state.baseCurrency)) {
          errors.push(`Unsupported currency: ${state.baseCurrency}`);
        }
        
        // Validate pour cost goal
        if (state.pourCostGoal < 10 || state.pourCostGoal > 50) {
          errors.push(`Pour cost goal ${state.pourCostGoal}% is outside recommended range (10-50%)`);
        }
        
        // Validate locale
        const supportedLocales = MeasurementService.getSupportedLocales();
        if (!supportedLocales.includes(state.locale)) {
          errors.push(`Unsupported locale: ${state.locale}`);
        }
        
        return {
          isValid: errors.length === 0,
          errors
        };
      },
      
      autoDetectLocale: () => {
        const detectedConfig = MeasurementService.autoDetectLocale();
        set({
          locale: detectedConfig.locale,
          measurementSystem: detectedConfig.measurementSystem,
          baseCurrency: detectedConfig.currency
        });
      },
      
      resetToDefaults: () => {
        set({
          measurementSystem: 'US',
          baseCurrency: 'USD',
          pourCostGoal: 20,
          isDarkMode: false,
          locale: 'en-US',
          isFirstLaunch: false,
        });
      },
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Migrate old store data if needed
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration from v0 to v1 - add new fields
          return {
            ...persistedState,
            locale: persistedState.locale || 'en-US',
            lastSyncDate: null,
          };
        }
        return persistedState;
      },
    }
  )
);