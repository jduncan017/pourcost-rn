import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useAppStore } from '@/src/stores/app-store';
import CocktailListItem from '@/src/components/CocktailListItem';
import SearchBar from '@/src/components/ui/SearchBar';
import EmptyState from '@/src/components/EmptyState';
import CocktailDetailModal from '@/src/components/modals/CocktailDetailModal';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Enhanced cocktail interface
interface CocktailIngredient {
  id: string;
  name: string;
  amount: number; // oz
  cost: number; // cost for this amount
  type: 'Beer' | 'Wine' | 'Spirit' | 'Liquor' | 'Prepared' | 'Garnish';
}

interface Cocktail {
  id: string;
  name: string;
  description?: string;
  category:
    | 'Classic'
    | 'Modern'
    | 'Tropical'
    | 'Whiskey'
    | 'Vodka'
    | 'Rum'
    | 'Gin'
    | 'Tequila'
    | 'Other';
  ingredients: CocktailIngredient[];
  totalCost: number;
  suggestedPrice: number;
  pourCostPercentage: number;
  profitMargin: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime: number; // minutes
  notes?: string;
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
}

/**
 * Cocktails management screen
 * Lists, searches, and manages saved cocktail recipes
 * Includes filtering, categorization, and detailed cocktail management
 */
