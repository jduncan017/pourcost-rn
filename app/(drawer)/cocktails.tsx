import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAppStore } from '@/src/stores/app-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import CocktailListItem from '@/src/components/CocktailListItem';
import SearchBar from '@/src/components/ui/SearchBar';
import EmptyState from '@/src/components/EmptyState';
import { useGuardedRouter } from '@/src/lib/guarded-router';
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
import SelectionActionBar from '@/src/components/ui/SelectionActionBar';

/**
 * Cocktails management screen
 * Lists, searches, and manages saved cocktail recipes
 * Includes filtering, categorization, and detailed cocktail management
 */
export default function CocktailsScreen() {
  const {} = useAppStore();
  const router = useGuardedRouter();
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

  // ── Multi-select ──────────────────────────────────────────────────────
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const enterSelectionMode = () => {
    setSelectionMode(true);
    setSelectedIds(new Set());
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  // Reset selection when this tab loses focus — see ingredients.tsx.
  useFocusEffect(
    useCallback(() => {
      return () => {
        setSelectionMode(false);
        setSelectedIds(new Set());
      };
    }, [])
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    FeedbackService.showConfirmation({
      title: `Delete ${count} cocktail${count === 1 ? '' : 's'}?`,
      message: 'This action cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
      onConfirm: async () => {
        const ids = Array.from(selectedIds);
        await Promise.all(ids.map((id) => deleteCocktail(id)));
        exitSelectionMode();
      },
    });
  };

  return (
    <GradientBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: selectionMode ? 96 : 0 }}
      >
        <View className="p-4">
          {/* Header */}
          <View className="mb-6 mt-4">
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
                className="h-full"
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
              <ScreenTitle
                title={
                  selectionMode
                    ? `${selectedIds.size} Selected`
                    : `Your Cocktails (${filteredCocktails.length})`
                }
                variant="group"
              />
              <View className="flex-row items-center gap-2">
                {searchQuery && !selectionMode && (
                  <Button
                    onPress={() => setSearchQuery('')}
                    variant="ghost"
                    size="small"
                  >
                    Clear
                  </Button>
                )}
                {filteredCocktails.length > 0 && (
                  <Pressable
                    onPress={selectionMode ? exitSelectionMode : enterSelectionMode}
                    hitSlop={6}
                    className="px-2 py-1"
                  >
                    <Text
                      style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}
                    >
                      {selectionMode ? 'Cancel' : 'Multi-select'}
                    </Text>
                  </Pressable>
                )}
              </View>
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
              <>
                {!selectionMode && (
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
                )}
                {filteredCocktails.map((cocktail) => (
                  <CocktailListItem
                    key={cocktail.id}
                    cocktail={cocktail}
                    sortBy={sortBy}
                    onPress={() => handleCocktailPress(cocktail)}
                    onEdit={() => handleEditCocktail(cocktail)}
                    onDelete={() => handleDeleteCocktail(cocktail)}
                    selectionMode={selectionMode}
                    selected={selectedIds.has(cocktail.id)}
                    onSelectionToggle={() => toggleSelection(cocktail.id)}
                  />
                ))}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {selectionMode && selectedIds.size > 0 && (
        <SelectionActionBar
          selectedCount={selectedIds.size}
          onDelete={handleBulkDelete}
        />
      )}
    </GradientBackground>
  );
}
