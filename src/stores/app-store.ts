import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Volume, fraction } from '@/src/types/models';
import { fetchProfile } from '@/src/lib/supabase-data';
import { updateProfile } from '@/src/lib/supabase-writes';
import { FeedbackService } from '@/src/services/feedback-service';
import { capture } from '@/src/services/analytics-service';
import { PourCostTier, DEFAULT_TIERS } from '@/src/lib/pour-cost-tiers';
import {
  DEFAULT_ENABLED_PRODUCT_SIZE_LABELS,
  type IngredientType,
} from '@/src/constants/appConstants';

// Sensible per-type pour sizes used when the user hasn't customized them.
// Spirit anchors to the existing global default (1.5 oz fractional). Others
// pick the most common chip option for that category.
const DEFAULT_POUR_SIZES_BY_TYPE: Record<IngredientType, Volume> = {
  Spirit: fraction(3, 2), // 1.5 oz
  Beer: { kind: 'decimalOunces', ounces: 12 },
  Wine: { kind: 'decimalOunces', ounces: 5 },
  'Non-Alc': fraction(1, 1), // 1 oz (mixer/syrup pour)
  Prepped: fraction(1, 1),
  Garnish: fraction(1, 1), // not user-facing, garnish has its own unit flow
  Other: fraction(1, 1),
};

