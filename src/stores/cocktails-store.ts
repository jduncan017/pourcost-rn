/**
 * Cocktails Store for PourCost-RN
 * Manages cocktail state with Zustand
 * Integrates with CocktailService for business logic
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cocktail, CocktailWithCalculations, SavedIngredient } from '@/src/types/models';
import { CocktailService, CreateCocktailData, UpdateCocktailData } from '@/src/services/cocktail-service';
import { getCocktailsWithCalculations } from '@/src/services/mock-data';

export interface CocktailsState {
  // Data
  cocktails: CocktailWithCalculations[];
  isLoading: boolean;
  error: string | null;
  
  // UI State
  searchQuery: string;
  selectedCategory: string;
  sortBy: 'name' | 'cost' | 'created' | 'profitMargin' | 'costPercent';
  
  // Actions - Data Management
  loadCocktails: () => Promise<void>;
  addCocktail: (data: CreateCocktailData) => Promise<Cocktail>;
  updateCocktail: (data: UpdateCocktailData) => Promise<Cocktail>;
  deleteCocktail: (id: string) => Promise<void>;
  duplicateCocktail: (id: string, newName?: string) => Promise<Cocktail>;
  toggleFavorite: (id: string) => Promise<void>;
  
  // Recipe Management
  addIngredientToCocktail: (cocktailId: string, ingredient: SavedIngredient, amount?: number) => Promise<Cocktail>;
  removeIngredientFromCocktail: (cocktailId: string, ingredientId: string) => Promise<Cocktail>;
  updateIngredientAmount: (cocktailId: string, ingredientId: string, newAmount: number) => Promise<Cocktail>;
  
  // Actions - UI State
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSortBy: (sortBy: 'name' | 'cost' | 'created' | 'profitMargin' | 'costPercent') => void;
  
  // Computed/Derived State
  getFilteredCocktails: () => CocktailWithCalculations[];
  getCocktailById: (id: string) => CocktailWithCalculations | undefined;
  getFavoriteCocktails: () => CocktailWithCalculations[];
  
  // Utility Actions
  clearError: () => void;
  reset: () => void;
}

/**
 * Cocktails store using Zustand with persistence
 */
