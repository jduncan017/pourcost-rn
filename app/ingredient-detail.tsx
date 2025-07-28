import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/src/stores/app-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useThemeColors, themeColors } from '@/src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/src/components/ui/Card';
import PourCostPerformanceBar from '@/src/components/PourCostPerformanceBar';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { getCurrencySymbol } from '@/src/utils/currency';
import { FeedbackService } from '@/src/services/feedback-service';
import { IngredientService } from '@/src/services/ingredient-service';

/**
 * Ingredient detail screen
 * Shows comprehensive ingredient data with full-screen layout
 */
export default function IngredientDetailScreen() {
  const insets = useSafeAreaInsets();
  const { baseCurrency } = useAppStore();
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [showActions, setShowActions] = useState(false);

  // Get ingredient store
  const { ingredients, loadIngredients, deleteIngredient } =
    useIngredientsStore();

  // Get ingredient ID from params
  const ingredientId = params.id as string;

  // Find the ingredient from the store
  const storeIngredient = ingredients.find((ing) => ing.id === ingredientId);

  // Load ingredients if not already loaded
  useEffect(() => {
    if (!storeIngredient && ingredients.length === 0) {
      loadIngredients();
    }
  }, [ingredientId, ingredients.length]);

  // Show loading if ingredient not found
  if (!storeIngredient) {
    return (
      <GradientBackground>
        <View
          style={{ paddingTop: insets.top }}
          className="flex-1 items-center justify-center"
        >
          <Text className="text-n1 text-lg">Loading ingredient...</Text>
        </View>
      </GradientBackground>
    );
  }

  // Calculate ingredient metrics
  const pourSize = 1.5; // Standard pour size
  const retailPrice = 8.0; // Default retail price for calculation
  const ingredient = IngredientService.calculateIngredientMetrics(
    storeIngredient,
    pourSize,
    retailPrice,
    baseCurrency
  );

  const handleEdit = () => {
    router.push({
      pathname: '/ingredient-form',
      params: {
        id: ingredient.id,
        name: ingredient.name,
        type: ingredient.type,
        bottleSize: ingredient.bottleSize.toString(),
        bottlePrice: ingredient.bottlePrice.toString(),
      },
    });
  };

  const handleDelete = () => {
    FeedbackService.showDeleteConfirmation(
      ingredient.name,
      async () => {
        await deleteIngredient(ingredient.id);
        router.back();
      },
      'ingredient'
    );
  };

  const currencySymbol = getCurrencySymbol(baseCurrency);

  // Get ingredient image (placeholder for now - similar to cocktail image logic)
  const getIngredientImage = () => {
    // For now, we'll just show the fallback icon
    // In the future, this could load ingredient images from assets or URLs
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
          <Text
            className="text-n1 dark:text-n1 text-xl"
            style={{ fontWeight: '600' }}
          >
            POUR COST
          </Text>
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
              className="p-3"
            >
              <Text className="text-base font-medium text-g4 dark:text-n1">
                Edit
              </Text>
            </Pressable>
            <View className="h-px mx-3 bg-g2 dark:bg-p2" />
            <Pressable
              onPress={() => {
                setShowActions(false);
                handleDelete();
              }}
              className="p-3"
            >
              <Text className="text-base font-medium text-red-600 dark:text-red-400">
                Delete
              </Text>
            </Pressable>
          </View>
        </>
      )}

      {/* Scrollable Content */}
      <ScrollView className="flex-1">
        <View className="p-4 flex-col gap-4">
          {/* Ingredient Header */}
          <Card displayClasses="flex-row gap-4">
            {/* Ingredient Info */}
            <View className="flex-1 flex-col gap-2">
              <Text className="text-n1 text-2xl  font-semibold">
                {ingredient.name.toUpperCase()}
              </Text>
              <Text className="text-g1 dark:text-g1/90 text-lg font-medium">
                Type: {ingredient.type}
              </Text>
              <Text className="text-g1 dark:text-g1/90 text-lg font-medium">
                Bottle Size: {ingredient.bottleSize}ml
              </Text>
              <Text className="text-g1 dark:text-g1/90 text-lg font-medium">
                ABV: 40%
              </Text>
              <Text className="text-g1 dark:text-g1/90 text-lg font-medium">
                Retail Price: {currencySymbol}
                {retailPrice.toFixed(2)}
              </Text>
            </View>
          </Card>

          {/* Pricing Details Card */}
          <Card displayClasses="PricingCard flex-col gap-2">
            <Text className="text-n1 dark:text-n1 text-xl font-medium">
              PRICING INFO
            </Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-g1 dark:text-g1/90 text-lg font-medium">
                Purchase Price: {currencySymbol}
                {ingredient.bottlePrice.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-g1 dark:text-g1/90 text-lg font-medium">
                Cost per Oz: {currencySymbol}
                {ingredient.costPerOz.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-g1 dark:text-g1/90 text-lg font-medium">
                Suggested Retail: {currencySymbol}
                {retailPrice.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-g1 dark:text-g1/90 text-lg font-medium">
                Margin: {currencySymbol}
                {ingredient.pourCostMargin.toFixed(2)}
              </Text>
            </View>
          </Card>

          {/* Description Section */}
          <Card className="mb-4">
            <Text
              className="text-n1 dark:text-n1 text-lg mb-3"
              style={{ fontWeight: '600' }}
            >
              DESCRIPTION
            </Text>
            <Text className="text-n1/80 dark:text-n1/80 leading-relaxed">
              No description provided
            </Text>
          </Card>

          {/* Cost Analysis */}
          <View className="mb-4">
            {/* Performance Bar */}
            <View className="mb-3 border-b border-p1 pb-4">
              <PourCostPerformanceBar
                pourCostPercentage={ingredient.pourCostPercentage}
              />
            </View>
          </View>

          {/* Updated Info */}
          <View className="items-center">
            <Text className="text-n1/60 dark:text-n1/60 text-sm">
              Last Updated:{' '}
              {new Date(ingredient.updatedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
