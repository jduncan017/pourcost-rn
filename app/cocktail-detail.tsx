import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/src/stores/app-store';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/src/components/ui/Card';
import PourCostPerformanceBar from '@/src/components/PourCostPerformanceBar';
import GradientBackground from '@/src/components/ui/GradientBackground';
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
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [showActions, setShowActions] = useState(false);

  // Mock cocktail data (would be fetched by ID in real app)
  const cocktail: Cocktail = {
    id: (params.id as string) || '1',
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

  const handleEdit = () => {
    router.push({
      pathname: '/cocktail-form',
      params: {
        id: cocktail.id,
        name: cocktail.name,
        description: cocktail.description,
        category: cocktail.category,
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
    <GradientBackground>
      {/* Fixed Header - Outside ScrollView */}
      <View
        className="flex-row items-center justify-between"
        style={{
          backgroundColor: colors.headerBackground,
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 16,
        }}
      >
        {/* Back Navigation */}
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-2 py-2"
        >
          <Ionicons name="chevron-back" size={20} color={colors.accent} />
          <Text
            className="text-base text-s11"
            style={{
              fontFamily: 'Geist',
              fontWeight: '500',
            }}
          >
            Cocktails
          </Text>
        </Pressable>

        {/* Page Title - Centered */}
        <View>
          <Text
            style={{
              fontFamily: 'Geist',
              fontWeight: '600',
              color: colors.text,
              fontSize: 18,
            }}
          >
            Recipe
          </Text>
        </View>

        {/* Action Menu */}
        <View style={{ position: 'relative' }}>
          <Pressable
            onPress={() => setShowActions(!showActions)}
            className="py-2 px-3"
          >
            <Text
              className="text-lg"
              style={{
                fontFamily: 'Geist',
                fontWeight: '600',
                color: colors.accent,
              }}
            >
              •••
            </Text>
          </Pressable>

          {/* Absolutely Positioned Dropdown */}
          {showActions && (
            <View
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                zIndex: 1000,
                minWidth: 120,
                backgroundColor: colors.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Pressable
                onPress={() => {
                  setShowActions(false);
                  handleEdit();
                }}
                className="p-3"
              >
                <Text
                  className="text-base"
                  style={{
                    fontFamily: 'Geist',
                    fontWeight: '500',
                    color: colors.text,
                  }}
                >
                  Edit
                </Text>
              </Pressable>

              <View
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                  marginHorizontal: 12,
                }}
              />

              <Pressable
                onPress={() => {
                  setShowActions(false);
                  handleDelete();
                }}
                className="p-3"
              >
                <Text
                  className="text-base"
                  style={{
                    fontFamily: 'Geist',
                    fontWeight: '500',
                    color: '#DC2626',
                  }}
                >
                  Delete
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Overlay to close dropdown when tapping outside */}
      {showActions && (
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onPress={() => setShowActions(false)}
        />
      )}

      {/* Scrollable Content */}
      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Cocktail Name and Description */}
          <View className="mb-6">
            <Text
              className="text-2xl text-g4 dark:text-n1 mb-2"
              style={{ fontFamily: 'Geist', fontWeight: '700' }}
            >
              {cocktail.name}
            </Text>
            <Text
              className="text-g3 dark:text-n1"
              style={{ fontFamily: 'Geist' }}
            >
              {cocktail.description}
            </Text>
          </View>

          {/* Ingredients */}
          <Card className="mb-4">
            <Text className="text-lg text-g4 dark:text-n1 mb-4 font-bold tracking-tight">
              Ingredients ({cocktail.ingredients.length})
            </Text>

            <View className="space-y-3">
              {cocktail.ingredients.map((ingredient) => (
                <View
                  key={ingredient.id}
                  className="flex-row items-center py-2 border-b border-g1/40 dark:border-p2/50 last:border-b-0"
                >
                  <View className="flex-1 min-w-0 mr-4">
                    <Text
                      className="text-g4 dark:text-n1 tracking-tight font-medium"
                      numberOfLines={1}
                    >
                      {ingredient.name}
                    </Text>
                    <Text className="text-sm text-g3 dark:text-n1 tracking-tight">
                      {ingredient.type}
                    </Text>
                  </View>
                  <View className="flex-shrink-0">
                    <Text className="text-g4 dark:text-n1 text-right tracking-tight">
                      {ingredient.amount}oz
                    </Text>
                    <Text className="text-sm text-g3 dark:text-n1 text-right tracking-tight">
                      {currencySymbol}
                      {ingredient.cost.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          {/* Cost Analysis */}
          <Card className="mb-4">
            <Text className="text-lg text-g4 dark:text-n1 mb-4 font-bold tracking-tight">
              Cost Analysis
            </Text>

            <View className="space-y-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-g3 dark:text-n1 tracking-tight">
                  Total Cost:
                </Text>
                <Text className="text-g4 dark:text-n1 text-lg tracking-tight">
                  {currencySymbol}
                  {cocktail.totalCost.toFixed(2)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-g3 dark:text-n1 tracking-tight">
                  Suggested Price:
                </Text>
                <Text className="text-p2 dark:text-n1 text-lg font-medium">
                  {currencySymbol}
                  {cocktail.suggestedPrice.toFixed(2)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-g3 dark:text-n1">Pour Cost:</Text>
                <Text
                  className={`text-lg ${getPourCostColor(cocktail.pourCostPercentage)}`}
                >
                  {cocktail.pourCostPercentage.toFixed(1)}%
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-g3 dark:text-n1">Profit Margin:</Text>
                <Text className="text-s22 text-lg">
                  {currencySymbol}
                  {cocktail.profitMargin.toFixed(2)}
                </Text>
              </View>
            </View>
          </Card>

          {/* Performance */}
          <Card className="mb-4">
            <Text className="text-lg text-g4 dark:text-n1 mb-4 font-medium">
              Performance Analysis
            </Text>

            <PourCostPerformanceBar
              pourCostPercentage={cocktail.pourCostPercentage}
              className="mb-4"
            />

            <View className="bg-p1/10 dark:bg-p2/20 p-4 rounded-lg border border-p1/30 dark:border-p1/40">
              <Text className="text-sm text-p3 dark:text-s11 mb-2 font-medium">
                Profit Analysis
              </Text>
              <Text
                className="text-xs text-p2 dark:text-g1 leading-relaxed"
                style={{ fontFamily: 'Geist' }}
              >
                This cocktail generates a profit of {currencySymbol}
                {cocktail.profitMargin.toFixed(2)} at the suggested price of{' '}
                {currencySymbol}
                {cocktail.suggestedPrice.toFixed(2)}. The pour cost of{' '}
                {cocktail.pourCostPercentage.toFixed(1)}%
                {cocktail.pourCostPercentage <= 20
                  ? ' is excellent and within target range.'
                  : ' could be optimized by adjusting portion sizes or pricing.'}
              </Text>
            </View>
          </Card>

          {/* Recipe Notes */}
          {cocktail.notes && (
            <Card className="mb-4">
              <Text
                className="text-lg text-g4 dark:text-n1 mb-3"
                style={{ fontFamily: 'Geist', fontWeight: '600' }}
              >
                Recipe Notes
              </Text>
              <Text
                className="text-g4 dark:text-n1 leading-relaxed"
                style={{ fontFamily: 'Geist' }}
              >
                {cocktail.notes}
              </Text>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <Text
              className="text-center text-g3 dark:text-n1 text-sm"
              style={{ fontFamily: 'Geist' }}
            >
              Created: {new Date(cocktail.createdAt).toLocaleDateString()} •
              Last updated: {new Date(cocktail.updatedAt).toLocaleDateString()}
            </Text>
          </Card>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
