/**
 * Ingredients Store for PourCost-RN
 * Stores base SavedIngredient data. Metrics are computed on-demand, never stored.
 * Data backed by Supabase, with AsyncStorage as offline cache.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedIngredient, IngredientConfiguration, Volume } from '@/src/types/models';
import { calculateIngredientMetrics } from '@/src/services/calculation-service';
import { FeedbackService } from '@/src/services/feedback-service';
import { useAppStore } from '@/src/stores/app-store';
import type { IngredientSortOption } from '@/src/constants/appConstants';
import { ensureDate } from '@/src/lib/ensureDate';
import {
  fetchIngredients,
  cascadeIngredientUpdate,
  insertIngredientConfiguration,
  updateIngredientConfiguration,
  deleteIngredientConfiguration,
} from '@/src/lib/supabase-data';
import {
  insertIngredient,
  updateIngredientById,
  deleteIngredientById,
} from '@/src/lib/supabase-writes';
import { capture } from '@/src/services/analytics-service';

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

  addConfiguration: (
    ingredientId: string,
    config: Omit<IngredientConfiguration, 'id' | 'ingredientId' | 'createdAt'>,
  ) => Promise<IngredientConfiguration>;
  updateConfiguration: (
    ingredientId: string,
    configId: string,
    updates: Partial<Omit<IngredientConfiguration, 'id' | 'ingredientId' | 'createdAt'>>,
  ) => Promise<void>;
  deleteConfiguration: (ingredientId: string, configId: string) => Promise<void>;

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
        const ta = ensureDate(a.createdAt).getTime();
        const tb = ensureDate(b.createdAt).getTime();
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
          const wasEmpty = get().ingredients.length === 0;
          const newIngredient = await insertIngredient(ingredientData);
          set(state => ({
            ingredients: [newIngredient, ...state.ingredients],
          }));
          if (wasEmpty) capture('first_ingredient_added');
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

          // Cascade cost/name changes to cocktails that use this ingredient
          cascadeIngredientUpdate(updated).then(() => {
            // Reload cocktails so UI reflects updated costs
            import('@/src/stores/cocktails-store').then(({ useCocktailsStore }) => {
              useCocktailsStore.getState().loadCocktails(true);
            });
          }).catch(() => {
            // Non-critical — cocktails will update on next load
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to update ingredient';
          set({ error: msg });
          throw error;
        }
      },

      deleteIngredient: async (id) => {
        const ingredient = get().ingredients.find(i => i.id === id);
        if (!ingredient) return;
        set({ error: null });

        // Optimistically remove from UI
        set(state => ({
          ingredients: state.ingredients.filter(i => i.id !== id),
        }));

        // Delay the actual delete so user can undo
        let cancelled = false;
        const timer = setTimeout(async () => {
          if (cancelled) return;
          try {
            await deleteIngredientById(id);
          } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to delete ingredient';
            // Offline-queued writes are effectively success from the UI's
            // perspective — the write is durable in the offline queue and
            // will sync on reconnect. The wrapper already showed a toast.
            if (msg === 'OFFLINE_QUEUED') return;
            // Real failure — re-add so the user doesn't lose the row silently.
            set(state => ({ ingredients: [...state.ingredients, ingredient] }));
            FeedbackService.showError('Delete Failed', msg);
          }
        }, 5000);

        FeedbackService.showSuccess(
          'Deleted',
          `"${ingredient.name}" removed`,
          {
            label: 'Undo',
            onPress: () => {
              cancelled = true;
              clearTimeout(timer);
              set(state => ({ ingredients: [...state.ingredients, ingredient] }));
            },
          }
        );
      },

      addConfiguration: async (ingredientId, configData) => {
        const config = await insertIngredientConfiguration({
          ...configData,
          ingredientId,
        });
        set((state) => ({
          ingredients: state.ingredients.map((ing) =>
            ing.id === ingredientId
              ? { ...ing, configurations: [...(ing.configurations ?? []), config] }
              : ing
          ),
        }));
        return config;
      },

      updateConfiguration: async (ingredientId, configId, updates) => {
        const updated = await updateIngredientConfiguration(configId, updates);
        set((state) => ({
          ingredients: state.ingredients.map((ing) =>
            ing.id === ingredientId
              ? {
                  ...ing,
                  configurations: (ing.configurations ?? []).map((c) =>
                    c.id === configId ? updated : c
                  ),
                }
              : ing
          ),
        }));
      },

      deleteConfiguration: async (ingredientId, configId) => {
        await deleteIngredientConfiguration(configId);
        set((state) => ({
          ingredients: state.ingredients.map((ing) =>
            ing.id === ingredientId
              ? {
                  ...ing,
                  configurations: (ing.configurations ?? []).filter(
                    (c) => c.id !== configId
                  ),
                }
              : ing
          ),
        }));
      },

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedType: (type) => set({ selectedType: type }),
      setSortBy: (sortBy) => set({ sortBy }),

      getIngredientById: (id) => get().ingredients.find(i => i.id === id),

      getFilteredIngredients: () => {
        const { ingredients, searchQuery, selectedType, sortBy } = get();
        if (ingredients.length === 0) return [];

        const filtered = ingredients.filter(i => {
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
          } else {
            // Normalize dates from JSON strings back to Date objects
            state.ingredients = state.ingredients.map(i => ({
              ...i,
              createdAt: ensureDate(i.createdAt),
              updatedAt: ensureDate(i.updatedAt),
            }));
          }
          state.isLoading = false;
          // Don't load here — auth may not be ready yet.
          // Root layout triggers loadIngredients() after auth is confirmed.
        }
      },
    }
  )
);
