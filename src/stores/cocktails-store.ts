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
import { ValidationService } from '@/src/services/validation-service';
import { FeedbackService } from '@/src/services/feedback-service';
import { getCocktailsWithCalculations } from '@/src/services/mock-data';

export interface CocktailsState {
  // Data
  cocktails: CocktailWithCalculations[];
  isLoading: boolean;
  error: string | null;
  validationErrors: Record<string, string[]>; // Cocktail ID -> errors
  
  // UI State
  searchQuery: string;
  selectedCategory: string;
  sortBy: 'name' | 'cost' | 'created' | 'profitMargin' | 'costPercent';
  
  // Actions - Data Management
  loadCocktails: () => Promise<void>;
  addCocktail: (data: CreateCocktailData) => Promise<Cocktail>;
  updateCocktail: (data: UpdateCocktailData) => Promise<Cocktail>;
  deleteCocktail: (id: string) => Promise<void>;
  bulkDeleteCocktails: (ids: string[]) => Promise<void>;
  duplicateCocktail: (id: string, newName?: string) => Promise<Cocktail>;
  toggleFavorite: (id: string) => Promise<void>;
  
  // Recipe Management
  addIngredientToCocktail: (cocktailId: string, ingredient: SavedIngredient, amount?: number) => Promise<Cocktail>;
  removeIngredientFromCocktail: (cocktailId: string, ingredientId: string) => Promise<Cocktail>;
  updateIngredientAmount: (cocktailId: string, ingredientId: string, newAmount: number) => Promise<Cocktail>;
  reorderIngredients: (cocktailId: string, ingredientIds: string[]) => Promise<Cocktail>;
  
  // Actions - UI State
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSortBy: (sortBy: 'name' | 'cost' | 'created' | 'profitMargin' | 'costPercent') => void;
  
  // Computed/Derived State
  getFilteredCocktails: () => CocktailWithCalculations[];
  getCocktailById: (id: string) => CocktailWithCalculations | undefined;
  getFavoriteCocktails: () => CocktailWithCalculations[];
  getCocktailsByCategory: (category: string) => CocktailWithCalculations[];
  getCocktailCategories: () => string[];
  getCocktailStatistics: () => Promise<any>;
  
  // Validation & Business Logic
  validateCocktail: (data: Partial<CreateCocktailData>) => ReturnType<typeof ValidationService.validateCocktail>;
  validateAllCocktails: () => Promise<void>;
  calculateCocktailMetrics: (cocktail: Cocktail) => ReturnType<typeof CocktailService.calculateCocktailMetrics>;
  getBusinessRuleAnalysis: (cocktail: CocktailWithCalculations) => any;
  
  // Advanced Features
  searchCocktails: (query: string, limit?: number) => Promise<CocktailWithCalculations[]>;
  suggestSimilarCocktails: (cocktailId: string) => CocktailWithCalculations[];
  
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
      isLoading: true, // Start with loading true until data is loaded
      error: null,
      validationErrors: {},
      searchQuery: '',
      selectedCategory: 'All',
      sortBy: 'created',
      
