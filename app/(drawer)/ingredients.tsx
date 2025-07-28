import { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAppStore } from '@/src/stores/app-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import IngredientListItem from '@/src/components/IngredientListItem';
import SearchBar from '@/src/components/ui/SearchBar';
import EmptyState from '@/src/components/EmptyState';
import { useRouter } from 'expo-router';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { IngredientWithCalculations } from '@/src/types/models';
import Button from '@/src/components/ui/Button';
import {
  IngredientTypeSelector,
  SortSelector,
} from '@/src/components/ui/ChipSelector';
import { useToast } from '@/src/components/ui/Toast';
import { FeedbackService } from '@/src/services/feedback-service';
import { HapticService } from '@/src/services/haptic-service';

/**
 * Ingredients management screen
 * Lists, searches, and manages saved ingredients
 * Includes add functionality and navigation to detail views
 */
export default function IngredientsScreen() {
  const {} = useAppStore();
  const router = useRouter();
  const toast = useToast();

  // Use Zustand store for state management
  const {
    // Data
    ingredients,
    isLoading,
    error,

    // UI State
    searchQuery,
    selectedType,
    sortBy,

    // Actions
    loadIngredients,
    deleteIngredient,
    setSearchQuery,
    setSelectedType,
    setSortBy,

    // Computed state
    getFilteredIngredients,

    // Utilities
    clearError,
  } = useIngredientsStore();

  // Get filtered ingredients from store
  const filteredIngredients = getFilteredIngredients();

  // Load ingredients on mount - always call loadIngredients, let the store handle the logic
  useEffect(() => {
    loadIngredients();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Error handling with toast
  useEffect(() => {
    if (error) {
      toast.showError('Error', error);
      clearError();
    }
  }, [error, clearError, toast]);

  // Handle ingredient selection
  const handleIngredientPress = (ingredient: IngredientWithCalculations) => {
    HapticService.navigation();
    router.push({
      pathname: '/ingredient-detail',
      params: { id: ingredient.id },
    });
  };

  // Handle add new ingredient
  const handleAddIngredient = () => {
    router.push('/ingredient-form');
  };

  // Handle ingredient editing
  const handleEditIngredient = (ingredient: IngredientWithCalculations) => {
    router.push({
      pathname: '/ingredient-form',
      params: {
        id: ingredient.id,
        name: ingredient.name,
        type: ingredient.type,
        bottleSize: ingredient.bottleSize.toString(),
        bottlePrice: ingredient.bottlePrice.toString(),
        createdAt: ingredient.createdAt.toISOString(),
      },
    });
  };

  // Handle ingredient deletion with confirmation
  const handleDeleteIngredient = (ingredient: IngredientWithCalculations) => {
    FeedbackService.showDeleteConfirmation(
      ingredient.name,
      async () => {
        await deleteIngredient(ingredient.id);
      },
      'ingredient'
    );
  };

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-g3 dark:text-g1 text-xl w-full pb-4 border-b border-g2 mb-4">
              Manage your ingredient library and cost calculations
            </Text>

            {/* Search Bar + Add Button */}
            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <SearchBar
                  placeholder="Search by name or type..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <Button
                onPress={handleAddIngredient}
                variant="primary"
                icon="add"
                size="medium"
              >
                Add
              </Button>
            </View>
          </View>

          {/* Filters */}
          <View className="mb-6">
            {/* Type Filter */}
            <View className="mb-4">
              <IngredientTypeSelector
                selectedType={selectedType}
                onTypeChange={setSelectedType}
              />
            </View>

            {/* Sort Options */}
            <SortSelector
              sortOptions={[
                { key: 'Name', label: 'Name' },
                { key: 'Date Created', label: 'Recently Added' },
                { key: 'Cost', label: 'Cost/Oz' },
                { key: 'Cost %', label: 'Pour Cost' },
                { key: 'Margin', label: 'Margin' },
              ]}
              selectedSort={sortBy}
              onSortChange={(sortKey) => setSortBy(sortKey as any)}
              showLabel={true}
              label="Sort By:"
            />
          </View>

          {/* Ingredients List */}
          <View className="flex flex-col gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-g4 dark:text-n1">
                Your Ingredients ({filteredIngredients.length})
              </Text>
              {searchQuery && (
                <Button
                  onPress={() => setSearchQuery('')}
                  variant="ghost"
                  size="small"
                >
                  Clear
                </Button>
              )}
            </View>

            {isLoading ? (
              <View className="p-8 items-center">
                <Text className="text-g3 dark:text-g1">
                  Loading ingredients...
                </Text>
              </View>
            ) : filteredIngredients.length === 0 ? (
              <EmptyState
                icon="flask"
                title={
                  searchQuery || selectedType !== 'All'
                    ? 'No ingredients found'
                    : 'No ingredients yet'
                }
                description={
                  searchQuery
                    ? `No ingredients match "${searchQuery}"${selectedType !== 'All' ? ` in ${selectedType}` : ''}`
                    : selectedType !== 'All'
                      ? `No ingredients in ${selectedType} category`
                      : 'Add your first ingredient to get started'
                }
                actionLabel="Add Ingredient"
                onAction={handleAddIngredient}
              />
            ) : (
              filteredIngredients.map((ingredient) => (
                <IngredientListItem
                  key={ingredient.id}
                  ingredient={ingredient}
                  sortBy={sortBy}
                  onPress={() => handleIngredientPress(ingredient)}
                  onEdit={() => handleEditIngredient(ingredient)}
                  onDelete={() => handleDeleteIngredient(ingredient)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
