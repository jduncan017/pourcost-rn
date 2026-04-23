import { useState, useMemo, useLayoutEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import SearchBar from '@/src/components/ui/SearchBar';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import SectionDivider from '@/src/components/ui/SectionDivider';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { volumeLabel } from '@/src/types/models';
import {
  calculateCostPerOz,
  calculateCocktailMetrics,
  formatCurrency,
} from '@/src/services/calculation-service';
import { ingredientTypeIcon, cocktailIcon, TypeIcon } from '@/src/lib/type-icons';
import { getIngredientUsageCounts, sortByUsage } from '@/src/lib/ingredientUsage';
import { ensureDate } from '@/src/lib/ensureDate';

function ResultRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: TypeIcon;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
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
        >
          {title}
        </Text>
        <Text className="text-sm mt-0.5" style={{ color: colors.textTertiary }}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

export default function SearchScreen() {
  const router = useRouter();
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

  const totalResults =
    searchResults.ingredients.length + searchResults.cocktails.length;

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

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="p-4 flex-col gap-6">
          {/* Search Bar */}
          <SearchBar
            placeholder="Search ingredients and cocktails..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Suggested — shown when no search query */}
          {!hasSearched && suggestedIngredients.length > 0 && (
            <View>
              <View className="flex-row items-center gap-1.5 mb-1">
                <Ionicons name="sparkles" size={12} color={palette.P2} />
                <ScreenTitle
                  title="Suggested Ingredients"
                  variant="muted"
                  style={{ color: palette.P2 }}
                />
              </View>
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
              <View className="flex-row items-center gap-1.5 mb-1">
                <Ionicons name="sparkles" size={12} color={palette.P2} />
                <ScreenTitle
                  title="Suggested Cocktails"
                  variant="muted"
                  style={{ color: palette.P2 }}
                />
              </View>
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

          {/* No results */}
          {hasSearched && totalResults === 0 && (
            <View className="py-12 items-center">
              <Ionicons name="search" size={48} color={colors.textTertiary} />
              <Text
                className="text-center mt-3"
                style={{ color: colors.text, fontWeight: '500' }}
              >
                No results found
              </Text>
              <Text
                className="text-sm text-center mt-1"
                style={{ color: colors.textTertiary }}
              >
                Try a different search term
              </Text>
            </View>
          )}

          {/* Ingredients Results */}
          {hasSearched && searchResults.ingredients.length > 0 && (
            <View>
              <ScreenTitle
                title={`Ingredients (${searchResults.ingredients.length})`}
                variant="group"
                className="mb-2"
              />
              {searchResults.ingredients.map((item, index) => {
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

          {/* Cocktails Results */}
          {hasSearched && searchResults.cocktails.length > 0 && (
            <View>
              <ScreenTitle
                title={`Cocktails (${searchResults.cocktails.length})`}
                variant="group"
                className="mb-2"
              />
              {searchResults.cocktails.map((item, index) => {
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
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
