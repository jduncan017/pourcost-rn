import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAppStore } from '@/src/stores/app-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import IngredientListItem from '@/src/components/IngredientListItem';
import IngredientInUseSheet from '@/src/components/ui/IngredientInUseSheet';
import SelectionActionBar from '@/src/components/ui/SelectionActionBar';
import SearchBar from '@/src/components/ui/SearchBar';
import ChipSelector, {
  IngredientTypeSelector,
  SortSelector,
} from '@/src/components/ui/ChipSelector';
import EmptyState from '@/src/components/EmptyState';
import { useGuardedRouter } from '@/src/lib/guarded-router';
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
  const [inUseIngredient, setInUseIngredient] = useState<SavedIngredient | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  /** After a partial bulk delete: the ingredients that were blocked because they're
   *  still referenced in cocktails. Shown in a follow-up sheet so the user knows
   *  what didn't get deleted and which cocktails to edit. */
  const [blockedIngredients, setBlockedIngredients] = useState<SavedIngredient[]>([]);
  const { cocktails } = useCocktailsStore();

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

  // Handle ingredient deletion with confirmation. Blocks when referenced in any cocktail.
  const handleDeleteIngredient = (ingredient: SavedIngredient) => {
    const usedIn = cocktails.filter((c) =>
      c.ingredients.some((ci) => ci.ingredientId === ingredient.id)
    );
    if (usedIn.length > 0) {
      setInUseIngredient(ingredient);
      return;
    }
    FeedbackService.showDeleteConfirmation(
      ingredient.name,
      async () => {
        await deleteIngredient(ingredient.id);
      },
      'ingredient'
    );
  };

  const handleOpenCocktail = (cocktailId: string) => {
    setInUseIngredient(null);
    router.navigate({ pathname: '/cocktail-detail', params: { id: cocktailId } });
  };

  const inUseCocktails = inUseIngredient
    ? cocktails.filter((c) =>
        c.ingredients.some((ci) => ci.ingredientId === inUseIngredient.id)
      )
    : [];

  // ── Multi-select ──────────────────────────────────────────────────────
  const enterSelectionMode = () => {
    setSelectionMode(true);
    setSelectedIds(new Set());
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  // Reset selection mode when the tab loses focus. Without this, switching to
  // Cocktails and back leaves the screen in selection mode with empty selection.
  useFocusEffect(
    useCallback(() => {
      return () => {
        setSelectionMode(false);
        setSelectedIds(new Set());
        setBlockedIngredients([]);
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

  // Partition the current selection into what's actually deletable right now vs.
  // what's blocked by cocktail references. User sees both counts in the confirm.
  const { deletableSelected, blockedSelected } = useMemo(() => {
    const allIngredients = useIngredientsStore.getState().ingredients;
    const referencedIds = new Set<string>();
    for (const c of cocktails) {
      for (const ci of c.ingredients) referencedIds.add(ci.ingredientId);
    }
    const deletable: SavedIngredient[] = [];
    const blocked: SavedIngredient[] = [];
    for (const id of selectedIds) {
      const ing = allIngredients.find((i) => i.id === id);
      if (!ing) continue;
      (referencedIds.has(id) ? blocked : deletable).push(ing);
    }
    return { deletableSelected: deletable, blockedSelected: blocked };
  }, [cocktails, selectedIds]);

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;

    // Everything blocked — nothing we can do. Show the guard sheet with all affected cocktails.
    if (deletableSelected.length === 0 && blockedSelected.length > 0) {
      setBlockedIngredients(blockedSelected);
      return;
    }

    const deletableCount = deletableSelected.length;
    const blockedCount = blockedSelected.length;
    const title =
      blockedCount > 0
        ? `Delete ${deletableCount} of ${selectedIds.size}?`
        : `Delete ${deletableCount} ingredient${deletableCount === 1 ? '' : 's'}?`;
    const message =
      blockedCount > 0
        ? `${blockedCount} ${blockedCount === 1 ? 'is' : 'are'} used in cocktails and will be skipped.`
        : 'This action cannot be undone.';

    FeedbackService.showConfirmation({
      title,
      message,
      confirmText: 'Delete',
      destructive: true,
      onConfirm: async () => {
        await Promise.all(deletableSelected.map((ing) => deleteIngredient(ing.id)));
        if (blockedSelected.length > 0) {
          setBlockedIngredients(blockedSelected);
        } else {
          exitSelectionMode();
        }
      },
    });
  };

  /** Cocktails that reference any of the blocked ingredients — deduped. */
  const blockedCocktails = useMemo(() => {
    if (blockedIngredients.length === 0) return [];
    const blockedIds = new Set(blockedIngredients.map((i) => i.id));
    return cocktails.filter((c) =>
      c.ingredients.some((ci) => blockedIds.has(ci.ingredientId))
    );
  }, [cocktails, blockedIngredients]);

  return (
    <GradientBackground>
      <IngredientInUseSheet
        visible={!!inUseIngredient}
        onClose={() => setInUseIngredient(null)}
        ingredientName={inUseIngredient?.name ?? ''}
        cocktails={inUseCocktails}
        onOpenCocktail={handleOpenCocktail}
      />
      <IngredientInUseSheet
        visible={blockedIngredients.length > 0}
        onClose={() => {
          setBlockedIngredients([]);
          exitSelectionMode();
        }}
        ingredientName={
          blockedIngredients.length === 1
            ? blockedIngredients[0].name
            : `${blockedIngredients.length} ingredients`
        }
        cocktails={blockedCocktails}
        onOpenCocktail={(id) => {
          setBlockedIngredients([]);
          exitSelectionMode();
          router.navigate({ pathname: '/cocktail-detail', params: { id } });
        }}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: selectionMode ? 96 : 0 }}
      >
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
                title={
                  selectionMode
                    ? `${selectedIds.size} Selected`
                    : `Your Ingredients (${filteredIngredients.length})`
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
                {filteredIngredients.length > 0 && (
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
                {filteredIngredients.map((ingredient) => (
                  <IngredientListItem
                    key={ingredient.id}
                    ingredient={ingredient}
                    sortBy={sortBy}
                    onPress={() => handleIngredientPress(ingredient)}
                    onEdit={() => handleEditIngredient(ingredient)}
                    onDelete={() => handleDeleteIngredient(ingredient)}
                    selectionMode={selectionMode}
                    selected={selectedIds.has(ingredient.id)}
                    onSelectionToggle={() => toggleSelection(ingredient.id)}
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
