import { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAppStore } from '@/src/stores/app-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import CocktailListItem from '@/src/components/CocktailListItem';
import SearchBar from '@/src/components/ui/SearchBar';
import EmptyState from '@/src/components/EmptyState';
import { useRouter } from 'expo-router';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { Cocktail } from '@/src/types/models';
import { ensureDate } from '@/src/lib/ensureDate';
import Button from '@/src/components/ui/Button';
import {
  CocktailCategorySelector,
  SortSelector,
} from '@/src/components/ui/ChipSelector';
import { useToast } from '@/src/components/ui/Toast';
import { FeedbackService } from '@/src/services/feedback-service';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import SkeletonLoader from '@/src/components/ui/SkeletonLoader';

/**
 * Cocktails management screen
 * Lists, searches, and manages saved cocktail recipes
 * Includes filtering, categorization, and detailed cocktail management
 */
export default function CocktailsScreen() {
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
    selectedCategory,
    sortBy,

    // Actions
    loadCocktails,
    deleteCocktail,
    setSearchQuery,
    setSelectedCategory,
    setSortBy,

    // Computed state
    getFilteredCocktails,

    // Utilities
    clearError,
  } = useCocktailsStore();

  // Get filtered cocktails from store
  const filteredCocktails = getFilteredCocktails();

  // Load cocktails on mount - always call loadCocktails, let the store handle the logic
  useEffect(() => {
    loadCocktails();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Error handling with toast
  useEffect(() => {
    if (error) {
      toast.showError('Error', error);
      clearError();
    }
  }, [error, clearError, toast]);

  // Handle cocktail selection
  const handleCocktailPress = (cocktail: Cocktail) => {
    router.push({
      pathname: '/cocktail-detail',
      params: { id: cocktail.id },
    });
  };

  // Handle add new cocktail
  const handleAddCocktail = () => {
    router.push('/cocktail-form');
  };

  // Handle cocktail editing
  const handleEditCocktail = (cocktail: Cocktail) => {
    router.push({
      pathname: '/cocktail-form',
      params: {
        id: cocktail.id,
        name: cocktail.name,
        description: cocktail.description,
        category: cocktail.category,
        notes: cocktail.notes,
        createdAt: ensureDate(cocktail.createdAt).toISOString(),
        favorited: (cocktail.favorited || false).toString(),
        retailPrice: cocktail.retailPrice?.toString(),
        ingredients: JSON.stringify(cocktail.ingredients),
      },
    });
  };

  // Handle cocktail deletion with confirmation
  const handleDeleteCocktail = (cocktail: Cocktail) => {
    FeedbackService.showDeleteConfirmation(
      cocktail.name,
      async () => {
        await deleteCocktail(cocktail.id);
      },
      'cocktail'
    );
  };

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-base pb-4 mb-4" style={{ color: colors.textSecondary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              Manage your cocktail recipes and cost calculations
            </Text>

            {/* Search Bar + Create Button */}
            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <SearchBar
                  placeholder="Search cocktails, ingredients, or descriptions..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <Button
                onPress={handleAddCocktail}
                variant="primary"
                icon="add"
                size="medium"
              >
                Create
              </Button>
            </View>
          </View>

          {/* Filters */}
          <View className="mb-6">
            {/* Category Filter */}
            <View className="mb-4">
              <ScreenTitle title="Category" variant="group" className="mb-2" />
              <CocktailCategorySelector
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                showLabel={false}
              />
            </View>

            {/* Sort Options */}
            <ScreenTitle title="Sort By" variant="group" className="mb-2" />
            <SortSelector
              sortOptions={[
                { key: 'name', label: 'Name' },
                { key: 'created', label: 'Recent' },
                { key: 'cost', label: 'Cost' },
                { key: 'costPercent', label: 'Cost %' },
                { key: 'profitMargin', label: 'Margin' },
              ]}
              selectedSort={sortBy}
              onSortChange={(sortKey) => setSortBy(sortKey as any)}
              showLabel={false}
            />
          </View>

          {/* Cocktails List */}
          <View className="flex flex-col gap-3">
            <View className="flex-row items-center justify-between">
              <ScreenTitle title={`Your Cocktails (${filteredCocktails.length})`} variant="group" />
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
            ) : filteredCocktails.length === 0 ? (
              <EmptyState
                icon="wine"
                title={
                  searchQuery || selectedCategory !== 'All'
                    ? 'No cocktails found'
                    : 'No cocktails yet'
                }
                description={
                  searchQuery
                    ? `No cocktails match "${searchQuery}"${selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}`
                    : selectedCategory !== 'All'
                      ? `No cocktails in ${selectedCategory} category`
                      : 'Create your first cocktail recipe to get started'
                }
                actionLabel="Create Cocktail"
                onAction={handleAddCocktail}
              />
            ) : (
              filteredCocktails.map((cocktail) => (
                <CocktailListItem
                  key={cocktail.id}
                  cocktail={cocktail}
                  sortBy={sortBy}
                  onPress={() => handleCocktailPress(cocktail)}
                  onEdit={() => handleEditCocktail(cocktail)}
                  onDelete={() => handleDeleteCocktail(cocktail)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
