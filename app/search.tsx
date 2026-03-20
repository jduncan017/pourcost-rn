import { useState, useMemo, useLayoutEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import SearchBar from '@/src/components/ui/SearchBar';
import Card from '@/src/components/ui/Card';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { volumeLabel } from '@/src/types/models';
import {
  calculateCostPerOz,
  calculateCocktailMetrics,
} from '@/src/services/calculation-service';

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

  // Search real data from stores
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
            c.ingredients.some((i) =>
              i.name.toLowerCase().includes(query)
            )
        )
        .slice(0, 10),
    };
  }, [searchQuery, ingredients, cocktails]);

  const totalResults =
    searchResults.ingredients.length + searchResults.cocktails.length;

  const handleItemPress = (type: 'ingredient' | 'cocktail', id: string) => {
    router.push({
      pathname: type === 'cocktail' ? '/cocktail-detail' : '/ingredient-detail',
      params: { id },
    });
  };

  return (
    <GradientBackground>
      <View className="flex-1">
        <View className="p-4">
          {/* Search Bar */}
          <View className="mb-6">
            <SearchBar
              placeholder="Search ingredients and cocktails..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView>
            {/* Empty state when no search */}
            {!hasSearched && (
              <Card>
                <View className="py-8 items-center">
                  <Ionicons name="search" size={48} color={colors.textSecondary} />
                  <Text
                    className="text-g3 dark:text-n1 text-center mt-3"
                    style={{ fontWeight: '500' }}
                  >
                    Search your library
                  </Text>
                  <Text className="text-sm text-g3 dark:text-n1 text-center mt-1">
                    {ingredients.length} ingredients and {cocktails.length}{' '}
                    cocktails
                  </Text>
                </View>
              </Card>
            )}

            {/* Search Results */}
            {hasSearched && (
              <Card className="mb-6">
                <ScreenTitle
                  title={`Search Results (${totalResults})`}
                  variant="section"
                  className="mb-3"
                />

                {totalResults === 0 ? (
                  <View className="py-8 items-center">
                    <Ionicons name="search" size={48} color={colors.textSecondary} />
                    <Text
                      className="text-g3 dark:text-n1 text-center mt-3"
                      style={{ fontWeight: '500' }}
                    >
                      No results found
                    </Text>
                    <Text className="text-sm text-g3 dark:text-n1 text-center mt-1">
                      Try a different search term
                    </Text>
                  </View>
                ) : (
                  <View className="flex flex-col gap-4">
                    {/* Ingredients Results */}
                    {searchResults.ingredients.length > 0 && (
                      <View>
                        <Text
                          className="text-g4 dark:text-n1 mb-2"
                          style={{ fontWeight: '500' }}
                        >
                          Ingredients ({searchResults.ingredients.length})
                        </Text>
                        <View className="flex flex-col gap-2">
                          {searchResults.ingredients.map((item) => {
                            const costPerOz = calculateCostPerOz(
                              item.productSize,
                              item.productCost
                            );
                            return (
                              <Pressable
                                key={item.id}
                                onPress={() =>
                                  handleItemPress('ingredient', item.id)
                                }
                                className="flex-row items-center justify-between p-3 bg-n1/50 dark:bg-p3/50 rounded-lg"
                              >
                                <View className="flex-row items-center gap-3">
                                  <Ionicons
                                    name="flask"
                                    size={20}
                                    color={colors.primary}
                                  />
                                  <View>
                                    <Text
                                      className="text-g4 dark:text-n1"
                                      style={{ fontWeight: '500' }}
                                    >
                                      {item.name}
                                    </Text>
                                    <Text className="text-sm text-g3 dark:text-n1">
                                      {item.type || 'Other'} •{' '}
                                      {volumeLabel(item.productSize)} • $
                                      {costPerOz.toFixed(2)}/oz
                                    </Text>
                                  </View>
                                </View>
                                <Ionicons
                                  name="chevron-forward"
                                  size={20}
                                  color={colors.textSecondary}
                                />
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {/* Cocktails Results */}
                    {searchResults.cocktails.length > 0 && (
                      <View>
                        <Text
                          className="text-g4 dark:text-n1 mb-2"
                          style={{ fontWeight: '500' }}
                        >
                          Cocktails ({searchResults.cocktails.length})
                        </Text>
                        <View className="flex flex-col gap-2">
                          {searchResults.cocktails.map((item) => {
                            const metrics = calculateCocktailMetrics(
                              item.ingredients
                            );
                            return (
                              <Pressable
                                key={item.id}
                                onPress={() =>
                                  handleItemPress('cocktail', item.id)
                                }
                                className="flex-row items-center justify-between p-3 bg-n1/50 dark:bg-p3/50 rounded-lg"
                              >
                                <View className="flex-row items-center gap-3">
                                  <Ionicons
                                    name="wine"
                                    size={20}
                                    color={colors.success}
                                  />
                                  <View>
                                    <Text
                                      className="text-g4 dark:text-n1"
                                      style={{ fontWeight: '500' }}
                                    >
                                      {item.name}
                                    </Text>
                                    <Text className="text-sm text-g3 dark:text-n1">
                                      {item.ingredients.length} ingredients • $
                                      {metrics.totalCost.toFixed(2)} cost
                                    </Text>
                                  </View>
                                </View>
                                <Ionicons
                                  name="chevron-forward"
                                  size={20}
                                  color={colors.textSecondary}
                                />
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </Card>
            )}
          </ScrollView>
        </View>
      </View>
    </GradientBackground>
  );
}
