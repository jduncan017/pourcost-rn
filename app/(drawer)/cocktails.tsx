import { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAppStore } from '@/src/stores/app-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import CocktailListItem from '@/src/components/CocktailListItem';
import SearchBar from '@/src/components/ui/SearchBar';
import EmptyState from '@/src/components/EmptyState';
import { useRouter } from 'expo-router';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { CocktailWithCalculations } from '@/src/types/models';
import Button from '@/src/components/ui/Button';
import {
  CocktailCategorySelector,
  SortSelector,
} from '@/src/components/ui/ChipSelector';
import { useToast } from '@/src/components/ui/Toast';
import { FeedbackService } from '@/src/services/feedback-service';

/**
 * Cocktails management screen
 * Lists, searches, and manages saved cocktail recipes
 * Includes filtering, categorization, and detailed cocktail management
 */
export default function CocktailsScreen() {
  const {} = useAppStore();
  const router = useRouter();
  const toast = useToast();

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
  const handleCocktailPress = (cocktail: CocktailWithCalculations) => {
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
  const handleEditCocktail = (cocktail: CocktailWithCalculations) => {
    router.push({
      pathname: '/cocktail-form',
      params: {
        id: cocktail.id,
        name: cocktail.name,
        description: cocktail.description,
        category: cocktail.category,
        notes: cocktail.notes,
        createdAt: cocktail.createdAt.toISOString(),
        favorited: (cocktail.favorited || false).toString(),
      },
    });
  };

  // Handle cocktail deletion with confirmation
  const handleDeleteCocktail = (cocktail: CocktailWithCalculations) => {
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
            <Text className="text-g3 dark:text-g1 text-xl w-full pb-4 border-b border-g2 mb-4">
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
              <CocktailCategorySelector
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </View>

            {/* Sort Options */}
            <SortSelector
              sortOptions={[
                { key: 'Date Created', label: 'Recently Added' },
                { key: 'Name', label: 'Name' },
                { key: 'Cost', label: 'Cost' },
                { key: 'Cost %', label: 'Cost %' },
                { key: 'Margin', label: 'Profit' },
              ]}
              selectedSort={sortBy}
              onSortChange={(sortKey) => setSortBy(sortKey as any)}
              showLabel={true}
              label="Sort By:"
            />
          </View>

          {/* Cocktails List */}
          <View className="flex flex-col gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-g4 dark:text-n1">
                Your Cocktails ({filteredCocktails.length})
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
                  Loading cocktails...
                </Text>
              </View>
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
