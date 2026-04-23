/**
 * Cocktails Store for PourCost-RN
 * Stores base Cocktail data. Metrics are computed on-demand.
 * Data backed by Supabase, with AsyncStorage as offline cache.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cocktail } from '@/src/types/models';
import { calculateCocktailMetrics } from '@/src/services/calculation-service';
import { FeedbackService } from '@/src/services/feedback-service';
import type { CocktailSortOption } from '@/src/constants/appConstants';
import { ensureDate } from '@/src/lib/ensureDate';
import { fetchCocktails } from '@/src/lib/supabase-data';
import {
  insertCocktail,
  updateCocktailById,
  deleteCocktailById,
} from '@/src/lib/supabase-writes';

// ==========================================
// STORE INTERFACE
// ==========================================

export interface CocktailsState {
  cocktails: Cocktail[];
  isLoading: boolean;
  error: string | null;

  searchQuery: string;
  selectedCategory: string;
  sortBy: CocktailSortOption;

  loadCocktails: (forceReload?: boolean) => Promise<void>;
  addCocktail: (cocktail: Omit<Cocktail, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<Cocktail>;
  updateCocktail: (id: string, updates: Partial<Cocktail>) => Promise<void>;
  deleteCocktail: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;

  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSortBy: (sortBy: CocktailSortOption) => void;

  getCocktailById: (id: string) => Cocktail | undefined;
  getFilteredCocktails: () => Cocktail[];
  getFavoriteCocktails: () => Cocktail[];
  getCocktailCategories: () => string[];

  clearError: () => void;
  reset: () => void;
}

// ==========================================
// SORTING
// ==========================================

function sortCocktails(
  cocktails: Cocktail[],
  sortBy: CocktailSortOption,
): Cocktail[] {
  return [...cocktails].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'cost': {
        const ma = calculateCocktailMetrics(a.ingredients);
        const mb = calculateCocktailMetrics(b.ingredients);
        return ma.totalCost - mb.totalCost;
      }
      case 'profitMargin': {
        // Sort by real margin when retailPrice is set; otherwise hypothetical fallback.
        const ma = calculateCocktailMetrics(a.ingredients, undefined, a.retailPrice);
        const mb = calculateCocktailMetrics(b.ingredients, undefined, b.retailPrice);
        return mb.profitMargin - ma.profitMargin;
      }
      case 'costPercent': {
        const ma = calculateCocktailMetrics(a.ingredients);
        const mb = calculateCocktailMetrics(b.ingredients);
        return ma.pourCostPercentage - mb.pourCostPercentage;
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

export const useCocktailsStore = create<CocktailsState>()(
  persist(
    (set, get) => ({
      cocktails: [],
      isLoading: false,
      error: null,
      searchQuery: '',
      selectedCategory: 'All',
      sortBy: 'name' as CocktailSortOption,

      loadCocktails: async (forceReload = false) => {
        const { cocktails, isLoading } = get();
        if (cocktails.length > 0 && !isLoading && !forceReload) return;

        set({ isLoading: true, error: null });
        try {
          const data = await fetchCocktails();
          set({ cocktails: data, isLoading: false });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to load cocktails';
          set({ error: msg, isLoading: false });
        }
      },

      addCocktail: async (cocktailData) => {
        set({ error: null });
        try {
          const newCocktail = await insertCocktail(cocktailData);
          set(state => ({
            cocktails: [newCocktail, ...state.cocktails],
          }));
          FeedbackService.showOperationSuccess('create', newCocktail.name);
          return newCocktail;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to add cocktail';
          set({ error: msg });
          throw error;
        }
      },

      updateCocktail: async (id, updates) => {
        set({ error: null });
        try {
          const updated = await updateCocktailById(id, updates);
          set(state => ({
            cocktails: state.cocktails.map(c =>
              c.id === id ? updated : c
            ),
          }));
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to update cocktail';
          set({ error: msg });
          throw error;
        }
      },

      deleteCocktail: async (id) => {
        const cocktail = get().cocktails.find(c => c.id === id);
        if (!cocktail) return;
        set({ error: null });

        // Optimistically remove from UI
        set(state => ({
          cocktails: state.cocktails.filter(c => c.id !== id),
        }));

        // Delay the actual delete so user can undo
        let cancelled = false;
        const timer = setTimeout(async () => {
          if (cancelled) return;
          try {
            await deleteCocktailById(id);
          } catch (error) {
            // Re-add on failure
            set(state => ({ cocktails: [...state.cocktails, cocktail] }));
            const msg = error instanceof Error ? error.message : 'Failed to delete cocktail';
            FeedbackService.showError('Delete Failed', msg);
          }
        }, 5000);

        FeedbackService.showSuccess(
          'Deleted',
          `"${cocktail.name}" removed`,
          {
            label: 'Undo',
            onPress: () => {
              cancelled = true;
              clearTimeout(timer);
              set(state => ({ cocktails: [...state.cocktails, cocktail] }));
            },
          }
        );
      },

      toggleFavorite: async (id) => {
        const cocktail = get().cocktails.find(c => c.id === id);
        if (!cocktail) return;

        const newFavorited = !cocktail.favorited;
        // Optimistic update
        set(state => ({
          cocktails: state.cocktails.map(c =>
            c.id === id ? { ...c, favorited: newFavorited } : c
          ),
        }));

        try {
          await updateCocktailById(id, { favorited: newFavorited });
        } catch (error) {
          // Revert on failure
          set(state => ({
            cocktails: state.cocktails.map(c =>
              c.id === id ? { ...c, favorited: !newFavorited } : c
            ),
          }));
          const msg = error instanceof Error ? error.message : 'Failed to update favorite';
          set({ error: msg });
        }
      },

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      setSortBy: (sortBy) => set({ sortBy }),

      getCocktailById: (id) => get().cocktails.find(c => c.id === id),

      getFilteredCocktails: () => {
        const { cocktails, searchQuery, selectedCategory, sortBy } = get();
        if (cocktails.length === 0) return [];

        const filtered = cocktails.filter(c => {
          const matchesSearch = !searchQuery ||
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            c.ingredients.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
          const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
          return matchesSearch && matchesCategory;
        });

        return sortCocktails(filtered, sortBy);
      },

      getFavoriteCocktails: () => get().cocktails.filter(c => c.favorited),

      getCocktailCategories: () => {
        const cats = new Set<string>();
        get().cocktails.forEach(c => { if (c.category) cats.add(c.category); });
        return Array.from(cats).sort();
      },

      clearError: () => set({ error: null }),
      reset: () => set({
        cocktails: [],
        isLoading: false,
        error: null,
        searchQuery: '',
        selectedCategory: 'All',
        sortBy: 'name' as CocktailSortOption,
      }),
    }),
    {
      name: 'cocktails-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ cocktails: state.cocktails }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Clear stale cache from old model format
          const hasStaleData = state.cocktails.some(
            (c: any) => c.ingredients?.some((i: any) => !i.pourSize?.kind)
          );
          if (hasStaleData) {
            state.cocktails = [];
          } else {
            // Normalize dates from JSON strings back to Date objects
            state.cocktails = state.cocktails.map(c => ({
              ...c,
              createdAt: ensureDate(c.createdAt),
              updatedAt: ensureDate(c.updatedAt),
            }));
          }
          state.isLoading = false;
          // Don't load here — auth may not be ready yet.
          // Root layout triggers loadCocktails() after auth is confirmed.
        }
      },
    }
  )
);
