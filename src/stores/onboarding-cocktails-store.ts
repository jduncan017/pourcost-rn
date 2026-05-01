/**
 * Transient store for the onboarding cocktail picker → pricing → adopt flow.
 *
 * Persisted to AsyncStorage so the user can background the app between the
 * picker and the pricing screen without losing their selection. Reset is
 * called once adoption completes (or the user explicitly skips).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LibraryRecipe, RecipeAnalysis, MissingIngredientGroup } from '@/src/lib/library-recipes';
import { PricedMissingIngredient } from '@/src/lib/recipe-adopter';

interface OnboardingCocktailsState {
  selectedRecipes: LibraryRecipe[];
  analyses: RecipeAnalysis[];
  missing: MissingIngredientGroup[];
  /** Set by the prices screen on Continue, read by the adopting screen. */
  pricedMissing: PricedMissingIngredient[];
  set: (data: {
    selectedRecipes: LibraryRecipe[];
    analyses: RecipeAnalysis[];
    missing: MissingIngredientGroup[];
  }) => void;
  setPricedMissing: (priced: PricedMissingIngredient[]) => void;
  reset: () => void;
}

export const useOnboardingCocktailsStore = create<OnboardingCocktailsState>()(
  persist(
    (set) => ({
      selectedRecipes: [],
      analyses: [],
      missing: [],
      pricedMissing: [],
      set: (data) => set(data),
      setPricedMissing: (priced) => set({ pricedMissing: priced }),
      reset: () =>
        set({ selectedRecipes: [], analyses: [], missing: [], pricedMissing: [] }),
    }),
    {
      name: 'onboarding-cocktails',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        selectedRecipes: state.selectedRecipes,
        analyses: state.analyses,
        missing: state.missing,
        pricedMissing: state.pricedMissing,
      }),
    },
  ),
);