export const useCocktailsStore = create<CocktailsState>()(
  persist(
    (set, get) => ({
      // Initial state
      cocktails: [],
      isLoading: false,
      error: null,
      searchQuery: '',
      selectedCategory: 'All',
      sortBy: 'created',
      
      // Data management actions
      loadCocktails: async () => {
        set({ isLoading: true, error: null });
        try {
          // In Phase 4, we're still using mock data
          // In Phase 5, this will connect to local storage
          // In Phase 6, this will sync with cloud storage
          const cocktails = getCocktailsWithCalculations();
          set({ cocktails, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load cocktails',
            isLoading: false 
          });
        }
      },
      
      addCocktail: async (data: CreateCocktailData) => {
        set({ isLoading: true, error: null });
        try {
          const newCocktail = await CocktailService.createCocktail(data);
          
          // Convert to CocktailWithCalculations
          const cocktailWithCalcs: CocktailWithCalculations = {
            ...newCocktail,
            totalCost: CocktailService.calculateCocktailMetrics(newCocktail).totalCost,
            suggestedPrice: CocktailService.calculateCocktailMetrics(newCocktail).suggestedPrice,
            pourCostPercentage: CocktailService.calculateCocktailMetrics(newCocktail).pourCostPercentage,
          };
          
          const currentCocktails = get().cocktails;
          set({ 
            cocktails: [...currentCocktails, cocktailWithCalcs],
            isLoading: false 
          });
          
          return newCocktail;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add cocktail';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      updateCocktail: async (data: UpdateCocktailData) => {
        set({ isLoading: true, error: null });
        try {
          const updatedCocktail = await CocktailService.updateCocktail(data);
          
          // Convert to CocktailWithCalculations
          const cocktailWithCalcs: CocktailWithCalculations = {
            ...updatedCocktail,
            totalCost: CocktailService.calculateCocktailMetrics(updatedCocktail).totalCost,
            suggestedPrice: CocktailService.calculateCocktailMetrics(updatedCocktail).suggestedPrice,
            pourCostPercentage: CocktailService.calculateCocktailMetrics(updatedCocktail).pourCostPercentage,
          };
          
          const currentCocktails = get().cocktails;
          const updatedCocktails = currentCocktails.map(cocktail =>
            cocktail.id === data.id ? cocktailWithCalcs : cocktail
          );
          
          set({ 
            cocktails: updatedCocktails,
            isLoading: false 
          });
          
          return updatedCocktail;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update cocktail';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      deleteCocktail: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await CocktailService.deleteCocktail(id);
          const currentCocktails = get().cocktails;
          
          const filteredCocktails = currentCocktails.filter(
            cocktail => cocktail.id !== id
          );
          
          set({ 
            cocktails: filteredCocktails,
            isLoading: false 
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete cocktail';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      duplicateCocktail: async (id: string, newName?: string) => {
        set({ isLoading: true, error: null });
        try {
          const duplicatedCocktail = await CocktailService.duplicateCocktail(id, newName);
          
          // Convert to CocktailWithCalculations
          const cocktailWithCalcs: CocktailWithCalculations = {
            ...duplicatedCocktail,
            totalCost: CocktailService.calculateCocktailMetrics(duplicatedCocktail).totalCost,
            suggestedPrice: CocktailService.calculateCocktailMetrics(duplicatedCocktail).suggestedPrice,
            pourCostPercentage: CocktailService.calculateCocktailMetrics(duplicatedCocktail).pourCostPercentage,
          };
          
          const currentCocktails = get().cocktails;
          set({ 
            cocktails: [...currentCocktails, cocktailWithCalcs],
            isLoading: false 
          });
          
          return duplicatedCocktail;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate cocktail';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      toggleFavorite: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          // Find current cocktail
          const currentCocktails = get().cocktails;
          const cocktail = currentCocktails.find(c => c.id === id);
          
          if (!cocktail) {
            throw new Error('Cocktail not found');
          }
          
          // Toggle favorite status
          const updatedCocktail = await CocktailService.updateCocktail({
            id,
            favorited: !cocktail.favorited,
          });
          
          // Convert to CocktailWithCalculations
          const cocktailWithCalcs: CocktailWithCalculations = {
            ...updatedCocktail,
            totalCost: cocktail.totalCost,
            suggestedPrice: cocktail.suggestedPrice,
            pourCostPercentage: cocktail.pourCostPercentage,
          };
          
          const updatedCocktails = currentCocktails.map(c =>
            c.id === id ? cocktailWithCalcs : c
          );
          
          set({ 
            cocktails: updatedCocktails,
            isLoading: false 
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to toggle favorite';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      // Recipe management actions
      addIngredientToCocktail: async (cocktailId: string, ingredient: SavedIngredient, amount = 1.5) => {
        set({ isLoading: true, error: null });
        try {
          const updatedCocktail = await CocktailService.addIngredientToCocktail(
            cocktailId,
            ingredient,
            amount
          );
          
          // Update in store
          const currentCocktails = get().cocktails;
          const cocktailWithCalcs: CocktailWithCalculations = {
            ...updatedCocktail,
            totalCost: CocktailService.calculateCocktailMetrics(updatedCocktail).totalCost,
            suggestedPrice: CocktailService.calculateCocktailMetrics(updatedCocktail).suggestedPrice,
            pourCostPercentage: CocktailService.calculateCocktailMetrics(updatedCocktail).pourCostPercentage,
          };
          
          const updatedCocktails = currentCocktails.map(c =>
            c.id === cocktailId ? cocktailWithCalcs : c
          );
          
          set({ 
            cocktails: updatedCocktails,
            isLoading: false 
          });
          
          return updatedCocktail;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add ingredient';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      removeIngredientFromCocktail: async (cocktailId: string, ingredientId: string) => {
        set({ isLoading: true, error: null });
        try {
          const updatedCocktail = await CocktailService.removeIngredientFromCocktail(
            cocktailId,
            ingredientId
          );
          
          // Update in store
          const currentCocktails = get().cocktails;
          const cocktailWithCalcs: CocktailWithCalculations = {
            ...updatedCocktail,
            totalCost: CocktailService.calculateCocktailMetrics(updatedCocktail).totalCost,
            suggestedPrice: CocktailService.calculateCocktailMetrics(updatedCocktail).suggestedPrice,
            pourCostPercentage: CocktailService.calculateCocktailMetrics(updatedCocktail).pourCostPercentage,
          };
          
          const updatedCocktails = currentCocktails.map(c =>
            c.id === cocktailId ? cocktailWithCalcs : c
          );
          
          set({ 
            cocktails: updatedCocktails,
            isLoading: false 
          });
          
          return updatedCocktail;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to remove ingredient';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      updateIngredientAmount: async (cocktailId: string, ingredientId: string, newAmount: number) => {
        set({ isLoading: true, error: null });
        try {
          const updatedCocktail = await CocktailService.updateIngredientAmount(
            cocktailId,
            ingredientId,
            newAmount
          );
          
          // Update in store
          const currentCocktails = get().cocktails;
          const cocktailWithCalcs: CocktailWithCalculations = {
            ...updatedCocktail,
            totalCost: CocktailService.calculateCocktailMetrics(updatedCocktail).totalCost,
            suggestedPrice: CocktailService.calculateCocktailMetrics(updatedCocktail).suggestedPrice,
            pourCostPercentage: CocktailService.calculateCocktailMetrics(updatedCocktail).pourCostPercentage,
          };
          
          const updatedCocktails = currentCocktails.map(c =>
            c.id === cocktailId ? cocktailWithCalcs : c
          );
          
          set({ 
            cocktails: updatedCocktails,
            isLoading: false 
          });
          
          return updatedCocktail;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update ingredient amount';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      // UI state actions
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setSelectedCategory: (category: string) => set({ selectedCategory: category }),
      setSortBy: (sortBy: 'name' | 'cost' | 'created' | 'profitMargin' | 'costPercent') => set({ sortBy }),
      
      // Computed state
      getFilteredCocktails: () => {
        const { cocktails, searchQuery, selectedCategory, sortBy } = get();
        
        // Ensure all cocktails have valid dates
        const validCocktails = cocktails.map(cocktail => ({
          ...cocktail,
          // Ensure createdAt and updatedAt are valid dates
          createdAt: cocktail.createdAt instanceof Date ? cocktail.createdAt : new Date(),
          updatedAt: cocktail.updatedAt instanceof Date ? cocktail.updatedAt : new Date(),
        }));
        
        // Apply filters
        const filtered = validCocktails.filter(cocktail => {
          const matchesSearch = !searchQuery || 
            cocktail.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (cocktail.description && cocktail.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            cocktail.ingredients.some(ingredient =>
              ingredient && ingredient.name && ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
          
          const matchesCategory = selectedCategory === 'All' || 
            cocktail.category === selectedCategory;
          
          return matchesSearch && matchesCategory;
        });
        
        // Apply sorting
        return CocktailService.sortCocktails(filtered, sortBy, sortBy !== 'created');
      },
      
      getCocktailById: (id: string) => {
        return get().cocktails.find(cocktail => cocktail.id === id);
      },
      
      getFavoriteCocktails: () => {
        return get().cocktails.filter(cocktail => cocktail.favorited);
      },
      
      // Utility actions
      clearError: () => set({ error: null }),
      reset: () => set({
        cocktails: [],
        isLoading: false,
        error: null,
        searchQuery: '',
        selectedCategory: 'All',
        sortBy: 'created',
      }),
    }),
    {
      name: 'cocktails-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the cocktails data, not UI state
      partialize: (state) => ({
        cocktails: state.cocktails,
      }),
      // Load data after rehydration
      onRehydrateStorage: () => (state) => {
        if (state && state.cocktails.length === 0) {
          // Load mock data if no persisted data exists
          state.loadCocktails();
        }
      },
    }
  )
);

