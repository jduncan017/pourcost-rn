import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAppStore } from '@/src/stores/app-store';
import CocktailListItem from '@/src/components/CocktailListItem';
import SearchBar from '@/src/components/SearchBar';

/**
 * Cocktails management screen
 * Lists, searches, and manages saved cocktail recipes
 */
export default function CocktailsScreen() {
  const { baseCurrency } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  const mockCocktails = [
    {
      id: '1',
      name: 'Classic Margarita',
      ingredients: [
        { name: 'Tequila', amount: 2.0, cost: 1.60 },
        { name: 'Lime juice', amount: 1.0, cost: 0.15 },
        { name: 'Triple sec', amount: 1.0, cost: 0.70 },
      ],
      totalCost: 2.45,
      suggestedPrice: 12.00,
      profitMargin: 390,
    },
    {
      id: '2',
      name: 'Old Fashioned',
      ingredients: [
        { name: 'Whiskey', amount: 2.0, cost: 2.40 },
        { name: 'Sugar', amount: 0.25, cost: 0.05 },
        { name: 'Bitters', amount: 0.125, cost: 0.15 },
        { name: 'Orange peel', amount: 1, cost: 0.60 },
      ],
      totalCost: 3.20,
      suggestedPrice: 14.00,
      profitMargin: 338,
    },
    {
      id: '3',
      name: 'Mojito',
      ingredients: [
        { name: 'White rum', amount: 2.0, cost: 1.20 },
        { name: 'Mint', amount: 0.5, cost: 0.25 },
        { name: 'Lime', amount: 0.5, cost: 0.10 },
        { name: 'Sugar', amount: 0.25, cost: 0.05 },
        { name: 'Soda water', amount: 4.0, cost: 0.25 },
      ],
      totalCost: 1.85,
      suggestedPrice: 10.00,
      profitMargin: 441,
    },
  ];

  const filteredCocktails = mockCocktails.filter(cocktail =>
    cocktail.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Saved Cocktails
          </Text>
          <Text className="text-gray-600">
            Manage your cocktail recipes
          </Text>
        </View>

        {/* Search Bar */}
        <View className="mb-6">
          <SearchBar
            placeholder="Search cocktails..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Cocktails List */}
        <View className="space-y-3">
          <Text className="text-lg font-semibold text-gray-700 mb-3">
            Your Cocktails ({filteredCocktails.length})
          </Text>
          {filteredCocktails.map((cocktail) => (
            <CocktailListItem
              key={cocktail.id}
              name={cocktail.name}
              ingredients={cocktail.ingredients}
              totalCost={cocktail.totalCost}
              suggestedPrice={cocktail.suggestedPrice}
              profitMargin={cocktail.profitMargin}
              currency={baseCurrency}
              onPress={() => console.log('Pressed cocktail:', cocktail.name)}
              onEdit={() => console.log('Edit cocktail:', cocktail.name)}
              onDelete={() => console.log('Delete cocktail:', cocktail.name)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}