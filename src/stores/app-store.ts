import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Volume, fraction } from '@/src/types/models';
import { fetchProfile } from '@/src/lib/supabase-data';
import { updateProfile } from '@/src/lib/supabase-writes';
import { FeedbackService } from '@/src/services/feedback-service';

// ==========================================
// TYPES
// ==========================================

export type ThemeMode = 'dark' | 'light' | 'auto';
export type IngredientOrderPref = 'manual' | 'most-to-least' | 'least-to-most' | 'cost-high-low';

interface AppState {
  // Synced with Supabase profiles
  pourCostGoal: number;
  defaultPourSize: Volume;
  defaultRetailPrice: number;
  ingredientOrderPref: IngredientOrderPref;
  themeMode: ThemeMode;
  displayName: string;

  // Local-only state
  isFirstLaunch: boolean;
  isLoading: boolean;
  lastSyncDate: Date | null;
  enabledProductSizes: string[]; // Volume labels of enabled container sizes (empty = all enabled)

  // Actions
  setPourCostGoal: (goal: number) => void;
  setDefaultPourSize: (size: Volume) => void;
  setDefaultRetailPrice: (price: number) => void;
  setIngredientOrderPref: (pref: IngredientOrderPref) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setDisplayName: (name: string) => void;
  setFirstLaunch: (isFirst: boolean) => void;
  setLoading: (loading: boolean) => void;
  setEnabledProductSizes: (sizes: string[]) => void;
  toggleProductSize: (sizeLabel: string) => void;

  // Supabase sync
  loadProfile: () => Promise<void>;
  saveProfile: () => Promise<void>;

  resetToDefaults: () => void;
}

// ==========================================
// HARDCODED FOR MVP (US-only)
// ==========================================

export const HARDCODED_MEASUREMENT_SYSTEM = 'us' as const;
export const HARDCODED_BASE_CURRENCY = 'USD' as const;
export const HARDCODED_LOCALE = 'en-US' as const;

// ==========================================
// STORE
// ==========================================

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Defaults
      pourCostGoal: 18,
      defaultPourSize: fraction(3, 2), // 1.5 oz
      defaultRetailPrice: 10.0,
      ingredientOrderPref: 'manual',
      themeMode: 'dark',
      displayName: '',
      isFirstLaunch: true,
      isLoading: false,
      lastSyncDate: null,
      enabledProductSizes: [], // empty = all enabled

      // Setters
      setPourCostGoal: (goal) => {
        if (goal >= 10 && goal <= 50) {
          set({ pourCostGoal: goal });
        }
      },

      setDefaultPourSize: (size) => set({ defaultPourSize: size }),

      setDefaultRetailPrice: (price) => {
        if (price >= 0 && price <= 1000) {
          set({ defaultRetailPrice: price });
        }
      },

      setIngredientOrderPref: (pref) => set({ ingredientOrderPref: pref }),

      setThemeMode: (mode) => set({ themeMode: mode }),

      setDisplayName: (name) => set({ displayName: name }),

      setFirstLaunch: (isFirst) => set({ isFirstLaunch: isFirst }),

      setLoading: (loading) => set({ isLoading: loading }),

      setEnabledProductSizes: (sizes) => set({ enabledProductSizes: sizes }),

      toggleProductSize: (sizeLabel) => {
        const { enabledProductSizes } = get();
        if (enabledProductSizes.includes(sizeLabel)) {
          set({ enabledProductSizes: enabledProductSizes.filter(s => s !== sizeLabel) });
        } else {
          set({ enabledProductSizes: [...enabledProductSizes, sizeLabel] });
        }
      },

      // Load profile from Supabase → store
      loadProfile: async () => {
        try {
          const profile = await fetchProfile();
          if (!profile) return;

          set({
            pourCostGoal: profile.pourCostGoal,
            defaultPourSize: profile.defaultPourSize,
            defaultRetailPrice: profile.defaultRetailPrice,
            ingredientOrderPref: profile.ingredientOrderPref,
            themeMode: profile.themeMode,
            displayName: profile.displayName,
            enabledProductSizes: profile.enabledProductSizes ?? [],
            lastSyncDate: new Date(),
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to load profile';
          if (msg !== 'OFFLINE_QUEUED') {
            FeedbackService.showError('Load Failed', msg);
          }
        }
      },

      // Save current store state → Supabase
      saveProfile: async () => {
        try {
          const state = get();
          await updateProfile({
            pourCostGoal: state.pourCostGoal,
            defaultPourSize: state.defaultPourSize,
            defaultRetailPrice: state.defaultRetailPrice,
            ingredientOrderPref: state.ingredientOrderPref,
            themeMode: state.themeMode,
            displayName: state.displayName,
            enabledProductSizes: state.enabledProductSizes,
          });
          set({ lastSyncDate: new Date() });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to save settings';
          if (msg !== 'OFFLINE_QUEUED') {
            FeedbackService.showError('Save Failed', msg);
          }
        }
      },

      resetToDefaults: () => {
        set({
          pourCostGoal: 18,
          defaultPourSize: fraction(3, 2),
          defaultRetailPrice: 10.0,
          ingredientOrderPref: 'manual',
          themeMode: 'dark',
          displayName: '',
          isFirstLaunch: false,
        });
      },
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          // Migration from v0/v1 → v2: new settings model
          return {
            ...persistedState,
            pourCostGoal: persistedState.pourCostGoal ?? 18,
            defaultPourSize: persistedState.defaultPourSize ?? { kind: 'fractionalOunces', numerator: 3, denominator: 2 },
            defaultRetailPrice: persistedState.defaultRetailPrice ?? 10.0,
            ingredientOrderPref: persistedState.ingredientOrderPref ?? 'manual',
            themeMode: persistedState.isDarkMode === false ? 'light' : 'dark',
            displayName: persistedState.displayName ?? '',
            lastSyncDate: null,
          };
        }
        return persistedState;
      },
    }
  )
);
