import { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useAppStore } from '@/src/stores/app-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { IngredientListItem } from '@/src/components/ui/GenericListItem';
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

/**
 * Ingredients management screen
 * Lists, searches, and manages saved ingredients
 * Includes add functionality and navigation to detail views
 */
export default function IngredientsScreen() {
  const { } = useAppStore();
  const router = useRouter();
  
  // Use Zustand store for state management
  const {
    // Data
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

  // Load ingredients on mount
  useEffect(() => {
    loadIngredients();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Error handling
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error, clearError]);

  // Handle ingredient selection
  const handleIngredientPress = (ingredient: IngredientWithCalculations) => {
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

  // Handle ingredient deletion
  const handleDeleteIngredient = (ingredient: IngredientWithCalculations) => {
    Alert.alert(
      'Delete Ingredient',
      `Are you sure you want to delete "${ingredient.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteIngredient(ingredient.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete ingredient');
            }
          },
        },
      ]
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
                { key: 'name', label: 'Name' },
                { key: 'created', label: 'Recently Added' },
                { key: 'cost', label: 'Cost/Oz' },
                { key: 'pourCost', label: 'Pour Cost' },
                { key: 'margin', label: 'Margin' },
              ]}
              selectedSort={sortBy}
              onSortChange={(sortKey) => setSortBy(sortKey as any)}
              showLabel={false}
              className="flex-row items-center"
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
                <Text className="text-g3 dark:text-g1">Loading ingredients...</Text>
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
