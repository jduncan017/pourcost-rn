import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  LinearTransition,
} from 'react-native-reanimated';
import { useNavigation, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '@/src/components/ui/GradientBackground';
import FormSaveBar from '@/src/components/ui/FormSaveBar';
import SearchBar from '@/src/components/ui/SearchBar';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import SuggestedTitle from '@/src/components/ui/SuggestedTitle';
import { useThemeColors, useIsDarkMode, palette } from '@/src/contexts/ThemeContext';
import { ingredientTypeIcon } from '@/src/lib/type-icons';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { SavedIngredient, CocktailIngredient, fraction } from '@/src/types/models';
import { calculateCostPerOz, calculateCostPerPour } from '@/src/services/calculation-service';
import { getIngredientUsageCounts, sortByUsage } from '@/src/lib/ingredientUsage';
import { useIngredientSelectionStore } from '@/src/stores/ingredient-selection-store';
import {
  searchCanonicalProducts,
  mapCanonicalToType,
  type CanonicalProductSummary,
} from '@/src/lib/canonical-products';

const DATABASE_DEBOUNCE_MS = 250;

const FADE_DURATION = 400;

/** Wrapper that fades a row's opacity when isFading becomes true */
function FadingRow({ isFading, children }: { isFading: boolean; children: React.ReactNode }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isFading) {
      opacity.value = withTiming(0, { duration: FADE_DURATION });
    } else {
      opacity.value = 1;
    }
  }, [isFading]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

/**
 * Dedicated ingredient selection screen for cocktail recipes
 * Uses full-screen search interface to avoid keyboard issues
 */
