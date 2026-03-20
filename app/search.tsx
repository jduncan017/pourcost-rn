import { useState, useMemo, useLayoutEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import SearchBar from '@/src/components/ui/SearchBar';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import SectionDivider from '@/src/components/ui/SectionDivider';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { volumeLabel } from '@/src/types/models';
import {
  calculateCostPerOz,
  calculateCocktailMetrics,
  formatCurrency,
} from '@/src/services/calculation-service';

function ResultRow({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
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
      <Ionicons name={icon} size={20} color={iconColor} style={{ marginRight: 12 }} />
      <View className="flex-1">
        <Text className="text-base" style={{ color: colors.text, fontWeight: '500' }}>
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
        .filter((i) =>
          i.name.toLowerCase().includes(query) ||
          (i.type && i.type.toLowerCase().includes(query))
        )
        .slice(0, 10),
      cocktails: cocktails
        .filter((c) =>
          c.name.toLowerCase().includes(query) ||
          (c.description && c.description.toLowerCase().includes(query)) ||
          c.ingredients.some((i) => i.name.toLowerCase().includes(query))
        )
        .slice(0, 10),
    };
  }, [searchQuery, ingredients, cocktails]);

  const totalResults = searchResults.ingredients.length + searchResults.cocktails.length;

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

          {/* Empty state */}
          {!hasSearched && (
            <View className="py-12 items-center">
              <Ionicons name="search" size={48} color={colors.textTertiary} />
              <Text className="text-center mt-3" style={{ color: colors.text, fontWeight: '500' }}>
                Search your library
              </Text>
              <Text className="text-sm text-center mt-1" style={{ color: colors.textTertiary }}>
                {ingredients.length} ingredients and {cocktails.length} cocktails
              </Text>
            </View>
          )}

          {/* No results */}
          {hasSearched && totalResults === 0 && (
            <View className="py-12 items-center">
              <Ionicons name="search" size={48} color={colors.textTertiary} />
              <Text className="text-center mt-3" style={{ color: colors.text, fontWeight: '500' }}>
                No results found
              </Text>
              <Text className="text-sm text-center mt-1" style={{ color: colors.textTertiary }}>
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
                const costPerOz = calculateCostPerOz(item.productSize, item.productCost);
                return (
                  <View key={item.id}>
                    {index > 0 && <SectionDivider />}
                    <ResultRow
                      icon="flask"
                      iconColor={colors.accent}
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
                      icon="wine"
                      iconColor={colors.success}
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
