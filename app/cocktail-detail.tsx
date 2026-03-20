import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useAppStore, HARDCODED_BASE_CURRENCY } from '@/src/stores/app-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { themeColors, useThemeColors } from '@/src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/src/components/ui/Card';
import ActionSheet from '@/src/components/ui/ActionSheet';
import PourCostPerformanceBar from '@/src/components/PourCostPerformanceBar';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { getCurrencySymbol } from '@/src/utils/currency';
import { FeedbackService } from '@/src/services/feedback-service';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { volumeLabel, volumeToOunces } from '@/src/types/models';
import { calculateCocktailMetrics, calculatePourCostPercentage } from '@/src/services/calculation-service';

/**
 * Cocktail detail screen
 * Shows comprehensive cocktail data with full-screen layout
 */
export default function CocktailDetailScreen() {
  const baseCurrency = HARDCODED_BASE_CURRENCY;
  const { defaultRetailPrice } = useAppStore();
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
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
        <View className="flex-1 items-center justify-center">
          <Text className="text-n1 text-lg">Loading cocktail...</Text>
        </View>
      </GradientBackground>
    );
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      title: cocktail.name,
      headerRight: () => (
        <Pressable onPress={() => setShowActions(true)} className="p-2">
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </Pressable>
      ),
    });
  }, [cocktail.name, navigation, colors.text]);

  // Compute metrics on-demand from ingredients
  const metrics = calculateCocktailMetrics(cocktail.ingredients);
  const retailPrice = cocktail.retailPrice ?? defaultRetailPrice;

  const handleEdit = () => {
    router.push({
      pathname: '/cocktail-form',
      params: {
        id: cocktail.id,
        name: cocktail.name,
        description: cocktail.description,
        category: cocktail.category,
        notes: cocktail.notes,
        retailPrice: cocktail.retailPrice?.toString(),
        ingredients: JSON.stringify(cocktail.ingredients),
        createdAt: cocktail.createdAt instanceof Date
          ? cocktail.createdAt.toISOString()
          : new Date(cocktail.createdAt).toISOString(),
      },
    });
  };

  const handleDelete = () => {
    FeedbackService.showDeleteConfirmation(
      cocktail.name,
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
      {/* Action Sheet */}
      <ActionSheet
        visible={showActions}
        onClose={() => setShowActions(false)}
        actions={[
          { label: 'Edit', icon: 'create-outline', onPress: handleEdit },
          { label: 'Delete', icon: 'trash-outline', onPress: handleDelete, destructive: true },
        ]}
      />

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
                {cocktail.name.toUpperCase()}
              </Text>
              <Text className="text-n1/70 dark:text-g1 text-lg font-medium">
                Retail Price: {currencySymbol}
                {retailPrice.toFixed(2)}
              </Text>
              <Text className="text-n1/70 dark:text-g1 text-lg font-medium">
                Total Volume:{' '}
                {cocktail.ingredients
                  .reduce((sum, ing) => sum + volumeToOunces(ing.pourSize), 0)
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
            {cocktail.ingredients.map((ingredient, index) => {
              const pourOz = volumeToOunces(ingredient.pourSize);
              const costPerOz = pourOz > 0 ? ingredient.cost / pourOz : 0;
              return (
                <Card key={ingredient.ingredientId + '-' + index} variant="gradient">
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
                      </View>

                      <View className="flex-row items-center justify-between">
                        <Text className="text-n1/70 dark:text-n1/70 font-medium w-[30%]">
                          {volumeLabel(ingredient.pourSize)}
                        </Text>
                        <Text className="text-n1/70 dark:text-n1/70 font-medium w-[30%]">
                          {currencySymbol}
                          {costPerOz.toFixed(2)}/oz
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
                        {volumeLabel(ingredient.pourSize)}
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
              );
            })}
          </View>

          {/* Recipe Notes */}
          {cocktail.notes && (
            <Card className="mb-4">
              <Text
                className="text-n1 dark:text-n1 text-lg mb-3"
                style={{ fontWeight: '600' }}
              >
                RECIPE NOTES
              </Text>
              <Text className="text-n1/80 dark:text-n1/80 leading-relaxed">
                {cocktail.notes}
              </Text>
            </Card>
          )}

          {/* Cost Analysis */}
          <View className="mb-4 flex-col gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-n1 dark:text-n2 text-xl font-semibold">
                Total Cost: {currencySymbol}
                {metrics.totalCost.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-n1/70 dark:text-g1 text-lg font-medium">
                Suggested Price
              </Text>
              <Text className="text-n1 dark:text-n2 text-lg font-medium">
                {currencySymbol}
                {metrics.suggestedPrice.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-n1/70 dark:text-g1 text-lg font-medium">
                Pour Cost
              </Text>
              <Text className="text-n1 dark:text-n2 text-lg font-medium">
                {retailPrice > 0
                  ? calculatePourCostPercentage(metrics.totalCost, retailPrice).toFixed(1)
                  : '0.0'}
                %
              </Text>
            </View>

            {/* Performance Bar */}
            <View className="border-t border-p1 pt-3">
              <PourCostPerformanceBar
                pourCostPercentage={
                  retailPrice > 0
                    ? calculatePourCostPercentage(metrics.totalCost, retailPrice)
                    : 0
                }
              />
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
