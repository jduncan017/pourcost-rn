import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAppStore } from '@/src/stores/app-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
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
  const ingredientCount = useIngredientsStore((s) => s.ingredients.length);

  // Narrow selectors — each field subscribed separately so unrelated state
  // changes (e.g. error toggling) don't re-render this whole screen + its
  // FlatList. See CLAUDE.md "Zustand selector style" for the pattern.
  const isLoading = useCocktailsStore((s) => s.isLoading);
  const searchQuery = useCocktailsStore((s) => s.searchQuery);
  const selectedCategory = useCocktailsStore((s) => s.selectedCategory);
  const sortBy = useCocktailsStore((s) => s.sortBy);
  const loadCocktails = useCocktailsStore((s) => s.loadCocktails);
  const deleteCocktail = useCocktailsStore((s) => s.deleteCocktail);
  const setSearchQuery = useCocktailsStore((s) => s.setSearchQuery);
  const setSelectedCategory = useCocktailsStore((s) => s.setSelectedCategory);
  const setSortBy = useCocktailsStore((s) => s.setSortBy);
  const getFilteredCocktails = useCocktailsStore((s) => s.getFilteredCocktails);
  const error = useCocktailsStore((s) => s.error);
  const clearError = useCocktailsStore((s) => s.clearError);

  // Get filtered cocktails from store
  const filteredCocktails = getFilteredCocktails();

  // Build a header title that reflects active filter + sort. Default state
  // reads "Your Cocktails (12)"; with filters: "Whiskey Cocktails by Cost (5)".
  const SORT_LABELS_COCKTAILS: Record<string, string> = {
    created: 'Recent',
    cost: 'Cost',
    costPercent: 'Cost %',
    profitMargin: 'Margin',
  };
  const cocktailListTitle = (() => {
    const base =
      selectedCategory === 'All' ? 'Your Cocktails' : `${selectedCategory} Cocktails`;
    const sortLabel = sortBy === 'name' ? '' : SORT_LABELS_COCKTAILS[sortBy] ?? '';
    const suffix = sortLabel ? ` by ${sortLabel}` : '';
    return `${base}${suffix} (${filteredCocktails.length})`;
  })();

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

  // Header for the FlatList — subtitle + search + filters + list title row.
  // Memoized so it doesn't re-render on every cocktail row change.
  const listHeader = useMemo(() => (
    <View>
      {/* Header */}
      <View className="mb-6 mt-4">
        <Text className="text-sm mb-3" style={{ color: colors.textTertiary }}>
          Recipes you've built, with live cost and margin.
        </Text>
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
            Add
          </Button>
        </View>
      </View>

      {/* Filters */}
      <View className="mb-6">
        <View className="mb-4">
          <ScreenTitle title="Category" variant="group" className="mb-2" />
          <CocktailCategorySelector
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            showLabel={false}
          />
        </View>
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

      {/* List title row */}
      <View className="flex-row items-center justify-between mb-3">
        <ScreenTitle
          title={selectionMode ? `${selectedIds.size} Selected` : cocktailListTitle}
          variant="group"
        />
        <View className="flex-row items-center gap-2">
          {searchQuery && !selectionMode && (
            <Button onPress={() => setSearchQuery('')} variant="ghost" size="small">
              Clear
            </Button>
          )}
          {(filteredCocktails.length > 0 || selectionMode) && (
            <Pressable
              onPress={selectionMode ? exitSelectionMode : enterSelectionMode}
              hitSlop={6}
              className="px-2 py-1"
            >
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
                {selectionMode ? 'Cancel' : 'Multi-select'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Swipe hint */}
      {!selectionMode && filteredCocktails.length > 0 && (
        <View
          className="flex-row justify-between items-center mb-3"
          style={{ opacity: 0.45 }}
        >
          <View className="flex-row items-center gap-1">
            <Ionicons name="arrow-back" size={11} color={colors.textSecondary} />
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
              Swipe left to delete
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
              Swipe right to edit
            </Text>
            <Ionicons name="arrow-forward" size={11} color={colors.textSecondary} />
          </View>
        </View>
      )}
    </View>
  ), [
    colors.textSecondary,
    colors.textTertiary,
    searchQuery,
    handleAddCocktail,
    selectedCategory,
    sortBy,
    selectionMode,
    selectedIds.size,
    cocktailListTitle,
    filteredCocktails.length,
  ]);

  const listEmpty = useMemo(() => {
    if (isLoading) return <SkeletonLoader count={6} />;
    const hasFilter = !!searchQuery || selectedCategory !== 'All';
    const inventoryEmpty = !hasFilter && ingredientCount === 0;
    return (
      <EmptyState
        icon="wine"
        title={
          hasFilter
            ? 'No cocktails found'
            : inventoryEmpty
              ? 'Set up your bar first'
              : 'No cocktails yet'
        }
        description={
          searchQuery
            ? `No cocktails match "${searchQuery}"${selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}`
            : selectedCategory !== 'All'
              ? `No cocktails in ${selectedCategory} category`
              : inventoryEmpty
                ? 'Cocktails need ingredients. Set up your wells in 60 seconds, then come back to build your first recipe.'
                : 'Create your first cocktail recipe to get started.'
        }
        actionLabel={inventoryEmpty ? 'Set Up Wells' : 'Create Cocktail'}
        onAction={inventoryEmpty ? () => router.push('/wells-setup' as any) : handleAddCocktail}
      />
    );
  }, [isLoading, searchQuery, selectedCategory, ingredientCount, handleAddCocktail, router]);

  return (
    <GradientBackground>
      <FlatList
        data={filteredCocktails}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <CocktailListItem
            cocktail={item}
            sortBy={sortBy}
            onPress={() => handleCocktailPress(item)}
            onEdit={() => handleEditCocktail(item)}
            onDelete={() => handleDeleteCocktail(item)}
            selectionMode={selectionMode}
            selected={selectedIds.has(item.id)}
            onSelectionToggle={() => toggleSelection(item.id)}
          />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: selectionMode ? 96 : 24 }}
        // Virtualization perf knobs — keep memory low on big lists.
        windowSize={11}
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
      />

      {selectionMode && selectedIds.size > 0 && (
        <SelectionActionBar
          selectedCount={selectedIds.size}
          onDelete={handleBulkDelete}
        />
      )}
    </GradientBackground>
  );
}
