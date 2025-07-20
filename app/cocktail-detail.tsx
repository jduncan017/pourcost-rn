import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/src/stores/app-store';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/src/components/ui/Card';
import PourCostPerformanceBar from '@/src/components/PourCostPerformanceBar';
import { getCurrencySymbol } from '@/src/utils/currency';

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
}

/**
 * Cocktail detail screen
 * Shows comprehensive cocktail data with full-screen layout
 */
export default function CocktailDetailScreen() {
  const insets = useSafeAreaInsets();
  const { baseCurrency } = useAppStore();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Mock cocktail data (would be fetched by ID in real app)
  const cocktail: Cocktail = {
    id: params.id as string || '1',
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
  };

  // Get pour cost color
  const getPourCostColor = (pourCost: number) => {
    if (pourCost <= 20) return 'text-s22';
    if (pourCost <= 25) return 'text-s12';
    return 'text-e3';
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-s22';
      case 'Medium':
        return 'text-s12';
      case 'Hard':
        return 'text-e3';
      default:
        return 'text-g3';
    }
  };

  const handleEdit = () => {
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
      },
    });
  };

  const handleDelete = () => {
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
            router.back();
          },
        },
      ]
    );
  };


  const currencySymbol = getCurrencySymbol(baseCurrency);

  return (
    <ScrollView className="flex-1 bg-n1" style={{ paddingTop: insets.top }}>
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center gap-3 mb-4">
            <Pressable
              onPress={() => router.back()}
              className="p-2 bg-g1/60 rounded-lg"
            >
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-2xl text-g4" style={{fontFamily: 'Geist', fontWeight: '700'}}>
                {cocktail.name}
              </Text>
              <Text className="text-g3" style={{fontFamily: 'Geist'}}>{cocktail.description}</Text>
            </View>
          </View>
          
          <View className="flex-row items-center flex-wrap gap-4 mb-4">
            <Text className="text-sm text-g3" style={{fontFamily: 'Geist'}}>
              {cocktail.category} • {cocktail.ingredients.length} ingredients
            </Text>
            <Text
              className={`text-sm ${getDifficultyColor(cocktail.difficulty)}`}
              style={{fontFamily: 'Geist', fontWeight: '500'}}
            >
              {cocktail.difficulty}
            </Text>
            <Text className="text-sm text-g3" style={{fontFamily: 'Geist'}}>
              {cocktail.prepTime} min prep
            </Text>
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={handleEdit}
              className="bg-p2 rounded-lg p-3 flex-row items-center gap-2"
            >
              <Ionicons name="pencil" size={16} color="white" />
              <Text className="text-white" style={{fontFamily: 'Geist', fontWeight: '500'}}>Edit</Text>
            </Pressable>

            <Pressable
              onPress={handleDelete}
              className="bg-e2 rounded-lg p-3"
            >
              <Ionicons name="trash" size={16} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Ingredients */}
        <Card className="mb-4">
          <Text className="text-lg text-g4 mb-4" style={{fontFamily: 'Geist', fontWeight: '600'}}>
            Ingredients
          </Text>

          <View className="space-y-3">
            {cocktail.ingredients.map((ingredient) => (
              <View
                key={ingredient.id}
                className="flex-row items-center py-2 border-b border-g1/40 last:border-b-0"
              >
                <View className="flex-1 min-w-0 mr-4">
                  <Text className="text-g4" numberOfLines={1} style={{fontFamily: 'Geist', fontWeight: '500'}}>
                    {ingredient.name}
                  </Text>
                  <Text className="text-sm text-g3" style={{fontFamily: 'Geist'}}>
                    {ingredient.type}
                  </Text>
                </View>
                <View className="flex-shrink-0">
                  <Text className="text-g4 text-right" style={{fontFamily: 'Geist', fontWeight: '500'}}>
                    {ingredient.amount}oz
                  </Text>
                  <Text className="text-sm text-g3 text-right" style={{fontFamily: 'Geist'}}>
                    {currencySymbol}{ingredient.cost.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Cost Analysis */}
        <Card className="mb-4">
          <Text className="text-lg text-g4 mb-4" style={{fontFamily: 'Geist', fontWeight: '600'}}>
            Cost Analysis
          </Text>

          <View className="space-y-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-g3" style={{fontFamily: 'Geist'}}>Total Cost:</Text>
              <Text className="text-g4 text-lg" style={{fontFamily: 'Geist', fontWeight: '500'}}>
                {currencySymbol}{cocktail.totalCost.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-g3" style={{fontFamily: 'Geist'}}>Suggested Price:</Text>
              <Text className="text-p2 text-lg" style={{fontFamily: 'Geist', fontWeight: '600'}}>
                {currencySymbol}{cocktail.suggestedPrice.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-g3" style={{fontFamily: 'Geist'}}>Pour Cost:</Text>
              <Text
                className={`text-lg ${getPourCostColor(cocktail.pourCostPercentage)}`}
                style={{fontFamily: 'Geist', fontWeight: '500'}}
              >
                {cocktail.pourCostPercentage.toFixed(1)}%
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-g3" style={{fontFamily: 'Geist'}}>Profit Margin:</Text>
              <Text className="text-s22 text-lg" style={{fontFamily: 'Geist', fontWeight: '500'}}>
                {currencySymbol}{cocktail.profitMargin.toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Performance */}
        <Card className="mb-4">
          <Text className="text-lg text-g4 mb-4" style={{fontFamily: 'Geist', fontWeight: '600'}}>
            Performance Analysis
          </Text>

          <PourCostPerformanceBar 
            pourCostPercentage={cocktail.pourCostPercentage} 
            className="mb-4"
          />

          <View className="bg-p1/10 p-4 rounded-lg border border-p1/30">
            <Text className="text-sm text-p3 mb-2" style={{fontFamily: 'Geist', fontWeight: '500'}}>
              Profit Analysis
            </Text>
            <Text className="text-xs text-p2 leading-relaxed" style={{fontFamily: 'Geist'}}>
              This cocktail generates a profit of {currencySymbol}
              {cocktail.profitMargin.toFixed(2)} at the suggested price of {currencySymbol}
              {cocktail.suggestedPrice.toFixed(2)}. The pour cost of {cocktail.pourCostPercentage.toFixed(1)}% 
              {cocktail.pourCostPercentage <= 20 
                ? ' is excellent and within target range.' 
                : ' could be optimized by adjusting portion sizes or pricing.'
              }
            </Text>
          </View>
        </Card>

        {/* Recipe Notes */}
        {cocktail.notes && (
          <Card className="mb-4">
            <Text className="text-lg text-g4 mb-3" style={{fontFamily: 'Geist', fontWeight: '600'}}>
              Recipe Notes
            </Text>
            <Text className="text-g4 leading-relaxed" style={{fontFamily: 'Geist'}}>{cocktail.notes}</Text>
          </Card>
        )}


        {/* Metadata */}
        <Card>
          <Text className="text-center text-g3 text-sm" style={{fontFamily: 'Geist'}}>
            Created: {new Date(cocktail.createdAt).toLocaleDateString()} • 
            Last updated: {new Date(cocktail.updatedAt).toLocaleDateString()}
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
}