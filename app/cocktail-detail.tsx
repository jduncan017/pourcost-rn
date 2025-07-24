import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/src/stores/app-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/src/components/ui/Card';
import PourCostPerformanceBar from '@/src/components/PourCostPerformanceBar';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { getCurrencySymbol } from '@/src/utils/currency';
import BackButton from '@/src/components/ui/BackButton';
import { FeedbackService } from '@/src/services/feedback-service';

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
  
  // Get cocktail store
  const { getCocktailById, loadCocktails, deleteCocktail } = useCocktailsStore();
  
  // Get cocktail ID from params
  const cocktailId = params.id as string;
  
  // Get cocktail from store
  const cocktail = getCocktailById(cocktailId);
  
  // Load cocktails if not already loaded
  useEffect(() => {
    if (!cocktail) {
      loadCocktails();
    }
  }, [cocktail, loadCocktails]);
  
  // Show loading if cocktail not found
  if (!cocktail) {
    return (
      <GradientBackground>
        <View style={{ paddingTop: insets.top }} className="flex-1 items-center justify-center">
          <Text className="text-n1 text-lg">Loading cocktail...</Text>
        </View>
      </GradientBackground>
    );
  }

  // Convert cocktail to the expected interface format
  const cocktailData: Cocktail = {
    id: cocktail.id,
    name: cocktail.name,
    description: cocktail.description,
    category: cocktail.category as any,
    ingredients: cocktail.ingredients.map(ing => ({
      id: ing.id,
      name: ing.name,
      amount: ing.amount,
      cost: ing.cost,
      type: ing.type as any,
    })),
    totalCost: cocktail.totalCost,
    suggestedPrice: cocktail.suggestedPrice,
    pourCostPercentage: cocktail.pourCostPercentage,
    profitMargin: cocktail.profitMargin,
    notes: cocktail.notes,
    createdAt: cocktail.createdAt instanceof Date ? cocktail.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: cocktail.updatedAt instanceof Date ? cocktail.updatedAt.toISOString() : new Date().toISOString(),
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
        name: cocktailData.name,
        description: cocktailData.description,
        category: cocktail.category,
        notes: cocktailData.notes,
        createdAt: cocktail.createdAt.toISOString(),
      },
    });
  };

  const handleDelete = () => {
    FeedbackService.showDeleteConfirmation(
      cocktailData.name,
      async () => {
        await deleteCocktail(cocktail.id);
        router.back();
      },
      'cocktail'
    );
  };

  const currencySymbol = getCurrencySymbol(baseCurrency);

  return (
    <GradientBackground>
      {/* Fixed Header - Outside ScrollView */}
      <View
        className="CocktailHeader flex-row items-center justify-between px-4 pb-4"
        style={{
          backgroundColor: colors.headerBackground,
          paddingTop: insets.top + 16,
        }}
      >
        {/* Back Navigation */}
        <Pressable
          onPress={() => router.back()}
          className="BackButton flex-row items-center gap-2 py-2"
        >
          <Ionicons name="chevron-back" size={20} color={colors.accent} />
          <Text className="BackText text-base font-medium text-p1 dark:text-s11">
            Cocktails
          </Text>
        </Pressable>

        {/* Page Title - Centered */}
        <View className="TitleContainer items-center">
          <Text className="PageTitle text-lg font-semibold text-p1 dark:text-s11">
            Recipe
          </Text>
        </View>

        {/* Action Menu */}
        <View className="MenuContainer relative">
          <Pressable
            onPress={() => setShowActions(!showActions)}
            className="MenuButton py-2 px-3"
          >
            <Text className="MenuDots text-lg font-semibold text-p1 dark:text-s11">
              •••
            </Text>
          </Pressable>

          {/* Absolutely Positioned Dropdown */}
          {showActions && (
            <View
              className="Dropdown absolute top-full right-0 min-w-[120px] rounded-xl border shadow-lg"
              style={{
                zIndex: 1000,
                backgroundColor: colors.surface,
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
                className="EditOption p-3"
              >
                <Text className="EditText text-base font-medium text-g4 dark:text-n1">
                  Edit
                </Text>
              </Pressable>

              <View
                className="Divider h-px mx-3"
                style={{ backgroundColor: colors.border }}
              />

              <Pressable
                onPress={() => {
                  setShowActions(false);
                  handleDelete();
                }}
                className="DeleteOption p-3"
              >
                <Text className="DeleteText text-base font-medium text-red-600 dark:text-red-400">
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
          className="DropdownOverlay absolute inset-0"
          style={{ zIndex: 999 }}
          onPress={() => setShowActions(false)}
        />
      )}

      {/* Scrollable Content */}
      <ScrollView className="ContentScroll flex-1">
        <View className="ContentContainer p-4">
          {/* Cocktail Name and Description */}
          <View className="CocktailInfo mb-6">
            <Text className="CocktailName text-2xl font-bold text-g4 dark:text-n1 mb-2">
              {cocktailData.name}
            </Text>
            <Text className="CocktailDescription text-g3 dark:text-n1">
              {cocktailData.description}
            </Text>
          </View>

          {/* Ingredients */}
          <Card className="mb-4">
            <Text className="text-lg text-g4 dark:text-n1 mb-4 font-bold tracking-tight">
              Ingredients ({cocktailData.ingredients.length})
            </Text>

            <View className="space-y-3">
              {cocktailData.ingredients.map((ingredient) => (
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
                  {cocktailData.totalCost.toFixed(2)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-g3 dark:text-n1 tracking-tight">
                  Suggested Price:
                </Text>
                <Text className="text-p2 dark:text-n1 text-lg font-medium">
                  {currencySymbol}
                  {cocktailData.suggestedPrice.toFixed(2)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-g3 dark:text-n1">Pour Cost:</Text>
                <Text
                  className={`text-lg ${getPourCostColor(cocktailData.pourCostPercentage)}`}
                >
                  {cocktailData.pourCostPercentage.toFixed(1)}%
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-g3 dark:text-n1">Profit Margin:</Text>
                <Text className="text-s22 text-lg">
                  {currencySymbol}
                  {cocktailData.profitMargin.toFixed(2)}
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
              pourCostPercentage={cocktailData.pourCostPercentage}
              className="mb-4"
            />

            <View className="bg-p1/10 dark:bg-p2/20 p-4 rounded-lg border border-p1/30 dark:border-p1/40">
              <Text className="text-sm text-p3 dark:text-s11 mb-2 font-medium">
                Profit Analysis
              </Text>
              <Text className="text-xs text-p2 dark:text-g1 leading-relaxed">
                This cocktail generates a profit of {currencySymbol}
                {cocktailData.profitMargin.toFixed(2)} at the suggested price of{' '}
                {currencySymbol}
                {cocktailData.suggestedPrice.toFixed(2)}. The pour cost of{' '}
                {cocktailData.pourCostPercentage.toFixed(1)}%
                {cocktailData.pourCostPercentage <= 20
                  ? ' is excellent and within target range.'
                  : ' could be optimized by adjusting portion sizes or pricing.'}
              </Text>
            </View>
          </Card>

          {/* Recipe Notes */}
          {cocktailData.notes && (
            <Card className="mb-4">
              <Text
                className="text-lg text-g4 dark:text-n1 mb-3"
                style={{ fontWeight: '600' }}
              >
                Recipe Notes
              </Text>
              <Text className="text-g4 dark:text-n1 leading-relaxed">
                {cocktailData.notes}
              </Text>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <Text className="text-center text-g3 dark:text-n1 text-sm">
              Created: {new Date(cocktail.createdAt).toLocaleDateString()} •
              Last updated: {new Date(cocktail.updatedAt).toLocaleDateString()}
            </Text>
          </Card>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
