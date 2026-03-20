import { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useAppStore } from '@/src/stores/app-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/src/components/ui/Card';
import MetricRow from '@/src/components/ui/MetricRow';
import ActionSheet from '@/src/components/ui/ActionSheet';
import PourCostPerformanceBar from '@/src/components/PourCostPerformanceBar';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { HARDCODED_BASE_CURRENCY } from '@/src/stores/app-store';
import { getCurrencySymbol } from '@/src/utils/currency';
import { FeedbackService } from '@/src/services/feedback-service';
import { volumeLabel } from '@/src/types/models';
import { calculateIngredientMetrics, calculateSuggestedPrice } from '@/src/services/calculation-service';

export default function IngredientDetailScreen() {
  const { defaultPourSize, defaultRetailPrice } = useAppStore();
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const [showActions, setShowActions] = useState(false);

  const { ingredients, loadIngredients, deleteIngredient } =
    useIngredientsStore();

  const ingredientId = params.id as string;
  const storeIngredient = ingredients.find((ing) => ing.id === ingredientId);

  useEffect(() => {
    if (!storeIngredient && ingredients.length === 0) {
      loadIngredients();
    }
  }, [ingredientId, ingredients.length]);

  if (!storeIngredient) {
    return (
      <GradientBackground>
        <View className="flex-1 items-center justify-center">
          <Text className="text-n1 text-lg">Loading ingredient...</Text>
        </View>
      </GradientBackground>
    );
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      title: storeIngredient.name,
      headerRight: () => (
        <Pressable onPress={() => setShowActions(true)} className="p-2">
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </Pressable>
      ),
    });
  }, [storeIngredient.name, navigation, colors.text]);

  // Calculate metrics on-demand using store defaults
  const metrics = calculateIngredientMetrics(storeIngredient, defaultPourSize, defaultRetailPrice);
  const suggestedRetail = calculateSuggestedPrice(metrics.costPerPour);

  const handleEdit = () => {
    router.push({
      pathname: '/ingredient-form',
      params: {
        id: storeIngredient.id,
        name: storeIngredient.name,
        type: storeIngredient.type,
        productSize: JSON.stringify(storeIngredient.productSize),
        productCost: storeIngredient.productCost.toString(),
      },
    });
  };

  const handleDelete = () => {
    FeedbackService.showDeleteConfirmation(
      storeIngredient.name,
      async () => {
        await deleteIngredient(storeIngredient.id);
        router.back();
      },
      'ingredient'
    );
  };

  const currencySymbol = getCurrencySymbol(HARDCODED_BASE_CURRENCY);

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
        <View className="p-4 flex-col gap-4">
          {/* Ingredient Header */}
          <Card displayClasses="flex-row gap-4">
            <View className="flex-1 flex-col gap-2">
              <Text className="text-n1 text-2xl font-semibold">
                {storeIngredient.name.toUpperCase()}
              </Text>
              <Text className="text-g1 dark:text-g1/90 text-lg font-medium">
                Type: {storeIngredient.type || 'Other'}
              </Text>
              <Text className="text-g1 dark:text-g1/90 text-lg font-medium">
                Container: {volumeLabel(storeIngredient.productSize)}
              </Text>
              <Text className="text-g1 dark:text-g1/90 text-lg font-medium">
                Retail Price: {currencySymbol}
                {defaultRetailPrice.toFixed(2)}
              </Text>
            </View>
          </Card>

          {/* Pricing Details Card */}
          <Card displayClasses="PricingCard flex-col gap-2">
            <Text className="text-n1 dark:text-n1 text-xl font-medium">
              PRICING INFO
            </Text>
            <MetricRow label="Purchase Price:" value={`${currencySymbol}${storeIngredient.productCost.toFixed(2)}`} valueColor="text-g1 dark:text-g1/90" />
            <MetricRow label="Cost per Oz:" value={`${currencySymbol}${metrics.costPerOz.toFixed(2)}`} valueColor="text-g1 dark:text-g1/90" />
            <MetricRow label="Suggested Retail:" value={`${currencySymbol}${suggestedRetail.toFixed(2)}`} valueColor="text-g1 dark:text-g1/90" />
            <MetricRow label="Margin:" value={`${currencySymbol}${metrics.pourCostMargin.toFixed(2)}`} valueColor="text-g1 dark:text-g1/90" />
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
              {storeIngredient.description || 'No description provided'}
            </Text>
          </Card>

          {/* Cost Analysis */}
          <View className="mb-4">
            <View className="mb-3 border-b border-p1 pb-4">
              <PourCostPerformanceBar
                pourCostPercentage={metrics.pourCostPercentage}
              />
            </View>
          </View>

          {/* Updated Info */}
          <View className="items-center">
            <Text className="text-n1/60 dark:text-n1/60 text-sm">
              Last Updated:{' '}
              {new Date(storeIngredient.updatedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
