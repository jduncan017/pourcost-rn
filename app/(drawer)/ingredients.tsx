import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, type Href } from 'expo-router';
import { useAppStore } from '@/src/stores/app-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import IngredientListItem from '@/src/components/IngredientListItem';
import IngredientInUseSheet from '@/src/components/ui/IngredientInUseSheet';
import SelectionActionBar from '@/src/components/ui/SelectionActionBar';
import SearchBar from '@/src/components/ui/SearchBar';
import ChipSelector, {
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
  SPIRIT_L3_CANONICAL_SUBS,
  type IngredientSortOption,
} from '@/src/constants/appConstants';

/**
 * Ingredients management screen
 * Lists, searches, and manages saved ingredients
 * Includes add functionality and navigation to detail views
 */
export default function IngredientsScreen() {
  const router = useGuardedRouter();
  const toast = useToast();
  const colors = useThemeColors();

  // Narrow selectors per CLAUDE.md "Zustand selector style".
  const isLoading = useIngredientsStore((s) => s.isLoading);
  const searchQuery = useIngredientsStore((s) => s.searchQuery);
  const selectedType = useIngredientsStore((s) => s.selectedType);
  const sortBy = useIngredientsStore((s) => s.sortBy);
  const loadIngredients = useIngredientsStore((s) => s.loadIngredients);
  const deleteIngredient = useIngredientsStore((s) => s.deleteIngredient);
  const setSearchQuery = useIngredientsStore((s) => s.setSearchQuery);
  const setSelectedType = useIngredientsStore((s) => s.setSelectedType);
  const setSortBy = useIngredientsStore((s) => s.setSortBy);
  const getFilteredIngredients = useIngredientsStore((s) => s.getFilteredIngredients);
  const error = useIngredientsStore((s) => s.error);
  const clearError = useIngredientsStore((s) => s.clearError);

  const [selectedSubType, setSelectedSubType] = useState('All');
  const [selectedCanonicalSub, setSelectedCanonicalSub] = useState('All');
  // Reactive ingredient list — drives the "what filter chips to show"
  // calculation below (hide types/subtypes the user doesn't own).
  const allIngredients = useIngredientsStore((s) => s.ingredients);

  // Top-level types that always appear in the chip row, regardless of
  // whether the user owns any of that type. These are the staples; the
  // remaining types (Non-Alc / Prepped / Garnish / Other) only show up
  // once the user actually has one.
  const ALWAYS_VISIBLE_TYPES = useMemo(() => ['Spirit', 'Beer', 'Wine'], []);
  // Spirit subtypes that always appear when Spirit is selected. Even with
  // zero spirits in inventory the user can pre-filter for these. The other
  // spirit subtypes (Mezcal, Brandy, Liqueur, etc.) only show once the
  // user has at least one of that subtype.
  const ALWAYS_VISIBLE_SPIRIT_SUBTYPES = useMemo(
    () => ['Gin', 'Vodka', 'Whiskey', 'Tequila', 'Rum'],
    [],
  );

  const visibleTypes = useMemo(() => {
    const allTypes = ['Spirit', 'Beer', 'Wine', 'Non-Alc', 'Prepped', 'Garnish', 'Other'];
    const owned = new Set(allIngredients.map((i) => i.type).filter(Boolean) as string[]);
    return allTypes.filter(
      (t) => ALWAYS_VISIBLE_TYPES.includes(t) || owned.has(t),
    );
  }, [allIngredients, ALWAYS_VISIBLE_TYPES]);

  const visibleSubtypes = useMemo(() => {
    const allForType = SUBTYPES_BY_TYPE[selectedType];
    if (!allForType) return [];
    const owned = new Set(
      allIngredients
        .filter((i) => i.type === selectedType && i.subType)
        .map((i) => i.subType as string),
    );
    if (selectedType === 'Spirit') {
      return allForType.filter(
        (s) => ALWAYS_VISIBLE_SPIRIT_SUBTYPES.includes(s) || owned.has(s),
      );
    }
    // Beer / Wine / Non-Alc: only show subtypes the user has.
    return allForType.filter((s) => owned.has(s));
  }, [allIngredients, selectedType, ALWAYS_VISIBLE_SPIRIT_SUBTYPES]);

  // L3 chip row: canonical subcategories under the current L2 selection.
  // Only renders for Spirit umbrellas that wrap multiple canonical subs
  // (Whiskey → Bourbon/Rye/Scotch/etc., Rum → White/Aged/Dark/etc.). Shows
  // only subs the user actually owns + 'All'.
  const visibleCanonicalSubs = useMemo(() => {
    if (selectedType !== 'Spirit' || selectedSubType === 'All') return [];
    const allForSub = SPIRIT_L3_CANONICAL_SUBS[selectedSubType];
    if (!allForSub) return [];
    const owned = new Set(
      allIngredients
        .filter(
          (i) =>
            i.type === 'Spirit' &&
            i.subType === selectedSubType &&
            i.canonicalSubcategory,
        )
        .map((i) => i.canonicalSubcategory as string),
    );
    return allForSub.filter((s) => owned.has(s));
  }, [allIngredients, selectedType, selectedSubType]);
  const [inUseIngredient, setInUseIngredient] = useState<SavedIngredient | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  /** After a partial bulk delete: the ingredients that were blocked because they're
   *  still referenced in cocktails. Shown in a follow-up sheet so the user knows
   *  what didn't get deleted and which cocktails to edit. */
  const [blockedIngredients, setBlockedIngredients] = useState<SavedIngredient[]>([]);
  const cocktails = useCocktailsStore((s) => s.cocktails);

  // Get filtered ingredients from store, then apply subtype + canonical-sub
  // filters locally.
  const hasSubtypes = visibleSubtypes.length > 0;
  const hasCanonicalSubs = visibleCanonicalSubs.length > 0;
  const filteredIngredients = (() => {
    let base = getFilteredIngredients();
    if (hasSubtypes && selectedSubType !== 'All') {
      base = base.filter((i) => i.subType === selectedSubType);
    }
    if (hasCanonicalSubs && selectedCanonicalSub !== 'All') {
      base = base.filter((i) => i.canonicalSubcategory === selectedCanonicalSub);
    }
    return base;
  })();

  // Build a header title that reflects active filter + sort. Default reads
  // "Your Ingredients (24)"; with filters: "Vodka by Cost (4)" or "Spirits (12)".
  const TYPE_PLURALS: Record<string, string> = {
    Spirit: 'Spirits',
    Beer: 'Beers',
    Wine: 'Wines',
    'Non-Alc': 'Non-Alcoholic',
  };
  const SORT_LABELS_INGREDIENTS: Record<string, string> = {
    created: 'Recent',
    cost: 'Cost',
    pourCost: 'Cost %',
    margin: 'Margin',
  };
  const ingredientListTitle = (() => {
    let base = 'Your Ingredients';
    if (selectedSubType !== 'All') {
      base = selectedSubType;
    } else if (selectedType !== 'All') {
      base = TYPE_PLURALS[selectedType] ?? selectedType;
    }
    const sortLabel = sortBy === 'name' ? '' : SORT_LABELS_INGREDIENTS[sortBy] ?? '';
    const suffix = sortLabel ? ` by ${sortLabel}` : '';
    return `${base}${suffix} (${filteredIngredients.length})`;
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

  // Handle add new ingredient. Routes to the catalog picker so users see the
  // catalog search before being dropped into the form. Picker forwards to
  // /ingredient-form (prefilled or empty) on the user's choice.
  // Cast required: expo-router's generated route types only refresh when the
  // dev server is running, so newly added screens don't appear until restart.
  const handleAddIngredient = () => {
    HapticService.navigation();
    router.push('/ingredient-create' as Href);
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
      <FlatList
        data={filteredIngredients}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <IngredientListItem
            ingredient={item}
            sortBy={sortBy}
            onPress={() => handleIngredientPress(item)}
            onEdit={() => handleEditIngredient(item)}
            onDelete={() => handleDeleteIngredient(item)}
            selectionMode={selectionMode}
            selected={selectedIds.has(item.id)}
            onSelectionToggle={() => toggleSelection(item.id)}
          />
        )}
        ListHeaderComponent={
          <View>
            <View className="mb-6 mt-4">
              <Text className="text-sm mb-3" style={{ color: colors.textTertiary }}>
                Ingredients in your bar. Costs, sizes, and what's prepped.
              </Text>
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

            <View className="mb-6">
              <View className="mb-4">
                <ScreenTitle title="Type" variant="group" className="mb-2" />
                <ChipSelector
                  options={['All', ...visibleTypes]}
                  selectedOption={selectedType}
                  onSelectionChange={(t) => {
                    setSelectedType(t);
                    if (t !== 'Spirit') setSelectedSubType('All');
                    setSelectedCanonicalSub('All');
                  }}
                  showLabel={false}
                  variant="filter"
                />
              </View>

              {hasSubtypes && (
                <View className="mb-4">
                  <ScreenTitle
                    title={`${selectedType} Type`}
                    variant="group"
                    className="mb-2"
                  />
                  <ChipSelector
                    options={['All', ...visibleSubtypes]}
                    selectedOption={selectedSubType}
                    onSelectionChange={(s) => {
                      setSelectedSubType(s);
                      setSelectedCanonicalSub('All');
                    }}
                    showLabel={false}
                    variant="filter"
                  />
                </View>
              )}

              {hasCanonicalSubs && (
                <View className="mb-4">
                  <ScreenTitle
                    title={`${selectedSubType} Style`}
                    variant="group"
                    className="mb-2"
                  />
                  <ChipSelector
                    options={['All', ...visibleCanonicalSubs]}
                    selectedOption={selectedCanonicalSub}
                    onSelectionChange={setSelectedCanonicalSub}
                    showLabel={false}
                    variant="filter"
                  />
                </View>
              )}

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
                onSortChange={(sortKey) => setSortBy(sortKey as IngredientSortOption)}
                showLabel={false}
              />
            </View>

            <View className="flex-row items-center justify-between mb-3">
              <ScreenTitle
                title={selectionMode ? `${selectedIds.size} Selected` : ingredientListTitle}
                variant="group"
              />
              <View className="flex-row items-center gap-2">
                {searchQuery && !selectionMode && (
                  <Button onPress={() => setSearchQuery('')} variant="ghost" size="small">
                    Clear
                  </Button>
                )}
                {(filteredIngredients.length > 0 || selectionMode) && (
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

            {!selectionMode && filteredIngredients.length > 0 && (
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
        }
        ListEmptyComponent={
          isLoading ? (
            <SkeletonLoader count={6} />
          ) : (
            <EmptyState
              icon="flask"
              title={
                searchQuery || selectedType !== 'All'
                  ? 'No ingredients found'
                  : 'Bar Inventory is empty'
              }
              description={
                searchQuery
                  ? `No ingredients match "${searchQuery}"${selectedType !== 'All' ? ` in ${selectedType}` : ''}`
                  : selectedType !== 'All'
                    ? `No ingredients in ${selectedType} category`
                    : 'Set up your wells and we\'ll add your house pours so you can start building cocktails.'
              }
              actionLabel={
                searchQuery || selectedType !== 'All' ? 'Add Ingredient' : 'Set Up Wells'
              }
              onAction={
                searchQuery || selectedType !== 'All'
                  ? handleAddIngredient
                  : () => router.push('/wells-setup' as any)
              }
            />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: selectionMode ? 96 : 24 }}
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
