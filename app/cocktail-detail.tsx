import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/src/stores/app-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { useThemeColors, themeColors } from '@/src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/src/components/ui/Card';
import PourCostPerformanceBar from '@/src/components/PourCostPerformanceBar';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { getCurrencySymbol } from '@/src/utils/currency';
import BackButton from '@/src/components/ui/BackButton';
import { FeedbackService } from '@/src/services/feedback-service';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { CocktailCategory } from '@/src/constants/appConstants';

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
  category: CocktailCategory;
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
  const [detailAnalysisVisible, setDetailAnalysisVisible] = useState(true);

  // Animated value for toggle button
  const togglePosition = useSharedValue(1); // 1 = on, 0 = off

  // Update toggle position when state changes
  useEffect(() => {
    togglePosition.value = withSpring(detailAnalysisVisible ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [detailAnalysisVisible]);

  // Animated style for toggle button
  const toggleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: togglePosition.value * 20 }], // 24px movement
    };
  });

  // Get cocktail store
  const { getCocktailById, loadCocktails, deleteCocktail } =
    useCocktailsStore();

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
        <View
          style={{ paddingTop: insets.top }}
          className="flex-1 items-center justify-center"
        >
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
    ingredients: cocktail.ingredients.map((ing) => ({
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
    // imagePath: cocktail.imagePath, // Add missing imagePath field - TypeScript error
    createdAt:
      cocktail.createdAt instanceof Date
        ? cocktail.createdAt.toISOString()
        : new Date().toISOString(),
    updatedAt:
      cocktail.updatedAt instanceof Date
        ? cocktail.updatedAt.toISOString()
        : new Date().toISOString(),
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

  // Static image mapping for local development
  // In production, this would be auto-generated or imagePath would be URLs
  const cocktailImages = {
    margarita: require('@/assets/images/cocktail-images/margarita.jpg'),
    manhattan: require('@/assets/images/cocktail-images/manhattan.jpg'),
    mojito: require('@/assets/images/cocktail-images/mojito.jpg'),
    'espresso-martini': require('@/assets/images/cocktail-images/espresso-martini.jpg'),
    'gin-and-tonic': require('@/assets/images/cocktail-images/gin-and-tonic.jpg'),
  };

  // Get cocktail image from data or show icon fallback
  const getCocktailImage = () => {
    // For local development: extract filename from imagePath and map to local asset
    // For production: imagePath would be a URL and this would just return { uri: cocktail.imagePath }
    if (cocktail.imagePath) {
      if (cocktail.imagePath.startsWith('http')) {
        // Production: Use URL directly
        return { uri: cocktail.imagePath };
      } else {
        // Development: Extract filename and use static mapping
        const filename = cocktail.imagePath.replace('.jpg', '');
        if (
          filename &&
          cocktailImages[filename as keyof typeof cocktailImages]
        ) {
          return cocktailImages[filename as keyof typeof cocktailImages];
        }
      }
    }

    // Return null to show wine glass icon fallback
    return null;
  };

  return (
    <GradientBackground>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 pb-4"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="menu" size={24} color={themeColors.n1} />
          </Pressable>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => setShowActions(!showActions)}>
            <Ionicons name="share-outline" size={24} color={themeColors.n1} />
          </Pressable>
          <Pressable onPress={() => setShowActions(!showActions)}>
            <Ionicons
              name="ellipsis-horizontal"
              size={24}
              color={themeColors.n1}
            />
          </Pressable>
        </View>
      </View>

      {/* Action Menu Dropdown */}
      {showActions && (
        <>
          <Pressable
            className="absolute inset-0 z-40"
            onPress={() => setShowActions(false)}
          />
          <View
            className="absolute top-20 right-4 min-w-[120px] rounded-xl border shadow-lg z-50"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <Pressable
              onPress={() => {
                setShowActions(false);
                handleEdit();
              }}
              className="p-4"
            >
              <Text className="text-xl font-medium text-g4 dark:text-n1">
                Edit
              </Text>
            </Pressable>
            <View className="h-px mx-3 bg-g2 dark:bg-p2" />
            <Pressable
              onPress={() => {
                setShowActions(false);
                handleDelete();
              }}
              className="p-4"
            >
              <Text className="text-xl font-medium text-red-600 dark:text-red-400">
                Delete
              </Text>
            </Pressable>
          </View>
        </>
      )}

      {/* Scrollable Content */}
      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Cocktail Header */}
          <View className="flex-row gap-4 shadow-4">
            {/* Cocktail Image */}
            <View className="w-44 h-44 rounded-lg overflow-hidden border border-t-g2 border-l-g2 border-b-g3 border-r-g3">
              {(() => {
                const imageSource = getCocktailImage();
                return imageSource ? (
                  <Image
                    source={imageSource}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full bg-p3/30 dark:bg-p3/60 flex items-center justify-center">
                    <Ionicons name="wine" size={64} color={themeColors.s31} />
                  </View>
                );
              })()}
            </View>

            {/* Cocktail Info */}
            <View className="flex-1 flex-col gap-2">
              <Text className="text-n1 text-2xl border-b border-g1 pb-2 font-semibold tracking-wider">
                {cocktailData.name.toUpperCase()}
              </Text>
              <Text className="text-n1/70 dark:text-g1 text-lg font-medium">
                Menu Price: {currencySymbol}
                {cocktailData.suggestedPrice.toFixed(2)}
              </Text>
              <Text className="text-n1/70 dark:text-g1 text-lg font-medium">
                Margin: {currencySymbol}
                {cocktailData.profitMargin.toFixed(2)}
              </Text>
              <Text className="text-n1/70 dark:text-g1 text-lg font-medium">
                ABV:{' '}
                {cocktailData.ingredients
                  .reduce((sum, ing) => sum + ing.amount, 0)
                  .toFixed(1)}
                oz
              </Text>
              <Text className="text-n1/70 dark:text-g1 text-lg font-medium">
                Total Alcohol:{' '}
                {cocktailData.ingredients
                  .reduce((sum, ing) => sum + ing.amount, 0)
                  .toFixed(1)}
                oz
              </Text>
            </View>
          </View>

          {/* Ingredients Section Header - Outside Card */}
          <View className="flex-row items-center justify-between mb-4 mt-6">
            <Text className="text-n1 dark:text-n1 text-xl font-medium tracking-wider">
              INGREDIENTS
            </Text>

            {/* Detail Analysis Toggle */}
            <View className="flex-row items-center gap-3">
              <Text className="text-n1/70 dark:text-g1 text-lg font-semibold">
                Detail Analysis
              </Text>
              <Pressable
                onPress={() => setDetailAnalysisVisible(!detailAnalysisVisible)}
                className={`w-[48px] h-8 rounded-full justify-center px-1 ${
                  detailAnalysisVisible ? 'bg-s21' : 'bg-g3'
                }`}
              >
                <Animated.View
                  style={[toggleStyle]}
                  className="w-6 h-6 bg-white rounded-full"
                />
              </Pressable>
            </View>
          </View>

          {/* Individual Ingredient Cards */}
          <View className="flex flex-col gap-3 mb-4">
            {cocktailData.ingredients.map((ingredient) => (
              <Card key={ingredient.id} variant="gradient">
                {detailAnalysisVisible ? (
                  /* Detailed View */
                  <>
                    <View className="flex-row items-center justify-between mb-2 pb-2 border-b border-g3">
                      <Text
                        className="text-n1 dark:text-n1 text-xl tracking-wide font-medium flex-1"
                        numberOfLines={2}
                      >
                        {ingredient.name}
                      </Text>
                      <Text className="text-n1/60 dark:text-n1/70 ml-2">
                        {ingredient.type}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <Text className="text-n1/70 dark:text-n1/70 font-medium w-[25%]">
                        {ingredient.amount}oz
                      </Text>
                      <Text className="text-n1/70 dark:text-n1/70 font-medium w-[25%]">
                        40% ABV
                      </Text>
                      <Text className="text-n1/70 dark:text-n1/70 font-medium w-[25%]">
                        {currencySymbol}
                        {(ingredient.cost / ingredient.amount).toFixed(2)}/oz
                      </Text>
                      <Text className="text-n1 dark:text-n1 font-medium">
                        Total: {currencySymbol}
                        {ingredient.cost.toFixed(2)}
                      </Text>
                    </View>
                  </>
                ) : (
                  /* Simple View - measurements on left */
                  <View className="flex-row items-center gap-3">
                    <Text className="text-n1/70 dark:text-n1/70 font-medium">
                      {ingredient.amount}oz
                    </Text>
                    <Text
                      className="text-n1 dark:text-n1 text-base flex-1 font-medium"
                      numberOfLines={2}
                    >
                      {ingredient.name}
                    </Text>
                  </View>
                )}
              </Card>
            ))}
          </View>

          {/* Recipe Notes */}
          {cocktailData.notes && (
            <Card className="mb-4">
              <Text
                className="text-n1 dark:text-n1 text-lg mb-3"
                style={{ fontWeight: '600' }}
              >
                RECIPE NOTES
              </Text>
              <Text className="text-n1/80 dark:text-n1/80 leading-relaxed">
                {cocktailData.notes}
              </Text>
            </Card>
          )}

          {/* Cost Analysis */}
          <View className="mb-4">
            {/* Performance Bar */}
            <View className="mb-3 border-b border-p1 pb-4">
              <PourCostPerformanceBar
                pourCostPercentage={cocktailData.pourCostPercentage}
              />
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-n1 dark:text-n2 text-xl font-semibold">
                Total Cost: {currencySymbol}
                {cocktailData.totalCost.toFixed(2)}
              </Text>
              <Text className="text-n1 dark:text-n2 text-lg font-medium">
                Suggested Price: {currencySymbol}
                {cocktailData.suggestedPrice.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Updated Info */}
          <View className="items-center py-4">
            <Text className="text-n1/60 dark:text-n1/60 text-sm">
              Updated {new Date(cocktail.updatedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