// Sensible per-type retail price defaults used when the user hasn't
// customized them. Pre-fills the retail price on new ingredients before any
// suggested-from-cost math kicks in, and acts as the display fallback for
// ingredients that don't carry their own retail. Spirit anchors to $10 to
// match the legacy single `defaultRetailPrice`.
const DEFAULT_RETAIL_PRICES_BY_TYPE: Record<IngredientType, number> = {
  Spirit: 10,
  Beer: 6,
  Wine: 10,
  'Non-Alc': 4,
  Prepped: 8,
  Garnish: 2,
  Other: 8,
};

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
  /** Per-ingredient-type pour size defaults. Used by the ingredient form to
   *  pick a sensible starting pour when the user picks a type, and as the
   *  display fallback for ingredients that don't carry their own pourSize.
   *  Spirit's slot is the canonical "general default" (back-compat with the
   *  legacy single `defaultPourSize`). */
  defaultPourSizes: Record<IngredientType, Volume>;
  defaultRetailPrice: number;
  /** Per-ingredient-type retail price defaults. Mirrors defaultPourSizes —
   *  Spirit's slot stays in sync with the legacy single `defaultRetailPrice`. */
  defaultRetailPrices: Record<IngredientType, number>;
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
  /** Set the default pour for a specific ingredient type. Spirit also mirrors
   *  to the legacy `defaultPourSize` so the rest of the app (sort fallbacks,
   *  lists, detail screens) stays in sync. */
  setDefaultPourSizeForType: (type: IngredientType, size: Volume) => void;
  setDefaultRetailPrice: (price: number) => void;
  /** Set the default retail price for a specific ingredient type. Spirit
   *  also mirrors to the legacy `defaultRetailPrice`. */
  setDefaultRetailPriceForType: (type: IngredientType, price: number) => void;
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
      defaultPourSizes: { ...DEFAULT_POUR_SIZES_BY_TYPE },
      defaultRetailPrice: 10.0,
      defaultRetailPrices: { ...DEFAULT_RETAIL_PRICES_BY_TYPE },
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

      setDefaultPourSize: (size) =>
        set((state) => ({
          defaultPourSize: size,
          defaultPourSizes: { ...state.defaultPourSizes, Spirit: size },
        })),

      setDefaultPourSizeForType: (type, size) =>
        set((state) => ({
          defaultPourSizes: { ...state.defaultPourSizes, [type]: size },
          // Keep the legacy single `defaultPourSize` mirrored to Spirit so
          // sort/display fallbacks elsewhere stay aligned.
          ...(type === 'Spirit' ? { defaultPourSize: size } : {}),
        })),

      setDefaultRetailPrice: (price) => {
        if (price >= 0 && price <= 1000) {
          set((state) => ({
            defaultRetailPrice: price,
            defaultRetailPrices: { ...state.defaultRetailPrices, Spirit: price },
          }));
        }
      },

      setDefaultRetailPriceForType: (type, price) => {
        if (price < 0 || price > 1000) return;
        set((state) => ({
          defaultRetailPrices: { ...state.defaultRetailPrices, [type]: price },
          ...(type === 'Spirit' ? { defaultRetailPrice: price } : {}),
        }));
      },

      setMinCocktailPrice: (price) => {
        if (price >= 0 && price <= 100) set({ minCocktailPrice: price });
      },

      setMinIngredientPrice: (price) => {
        if (price >= 0 && price <= 100) set({ minIngredientPrice: price });
      },

      setIngredientOrderPref: (pref) => {
        set({ ingredientOrderPref: pref });
        capture('setting_changed', { key: 'ingredientOrderPref', value: pref });
      },

      setThemeMode: (mode) => {
        set({ themeMode: mode });
        capture('setting_changed', { key: 'themeMode', value: mode });
      },

      setDisplayName: (name) => set({ displayName: name }),

      setDefaultLandingScreen: (screen) => {
        set({ defaultLandingScreen: screen });
        capture('setting_changed', { key: 'defaultLandingScreen', value: screen });
      },

      setDetailLevel: (level) => {
        set({ detailLevel: level });
        capture('setting_changed', { key: 'detailLevel', value: level });
      },

      setSuggestedPriceRounding: (r) => {
        set({ suggestedPriceRounding: r });
        capture('setting_changed', { key: 'suggestedPriceRounding', value: r });
      },

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

      setProModeEnabled: (enabled) => {
        set({ proModeEnabled: enabled });
        capture('setting_changed', { key: 'proModeEnabled', value: enabled });
      },
      setPourCostTiers: (tiers) => {
        set({ pourCostTiers: tiers });
        capture('setting_changed', { key: 'pourCostTiers', value: tiers.length });
      },

      // Load profile from Supabase → store
      loadProfile: async () => {
        try {
          const profile = await fetchProfile();
          if (!profile) return;

          // Merge per-type defaults from the server with the in-app sensible
          // defaults so any keys missing on the server (older profiles, or
          // simply types the user hasn't touched) still resolve to a value.
          const mergedPourSizes: Record<IngredientType, Volume> = {
            ...DEFAULT_POUR_SIZES_BY_TYPE,
            ...(profile.defaultPourSizes ?? {}),
            // Spirit always tracks the legacy single column for back-compat
            // with older clients writing only the single field.
            Spirit: profile.defaultPourSize,
          };
          const mergedRetailPrices: Record<IngredientType, number> = {
            ...DEFAULT_RETAIL_PRICES_BY_TYPE,
            ...(profile.defaultRetailPrices ?? {}),
            Spirit: profile.defaultRetailPrice,
          };
          set({
            pourCostGoal: profile.pourCostGoal,
            beerPourCostGoal: profile.beerPourCostGoal,
            winePourCostGoal: profile.winePourCostGoal,
            defaultPourSize: profile.defaultPourSize,
            defaultPourSizes: mergedPourSizes,
            defaultRetailPrice: profile.defaultRetailPrice,
            defaultRetailPrices: mergedRetailPrices,
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
            defaultPourSizes: state.defaultPourSizes,
            defaultRetailPrice: state.defaultRetailPrice,
            defaultRetailPrices: state.defaultRetailPrices,
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
          defaultPourSizes: { ...DEFAULT_POUR_SIZES_BY_TYPE },
          defaultRetailPrice: 10.0,
          defaultRetailPrices: { ...DEFAULT_RETAIL_PRICES_BY_TYPE },
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
      version: 4,
      migrate: (persistedState: any, version: number) => {
        let next = persistedState;
        if (version < 2) {
          // v0/v1 → v2: new settings model
          next = {
            ...next,
            pourCostGoal: next.pourCostGoal ?? 18,
            defaultPourSize: next.defaultPourSize ?? { kind: 'fractionalOunces', numerator: 3, denominator: 2 },
            defaultRetailPrice: next.defaultRetailPrice ?? 10.0,
            ingredientOrderPref: next.ingredientOrderPref ?? 'manual',
            themeMode: next.isDarkMode === false ? 'light' : 'dark',
            displayName: next.displayName ?? '',
            lastSyncDate: null,
          };
        }
        if (version < 3) {
          // v2 → v3: per-type pour-size defaults. Seed from the legacy
          // single `defaultPourSize` for Spirit; sensible static values for
          // the rest. Existing user value wins for Spirit.
          const legacy = next.defaultPourSize ?? DEFAULT_POUR_SIZES_BY_TYPE.Spirit;
          next = {
            ...next,
            defaultPourSizes: {
              ...DEFAULT_POUR_SIZES_BY_TYPE,
              Spirit: legacy,
              ...(next.defaultPourSizes ?? {}),
            },
          };
        }
        if (version < 4) {
          // v3 → v4: per-type retail price defaults. Seed Spirit from the
          // legacy single `defaultRetailPrice`; everyone else gets the
          // category-typical default.
          const legacyRetail = next.defaultRetailPrice ?? DEFAULT_RETAIL_PRICES_BY_TYPE.Spirit;
          next = {
            ...next,
            defaultRetailPrices: {
              ...DEFAULT_RETAIL_PRICES_BY_TYPE,
              Spirit: legacyRetail,
              ...(next.defaultRetailPrices ?? {}),
            },
          };
        }
        return next;
      },
    }
  )
);
