import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAppStore } from '@/src/stores/app-store';
import IngredientListItem from '@/src/components/IngredientListItem';
import SearchBar from '@/src/components/SearchBar';

/**
 * Ingredients management screen
 * Lists, searches, and manages saved ingredients
 */
export default function IngredientsScreen() {
  const { measurementSystem, baseCurrency } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  const mockIngredients = [
    {
      id: '1',
      name: 'Vodka (Premium)',
      bottleSize: 750,
      bottlePrice: 24.99,
      pourSize: 1.5,
      costPerPour: 1.99,
    },
    {
      id: '2', 
      name: 'Simple Syrup',
      bottleSize: 473,
      bottlePrice: 3.99,
      pourSize: 0.5,
      costPerPour: 0.12,
    },
    {
      id: '3',
      name: 'Fresh Lime Juice', 
      bottleSize: 946,
      bottlePrice: 4.50,
      pourSize: 0.75,
      costPerPour: 0.11,
    },
  ];

  const filteredIngredients = mockIngredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Saved Ingredients
          </Text>
          <Text className="text-gray-600">
            Manage your ingredient library
          </Text>
        </View>

        {/* Search Bar */}
        <View className="mb-6">
          <SearchBar
            placeholder="Search ingredients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Ingredients List */}
        <View className="space-y-3">
          <Text className="text-lg font-semibold text-gray-700 mb-3">
            Your Ingredients ({filteredIngredients.length})
          </Text>
          {filteredIngredients.map((ingredient) => (
            <IngredientListItem
              key={ingredient.id}
              name={ingredient.name}
              bottleSize={ingredient.bottleSize}
              bottlePrice={ingredient.bottlePrice}
              pourSize={ingredient.pourSize}
              costPerPour={ingredient.costPerPour}
              currency={baseCurrency}
              measurementSystem={measurementSystem}
              onPress={() => console.log('Pressed ingredient:', ingredient.name)}
              onEdit={() => console.log('Edit ingredient:', ingredient.name)}
              onDelete={() => console.log('Delete ingredient:', ingredient.name)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}