import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Volume, fraction } from '@/src/types/models';
import { fetchProfile } from '@/src/lib/supabase-data';
import { updateProfile } from '@/src/lib/supabase-writes';
import { FeedbackService } from '@/src/services/feedback-service';
import { PourCostTier, DEFAULT_TIERS } from '@/src/lib/pour-cost-tiers';
import { DEFAULT_ENABLED_PRODUCT_SIZE_LABELS } from '@/src/constants/appConstants';

// ==========================================
// TYPES
// ==========================================

export type ThemeMode = 'dark' | 'light' | 'auto';
export type IngredientOrderPref = 'manual' | 'most-to-least' | 'least-to-most' | 'cost-high-low';
export type DetailLevel = 'simple' | 'detailed';
/** Rounding mode for displayed Suggested Prices across the app. */
export type PriceRounding = 'off' | '1' | '0.5' | '0.25';
/** Which drawer screen the user lands on after sign-in. */
export type DefaultLandingScreen = 'cocktails' | 'ingredients' | 'calculator';

interface AppState {
  // Synced with Supabase profiles
  pourCostGoal: number;
  /** Bar-wide pour cost target for beer pours. Beer is priced as a category
   *  (not by bottle cost) so it gets its own goal separate from spirits. */
  beerPourCostGoal: number;
  /** Bar-wide pour cost target for wine by the glass. */
  winePourCostGoal: number;
  defaultPourSize: Volume;
  defaultRetailPrice: number;
  /** Minimum allowed Suggested Price for cocktails. Floor wins when raw
   *  pour-cost math suggests less than this. Default $10. */
  minCocktailPrice: number;
  /** Minimum allowed Suggested Retail for individual ingredient pours
   *  (spirits sold straight, beer, wine by glass). Default $7. */
  minIngredientPrice: number;
  ingredientOrderPref: IngredientOrderPref;
  themeMode: ThemeMode;
  displayName: string;
  defaultLandingScreen: DefaultLandingScreen;

  // Local-only state
  detailLevel: DetailLevel;
  suggestedPriceRounding: PriceRounding;
  isFirstLaunch: boolean;
  isLoading: boolean;
  lastSyncDate: Date | null;
  enabledProductSizes: string[]; // Volume labels of enabled container sizes

  /** Pro Mode unlocks custom pour-cost tiers. Currently admin-gated for
   *  testing; will become a paid feature post-launch. */
  proModeEnabled: boolean;
  /** User's custom tier ladder — used when proModeEnabled. Empty array
   *  falls back to DEFAULT_TIERS even when Pro Mode is on. */
  pourCostTiers: PourCostTier[];

  // Actions
  setPourCostGoal: (goal: number) => void;
  setBeerPourCostGoal: (goal: number) => void;
  setWinePourCostGoal: (goal: number) => void;
  setDefaultPourSize: (size: Volume) => void;
  setDefaultRetailPrice: (price: number) => void;
  setMinCocktailPrice: (price: number) => void;
  setMinIngredientPrice: (price: number) => void;
  setIngredientOrderPref: (pref: IngredientOrderPref) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setDisplayName: (name: string) => void;
  setDefaultLandingScreen: (screen: DefaultLandingScreen) => void;
  setDetailLevel: (level: DetailLevel) => void;
  setSuggestedPriceRounding: (r: PriceRounding) => void;
  setFirstLaunch: (isFirst: boolean) => void;
  setLoading: (loading: boolean) => void;
  setEnabledProductSizes: (sizes: string[]) => void;
  toggleProductSize: (sizeLabel: string) => void;
  setProModeEnabled: (enabled: boolean) => void;
  setPourCostTiers: (tiers: PourCostTier[]) => void;

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
      beerPourCostGoal: 22,
      winePourCostGoal: 25,
      defaultPourSize: fraction(3, 2), // 1.5 oz
      defaultRetailPrice: 10.0,
      minCocktailPrice: 10.0,
      minIngredientPrice: 7.0,
      ingredientOrderPref: 'manual',
      themeMode: 'dark',
      displayName: '',
      defaultLandingScreen: 'cocktails',
      detailLevel: 'detailed',
      suggestedPriceRounding: '1',
      isFirstLaunch: true,
      isLoading: false,
      lastSyncDate: null,
      enabledProductSizes: DEFAULT_ENABLED_PRODUCT_SIZE_LABELS,
      proModeEnabled: false,
      pourCostTiers: DEFAULT_TIERS,

