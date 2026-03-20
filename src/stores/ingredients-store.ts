/**
 * Ingredients Store for PourCost-RN
 * Stores base SavedIngredient data. Metrics are computed on-demand, never stored.
 * Data backed by Supabase, with AsyncStorage as offline cache.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedIngredient, Volume } from '@/src/types/models';
import { calculateIngredientMetrics } from '@/src/services/calculation-service';
import { FeedbackService } from '@/src/services/feedback-service';
import { useAppStore } from '@/src/stores/app-store';
import type { IngredientSortOption } from '@/src/constants/appConstants';
import {
  fetchIngredients,
  insertIngredient,
  updateIngredientById,
  deleteIngredientById,
} from '@/src/lib/supabase-data';

// ==========================================
// STORE INTERFACE
// ==========================================

export interface IngredientsState {
  ingredients: SavedIngredient[];
  isLoading: boolean;
  error: string | null;

  searchQuery: string;
  selectedType: string;
  sortBy: IngredientSortOption;

  loadIngredients: (forceReload?: boolean) => Promise<void>;
  addIngredient: (ingredient: Omit<SavedIngredient, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<SavedIngredient>;
  updateIngredient: (id: string, updates: Partial<SavedIngredient>) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;

  setSearchQuery: (query: string) => void;
  setSelectedType: (type: string) => void;
  setSortBy: (sortBy: IngredientSortOption) => void;

  getIngredientById: (id: string) => SavedIngredient | undefined;
  getFilteredIngredients: () => SavedIngredient[];
  getIngredientTypes: () => string[];

  clearError: () => void;
  reset: () => void;
}

// ==========================================
// SORTING
// ==========================================

function sortIngredients(
  ingredients: SavedIngredient[],
  sortBy: IngredientSortOption,
  pourSize: Volume,
  retailPrice: number,
): SavedIngredient[] {
  return [...ingredients].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'cost': {
        const ma = calculateIngredientMetrics(a, pourSize, retailPrice);
        const mb = calculateIngredientMetrics(b, pourSize, retailPrice);
        return ma.costPerOz - mb.costPerOz;
      }
      case 'pourCost': {
        const ma = calculateIngredientMetrics(a, pourSize, retailPrice);
        const mb = calculateIngredientMetrics(b, pourSize, retailPrice);
        return ma.pourCostPercentage - mb.pourCostPercentage;
      }
      case 'margin': {
        const ma = calculateIngredientMetrics(a, pourSize, retailPrice);
        const mb = calculateIngredientMetrics(b, pourSize, retailPrice);
        return mb.pourCostMargin - ma.pourCostMargin;
      }
      case 'created':
      default: {
        const ta = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        const tb = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
        return tb - ta;
      }
    }
  });
}

// ==========================================
// STORE
// ==========================================

export const useIngredientsStore = create<IngredientsState>()(
  persist(
    (set, get) => ({
      ingredients: [],
      isLoading: false,
      error: null,
      searchQuery: '',
      selectedType: 'All',
      sortBy: 'name' as IngredientSortOption,

      loadIngredients: async (forceReload = false) => {
        const { ingredients, isLoading } = get();
        if (ingredients.length > 0 && !isLoading && !forceReload) return;

        set({ isLoading: true, error: null });
        try {
          const data = await fetchIngredients();
          set({ ingredients: data, isLoading: false });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to load ingredients';
          set({ error: msg, isLoading: false });
          // Cached data from AsyncStorage remains available if fetch fails
        }
      },

      addIngredient: async (ingredientData) => {
        set({ error: null });
        try {
          const newIngredient = await insertIngredient(ingredientData);
          set(state => ({
            ingredients: [newIngredient, ...state.ingredients],
          }));
          FeedbackService.showOperationSuccess('create', newIngredient.name);
          return newIngredient;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to add ingredient';
          set({ error: msg });
          throw error;
        }
      },

      updateIngredient: async (id, updates) => {
        set({ error: null });
        try {
          const updated = await updateIngredientById(id, updates);
          set(state => ({
            ingredients: state.ingredients.map(ing =>
              ing.id === id ? updated : ing
            ),
          }));
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to update ingredient';
          set({ error: msg });
          throw error;
        }
      },

      deleteIngredient: async (id) => {
        const ingredient = get().ingredients.find(i => i.id === id);
        set({ error: null });
        try {
          await deleteIngredientById(id);
          set(state => ({
            ingredients: state.ingredients.filter(i => i.id !== id),
          }));
          if (ingredient) {
            FeedbackService.showOperationSuccess('delete', ingredient.name);
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to delete ingredient';
          set({ error: msg });
          throw error;
        }
      },

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedType: (type) => set({ selectedType: type }),
      setSortBy: (sortBy) => set({ sortBy }),

      getIngredientById: (id) => get().ingredients.find(i => i.id === id),

      getFilteredIngredients: () => {
        const { ingredients, searchQuery, selectedType, sortBy } = get();
        if (ingredients.length === 0) return [];

        const valid = ingredients.map(i => ({
          ...i,
          createdAt: i.createdAt instanceof Date ? i.createdAt : new Date(i.createdAt),
          updatedAt: i.updatedAt instanceof Date ? i.updatedAt : new Date(i.updatedAt),
        }));

        const filtered = valid.filter(i => {
          const matchesSearch = !searchQuery ||
            i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (i.type && i.type.toLowerCase().includes(searchQuery.toLowerCase()));
          const matchesType = selectedType === 'All' || i.type === selectedType;
          return matchesSearch && matchesType;
        });

        const { defaultPourSize, defaultRetailPrice } = useAppStore.getState();
        return sortIngredients(filtered, sortBy, defaultPourSize, defaultRetailPrice);
      },

      getIngredientTypes: () => {
        const types = new Set<string>();
        get().ingredients.forEach(i => { if (i.type) types.add(i.type); });
        return Array.from(types).sort();
      },

      clearError: () => set({ error: null }),
      reset: () => set({
        ingredients: [],
        isLoading: false,
        error: null,
        searchQuery: '',
        selectedType: 'All',
        sortBy: 'name' as IngredientSortOption,
      }),
    }),
    {
      name: 'ingredients-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ ingredients: state.ingredients }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Clear stale cache from old model format (bottleSize instead of productSize)
          const hasStaleData = state.ingredients.some(
            (i: any) => !i.productSize?.kind
          );
          if (hasStaleData) {
            state.ingredients = [];
          }
          state.isLoading = false;
          state.loadIngredients();
        }
      },
    }
  )
);
