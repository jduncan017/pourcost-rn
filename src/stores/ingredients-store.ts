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
import { ValidationService } from '@/src/services/validation-service';
import { CurrencyService } from '@/src/services/currency-service';
import { MeasurementService } from '@/src/services/measurement-service';
import { FeedbackService } from '@/src/services/feedback-service';
import { getSavedIngredients, getIngredientsWithCalculations } from '@/src/services/mock-data';

export interface IngredientsState {
  // Data
  ingredients: SavedIngredient[];
  isLoading: boolean;
  error: string | null;
  validationErrors: Record<string, string[]>; // Ingredient ID -> errors
  
  // UI State
  searchQuery: string;
  selectedType: string;
  sortBy: 'name' | 'cost' | 'created' | 'pourCost' | 'margin';
  
  // Actions - Data Management
  loadIngredients: () => Promise<void>;
  addIngredient: (data: CreateIngredientData) => Promise<SavedIngredient>;
  updateIngredient: (data: UpdateIngredientData) => Promise<SavedIngredient>;
  deleteIngredient: (id: string) => Promise<void>;
  bulkDeleteIngredients: (ids: string[]) => Promise<void>;
  duplicateIngredient: (id: string, newName?: string) => Promise<SavedIngredient>;
  
  // Actions - UI State
  setSearchQuery: (query: string) => void;
  setSelectedType: (type: string) => void;
  setSortBy: (sortBy: 'name' | 'cost' | 'created' | 'pourCost' | 'margin') => void;
  
  // Computed/Derived State
  getFilteredIngredients: () => IngredientWithCalculations[];
  getIngredientById: (id: string) => SavedIngredient | undefined;
  getIngredientTypes: () => string[];
  getIngredientStatistics: () => Promise<any>;
  
  // Validation
  validateIngredient: (data: Partial<CreateIngredientData>) => ReturnType<typeof ValidationService.validateIngredient>;
  validateAllIngredients: () => Promise<void>;
  
  // Business Logic Integration
  calculateIngredientMetrics: (ingredient: SavedIngredient, retailPrice?: number) => IngredientWithCalculations;
  getPerformanceAnalysis: (ingredient: IngredientWithCalculations) => any;
  
  // Utility Actions
  clearError: () => void;
  reset: () => void;
  searchIngredients: (query: string, limit?: number) => Promise<SavedIngredient[]>;
}

/**
 * Ingredients store using Zustand with persistence
 */
