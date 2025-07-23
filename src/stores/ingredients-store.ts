/**
 * Ingredients Store for PourCost-RN
 * Manages ingredient state with Zustand
 * Integrates with IngredientService for business logic
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedIngredient, IngredientWithCalculations } from '@/src/types/models';
import { IngredientService, CreateIngredientData, UpdateIngredientData } from '@/src/services/ingredient-service';
import { getSavedIngredients, getIngredientsWithCalculations } from '@/src/services/mock-data';

export interface IngredientsState {
  // Data
  ingredients: SavedIngredient[];
  isLoading: boolean;
  error: string | null;
  
  // UI State
  searchQuery: string;
  selectedType: string;
  sortBy: 'name' | 'cost' | 'created' | 'pourCost' | 'margin';
  
  // Actions - Data Management
  loadIngredients: () => Promise<void>;
  addIngredient: (data: CreateIngredientData) => Promise<SavedIngredient>;
  updateIngredient: (data: UpdateIngredientData) => Promise<SavedIngredient>;
  deleteIngredient: (id: string) => Promise<void>;
  
  // Actions - UI State
  setSearchQuery: (query: string) => void;
  setSelectedType: (type: string) => void;
  setSortBy: (sortBy: 'name' | 'cost' | 'created' | 'pourCost' | 'margin') => void;
  
  // Computed/Derived State
  getFilteredIngredients: () => IngredientWithCalculations[];
  getIngredientById: (id: string) => SavedIngredient | undefined;
  
  // Utility Actions
  clearError: () => void;
  reset: () => void;
}

/**
 * Ingredients store using Zustand with persistence
 */
export const useIngredientsStore = create<IngredientsState>()(
  persist(
    (set, get) => ({
      // Initial state
      ingredients: [],
      isLoading: false,
      error: null,
      searchQuery: '',
      selectedType: 'All',
      sortBy: 'name',
      
      // Data management actions
      loadIngredients: async () => {
        set({ isLoading: true, error: null });
        try {
          // In Phase 4, we're still using mock data
          // In Phase 5, this will connect to local storage
          // In Phase 6, this will sync with cloud storage
          const ingredients = getSavedIngredients();
          set({ ingredients, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load ingredients',
            isLoading: false 
          });
        }
      },
      
      addIngredient: async (data: CreateIngredientData) => {
        set({ isLoading: true, error: null });
        try {
          const newIngredient = await IngredientService.createIngredient(data);
          const currentIngredients = get().ingredients;
          
          set({ 
            ingredients: [...currentIngredients, newIngredient],
            isLoading: false 
          });
          
          return newIngredient;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add ingredient';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      updateIngredient: async (data: UpdateIngredientData) => {
        set({ isLoading: true, error: null });
        try {
          const updatedIngredient = await IngredientService.updateIngredient(data);
          const currentIngredients = get().ingredients;
          
          const updatedIngredients = currentIngredients.map(ingredient =>
            ingredient.id === data.id ? updatedIngredient : ingredient
          );
          
          set({ 
            ingredients: updatedIngredients,
            isLoading: false 
          });
          
          return updatedIngredient;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update ingredient';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      deleteIngredient: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await IngredientService.deleteIngredient(id);
          const currentIngredients = get().ingredients;
          
          const filteredIngredients = currentIngredients.filter(
            ingredient => ingredient.id !== id
          );
          
          set({ 
            ingredients: filteredIngredients,
            isLoading: false 
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete ingredient';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      // UI state actions
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setSelectedType: (type: string) => set({ selectedType: type }),
      setSortBy: (sortBy: 'name' | 'cost' | 'created' | 'pourCost' | 'margin') => set({ sortBy }),
      
      // Computed state
      getFilteredIngredients: () => {
        const { ingredients, searchQuery, selectedType, sortBy } = get();
        
        // Ensure all ingredients have valid dates
        const validIngredients = ingredients.map(ingredient => ({
          ...ingredient,
          // Ensure createdAt and updatedAt are valid dates
          createdAt: ingredient.createdAt instanceof Date ? ingredient.createdAt : new Date(),
          updatedAt: ingredient.updatedAt instanceof Date ? ingredient.updatedAt : new Date(),
        }));
        
        // Convert to ingredients with calculations
        const ingredientsWithCalcs = validIngredients.map(ingredient =>
          IngredientService.calculateIngredientMetrics(
            ingredient,
            1.5, // Default pour size
            8.0, // Default retail price
            'USD', // Default currency
            'US' // Default measurement system
          )
        );
        
        // Apply filters
        const filtered = ingredientsWithCalcs.filter(ingredient => {
          const matchesSearch = !searchQuery || 
            ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ingredient.type && ingredient.type.toLowerCase().includes(searchQuery.toLowerCase()));
          
          const matchesType = selectedType === 'All' || 
            (ingredient.type && ingredient.type === selectedType);
          
          return matchesSearch && matchesType;
        });
        
        // Apply sorting
        return IngredientService.sortIngredients(filtered, sortBy, sortBy !== 'created');
      },
      
      getIngredientById: (id: string) => {
        return get().ingredients.find(ingredient => ingredient.id === id);
      },
      
      // Utility actions
      clearError: () => set({ error: null }),
      reset: () => set({
        ingredients: [],
        isLoading: false,
        error: null,
        searchQuery: '',
        selectedType: 'All',
        sortBy: 'name',
      }),
    }),
    {
      name: 'ingredients-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the ingredients data, not UI state
      partialize: (state) => ({
        ingredients: state.ingredients,
      }),
      // Load data after rehydration
      onRehydrateStorage: () => (state) => {
        if (state && state.ingredients.length === 0) {
          // Load mock data if no persisted data exists
          state.loadIngredients();
        }
      },
    }
  )
);