export default function IngredientSelectorScreen() {
  const insets = useSafeAreaInsets();
  const router = useGuardedRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const colors = useThemeColors();
  const isDark = useIsDarkMode();
  const { setSelectedIngredients: setStoreIngredients, setRemovedIngredientIds } = useIngredientSelectionStore();
  const { ingredients: allIngredients } = useIngredientsStore();
  const { cocktails } = useCocktailsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<SavedIngredient[]>([]);
  const [initialExistingIds, setInitialExistingIds] = useState<string[]>([]);
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());

  // Inline Spirit Database expander — collapsed by default, opens when the
  // user explicitly asks for database results below their library.
  const [showDatabase, setShowDatabase] = useState(false);
  const [databaseResults, setDatabaseResults] = useState<CanonicalProductSummary[]>([]);
  const [databaseLoading, setDatabaseLoading] = useState(false);
  const databaseDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset the database expander when the user clears the search box. Keeps
  // the section from sticking around when there's no query to drive it.
  useEffect(() => {
    if (!searchQuery.trim()) {
      setShowDatabase(false);
      setDatabaseResults([]);
    }
  }, [searchQuery]);

  // Auto-open the database section the moment the user's library has no
  // matches — that's when the catalog is most useful and the manual expander
  // tap becomes friction. Stays open through subsequent typing so results
  // don't flicker back behind the collapser.

  // Debounced canonical search when the database section is expanded.
  useEffect(() => {
    if (databaseDebounceRef.current) clearTimeout(databaseDebounceRef.current);
    if (!showDatabase || searchQuery.trim().length < 2) {
      setDatabaseResults([]);
      setDatabaseLoading(false);
      return;
    }
    setDatabaseLoading(true);
    databaseDebounceRef.current = setTimeout(async () => {
      const found = await searchCanonicalProducts(searchQuery);
      setDatabaseResults(found);
      setDatabaseLoading(false);
    }, DATABASE_DEBOUNCE_MS);
    return () => {
      if (databaseDebounceRef.current) clearTimeout(databaseDebounceRef.current);
    };
  }, [searchQuery, showDatabase]);

  // Tapping a canonical opens the preview screen first (read-only "is this
  // the right product?" view); the preview's Save button replaces preview
  // with the form, so saving the form pops back here for auto-select.
  const goToFormWithCanonical = (product: CanonicalProductSummary) => {
    router.push({
      pathname: '/ingredient-preview',
      params: { canonicalId: product.id },
    });
  };

  const goToFormEmpty = () => {
    router.push({ pathname: '/ingredient-form', params: { name: searchQuery.trim() || undefined } });
  };

  // Track ingredient count to detect newly created ingredients
  const prevIngredientCountRef = useRef(allIngredients.length);

  // Pre-load existing ingredients when editing a cocktail
  useEffect(() => {
    if (params.existingIngredientIds) {
      try {
        const ids: string[] = JSON.parse(params.existingIngredientIds as string);
        const existing = allIngredients.filter(ing => ids.includes(ing.id));
        if (existing.length > 0) {
          setSelectedIngredients(existing);
          setInitialExistingIds(ids);
        }
      } catch (e) {
        if (__DEV__) console.error('Error parsing existingIngredientIds:', e);
      }
    }
  }, []);

  // Auto-select newly created ingredient when returning from ingredient-form
  useFocusEffect(
    useCallback(() => {
      if (allIngredients.length > prevIngredientCountRef.current) {
        // Find the newest ingredient by createdAt (sort descending, pick first unselected)
        const sorted = [...allIngredients].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const newest = sorted.find(i => !selectedIngredients.find(s => s.id === i.id));
        if (newest) {
          setSelectedIngredients(prev => [...prev, newest]);
        }
      }
      prevIngredientCountRef.current = allIngredients.length;
    }, [allIngredients.length])
  );

  // Header right Create button — iOS 26 wraps interactive headerRight items
  // in a Liquid Glass capsule automatically; that's the desired aesthetic
  // here since this is a secondary action sitting next to a primary list.
  // Ref pattern keeps the header pinned without re-setting options on every
  // searchQuery keystroke.
  const createRef = useRef<() => void>(() => {});
  createRef.current = () => goToFormEmpty();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Add Ingredients',
      headerLeft: () => (
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 p-2">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={{ color: colors.text, fontSize: 16 }}>Cancel</Text>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable
          onPress={() => createRef.current()}
          className="flex-row items-center gap-1 px-3 py-1.5"
          hitSlop={6}
        >
          <Ionicons name="add" size={16} color={colors.text} />
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>
            Create
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, colors]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setHasSearched(query.length > 0);
  };

  const handleSelectIngredient = (ingredient: SavedIngredient) => {
    if (selectedIngredients.find(item => item.id === ingredient.id)) return;
    if (fadingIds.has(ingredient.id)) return;

    // Add to selected immediately (appears in pills)
    setSelectedIngredients(prev => [...prev, ingredient]);

    // Start fading — row stays visible during animation
    setFadingIds(prev => new Set(prev).add(ingredient.id));

    // Remove from DOM after fade completes
    setTimeout(() => {
      setFadingIds(prev => {
        const next = new Set(prev);
        next.delete(ingredient.id);
        return next;
      });
    }, FADE_DURATION);
  };

  const handleRemoveFromQueue = (id: string) => {
    setSelectedIngredients(selectedIngredients.filter(item => item.id !== id));
  };

  const handleFinishSelection = () => {
    const defaultPourSize = fraction(3, 2);
    const selectedIds = selectedIngredients.map(i => i.id);

    const newIngredients: CocktailIngredient[] = selectedIngredients
      .filter(ingredient => !initialExistingIds.includes(ingredient.id))
      .map(ingredient => ({
        ingredientId: ingredient.id,
        name: ingredient.name,
        productSize: ingredient.productSize,
        productCost: ingredient.productCost,
        pourSize: defaultPourSize,
        cost: calculateCostPerPour(ingredient.productSize, ingredient.productCost, defaultPourSize),
      }));

    const removed = initialExistingIds.filter(id => !selectedIds.includes(id));

    setStoreIngredients(newIngredients);
    setRemovedIngredientIds(removed);

    router.back();
  };

  // Derive ingredient usage counts from cocktail data
  const usageCounts = useMemo(
    () => getIngredientUsageCounts(cocktails),
    [cocktails]
  );

  // Full pool of ingredients sorted by usage (for backfilling suggested)
  const usageSortedPool = useMemo(() => {
    const used = allIngredients.filter(i => (usageCounts.get(i.id) ?? 0) > 0);
    return sortByUsage(used, usageCounts);
  }, [allIngredients, usageCounts]);

  // Suggested: always 5 items (4 visible + 1 clipped below, ready to slide in)
  // Includes currently-fading items so they stay in DOM during animation
  const suggestedIngredients = useMemo(() => {
    const result: SavedIngredient[] = [];
    for (const item of usageSortedPool) {
      const isSelected = selectedIngredients.find(s => s.id === item.id);
      if (!isSelected || fadingIds.has(item.id)) {
        result.push(item);
      }
      if (result.length >= 5) break;
    }
    return result;
  }, [usageSortedPool, selectedIngredients, fadingIds]);

  // Measure row height to calculate the clipping container
  const [rowHeight, setRowHeight] = useState(0);
  const GAP = 8; // gap-2 = 8px
  // Non-fading item count determines visible rows (max 4, 5th is hidden)
  const nonFadingCount = suggestedIngredients.filter(i => !fadingIds.has(i.id)).length;
  const visibleRows = Math.min(nonFadingCount, 4);
  const clippedHeight = rowHeight > 0 && visibleRows > 0
    ? rowHeight * visibleRows + GAP * (visibleRows - 1)
    : undefined;

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const filtered = allIngredients.filter(
      (i) =>
        i.name.toLowerCase().includes(query) ||
        (i.type && i.type.toLowerCase().includes(query)) ||
        (i.subType && i.subType.toLowerCase().includes(query))
    );
    return sortByUsage(filtered, usageCounts);
  }, [searchQuery, allIngredients, usageCounts]);

  // Auto-show DB section when the user's library returns 3 or fewer matches
  // for the active query. Threshold (vs strict zero) handles the case where
  // a user has e.g. one vodka in inventory but is looking for something
  // else — the DB results come up automatically without an extra tap.
  // Once on, stays on until the user clears the search.
  useEffect(() => {
    if (searchQuery.trim().length >= 2 && searchResults.length <= 3) {
      setShowDatabase(true);
    }
  }, [searchQuery, searchResults]);

  // Check if an ingredient is currently selected
  const isIngredientSelected = useCallback(
    (id: string) => !!selectedIngredients.find(item => item.id === id),
    [selectedIngredients]
  );

  // Render a Spirit Database (canonical) row using the same visual as the
  // library row — typed icon, name, subtitle, add-circle on the right —
  // so the two sections feel like one continuous list.
  const renderDatabaseRow = (product: CanonicalProductSummary) => {
    const { ingredientType } = mapCanonicalToType(product);
    const icon = ingredientTypeIcon(ingredientType);
    const subtitle = [product.brand, product.subcategory ?? product.category]
      .filter((s) => s && s !== product.name)
      .join(' · ');
    return (
      <Pressable
        key={product.id}
        onPress={() => goToFormWithCanonical(product)}
        className="flex-row items-center py-3"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <MaterialCommunityIcons
          name={icon.name}
          size={22}
          color={icon.color}
          style={{ marginRight: 12 }}
        />
        <View className="flex-1">
          <Text
            className="text-base"
            style={{ color: colors.text, fontWeight: '500' }}
            numberOfLines={1}
          >
            {product.name}
          </Text>
          {subtitle ? (
            <Text
              className="text-sm mt-0.5"
              style={{ color: colors.textTertiary }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Ionicons name="add-circle" size={26} color={colors.success} />
      </Pressable>
    );
  };

  // Render an ingredient row — matches search page row visual with a typed
  // icon, and an add-circle indicator on the right. Tapping the whole row adds.
  const renderIngredientRow = (ingredient: SavedIngredient, suggested = false, measure = false) => {
    const isFading = fadingIds.has(ingredient.id);
    const icon = ingredientTypeIcon(ingredient.type);
    const addColor = colors.success;

    return (
      <FadingRow key={ingredient.id} isFading={isFading}>
        <Pressable
          onPress={() => handleSelectIngredient(ingredient)}
          disabled={isFading}
          className="flex-row items-center py-3"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          onLayout={measure && rowHeight === 0 ? (e) => setRowHeight(e.nativeEvent.layout.height) : undefined}
        >
          <MaterialCommunityIcons
            name={icon.name}
            size={22}
            color={icon.color}
            style={{ marginRight: 12 }}
          />
          <View className="flex-1">
            <View className="flex-row items-center gap-1">
              <Text
                className="text-base"
                style={{ color: colors.text, fontWeight: '500' }}
                numberOfLines={1}
              >
                {ingredient.name}
              </Text>
              {suggested && (
                <Ionicons name="sparkles" size={10} color={palette.P2} />
              )}
            </View>
            <Text className="text-sm mt-0.5" style={{ color: colors.textTertiary }}>
              {ingredient.type || 'Other'} • ${calculateCostPerOz(ingredient.productSize, ingredient.productCost).toFixed(2)}/oz
            </Text>
          </View>
          <Ionicons name="add-circle" size={26} color={addColor} />
        </Pressable>
      </FadingRow>
    );
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          keyboardShouldPersistTaps="handled"
        >
        <View className="px-6 pt-4 pb-6 flex-col gap-6">
          {/* Helper — points the user at the header Create button when their
              ingredient isn't in their inventory or the Spirit Database. */}
          <Text
            className="text-sm leading-5"
            style={{ color: colors.textSecondary }}
          >
            Search for an ingredient or create a new one above.
          </Text>

          {/* Search Bar */}
          <SearchBar
            placeholder="Search ingredients..."
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />

          {/* Selected queue — only when there's something selected */}
          {selectedIngredients.length > 0 && (
            <View className="flex-col gap-3">
              <View className="flex-row items-center justify-between">
                <ScreenTitle
                  title={`Selected (${selectedIngredients.length})`}
                  variant="muted"
                />
                <Pressable
                  onPress={() => setSelectedIngredients([])}
                  className="flex-row items-center gap-1 px-2 py-1"
                  hitSlop={6}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.error} />
                  <Text
                    className="text-sm"
                    style={{ color: colors.error, fontWeight: '600' }}
                  >
                    Clear
                  </Text>
                </Pressable>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {selectedIngredients.map((ingredient) => (
                  <View
                    key={ingredient.id}
                    className="flex-row items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                    }}
                  >
                    <Text
                      className="text-sm"
                      style={{ color: colors.text, fontWeight: '500' }}
                      numberOfLines={1}
                    >
                      {ingredient.name}
                    </Text>
                    <Pressable
                      onPress={() => handleRemoveFromQueue(ingredient.id)}
                      hitSlop={6}
                    >
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color={colors.textTertiary}
                      />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Search Results or Suggested */}
          {hasSearched ? (
            <View className="flex-col">
              {(() => {
                const visibleLibrary = searchResults.filter(
                  (i) => !isIngredientSelected(i.id) || fadingIds.has(i.id),
                );
                const libraryEmpty = visibleLibrary.length === 0;
                return (
                  <>
                    <ScreenTitle
                      title={`Your Inventory (${visibleLibrary.length})`}
                      variant="muted"
                      className="mb-1"
                    />

                    {libraryEmpty ? (
                      <Text
                        className="text-sm py-2"
                        style={{ color: colors.textTertiary }}
                      >
                        No matches in Your Inventory.
                      </Text>
                    ) : (
                      <Animated.View layout={LinearTransition.duration(300)}>
                        {visibleLibrary.map((ingredient, index) => {
                          const isSuggested =
                            index === 0 && (usageCounts.get(ingredient.id) ?? 0) > 0;
                          return renderIngredientRow(ingredient, isSuggested);
                        })}
                      </Animated.View>
                    )}

                    {/* Spirit Database expander — only after the user has typed.
                        Tapping loads canonical results inline below, on the
                        same screen. Tapping a result routes to ingredient-form
                        with prefill; the new ingredient auto-selects on
                        return via the useFocusEffect above. */}
                    {!showDatabase && (
                      <Pressable
                        onPress={() => setShowDatabase(true)}
                        className="flex-row items-center justify-center gap-2 py-3 mt-3 rounded-full"
                        style={{ backgroundColor: palette.P2 }}
                      >
                        <Ionicons name="add" size={18} color={palette.P8} />
                        <Text
                          style={{ color: palette.P8, fontWeight: '700', fontSize: 14 }}
                        >
                          Show Spirit Database Results
                        </Text>
                      </Pressable>
                    )}

                    {showDatabase && (
                      <View className="flex-col mt-3">
                        <ScreenTitle
                          title={`Spirit Database${
                            !databaseLoading ? ` (${databaseResults.length})` : ''
                          }`}
                          variant="muted"
                          className="mb-1"
                        />

                        {databaseLoading && (
                          <View className="flex-row items-center gap-2 py-2">
                            <ActivityIndicator size="small" color={colors.textSecondary} />
                            <Text className="text-sm" style={{ color: colors.textTertiary }}>
                              Searching Spirit Database…
                            </Text>
                          </View>
                        )}

                        {!databaseLoading && databaseResults.length === 0 && (
                          <Text
                            className="text-sm py-2"
                            style={{ color: colors.textTertiary }}
                          >
                            {searchQuery.trim().length < 2
                              ? 'Type at least 2 characters to search the Spirit Database.'
                              : 'No matches in the Spirit Database.'}
                          </Text>
                        )}

                        {!databaseLoading && databaseResults.length > 0 && (
                          <Animated.View layout={LinearTransition.duration(300)}>
                            {databaseResults.map((product) =>
                              renderDatabaseRow(product),
                            )}
                          </Animated.View>
                        )}
                      </View>
                    )}

                  </>
                );
              })()}
            </View>
          ) : (
            nonFadingCount > 0 && (
              <View className="flex-col">
                <SuggestedTitle title="Suggested" />

                <View style={clippedHeight ? { maxHeight: clippedHeight, overflow: 'hidden' } : undefined}>
                  <Animated.View layout={LinearTransition.duration(300)}>
                    {suggestedIngredients.map((item, index) =>
                      renderIngredientRow(item, true, index === 0)
                    )}
                  </Animated.View>
                </View>
              </View>
            )
          )}
        </View>
        </ScrollView>

        {/* Sticky Done bar — anchored to the bottom so search results scroll
            *under* it without pushing it offscreen. Background matches the
            "to" color of GradientBackground (B8 dark / B1 light) so the bar
            blends with the screen's gradient bottom. */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: insets.bottom + 12,
            backgroundColor: isDark ? palette.B8 : palette.B1,
          }}
        >
          <FormSaveBar
            onPress={handleFinishSelection}
            label={selectedIngredients.length > 0 ? `Done (${selectedIngredients.length})` : 'Done'}
          />
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}
