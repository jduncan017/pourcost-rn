import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import SearchBar from '@/src/components/ui/SearchBar';
import BackButton from '@/src/components/ui/BackButton';
import Card from '@/src/components/ui/Card';
import ScreenTitle from '@/src/components/ui/ScreenTitle';

// Mock data for recent searches and recent items
const RECENT_SEARCHES = ['Vodka Premium', 'Margarita', 'Simple Syrup'];

const RECENT_COCKTAILS = [
  { id: '1', name: 'Classic Margarita', type: 'cocktail', totalCost: 2.45 },
  { id: '2', name: 'Old Fashioned', type: 'cocktail', totalCost: 3.2 },
  { id: '3', name: 'Mojito', type: 'cocktail', totalCost: 1.85 },
];

const RECENT_INGREDIENTS = [
  { id: '1', name: 'Vodka Premium', type: 'ingredient', costPerOz: 0.98 },
  { id: '2', name: 'Simple Syrup', type: 'ingredient', costPerOz: 0.53 },
];

// Mock search results
const SEARCH_RESULTS = {
  ingredients: [
    {
      id: '1',
      name: 'Vodka Premium',
      type: 'ingredient',
      costPerOz: 0.98,
      category: 'Spirit',
    },
    {
      id: '2',
      name: 'Vodka (Standard)',
      type: 'ingredient',
      costPerOz: 0.75,
      category: 'Spirit',
    },
    {
      id: '3',
      name: 'Simple Syrup',
      type: 'ingredient',
      costPerOz: 0.53,
      category: 'Syrup',
    },
  ],
  cocktails: [
    {
      id: '1',
      name: 'Classic Margarita',
      type: 'cocktail',
      totalCost: 2.45,
      ingredients: 3,
    },
    {
      id: '2',
      name: 'Spicy Margarita',
      type: 'cocktail',
      totalCost: 2.75,
      ingredients: 4,
    },
    {
      id: '3',
      name: 'Frozen Margarita',
      type: 'cocktail',
      totalCost: 3.1,
      ingredients: 4,
    },
  ],
};

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setHasSearched(query.length > 0);
  };

  const handleRecentSearchPress = (search: string) => {
    setSearchQuery(search);
    setHasSearched(true);
  };

  const handleItemPress = (item: any) => {
    if (item.type === 'cocktail') {
      router.push({
        pathname: '/cocktail-detail',
        params: { id: item.id },
      });
    } else {
      router.push({
        pathname: '/ingredient-detail',
        params: { id: item.id },
      });
    }
  };

  const getFilteredResults = () => {
    if (!searchQuery.trim()) return { ingredients: [], cocktails: [] };

    const query = searchQuery.toLowerCase();
    return {
      ingredients: SEARCH_RESULTS.ingredients.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      ),
      cocktails: SEARCH_RESULTS.cocktails.filter((item) =>
        item.name.toLowerCase().includes(query)
      ),
    };
  };

  const searchResults = getFilteredResults();
  const totalResults =
    searchResults.ingredients.length + searchResults.cocktails.length;

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-center gap-3 mb-6">
            <BackButton />
            <View className="flex-1">
              <ScreenTitle title="Search" variant="main" />
              <Text
                className="text-g3 dark:text-n1"
                style={{ fontFamily: 'Geist' }}
              >
                Find ingredients and cocktails
              </Text>
            </View>
          </View>

          {/* Search Bar */}
          <View className="mb-6">
            <SearchBar
              placeholder="Search ingredients and cocktails..."
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

          {/* Recent Searches */}
          {!hasSearched && (
            <Card className="mb-6">
              <ScreenTitle
                title="Recent Searches"
                variant="section"
                className="mb-3"
              />
              {RECENT_SEARCHES.length > 0 ? (
                <View className="flex flex-col gap-2">
                  {RECENT_SEARCHES.map((search, index) => (
                    <Pressable
                      key={index}
                      onPress={() => handleRecentSearchPress(search)}
                      className="flex-row items-center gap-3 p-3 bg-n1/50 dark:bg-p3/50 rounded-lg"
                    >
                      <Ionicons name="time" size={16} color="#6B7280" />
                      <Text
                        className="flex-1 text-g4 dark:text-n1"
                        style={{ fontFamily: 'Geist' }}
                      >
                        {search}
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color="#6B7280"
                      />
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text
                  className="text-g3 dark:text-n1 text-center py-4"
                  style={{ fontFamily: 'Geist' }}
                >
                  No recent searches
                </Text>
              )}
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
                  <Ionicons name="search" size={48} color="#9CA3AF" />
                  <Text
                    className="text-g3 dark:text-n1 text-center mt-3"
                    style={{ fontFamily: 'Geist', fontWeight: '500' }}
                  >
                    No results found
                  </Text>
                  <Text
                    className="text-sm text-g3 dark:text-n1 text-center mt-1"
                    style={{ fontFamily: 'Geist' }}
                  >
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
                        style={{ fontFamily: 'Geist', fontWeight: '500' }}
                      >
                        Ingredients ({searchResults.ingredients.length})
                      </Text>
                      <View className="flex flex-col gap-2">
                        {searchResults.ingredients.map((item) => (
                          <Pressable
                            key={item.id}
                            onPress={() => handleItemPress(item)}
                            className="flex-row items-center justify-between p-3 bg-n1/50 dark:bg-p3/50 rounded-lg"
                          >
                            <View className="flex-row items-center gap-3">
                              <Ionicons
                                name="flask"
                                size={20}
                                color="#3B82F6"
                              />
                              <View>
                                <Text
                                  className="text-g4 dark:text-n1"
                                  style={{
                                    fontFamily: 'Geist',
                                    fontWeight: '500',
                                  }}
                                >
                                  {item.name}
                                </Text>
                                <Text
                                  className="text-sm text-g3 dark:text-n1"
                                  style={{ fontFamily: 'Geist' }}
                                >
                                  {item.category} • ${item.costPerOz.toFixed(2)}
                                  /oz
                                </Text>
                              </View>
                            </View>
                            <Ionicons
                              name="chevron-forward"
                              size={20}
                              color="#6B7280"
                            />
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Cocktails Results */}
                  {searchResults.cocktails.length > 0 && (
                    <View>
                      <Text
                        className="text-g4 dark:text-n1 mb-2"
                        style={{ fontFamily: 'Geist', fontWeight: '500' }}
                      >
                        Cocktails ({searchResults.cocktails.length})
                      </Text>
                      <View className="flex flex-col gap-2">
                        {searchResults.cocktails.map((item) => (
                          <Pressable
                            key={item.id}
                            onPress={() => handleItemPress(item)}
                            className="flex-row items-center justify-between p-3 bg-n1/50 dark:bg-p3/50 rounded-lg"
                          >
                            <View className="flex-row items-center gap-3">
                              <Ionicons name="wine" size={20} color="#10B981" />
                              <View>
                                <Text
                                  className="text-g4 dark:text-n1"
                                  style={{
                                    fontFamily: 'Geist',
                                    fontWeight: '500',
                                  }}
                                >
                                  {item.name}
                                </Text>
                                <Text
                                  className="text-sm text-g3 dark:text-n1"
                                  style={{ fontFamily: 'Geist' }}
                                >
                                  {item.ingredients} ingredients • $
                                  {item.totalCost.toFixed(2)} cost
                                </Text>
                              </View>
                            </View>
                            <Ionicons
                              name="chevron-forward"
                              size={20}
                              color="#6B7280"
                            />
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </Card>
          )}

          {/* Recently Viewed */}
          {!hasSearched && (
            <Card>
              <ScreenTitle
                title="Recently Viewed"
                variant="section"
                className="mb-3"
              />
              <View className="flex flex-col gap-4">
                {/* Recent Cocktails */}
                <View>
                  <Text
                    className="text-g4 dark:text-n1 mb-2"
                    style={{ fontFamily: 'Geist', fontWeight: '500' }}
                  >
                    Cocktails
                  </Text>
                  <View className="flex flex-col gap-2">
                    {RECENT_COCKTAILS.map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() => handleItemPress(item)}
                        className="flex-row items-center justify-between p-3 bg-n1/50 dark:bg-p3/50 rounded-lg"
                      >
                        <View className="flex-row items-center gap-3">
                          <Ionicons name="wine" size={20} color="#10B981" />
                          <View>
                            <Text
                              className="text-g4 dark:text-n1"
                              style={{ fontFamily: 'Geist', fontWeight: '500' }}
                            >
                              {item.name}
                            </Text>
                            <Text
                              className="text-sm text-g3 dark:text-n1"
                              style={{ fontFamily: 'Geist' }}
                            >
                              Total cost: ${item.totalCost.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#6B7280"
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Recent Ingredients */}
                <View>
                  <Text
                    className="text-g4 dark:text-n1 mb-2"
                    style={{ fontFamily: 'Geist', fontWeight: '500' }}
                  >
                    Ingredients
                  </Text>
                  <View className="flex flex-col gap-2">
                    {RECENT_INGREDIENTS.map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() => handleItemPress(item)}
                        className="flex-row items-center justify-between p-3 bg-n1/50 dark:bg-p3/50 rounded-lg"
                      >
                        <View className="flex-row items-center gap-3">
                          <Ionicons name="flask" size={20} color="#3B82F6" />
                          <View>
                            <Text
                              className="text-g4 dark:text-n1"
                              style={{ fontFamily: 'Geist', fontWeight: '500' }}
                            >
                              {item.name}
                            </Text>
                            <Text
                              className="text-sm text-g3 dark:text-n1"
                              style={{ fontFamily: 'Geist' }}
                            >
                              ${item.costPerOz.toFixed(2)}/oz
                            </Text>
                          </View>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#6B7280"
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
