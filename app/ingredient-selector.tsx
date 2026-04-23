import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  LinearTransition,
} from 'react-native-reanimated';
import { useRouter, useNavigation, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '@/src/components/ui/GradientBackground';
import SearchBar from '@/src/components/ui/SearchBar';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { ingredientTypeIcon } from '@/src/lib/type-icons';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { SavedIngredient, CocktailIngredient, fraction } from '@/src/types/models';
import { calculateCostPerOz, calculateCostPerPour } from '@/src/services/calculation-service';
import { getIngredientUsageCounts, sortByUsage } from '@/src/lib/ingredientUsage';
import { useIngredientSelectionStore } from '@/src/stores/ingredient-selection-store';

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
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const colors = useThemeColors();
  const { setSelectedIngredients: setStoreIngredients, setRemovedIngredientIds } = useIngredientSelectionStore();
  const { ingredients: allIngredients } = useIngredientsStore();
  const { cocktails } = useCocktailsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<SavedIngredient[]>([]);
  const [initialExistingIds, setInitialExistingIds] = useState<string[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());

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
          onPress={handleFinishSelection}
          // Match cocktail-form save pill so iOS 26 treats it as the button itself
          style={{
            backgroundColor: colors.go,
            paddingHorizontal: 18,
            paddingVertical: 8,
            borderRadius: 999,
            minHeight: 36,
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: palette.N1, fontWeight: '600', fontSize: 15 }}>Save</Text>
        </Pressable>
      ),
    });
  }, [selectedIngredients.length, navigation, colors]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

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

  // Check if an ingredient is currently selected
  const isIngredientSelected = useCallback(
    (id: string) => !!selectedIngredients.find(item => item.id === id),
    [selectedIngredients]
  );

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
          {/* Search Bar */}
          <SearchBar
            placeholder="Search ingredients..."
            value={searchQuery}
            onChangeText={handleSearch}
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
              <ScreenTitle
                title={`Search Results (${searchResults.filter(i => !isIngredientSelected(i.id) || fadingIds.has(i.id)).length})`}
                variant="muted"
                className="mb-1"
              />

              {searchResults.filter(i => !isIngredientSelected(i.id) || fadingIds.has(i.id)).length === 0 ? (
                <View className="py-8 items-center">
                  <Ionicons name="search" size={40} color={colors.textTertiary} />
                  <Text
                    className="text-center mt-3"
                    style={{ color: colors.text, fontWeight: '500' }}
                  >
                    No ingredients found
                  </Text>
                  <Text
                    className="text-sm text-center mt-1"
                    style={{ color: colors.textTertiary }}
                  >
                    Try a different search term
                  </Text>
                </View>
              ) : (
                <Animated.View layout={LinearTransition.duration(300)}>
                  {searchResults
                    .filter(i => !isIngredientSelected(i.id) || fadingIds.has(i.id))
                    .map((ingredient, index) => {
                      const isSuggested = index === 0 && (usageCounts.get(ingredient.id) ?? 0) > 0;
                      return renderIngredientRow(ingredient, isSuggested);
                    })}
                </Animated.View>
              )}
            </View>
          ) : (
            nonFadingCount > 0 && (
              <View className="flex-col">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Ionicons name="sparkles" size={12} color={palette.P2} />
                  <ScreenTitle
                    title="Suggested"
                    variant="muted"
                    style={{ color: palette.P2 }}
                  />
                </View>

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

          {/* Create New Ingredient */}
          <Pressable
            onPress={() => router.push('/ingredient-form')}
            className="flex-row items-center justify-center gap-2 py-3 rounded-xl"
            style={{ backgroundColor: colors.accent }}
          >
            <Ionicons name="add-circle-outline" size={20} color={palette.N1} />
            <Text style={{ color: palette.N1, fontWeight: '600', fontSize: 16 }}>
              Create New Ingredient
            </Text>
          </Pressable>
        </View>
        </ScrollView>

        {/* Keyboard Dismiss Button - Only show when keyboard is open */}
        {keyboardVisible && (
          <Pressable
            onPress={() => Keyboard.dismiss()}
            className="absolute right-4 bg-g4/90 rounded-full w-12 h-12 items-center justify-center z-50"
            style={{
              bottom: keyboardHeight + 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Ionicons name="chevron-down" size={24} color={palette.N1} />
          </Pressable>
        )}
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}
