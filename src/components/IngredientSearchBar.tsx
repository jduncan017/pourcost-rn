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

// Mock saved ingredient interface (would come from store)
interface SavedIngredient {
  id: string;
  name: string;
  type: string;
  bottleSize: number;
  bottlePrice: number;
  costPerOz: number;
  createdAt: string;
}

interface CocktailIngredient {
  id: string;
  name: string;
  amount: number;
  unit: 'oz' | 'ml' | 'drops' | 'splash';
  bottleSize: number;
  bottlePrice: number;
  type: string;
  costPerOz: number;
  cost: number;
}

interface IngredientSearchBarProps {
  onAddIngredient: (ingredient: CocktailIngredient) => void;
  placeholder?: string;
}

// Mock saved ingredients (would come from ingredients store)
const MOCK_SAVED_INGREDIENTS: SavedIngredient[] = [
  {
    id: '1',
    name: 'Remy Martin V.S.O.P.',
    type: 'Cognac',
    bottleSize: 750,
    bottlePrice: 45.99,
    costPerOz: 1.81,
    createdAt: '2025-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Vodka (Premium)',
    type: 'Liquor',
    bottleSize: 750,
    bottlePrice: 24.99,
    costPerOz: 0.98,
    createdAt: '2025-01-15T10:30:00Z',
  },
  {
    id: '3',
    name: 'Simple Syrup',
    type: 'Syrup',
    bottleSize: 500,
    bottlePrice: 8.99,
    costPerOz: 0.53,
    createdAt: '2025-01-15T10:30:00Z',
  },
  {
    id: '4',
    name: 'Fresh Lime Juice',
    type: 'Mixer',
    bottleSize: 1000,
    bottlePrice: 4.99,
    costPerOz: 0.15,
    createdAt: '2025-01-15T10:30:00Z',
  },
  {
    id: '5',
    name: 'Triple Sec',
    type: 'Liquor',
    bottleSize: 750,
    bottlePrice: 18.99,
    costPerOz: 0.75,
    createdAt: '2025-01-15T10:30:00Z',
  },
  {
    id: '6',
    name: 'Tequila Blanco',
    type: 'Spirit',
    bottleSize: 750,
    bottlePrice: 35.99,
    costPerOz: 1.42,
    createdAt: '2025-01-15T10:30:00Z',
  },
  {
    id: '7',
    name: 'Gin (London Dry)',
    type: 'Spirit',
    bottleSize: 750,
    bottlePrice: 28.99,
    costPerOz: 1.14,
    createdAt: '2025-01-15T10:30:00Z',
  },
  {
    id: '8',
    name: 'Bourbon Whiskey',
    type: 'Whiskey',
    bottleSize: 750,
    bottlePrice: 42.99,
    costPerOz: 1.69,
    createdAt: '2025-01-15T10:30:00Z',
  },
];

export default function IngredientSearchBar({
  onAddIngredient,
  placeholder = 'Search ingredients...',
}: IngredientSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter ingredients based on search
  const filteredIngredients = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return MOCK_SAVED_INGREDIENTS.filter(
      (ingredient) =>
        ingredient.name.toLowerCase().includes(query) ||
        ingredient.type.toLowerCase().includes(query)
    ).slice(0, 5); // Show max 5 results
  }, [searchQuery]);

  const handleSelectIngredient = (ingredient: SavedIngredient) => {
    // Default to 1.5oz amount when adding from search
    const defaultAmount = 1.5;
    const cost = ingredient.costPerOz * defaultAmount;

    const cocktailIngredient: CocktailIngredient = {
      id: `${ingredient.id}-${Date.now()}`,
      name: ingredient.name,
      amount: defaultAmount,
      unit: 'oz',
      bottleSize: ingredient.bottleSize,
      bottlePrice: ingredient.bottlePrice,
      type: ingredient.type,
      costPerOz: ingredient.costPerOz,
      cost,
    };

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
                    ${item.costPerOz.toFixed(2)}/oz
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