      // Data management actions
      loadCocktails: async () => {
        const currentState = get();
        
        // Always load if no cocktails exist, regardless of loading state
        if (currentState.cocktails.length > 0) {
          console.log('Cocktails already loaded, skipping reload');
          return;
        }
        
        console.log('Loading cocktails...');
        set({ isLoading: true, error: null });
        try {
          // In Phase 4, we're still using mock data
          // In Phase 5, this will connect to local storage
          // In Phase 6, this will sync with cloud storage
          const cocktails = getCocktailsWithCalculations();
          console.log('Loaded cocktails:', cocktails.length);
          set({ cocktails, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load cocktails';
          console.error('Error loading cocktails:', error);
          set({ error: errorMessage, isLoading: false });
          FeedbackService.handleError(error instanceof Error ? error : errorMessage, {
            screen: 'cocktails',
            action: 'loadCocktails'
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
          
          // Show success feedback
          FeedbackService.showOperationSuccess('create', newCocktail.name);
          
          return newCocktail;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add cocktail';
          set({ error: errorMessage, isLoading: false });
          FeedbackService.handleError(error instanceof Error ? error : errorMessage, {
            screen: 'cocktails',
            action: 'addCocktail'
          });
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
        
        // Return empty array if no cocktails loaded yet
        if (cocktails.length === 0) {
          return [];
        }
        
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
      
      // Missing required methods
      bulkDeleteCocktails: async (ids: string[]) => {
        set({ isLoading: true, error: null });
        try {
          // Delete all cocktails
          await Promise.all(ids.map(id => CocktailService.deleteCocktail(id)));
          
          const currentCocktails = get().cocktails;
          const filteredCocktails = currentCocktails.filter(
            cocktail => !ids.includes(cocktail.id)
          );
          
          set({ 
            cocktails: filteredCocktails,
            isLoading: false 
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete cocktails';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      reorderIngredients: async (cocktailId: string, ingredientIds: string[]) => {
        const cocktail = get().getCocktailById(cocktailId);
        if (!cocktail) {
          throw new Error('Cocktail not found');
        }
        
        // Reorder ingredients based on provided IDs
        const reorderedIngredients = ingredientIds.map((id, index) => {
          const ingredient = cocktail.ingredients.find(ing => ing.id === id);
          if (!ingredient) throw new Error(`Ingredient ${id} not found`);
          return { ...ingredient, order: index };
        });
        
        return get().updateCocktail({
          id: cocktailId,
          ingredients: reorderedIngredients,
        });
      },
      
      getCocktailsByCategory: (category: string) => {
        return get().cocktails.filter(cocktail => cocktail.category === category);
      },
      
      getCocktailCategories: () => {
        const cocktails = get().cocktails;
        const categories = new Set<string>();
        
        cocktails.forEach(cocktail => {
          if (cocktail.category) {
            categories.add(cocktail.category);
          }
        });
        
        return Array.from(categories).sort();
      },
      
      getCocktailStatistics: async () => {
        return CocktailService.getCostStatistics();
      },
      
      validateCocktail: (data: Partial<CreateCocktailData>) => {
        return ValidationService.validateCocktail(data);
      },
      
      validateAllCocktails: async () => {
        const cocktails = get().cocktails;
        const validationErrors: Record<string, string[]> = {};
        
        cocktails.forEach(cocktail => {
          const validation = get().validateCocktail(cocktail);
          if (!validation.isValid) {
            validationErrors[cocktail.id] = validation.errors;
          }
        });
        
        set({ validationErrors });
      },
      
      calculateCocktailMetrics: (cocktail: Cocktail) => {
        return CocktailService.calculateCocktailMetrics(cocktail);
      },
      
      getBusinessRuleAnalysis: (cocktail: CocktailWithCalculations) => {
        return ValidationService.validateCocktailBusinessRules({
          name: cocktail.name,
          totalCost: cocktail.totalCost,
          suggestedPrice: cocktail.suggestedPrice,
          pourCostPercentage: cocktail.pourCostPercentage,
          profitMargin: cocktail.profitMargin,
          ingredients: cocktail.ingredients.map(ing => ({ cost: ing.cost, name: ing.name })),
        });
      },
      
      searchCocktails: async (query: string, limit = 10) => {
        return CocktailService.searchCocktails(query, undefined, limit);
      },
      
      suggestSimilarCocktails: (cocktailId: string) => {
        const cocktail = get().getCocktailById(cocktailId);
        if (!cocktail) return [];
        
        const allCocktails = get().cocktails;
        
        // Simple similarity based on shared ingredients
        const cocktailIngredientNames = cocktail.ingredients.map(ing => ing.name.toLowerCase());
        
        return allCocktails
          .filter(c => c.id !== cocktailId)
          .map(c => ({
            ...c,
            similarity: c.ingredients.filter(ing => 
              cocktailIngredientNames.includes(ing.name.toLowerCase())
            ).length
          }))
          .filter(c => c.similarity > 0)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 5)
          .map(({ similarity, ...cocktail }) => cocktail);
      },
      
      // Utility actions
      clearError: () => set({ error: null, validationErrors: {} }),
      reset: () => set({
        cocktails: [],
        isLoading: false,
        error: null,
        validationErrors: {},
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
        console.log('Rehydrating cocktails store:', state?.cocktails?.length || 0, 'cocktails');
        if (state) {
          // Always ensure loading is false after rehydration
          state.isLoading = false;
          
          if (state.cocktails.length === 0) {
            console.log('No persisted cocktails found, loading mock data');
            // Load mock data if no persisted data exists
            state.loadCocktails();
          } else {
            console.log('Rehydrated', state.cocktails.length, 'cocktails from storage');
          }
        }
      },
    }
  )
);

