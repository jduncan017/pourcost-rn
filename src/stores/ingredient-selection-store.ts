import { create } from 'zustand';
import { CocktailIngredient } from '@/src/types/models';

interface IngredientSelectionState {
  selectedIngredient: CocktailIngredient | null;
  selectedIngredients: CocktailIngredient[];
  removedIngredientIds: string[];
  setSelectedIngredient: (ingredient: CocktailIngredient | null) => void;
  setSelectedIngredients: (ingredients: CocktailIngredient[]) => void;
  setRemovedIngredientIds: (ids: string[]) => void;
  clearSelection: () => void;
}

export const useIngredientSelectionStore = create<IngredientSelectionState>((set) => ({
  selectedIngredient: null,
  selectedIngredients: [],
  removedIngredientIds: [],
  setSelectedIngredient: (ingredient) => set({ selectedIngredient: ingredient }),
  setSelectedIngredients: (ingredients) => set({ selectedIngredients: ingredients }),
  setRemovedIngredientIds: (ids) => set({ removedIngredientIds: ids }),
  clearSelection: () => set({ selectedIngredient: null, selectedIngredients: [], removedIngredientIds: [] }),
}));