      // Setters
      setPourCostGoal: (goal) => {
        if (goal >= 5 && goal <= 60) set({ pourCostGoal: goal });
      },

      setBeerPourCostGoal: (goal) => {
        if (goal >= 5 && goal <= 60) set({ beerPourCostGoal: goal });
      },

      setWinePourCostGoal: (goal) => {
        if (goal >= 5 && goal <= 60) set({ winePourCostGoal: goal });
      },

      setDefaultPourSize: (size) => set({ defaultPourSize: size }),

      setDefaultRetailPrice: (price) => {
        if (price >= 0 && price <= 1000) {
          set({ defaultRetailPrice: price });
        }
      },

      setMinCocktailPrice: (price) => {
        if (price >= 0 && price <= 100) set({ minCocktailPrice: price });
      },

      setMinIngredientPrice: (price) => {
        if (price >= 0 && price <= 100) set({ minIngredientPrice: price });
      },

      setIngredientOrderPref: (pref) => set({ ingredientOrderPref: pref }),

      setThemeMode: (mode) => set({ themeMode: mode }),

      setDisplayName: (name) => set({ displayName: name }),

      setDefaultLandingScreen: (screen) => set({ defaultLandingScreen: screen }),

      setDetailLevel: (level) => set({ detailLevel: level }),

      setSuggestedPriceRounding: (r) => set({ suggestedPriceRounding: r }),

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

      setProModeEnabled: (enabled) => set({ proModeEnabled: enabled }),
      setPourCostTiers: (tiers) => set({ pourCostTiers: tiers }),

      // Load profile from Supabase → store
      loadProfile: async () => {
        try {
          const profile = await fetchProfile();
          if (!profile) return;

          set({
            pourCostGoal: profile.pourCostGoal,
            beerPourCostGoal: profile.beerPourCostGoal,
            winePourCostGoal: profile.winePourCostGoal,
            defaultPourSize: profile.defaultPourSize,
            defaultRetailPrice: profile.defaultRetailPrice,
            minCocktailPrice: profile.minCocktailPrice,
            minIngredientPrice: profile.minIngredientPrice,
            ingredientOrderPref: profile.ingredientOrderPref,
            themeMode: profile.themeMode,
            displayName: profile.displayName,
            defaultLandingScreen: profile.defaultLandingScreen,
            // Profiles persisted before the curated default landed have
            // either an empty array or the legacy "all enabled" sentinel —
            // give them the curated set so dropdowns aren't empty.
            enabledProductSizes:
              profile.enabledProductSizes && profile.enabledProductSizes.length > 0
                ? profile.enabledProductSizes
                : DEFAULT_ENABLED_PRODUCT_SIZE_LABELS,
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
            beerPourCostGoal: state.beerPourCostGoal,
            winePourCostGoal: state.winePourCostGoal,
            defaultPourSize: state.defaultPourSize,
            defaultRetailPrice: state.defaultRetailPrice,
            minCocktailPrice: state.minCocktailPrice,
            minIngredientPrice: state.minIngredientPrice,
            ingredientOrderPref: state.ingredientOrderPref,
            themeMode: state.themeMode,
            displayName: state.displayName,
            defaultLandingScreen: state.defaultLandingScreen,
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
          beerPourCostGoal: 22,
          winePourCostGoal: 25,
          defaultPourSize: fraction(3, 2),
          defaultRetailPrice: 10.0,
          minCocktailPrice: 10.0,
          minIngredientPrice: 7.0,
          ingredientOrderPref: 'manual',
          themeMode: 'dark',
          displayName: '',
          defaultLandingScreen: 'cocktails',
          detailLevel: 'detailed',
          suggestedPriceRounding: '1',
          isFirstLaunch: false,
          proModeEnabled: false,
          pourCostTiers: DEFAULT_TIERS,
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