export default function CocktailsScreen() {
  const { baseCurrency } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<
    'name' | 'cost' | 'created' | 'profitMargin' | 'margin'
  >('created');
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const router = useRouter();

  // Category options
  const categories = [
    'All',
    'Classic',
    'Modern',
    'Tropical',
    'Whiskey',
    'Vodka',
    'Rum',
    'Gin',
    'Tequila',
    'Other',
  ];

  // Enhanced mock cocktails with comprehensive data
  const mockCocktails: Cocktail[] = [
    {
      id: '1',
      name: 'Classic Margarita',
      description: 'The perfect balance of tequila, lime, and orange liqueur',
      category: 'Tequila',
      ingredients: [
        {
          id: '1',
          name: 'Tequila Blanco',
          amount: 2.0,
          cost: 1.6,
          type: 'Spirit',
        },
        {
          id: '2',
          name: 'Fresh Lime Juice',
          amount: 1.0,
          cost: 0.15,
          type: 'Prepared',
        },
        { id: '3', name: 'Triple Sec', amount: 1.0, cost: 0.7, type: 'Liquor' },
      ],
      totalCost: 2.45,
      suggestedPrice: 12.0,
      pourCostPercentage: 20.4,
      profitMargin: 9.55,
      difficulty: 'Easy',
      prepTime: 2,
      notes: 'Serve in salt-rimmed glass with lime wheel',
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-15T10:30:00Z',
      favorited: true,
    },
    {
      id: '2',
      name: 'Old Fashioned',
      description: 'Classic whiskey cocktail with muddled sugar and bitters',
      category: 'Whiskey',
      ingredients: [
        {
          id: '4',
          name: 'Bourbon Whiskey',
          amount: 2.0,
          cost: 2.4,
          type: 'Spirit',
        },
        {
          id: '5',
          name: 'Simple Syrup',
          amount: 0.25,
          cost: 0.05,
          type: 'Prepared',
        },
        {
          id: '6',
          name: 'Angostura Bitters',
          amount: 0.125,
          cost: 0.15,
          type: 'Garnish',
        },
        { id: '7', name: 'Orange Peel', amount: 1, cost: 0.6, type: 'Garnish' },
      ],
      totalCost: 3.2,
      suggestedPrice: 14.0,
      pourCostPercentage: 22.9,
      profitMargin: 10.8,
      difficulty: 'Medium',
      prepTime: 3,
      notes: 'Express orange oils over drink, garnish with peel',
      createdAt: '2025-01-14T16:45:00Z',
      updatedAt: '2025-01-14T16:45:00Z',
      favorited: false,
    },
    {
      id: '3',
      name: 'Mojito',
      description: 'Refreshing Cuban cocktail with mint, lime, and rum',
      category: 'Rum',
      ingredients: [
        { id: '8', name: 'White Rum', amount: 2.0, cost: 1.2, type: 'Spirit' },
        { id: '9', name: 'Fresh Mint', amount: 0.5, cost: 0.25, type: 'Garnish' },
        { id: '10', name: 'Lime Juice', amount: 0.5, cost: 0.1, type: 'Prepared' },
        {
          id: '11',
          name: 'Simple Syrup',
          amount: 0.25,
          cost: 0.05,
          type: 'Prepared',
        },
        {
          id: '12',
          name: 'Soda Water',
          amount: 4.0,
          cost: 0.25,
          type: 'Liquor',
        },
      ],
      totalCost: 1.85,
      suggestedPrice: 10.0,
      pourCostPercentage: 18.5,
      profitMargin: 8.15,
      difficulty: 'Easy',
      prepTime: 3,
      notes: 'Muddle mint gently, top with soda water',
      createdAt: '2025-01-13T14:20:00Z',
      updatedAt: '2025-01-13T14:20:00Z',
      favorited: true,
    },
    {
      id: '4',
      name: 'Espresso Martini',
      description: 'Modern coffee cocktail with vodka and coffee liqueur',
      category: 'Modern',
      ingredients: [
        { id: '13', name: 'Vodka', amount: 2.0, cost: 1.96, type: 'Spirit' },
        {
          id: '14',
          name: 'Coffee Liqueur',
          amount: 1.0,
          cost: 0.9,
          type: 'Liquor',
        },
        {
          id: '15',
          name: 'Fresh Espresso',
          amount: 1.0,
          cost: 0.35,
          type: 'Garnish',
        },
      ],
      totalCost: 3.21,
      suggestedPrice: 15.0,
      pourCostPercentage: 21.4,
      profitMargin: 11.79,
      difficulty: 'Medium',
      prepTime: 4,
      notes: 'Shake vigorously for proper foam, garnish with coffee beans',
      createdAt: '2025-01-12T19:30:00Z',
      updatedAt: '2025-01-12T19:30:00Z',
      favorited: false,
    },
    {
      id: '5',
      name: 'Pina Colada',
      description: 'Tropical rum cocktail with coconut and pineapple',
      category: 'Tropical',
      ingredients: [
        { id: '16', name: 'White Rum', amount: 1.5, cost: 0.9, type: 'Spirit' },
        {
          id: '17',
          name: 'Coconut Rum',
          amount: 0.5,
          cost: 0.45,
          type: 'Spirit',
        },
        {
          id: '18',
          name: 'Coconut Cream',
          amount: 1.0,
          cost: 0.4,
          type: 'Liquor',
        },
        {
          id: '19',
          name: 'Pineapple Juice',
          amount: 3.0,
          cost: 0.45,
          type: 'Prepared',
        },
      ],
      totalCost: 2.2,
      suggestedPrice: 11.0,
      pourCostPercentage: 20.0,
      profitMargin: 8.8,
      difficulty: 'Easy',
      prepTime: 2,
      notes: 'Blend with ice, garnish with pineapple and cherry',
      createdAt: '2025-01-11T12:15:00Z',
      updatedAt: '2025-01-11T12:15:00Z',
      favorited: true,
    },
  ];

  // Filter and sort cocktails
  const filteredCocktails = mockCocktails
    .filter((cocktail) => {
      const matchesSearch =
        cocktail.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cocktail.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        cocktail.ingredients.some((ing) =>
          ing.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesCategory =
        selectedCategory === 'All' || cocktail.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'cost':
          return a.totalCost - b.totalCost;
        case 'profitMargin':
        case 'margin':
          return b.profitMargin - a.profitMargin;
        case 'created':
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

  // Handle cocktail selection
  const handleCocktailPress = (cocktail: Cocktail) => {
    setSelectedCocktail(cocktail);
    setShowDetailModal(true);
  };

  // Handle add new cocktail
  const handleAddCocktail = () => {
    router.push('/cocktail-form');
  };

  // Handle cocktail editing
  const handleEditCocktail = (cocktail: Cocktail) => {
    router.push({
      pathname: '/cocktail-form',
      params: {
        id: cocktail.id,
        name: cocktail.name,
        description: cocktail.description,
        category: cocktail.category,
        difficulty: cocktail.difficulty,
        prepTime: cocktail.prepTime.toString(),
        notes: cocktail.notes,
        createdAt: cocktail.createdAt,
        favorited: cocktail.favorited.toString(),
      },
    });
  };

  // Handle cocktail deletion
  const handleDeleteCocktail = (cocktail: Cocktail) => {
    Alert.alert(
      'Delete Cocktail',
      `Are you sure you want to delete "${cocktail.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Deleted', `"${cocktail.name}" has been deleted.`);
          },
        },
      ]
    );
  };

  // Handle favorite toggle
  const handleToggleFavorite = (cocktail: Cocktail) => {
    Alert.alert(
      'Favorite',
      `"${cocktail.name}" ${cocktail.favorited ? 'removed from' : 'added to'} favorites`
    );
  };

  // Get pour cost color
  const getPourCostColor = (pourCost: number) => {
    if (pourCost <= 20) return 'text-green-600';
    if (pourCost <= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'Hard':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-2xl font-bold text-gray-800">Cocktails</Text>
            <Pressable
              onPress={handleAddCocktail}
              className="bg-primary-500 rounded-lg p-3 flex-row items-center gap-2"
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-medium">Create</Text>
            </Pressable>
          </View>
          <Text className="text-gray-600">
            Manage your cocktail recipes and cost calculations
          </Text>
        </View>

        {/* Search Bar */}
        <View className="mb-4">
          <SearchBar
            placeholder="Search cocktails, ingredients, or descriptions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filters */}
        <View className="mb-6">
          {/* Category Filter */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <View className="flex-row" style={{gap: 8}}>
                {categories.map((category) => (
                  <Pressable
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                    className={`px-3 py-2 rounded-full border ${
                      selectedCategory === category
                        ? 'bg-primary-500 border-primary-500'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selectedCategory === category
                          ? 'text-white'
                          : 'text-gray-700'
                      }`}
                    >
                      {category}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Sort Options */}
          <View className="flex-row items-center">
            <Text className="text-sm font-medium text-gray-700 mr-3">Sort by:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <View className="flex-row" style={{gap: 8}}>
                {[
                  { key: 'created', label: 'Recently Added' },
                  { key: 'name', label: 'Name' },
                  { key: 'cost', label: 'Cost' },
                  { key: 'profitMargin', label: 'Profit' },
                  { key: 'margin', label: 'Margin' },
                ].map((sort) => (
                  <Pressable
                    key={sort.key}
                    onPress={() => setSortBy(sort.key as any)}
                    className={`px-2 py-1 rounded border ${
                      sortBy === sort.key
                        ? 'bg-gray-800 border-gray-800'
                        : 'bg-gray-100 border-gray-300'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        sortBy === sort.key ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {sort.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Cocktails List */}
        <View className="space-y-3">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-700">
              Your Cocktails ({filteredCocktails.length})
            </Text>
            {searchQuery && (
              <Pressable onPress={() => setSearchQuery('')} className="p-1">
                <Text className="text-primary-500 text-sm font-medium">
                  Clear
                </Text>
              </Pressable>
            )}
          </View>

          {filteredCocktails.length === 0 ? (
            <EmptyState
              icon="wine"
              title={
                searchQuery || selectedCategory !== 'All'
                  ? 'No cocktails found'
                  : 'No cocktails yet'
              }
              description={
                searchQuery
                  ? `No cocktails match "${searchQuery}"${selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}`
                  : selectedCategory !== 'All'
                    ? `No cocktails in ${selectedCategory} category`
                    : 'Create your first cocktail recipe to get started'
              }
              actionLabel="Create Cocktail"
              onAction={handleAddCocktail}
            />
          ) : (
            filteredCocktails.map((cocktail) => (
              <CocktailListItem
                key={cocktail.id}
                name={cocktail.name}
                ingredients={cocktail.ingredients.map((ing) => ({
                  name: ing.name,
                  amount: ing.amount,
                  cost: ing.cost,
                }))}
                totalCost={cocktail.totalCost}
                suggestedPrice={cocktail.suggestedPrice}
                profitMargin={cocktail.profitMargin}
                currency={baseCurrency}
                sortBy={sortBy}
                onPress={() => handleCocktailPress(cocktail)}
                onEdit={() => handleEditCocktail(cocktail)}
                onDelete={() => handleDeleteCocktail(cocktail)}
              />
            ))
          )}
        </View>

        {/* Cocktail Detail Modal */}
        <CocktailDetailModal
          visible={showDetailModal}
          cocktail={selectedCocktail}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCocktail(null);
          }}
          onEdit={handleEditCocktail}
          onDelete={handleDeleteCocktail}
          onToggleFavorite={handleToggleFavorite}
          baseCurrency={baseCurrency}
        />
      </View>
    </ScrollView>
  );
}