export const useIngredientsStore = create<IngredientsState>()(
  persist(
    (set, get) => ({
      // Initial state
      ingredients: [],
      isLoading: true, // Start with loading true until data is loaded
      error: null,
      validationErrors: {},
      searchQuery: '',
      selectedType: 'All',
      sortBy: 'name',
      
      // Data management actions
      loadIngredients: async () => {
        const currentState = get();
        
        // Don't reload if already loaded and not loading
        if (currentState.ingredients.length > 0 && !currentState.isLoading) {
          return;
        }
        
        set({ isLoading: true, error: null });
        try {
          // In Phase 4, we're still using mock data
          // In Phase 5, this will connect to local storage
          // In Phase 6, this will sync with cloud storage
          const ingredients = getSavedIngredients();
          set({ ingredients, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load ingredients';
          set({ error: errorMessage, isLoading: false });
          FeedbackService.handleError(error instanceof Error ? error : errorMessage, {
            screen: 'ingredients',
            action: 'loadIngredients'
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
          
          // Show success feedback
          FeedbackService.showOperationSuccess('create', newIngredient.name);
          
          return newIngredient;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add ingredient';
          set({ error: errorMessage, isLoading: false });
          FeedbackService.handleError(error instanceof Error ? error : errorMessage, {
            screen: 'ingredients',
            action: 'addIngredient'
          });
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
          
          // Show success feedback
          FeedbackService.showOperationSuccess('update', updatedIngredient.name);
          
          return updatedIngredient;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update ingredient';
          set({ error: errorMessage, isLoading: false });
          FeedbackService.handleError(error instanceof Error ? error : errorMessage, {
            screen: 'ingredients',
            action: 'updateIngredient'
          });
          throw error;
        }
      },
      
      deleteIngredient: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const ingredient = get().ingredients.find(ing => ing.id === id);
          const ingredientName = ingredient?.name || 'ingredient';
          
          await IngredientService.deleteIngredient(id);
          const currentIngredients = get().ingredients;
          
          const filteredIngredients = currentIngredients.filter(
            ingredient => ingredient.id !== id
          );
          
          set({ 
            ingredients: filteredIngredients,
            isLoading: false 
          });
          
          // Show success feedback
          FeedbackService.showOperationSuccess('delete', ingredientName);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete ingredient';
          set({ error: errorMessage, isLoading: false });
          FeedbackService.handleError(error instanceof Error ? error : errorMessage, {
            screen: 'ingredients',
            action: 'deleteIngredient'
          });
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
        
        // Return empty array if no ingredients loaded yet
        if (ingredients.length === 0) {
          return [];
        }
        
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
      
      // New enhanced functionality
      bulkDeleteIngredients: async (ids: string[]) => {
        set({ isLoading: true, error: null });
        try {
          // Delete all ingredients
          await Promise.all(ids.map(id => IngredientService.deleteIngredient(id)));
          
          const currentIngredients = get().ingredients;
          const filteredIngredients = currentIngredients.filter(
            ingredient => !ids.includes(ingredient.id)
          );
          
          set({ 
            ingredients: filteredIngredients,
            isLoading: false 
          });
          
          // Show success feedback
          FeedbackService.showSuccess(
            'Ingredients Deleted',
            `Successfully deleted ${ids.length} ingredient${ids.length === 1 ? '' : 's'}`
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete ingredients';
          set({ error: errorMessage, isLoading: false });
          FeedbackService.handleError(error instanceof Error ? error : errorMessage, {
            screen: 'ingredients',
            action: 'bulkDeleteIngredients'
          });
          throw error;
        }
      },
      
      duplicateIngredient: async (id: string, newName?: string) => {
        const ingredient = get().getIngredientById(id);
        if (!ingredient) {
          throw new Error('Ingredient not found');
        }
        
        const duplicateData: CreateIngredientData = {
          name: newName || `${ingredient.name} (Copy)`,
          bottleSize: ingredient.bottleSize,
          bottlePrice: ingredient.bottlePrice,
          type: ingredient.type,
        };
        
        return get().addIngredient(duplicateData);
      },
      
      getIngredientTypes: () => {
        const ingredients = get().ingredients;
        const types = new Set<string>();
        
        ingredients.forEach(ingredient => {
          if (ingredient.type) {
            types.add(ingredient.type);
          }
        });
        
        return Array.from(types).sort();
      },
      
      getIngredientStatistics: async () => {
        return IngredientService.getCostStatistics();
      },
      
      validateIngredient: (data: Partial<CreateIngredientData>) => {
        // Get app settings for validation context
        const measurementSystem = 'US'; // TODO: Get from app store
        const currency = 'USD'; // TODO: Get from app store
        
        return ValidationService.validateIngredient(data, measurementSystem, currency);
      },
      
      validateAllIngredients: async () => {
        const ingredients = get().ingredients;
        const validationErrors: Record<string, string[]> = {};
        
        ingredients.forEach(ingredient => {
          const validation = get().validateIngredient(ingredient);
          if (!validation.isValid) {
            validationErrors[ingredient.id] = validation.errors;
          }
        });
        
        set({ validationErrors });
      },
      
      calculateIngredientMetrics: (ingredient: SavedIngredient, retailPrice = 8.0) => {
        return IngredientService.calculateIngredientMetrics(
          ingredient,
          1.5, // Default pour size
          retailPrice,
          'USD', // TODO: Get from app store
          'US' // TODO: Get from app store
        );
      },
      
      getPerformanceAnalysis: (ingredient: IngredientWithCalculations) => {
        return IngredientService.getIngredientPerformanceAnalysis(ingredient);
      },
      
      searchIngredients: async (query: string, limit = 10) => {
        return IngredientService.searchIngredients(query, undefined, limit);
      },
      
      // Utility actions
      clearError: () => set({ error: null, validationErrors: {} }),
      reset: () => set({
        ingredients: [],
        isLoading: false,
        error: null,
        validationErrors: {},
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
        if (state) {
          if (state.ingredients.length === 0) {
            // Load mock data if no persisted data exists
            state.loadIngredients();
          } else {
            // Data was rehydrated, set loading to false
            state.isLoading = false;
          }
        }
      },
    }
  )
);

