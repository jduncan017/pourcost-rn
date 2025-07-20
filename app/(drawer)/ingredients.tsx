import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useAppStore } from '@/src/stores/app-store';
import IngredientListItem from '@/src/components/IngredientListItem';
import SearchBar from '@/src/components/ui/SearchBar';
import EmptyState from '@/src/components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Enhanced ingredient interface with all required fields
interface Ingredient {
  id: string;
  name: string;
  bottleSize: number; // ml
  type: 'Beer' | 'Wine' | 'Spirit' | 'Liquor' | 'Prepared' | 'Garnish';
  price: number; // bottle price
  costPerOz: number;
  retailPrice: number; // price for 1.5oz serving
  pourCost: number; // percentage
  suggestedRetail: number;
  pourCostMargin: number; // profit margin
  createdAt: string;
  updatedAt: string;
}

/**
 * Ingredients management screen
 * Lists, searches, and manages saved ingredients
 * Includes add functionality and navigation to detail views
 */
export default function IngredientsScreen() {
  const { measurementSystem, baseCurrency } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Mock ingredients with enhanced data structure
  const mockIngredients: Ingredient[] = [
    {
      id: '1',
      name: 'Vodka (Premium)',
      bottleSize: 750,
      type: 'Spirit',
      price: 24.99,
      costPerOz: 0.98,
      retailPrice: 8.00,
      pourCost: 18.3, // (0.98 * 1.5) / 8.00 * 100
      suggestedRetail: 7.35, // based on 20% target pour cost
      pourCostMargin: 6.53, // 8.00 - (0.98 * 1.5)
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-15T10:30:00Z',
    },
    {
      id: '2',
      name: 'Simple Syrup',
      bottleSize: 473,
      type: 'Prepared',
      price: 3.99,
      costPerOz: 0.26,
      retailPrice: 2.00,
      pourCost: 19.5, // (0.26 * 1.5) / 2.00 * 100
      suggestedRetail: 1.95, // based on 20% target pour cost
      pourCostMargin: 1.61, // 2.00 - (0.26 * 1.5)
      createdAt: '2025-01-14T14:20:00Z',
      updatedAt: '2025-01-14T14:20:00Z',
    },
    {
      id: '3',
      name: 'Fresh Lime Juice',
      bottleSize: 946,
      type: 'Prepared',
      price: 4.50,
      costPerOz: 0.15,
      retailPrice: 1.50,
      pourCost: 15.0, // (0.15 * 1.5) / 1.50 * 100
      suggestedRetail: 1.13, // based on 20% target pour cost
      pourCostMargin: 1.28, // 1.50 - (0.15 * 1.5)
      createdAt: '2025-01-13T09:15:00Z',
      updatedAt: '2025-01-13T09:15:00Z',
    },
    {
      id: '4',
      name: 'Craft Beer IPA',
      bottleSize: 355,
      type: 'Beer',
      price: 2.50,
      costPerOz: 0.21,
      retailPrice: 6.00,
      pourCost: 5.3, // (0.21 * 1.5) / 6.00 * 100
      suggestedRetail: 1.58, // based on 20% target pour cost
      pourCostMargin: 5.68, // 6.00 - (0.21 * 1.5)
      createdAt: '2025-01-12T16:45:00Z',
      updatedAt: '2025-01-12T16:45:00Z',
    },
    {
      id: '5',
      name: 'House Red Wine',
      bottleSize: 750,
      type: 'Wine',
      price: 18.00,
      costPerOz: 0.72,
      retailPrice: 9.00,
      pourCost: 12.0, // (0.72 * 1.5) / 9.00 * 100
      suggestedRetail: 5.40, // based on 20% target pour cost
      pourCostMargin: 7.92, // 9.00 - (0.72 * 1.5)
      createdAt: '2025-01-11T11:30:00Z',
      updatedAt: '2025-01-11T11:30:00Z',
    },
  ];

  // Additional filter states
  const [selectedType, setSelectedType] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'cost' | 'created' | 'pourCost' | 'margin'>('name');
  
  // Type options
  const types = ['All', 'Beer', 'Wine', 'Spirit', 'Liquor', 'Prepared', 'Garnish'];
  
  // Filter and sort ingredients
  const filteredIngredients = mockIngredients
    .filter(ingredient => {
      const matchesSearch = ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           ingredient.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'All' || ingredient.type === selectedType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'cost':
          return a.costPerOz - b.costPerOz;
        case 'pourCost':
          return a.pourCost - b.pourCost;
        case 'margin':
          return b.pourCostMargin - a.pourCostMargin;
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  
  // Handle ingredient selection
  const handleIngredientPress = (ingredient: Ingredient) => {
    router.push({
      pathname: '/ingredient-detail',
      params: { id: ingredient.id }
    });
  };
  
  // Handle add new ingredient
  const handleAddIngredient = () => {
    router.push('/ingredient-form');
  };
  
  // Handle ingredient editing
  const handleEditIngredient = (ingredient: Ingredient) => {
    router.push({
      pathname: '/ingredient-form',
      params: {
        id: ingredient.id,
        name: ingredient.name,
        type: ingredient.type,
        bottleSize: ingredient.bottleSize.toString(),
        bottlePrice: ingredient.price.toString(),
        retailPrice: ingredient.retailPrice.toString(),
        createdAt: ingredient.createdAt,
      },
    });
  };
  
  // Handle ingredient deletion
  const handleDeleteIngredient = (ingredient: Ingredient) => {
    Alert.alert(
      'Delete Ingredient',
      `Are you sure you want to delete "${ingredient.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Deleted', `"${ingredient.name}" has been deleted.`);
          },
        },
      ]
    );
  };
  
  // Get pour cost color based on percentage
  const getPourCostColor = (pourCost: number) => {
    if (pourCost <= 15) return 'text-green-600';
    if (pourCost <= 25) return 'text-yellow-600';
    return 'text-red-600';
  };
  return (
    <ScrollView className="flex-1 bg-n1">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-2xl font-bold text-g4">
              Ingredients
            </Text>
            <Pressable
              onPress={handleAddIngredient}
              className="bg-p1 rounded-lg p-3 flex-row items-center gap-2"
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-medium">Add</Text>
            </Pressable>
          </View>
          <Text className="text-g3">
            Manage your ingredient library and cost calculations
          </Text>
        </View>

        {/* Search Bar */}
        <View className="mb-4">
          <SearchBar
            placeholder="Search by name or type..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {/* Filters */}
        <View className="mb-6">
          {/* Type Filter */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-g4 mb-3">Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row" style={{gap: 8}}>
                {types.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setSelectedType(type)}
                    className={`px-3 py-2 rounded-full border ${
                      selectedType === type
                        ? 'bg-p1 border-primary-500'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${
                      selectedType === type ? 'text-white' : 'text-g4'
                    }`}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
          
          {/* Sort Options */}
          <View className="flex-row items-center">
            <Text className="text-sm font-medium text-g4 mr-3">Sort by:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row" style={{gap: 8}}>
                {[{key: 'name', label: 'Name'}, {key: 'created', label: 'Recently Added'}, {key: 'cost', label: 'Cost/Oz'}, {key: 'pourCost', label: 'Pour Cost'}, {key: 'margin', label: 'Margin'}].map((sort) => (
                  <Pressable
                    key={sort.key}
                    onPress={() => setSortBy(sort.key as any)}
                    className={`px-2 py-1 rounded border ${
                      sortBy === sort.key
                        ? 'bg-gray-800 border-gray-800'
                        : 'bg-gray-100 border-gray-300'
                    }`}
                  >
                    <Text className={`text-xs font-medium ${
                      sortBy === sort.key ? 'text-white' : 'text-g3'
                    }`}>
                      {sort.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Ingredients List */}
        <View className="space-y-3">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-g4">
              Your Ingredients ({filteredIngredients.length})
            </Text>
            {searchQuery && (
              <Pressable
                onPress={() => setSearchQuery('')}
                className="p-1"
              >
                <Text className="text-primary-500 text-sm font-medium">Clear</Text>
              </Pressable>
            )}
          </View>
          
          {filteredIngredients.length === 0 ? (
            <EmptyState
              icon="flask"
              title={searchQuery || selectedType !== 'All' ? 'No ingredients found' : 'No ingredients yet'}
              description={
                searchQuery 
                  ? `No ingredients match "${searchQuery}"${selectedType !== 'All' ? ` in ${selectedType}` : ''}`
                  : selectedType !== 'All'
                  ? `No ingredients in ${selectedType} category`
                  : 'Add your first ingredient to get started'
              }
              actionLabel="Add Ingredient"
              onAction={handleAddIngredient}
            />
          ) : (
            filteredIngredients.map((ingredient) => (
              <IngredientListItem
                key={ingredient.id}
                name={ingredient.name}
                bottleSize={ingredient.bottleSize}
                bottlePrice={ingredient.price}
                pourSize={1.5}
                costPerPour={ingredient.costPerOz * 1.5}
                costPerOz={ingredient.costPerOz}
                pourCostMargin={ingredient.pourCostMargin}
                pourCostPercentage={ingredient.pourCost}
                currency={baseCurrency}
                measurementSystem={measurementSystem}
                sortBy={sortBy}
                onPress={() => handleIngredientPress(ingredient)}
                onEdit={() => handleEditIngredient(ingredient)}
                onDelete={() => handleDeleteIngredient(ingredient)}
              />
            ))
          )}
        </View>
        
      </View>
    </ScrollView>
  );
}