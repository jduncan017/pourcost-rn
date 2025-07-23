import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput as RNTextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './ui/Card';
import { SavedIngredient, CocktailIngredient } from '@/src/types/models';
import { searchIngredients, createCocktailIngredient, calculateCostPerOz } from '@/src/services/mock-data';

interface IngredientSearchBarProps {
  onAddIngredient: (ingredient: CocktailIngredient) => void;
  placeholder?: string;
}

export default function IngredientSearchBar({
  onAddIngredient,
  placeholder = 'Search ingredients...',
}: IngredientSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter ingredients based on search
  const filteredIngredients = useMemo(() => {
    return searchIngredients(searchQuery);
  }, [searchQuery]);

  const handleSelectIngredient = (ingredient: SavedIngredient) => {
    // Create cocktail ingredient using service function
    const cocktailIngredient = createCocktailIngredient(ingredient, 1.5, 'oz');
    onAddIngredient(cocktailIngredient);

    // Clear search
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setShowDropdown(text.length > 0);
  };

  return (
    <View className="relative">
      {/* Search Input */}
      <View className="relative">
        <RNTextInput
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          className="bg-n1/80 dark:bg-p3/80 border border-g2/50 dark:border-p2/50 rounded-lg px-4 py-3 pr-10 text-g4 dark:text-n1"
          style={{}}
          onFocus={() => setShowDropdown(searchQuery.length > 0)}
          onBlur={() => {
            // Delay hiding to allow for selection
            setTimeout(() => setShowDropdown(false), 200);
          }}
        />

        {/* Search Icon */}
        <View className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Ionicons name="search" size={20} color="#9CA3AF" />
        </View>
      </View>

      {/* Dropdown Results */}
      {showDropdown && filteredIngredients.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 bg-n1 dark:bg-p2">
          <FlatList
            data={filteredIngredients}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => handleSelectIngredient(item)}
                className={`p-3 ${
                  index < filteredIngredients.length - 1
                    ? 'border-b border-g2/30 dark:border-p2/30'
                    : ''
                }`}
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text
                      className="text-g4 dark:text-n1"
                      style={{ fontWeight: '500' }}
                    >
                      {item.name}
                    </Text>
                    <Text
                      className="text-sm text-g3 dark:text-n1"
                      style={{}}
                    >
                      {item.type} • {item.bottleSize}ml
                    </Text>
                  </View>
                  <Text
                    className="text-g4 dark:text-n1"
                    style={{ fontWeight: '500' }}
                  >
                    ${calculateCostPerOz(item.bottleSize, item.bottlePrice).toFixed(2)}/oz
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </Card>
      )}

      {/* No Results */}
      {showDropdown &&
        searchQuery.length > 0 &&
        filteredIngredients.length === 0 && (
          <Card className="absolute top-full left-0 right-0 mt-1 z-50 bg-n1 dark:bg-p3">
            <View className="p-4 items-center">
              <Ionicons name="search" size={32} color="#9CA3AF" />
              <Text
                className="text-g3 dark:text-n1 text-center mt-2"
                style={{}}
              >
                No ingredients found
              </Text>
              <Text
                className="text-sm text-g3 dark:text-n1 text-center mt-1"
                style={{}}
              >
                Try a different search term
              </Text>
            </View>
          </Card>
        )}
    </View>
  );
}
