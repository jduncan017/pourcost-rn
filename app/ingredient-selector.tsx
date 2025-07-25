import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '@/src/components/ui/GradientBackground';
import SearchBar from '@/src/components/ui/SearchBar';
import BackButton from '@/src/components/ui/BackButton';
import Card from '@/src/components/ui/Card';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import { searchIngredients, createCocktailIngredient, calculateCostPerOz } from '@/src/services/mock-data';
import { SavedIngredient } from '@/src/types/models';
import { useIngredientSelectionStore } from '@/src/stores/ingredient-selection-store';

/**
 * Dedicated ingredient selection screen for cocktail recipes
 * Uses full-screen search interface to avoid keyboard issues
 */
export default function IngredientSelectorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setSelectedIngredients: setStoreIngredients } = useIngredientSelectionStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<SavedIngredient[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
    // Add to queue if not already selected
    if (!selectedIngredients.find(item => item.id === ingredient.id)) {
      setSelectedIngredients([...selectedIngredients, ingredient]);
    }
  };

  const handleRemoveFromQueue = (id: string) => {
    setSelectedIngredients(selectedIngredients.filter(item => item.id !== id));
  };

  const handleFinishSelection = () => {
    // Convert all selected ingredients to cocktail ingredients and send them back
    const cocktailIngredients = selectedIngredients.map(ingredient => 
      createCocktailIngredient(ingredient, 1.5, 'oz')
    );
    
    setStoreIngredients(cocktailIngredients);
    
    // Navigate back to cocktail form
    router.back();
  };

  const getFilteredResults = () => {
    if (!searchQuery.trim()) return [];
    return searchIngredients(searchQuery);
  };

  const searchResults = getFilteredResults();

  return (
    <GradientBackground>
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          className="flex-1"
          style={{ paddingTop: insets.top + 20 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          keyboardShouldPersistTaps="handled"
        >
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-center gap-3 mb-6">
            <BackButton 
              onPress={handleFinishSelection}
              variant={selectedIngredients.length > 0 ? 'save' : 'default'}
              showSaveText={selectedIngredients.length > 0}
            />
            <View className="flex-1">
              <ScreenTitle title="Add Ingredients" variant="main" />
              <Text className="text-g3 dark:text-n1">
                Search and select ingredients for your cocktail
              </Text>
            </View>
          </View>

          {/* Search Bar */}
          <View className="mb-6">
            <SearchBar
              placeholder="Search ingredients..."
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

          {/* Selected Ingredients Queue */}
          <Card className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <ScreenTitle
                title={`Selected (${selectedIngredients.length})`}
                variant="section"
              />
              {selectedIngredients.length > 0 && (
                <Pressable
                  onPress={() => setSelectedIngredients([])}
                  className="bg-e3/20 px-3 py-1 rounded-lg"
                >
                  <Text className="text-e3 font-medium text-sm">Clear All</Text>
                </Pressable>
              )}
            </View>
            {selectedIngredients.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {selectedIngredients.map((ingredient) => (
                  <View
                    key={ingredient.id}
                    className="bg-p3/50 dark:bg-p4/50 px-3 py-2 rounded-full flex-row items-center gap-2"
                  >
                    <Text 
                      className="text-n1 text-sm font-medium"
                      numberOfLines={1}
                    >
                      {ingredient.name}
                    </Text>
                    <Pressable
                      onPress={() => handleRemoveFromQueue(ingredient.id)}
                      className="bg-g3 rounded-full w-5 h-5 items-center justify-center"
                    >
                      <Ionicons name="close" size={12} color="white" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-g3 dark:text-g2 text-sm text-center py-4">
                No ingredients selected yet
              </Text>
            )}
          </Card>

          {/* Search Instructions */}
          {!hasSearched && (
            <Card className="mb-6">
              <View className="py-8 items-center">
                <Ionicons name="flask" size={48} color="#3B82F6" />
                <Text
                  className="text-g4 dark:text-n1 text-center mt-3"
                  style={{ fontWeight: '500' }}
                >
                  Search for an ingredient
                </Text>
                <Text
                  className="text-sm text-g3 dark:text-n1 text-center mt-1"
                >
                  Type the name or category of the ingredient you want to add
                </Text>
              </View>
            </Card>
          )}

          {/* Search Results */}
          {hasSearched && (
            <Card className="mb-6">
              <ScreenTitle
                title={`Search Results (${searchResults.length})`}
                variant="section"
                className="mb-3"
              />

              {searchResults.length === 0 ? (
                <View className="py-8 items-center">
                  <Ionicons name="search" size={48} color="#9CA3AF" />
                  <Text
                    className="text-g3 dark:text-n1 text-center mt-3"
                    style={{ fontWeight: '500' }}
                  >
                    No ingredients found
                  </Text>
                  <Text
                    className="text-sm text-g3 dark:text-n1 text-center mt-1"
                  >
                    Try a different search term
                  </Text>
                </View>
              ) : (
                <View className="flex flex-col gap-2">
                  {searchResults.map((ingredient) => {
                    const isSelected = selectedIngredients.find(item => item.id === ingredient.id);
                    return (
                      <View
                        key={ingredient.id}
                        className="flex-row items-center justify-between p-4 bg-n1/50 dark:bg-p3/50 rounded-lg"
                      >
                        <View className="flex-row items-center gap-3 flex-1">
                          <Ionicons
                            name="flask"
                            size={24}
                            color="#3B82F6"
                          />
                          <View className="flex-1">
                            <Text
                              className="text-g4 dark:text-n1"
                              style={{ fontWeight: '500' }}
                            >
                              {ingredient.name}
                            </Text>
                            <Text className="text-sm text-g3 dark:text-g2">
                              {ingredient.type} • ${calculateCostPerOz(ingredient.bottleSize, ingredient.bottlePrice).toFixed(2)}/oz
                            </Text>
                          </View>
                        </View>
                        <Pressable
                          onPress={() => isSelected ? handleRemoveFromQueue(ingredient.id) : handleSelectIngredient(ingredient)}
                          className="items-center justify-center"
                        >
                          <Ionicons
                            name={isSelected ? "checkmark-circle" : "add-circle"}
                            size={28}
                            color={isSelected ? "#6B7280" : "#10B981"}
                          />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>
          )}
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
            <Ionicons name="chevron-down" size={24} color="white" />
          </Pressable>
        )}
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}