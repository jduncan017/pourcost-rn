import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/src/stores/app-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import IngredientListItem from '@/src/components/IngredientListItem';
import SearchBar from '@/src/components/ui/SearchBar';
import ChipSelector, {
  IngredientTypeSelector,
  SortSelector,
} from '@/src/components/ui/ChipSelector';
import EmptyState from '@/src/components/EmptyState';
import { useRouter } from 'expo-router';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { SavedIngredient } from '@/src/types/models';
import { buildIngredientEditParams } from '@/src/lib/buildIngredientEditParams';
import Button from '@/src/components/ui/Button';
import { useToast } from '@/src/components/ui/Toast';
import { FeedbackService } from '@/src/services/feedback-service';
import { HapticService } from '@/src/services/haptic-service';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import SkeletonLoader from '@/src/components/ui/SkeletonLoader';
import {
  SUBTYPES_BY_TYPE,
  type IngredientSortOption,
} from '@/src/constants/appConstants';

/**
 * Ingredients management screen
 * Lists, searches, and manages saved ingredients
 * Includes add functionality and navigation to detail views
 */
export default function IngredientsScreen() {
  const {} = useAppStore();
  const router = useRouter();
  const toast = useToast();
  const colors = useThemeColors();

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

  const [selectedSubType, setSelectedSubType] = useState('All');

  // Get filtered ingredients from store, then apply subtype filter locally
  const hasSubtypes = !!SUBTYPES_BY_TYPE[selectedType];
  const filteredIngredients = (() => {
    const base = getFilteredIngredients();
    if (!hasSubtypes || selectedSubType === 'All') return base;
    return base.filter((i) => i.subType === selectedSubType);
  })();

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
  const handleIngredientPress = (ingredient: SavedIngredient) => {
    HapticService.navigation();
    router.push({
      pathname: '/ingredient-detail',
      params: { id: ingredient.id },
    });
  };

  // Handle add new ingredient
  const handleAddIngredient = () => {
    HapticService.navigation();
    router.push('/ingredient-form');
  };

  // Handle ingredient editing
  const handleEditIngredient = (ingredient: SavedIngredient) => {
    router.navigate({
      pathname: '/ingredient-form',
      params: buildIngredientEditParams(ingredient),
    });
  };

  // Handle ingredient deletion with confirmation
  const handleDeleteIngredient = (ingredient: SavedIngredient) => {
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
          <View className="mb-6 mt-4">
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
                className="h-full"
              >
                Add
              </Button>
            </View>
          </View>

          {/* Filters */}
          <View className="mb-6">
            {/* Type Filter */}
            <View className="mb-4">
              <ScreenTitle title="Type" variant="group" className="mb-2" />
              <IngredientTypeSelector
                selectedType={selectedType}
                onTypeChange={(t) => {
                  setSelectedType(t);
                  if (t !== 'Spirit') setSelectedSubType('All');
                }}
                showLabel={false}
              />
            </View>

            {/* Subtype Filter — shows for any type with subtypes */}
            {hasSubtypes && (
              <View className="mb-4">
                <ScreenTitle
                  title={`${selectedType} Type`}
                  variant="group"
                  className="mb-2"
                />
                <ChipSelector
                  options={['All', ...SUBTYPES_BY_TYPE[selectedType]]}
                  selectedOption={selectedSubType}
                  onSelectionChange={setSelectedSubType}
                  showLabel={false}
                  variant="filter"
                />
              </View>
            )}

            {/* Sort Options */}
            <ScreenTitle title="Sort By" variant="group" className="mb-2" />
            <SortSelector
              sortOptions={[
                { key: 'name', label: 'Name' },
                { key: 'created', label: 'Recent' },
                { key: 'cost', label: 'Cost' },
                { key: 'pourCost', label: 'Cost %' },
                { key: 'margin', label: 'Margin' },
              ]}
              selectedSort={sortBy}
              onSortChange={(sortKey) =>
                setSortBy(sortKey as IngredientSortOption)
              }
              showLabel={false}
            />
          </View>

          {/* Ingredients List */}
          <View className="flex flex-col gap-3">
            <View className="flex-row items-center justify-between">
              <ScreenTitle
                title={`Your Ingredients (${filteredIngredients.length})`}
                variant="group"
              />
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
              <SkeletonLoader count={6} />
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
              <>
                <View
                  className="flex-row justify-between items-center"
                  style={{ opacity: 0.45 }}
                >
                  <View className="flex-row items-center gap-1">
                    <Ionicons
                      name="arrow-back"
                      size={11}
                      color={colors.textSecondary}
                    />
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                      Swipe left to delete
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                      Swipe right to edit
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={11}
                      color={colors.textSecondary}
                    />
                  </View>
                </View>
                {filteredIngredients.map((ingredient) => (
                  <IngredientListItem
                    key={ingredient.id}
                    ingredient={ingredient}
                    sortBy={sortBy}
                    onPress={() => handleIngredientPress(ingredient)}
                    onEdit={() => handleEditIngredient(ingredient)}
                    onDelete={() => handleDeleteIngredient(ingredient)}
                  />
                ))}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
