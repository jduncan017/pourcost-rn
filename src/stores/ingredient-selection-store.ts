import { create } from 'zustand';
import { CocktailIngredient } from '@/src/types/models';

interface IngredientSelectionState {
  selectedIngredient: CocktailIngredient | null;
  selectedIngredients: CocktailIngredient[];
  setSelectedIngredient: (ingredient: CocktailIngredient | null) => void;
  setSelectedIngredients: (ingredients: CocktailIngredient[]) => void;
  clearSelection: () => void;
}

/**
 * Simple store for handling ingredient selection between screens
 * Used to pass selected ingredients from ingredient-selector back to cocktail-form
 */
export const useIngredientSelectionStore = create<IngredientSelectionState>((set) => ({
  selectedIngredient: null,
  selectedIngredients: [],
  setSelectedIngredient: (ingredient) => set({ selectedIngredient: ingredient }),
  setSelectedIngredients: (ingredients) => set({ selectedIngredients: ingredients }),
  clearSelection: () => set({ selectedIngredient: null, selectedIngredients: [] }),
}));