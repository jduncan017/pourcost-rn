import { useState, useMemo, useLayoutEffect, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import SearchBar from '@/src/components/ui/SearchBar';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import SectionDivider from '@/src/components/ui/SectionDivider';
import SuggestedTitle from '@/src/components/ui/SuggestedTitle';
import ResultRow from '@/src/components/ui/ResultRow';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { volumeLabel } from '@/src/types/models';
import {
  calculateCostPerOz,
  calculateCocktailMetrics,
  formatCurrency,
} from '@/src/services/calculation-service';
import { ingredientTypeIcon, cocktailIcon } from '@/src/lib/type-icons';
import { getIngredientUsageCounts, sortByUsage } from '@/src/lib/ingredientUsage';
import { ensureDate } from '@/src/lib/ensureDate';
import {
  searchCanonicalProducts,
  mapCanonicalToType,
  type CanonicalProductSummary,
} from '@/src/lib/canonical-products';

const DATABASE_DEBOUNCE_MS = 250;

export default function SearchScreen() {
  const router = useGuardedRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Search' });
  }, [navigation]);

  const { ingredients } = useIngredientsStore();
  const { cocktails } = useCocktailsStore();

  const hasSearched = searchQuery.length > 0;

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { ingredients: [], cocktails: [] };
    const query = searchQuery.toLowerCase();
    return {
      ingredients: ingredients
        .filter(
          (i) =>
            i.name.toLowerCase().includes(query) ||
            (i.type && i.type.toLowerCase().includes(query))
        )
        .slice(0, 10),
      cocktails: cocktails
        .filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            (c.description && c.description.toLowerCase().includes(query)) ||
            c.ingredients.some((i) => i.name.toLowerCase().includes(query))
        )
        .slice(0, 10),
    };
  }, [searchQuery, ingredients, cocktails]);

  // Suggested ingredients: top 5 by cocktail-usage frequency.
  const usageCounts = useMemo(() => getIngredientUsageCounts(cocktails), [cocktails]);
  const suggestedIngredients = useMemo(() => {
    const used = ingredients.filter((i) => (usageCounts.get(i.id) ?? 0) > 0);
    return sortByUsage(used, usageCounts).slice(0, 5);
  }, [ingredients, usageCounts]);

  // Suggested cocktails: top 5 most-recently-updated.
  const suggestedCocktails = useMemo(() => {
    return [...cocktails]
      .sort(
        (a, b) =>
          ensureDate(b.updatedAt).getTime() - ensureDate(a.updatedAt).getTime()
      )
      .slice(0, 5);
  }, [cocktails]);

  const handleItemPress = (type: 'ingredient' | 'cocktail', id: string) => {
    router.push({
      pathname: type === 'cocktail' ? '/cocktail-detail' : '/ingredient-detail',
      params: { id },
    });
  };

  // Optional Spirit Database expander — opt-in only on global search; never
  // auto-opens (unlike ingredient-selector). Users come here to find their
  // own stuff first; the catalog is a side trip.
  const [showDatabase, setShowDatabase] = useState(false);
  const [databaseResults, setDatabaseResults] = useState<CanonicalProductSummary[]>([]);
  const [databaseLoading, setDatabaseLoading] = useState(false);
  const databaseDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setShowDatabase(false);
      setDatabaseResults([]);
    }
  }, [searchQuery]);

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

  const goToFormWithCanonical = (product: CanonicalProductSummary) => {
    const { ingredientType, subType } = mapCanonicalToType(product);
    const firstSize = product.defaultSizes[0];
    router.push({
      pathname: '/ingredient-form',
      params: {
        canonicalProductId: product.id,
        name: product.name,
        description: product.description ?? undefined,
        abv: product.abv != null ? String(product.abv) : undefined,
        type: ingredientType,
        subType: subType || undefined,
        productSize: firstSize ? JSON.stringify(firstSize) : undefined,
      },
    });
  };

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="p-4 flex-col gap-6">
          {/* Search Bar */}
          <SearchBar
            placeholder="Search ingredients and cocktails..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />

          {/* Suggested — shown when no search query */}
          {!hasSearched && suggestedIngredients.length > 0 && (
            <View>
              <SuggestedTitle title="Suggested Ingredients" />
              {suggestedIngredients.map((item, index) => {
                const costPerOz = calculateCostPerOz(
                  item.productSize,
                  item.productCost
                );
                return (
                  <View key={item.id}>
                    {index > 0 && <SectionDivider />}
                    <ResultRow
                      icon={ingredientTypeIcon(item.type)}
                      title={item.name}
                      subtitle={`${item.type || 'Other'} • ${volumeLabel(item.productSize)} • ${formatCurrency(costPerOz)}/oz`}
                      onPress={() => handleItemPress('ingredient', item.id)}
                    />
                  </View>
                );
              })}
            </View>
          )}

          {!hasSearched && suggestedCocktails.length > 0 && (
            <View>
              <SuggestedTitle title="Suggested Cocktails" />
              {suggestedCocktails.map((item, index) => {
                const metrics = calculateCocktailMetrics(item.ingredients);
                return (
                  <View key={item.id}>
                    {index > 0 && <SectionDivider />}
                    <ResultRow
                      icon={cocktailIcon}
                      title={item.name}
                      subtitle={`${item.ingredients.length} ingredients • ${formatCurrency(metrics.totalCost)} cost`}
                      onPress={() => handleItemPress('cocktail', item.id)}
                    />
                  </View>
                );
              })}
            </View>
          )}

          {/* Empty library hint — only when user has no ingredients AND no cocktails */}
          {!hasSearched &&
            suggestedIngredients.length === 0 &&
            suggestedCocktails.length === 0 && (
              <View className="py-12 items-center">
                <Ionicons name="search" size={48} color={colors.textTertiary} />
                <Text
                  className="text-center mt-3"
                  style={{ color: colors.text, fontWeight: '500' }}
                >
                  Search your library
                </Text>
                <Text
                  className="text-sm text-center mt-1"
                  style={{ color: colors.textTertiary }}
                >
                  {ingredients.length} ingredients and {cocktails.length}{' '}
                  cocktails
                </Text>
              </View>
            )}

          {/* Bar Inventory Results — section title always shown when searched;
              when no matches, a small muted line sits where the rows would. */}
          {hasSearched && (
            <View>
              <ScreenTitle
                title={`Bar Inventory (${searchResults.ingredients.length})`}
                variant="muted"
                className="mb-1"
              />
              {searchResults.ingredients.length === 0 ? (
                <Text
                  className="text-sm py-2"
                  style={{ color: colors.textTertiary }}
                >
                  No matches in Bar Inventory.
                </Text>
              ) : (
                searchResults.ingredients.map((item, index) => {
                  const costPerOz = calculateCostPerOz(
                    item.productSize,
                    item.productCost
                  );
                  return (
                    <View key={item.id}>
                      {index > 0 && <SectionDivider />}
                      <ResultRow
                        icon={ingredientTypeIcon(item.type)}
                        title={item.name}
                        subtitle={`${item.type || 'Other'} • ${volumeLabel(item.productSize)} • ${formatCurrency(costPerOz)}/oz`}
                        onPress={() => handleItemPress('ingredient', item.id)}
                      />
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* Cocktails Results — same pattern as Bar Inventory above. */}
          {hasSearched && (
            <View>
              <ScreenTitle
                title={`Cocktails (${searchResults.cocktails.length})`}
                variant="muted"
                className="mb-1"
              />
              {searchResults.cocktails.length === 0 ? (
                <Text
                  className="text-sm py-2"
                  style={{ color: colors.textTertiary }}
                >
                  No matches in Cocktails.
                </Text>
              ) : (
                searchResults.cocktails.map((item, index) => {
                  const metrics = calculateCocktailMetrics(item.ingredients);
                  return (
                    <View key={item.id}>
                      {index > 0 && <SectionDivider />}
                      <ResultRow
                        icon={cocktailIcon}
                        title={item.name}
                        subtitle={`${item.ingredients.length} ingredients • ${formatCurrency(metrics.totalCost)} cost`}
                        onPress={() => handleItemPress('cocktail', item.id)}
                      />
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* Spirit Database — opt-in expander, never auto-opens on global
              search. Tapping a result routes to ingredient-form with prefill. */}
          {hasSearched && !showDatabase && (
            <Pressable
              onPress={() => setShowDatabase(true)}
              className="flex-row items-center justify-center gap-2 py-3 rounded-full"
              style={{ backgroundColor: palette.P2 }}
            >
              <Ionicons name="add" size={18} color={palette.P8} />
              <Text style={{ color: palette.P8, fontWeight: '700', fontSize: 14 }}>
                Show Spirit Database Results
              </Text>
            </Pressable>
          )}

          {hasSearched && showDatabase && (
            <View className="flex-col">
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
                <View>
                  {databaseResults.map((product, index) => {
                    const { ingredientType } = mapCanonicalToType(product);
                    const icon = ingredientTypeIcon(ingredientType);
                    const subtitle = [
                      product.brand,
                      product.subcategory ?? product.category,
                    ]
                      .filter((s) => s && s !== product.name)
                      .join(' · ');
                    return (
                      <View key={product.id}>
                        {index > 0 && <SectionDivider />}
                        <Pressable
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
                          <Ionicons
                            name="add-circle"
                            size={26}
                            color={colors.success}
                          />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
