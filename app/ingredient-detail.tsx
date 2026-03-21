import { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useAppStore } from '@/src/stores/app-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AiSuggestionRow from '@/src/components/ui/AiSuggestionRow';
import SectionDivider from '@/src/components/ui/SectionDivider';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import ActionSheet from '@/src/components/ui/ActionSheet';
import PourCostPerformanceBar from '@/src/components/PourCostPerformanceBar';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { FeedbackService } from '@/src/services/feedback-service';
import { volumeLabel } from '@/src/types/models';
import {
  calculateIngredientMetrics,
  calculateSuggestedPrice,
  formatCurrency,
} from '@/src/services/calculation-service';

export default function IngredientDetailScreen() {
  const { defaultPourSize, defaultRetailPrice, pourCostGoal } = useAppStore();
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const [showActions, setShowActions] = useState(false);

  const { ingredients, loadIngredients, deleteIngredient } = useIngredientsStore();

  const ingredientId = params.id as string;
  const ingredient = ingredients.find((ing) => ing.id === ingredientId);

  useEffect(() => {
    if (!ingredient && ingredients.length === 0) {
      loadIngredients();
    }
  }, [ingredientId, ingredients.length]);

  if (!ingredient) {
    return (
      <GradientBackground>
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: colors.text }} className="text-lg">Loading...</Text>
        </View>
      </GradientBackground>
    );
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Ingredient',
      headerRight: () => (
        <Pressable onPress={() => setShowActions(true)} className="p-2">
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </Pressable>
      ),
    });
  }, [navigation, colors.text]);

  const isNotForSale = ingredient.notForSale === true;
  const metrics = calculateIngredientMetrics(ingredient, defaultPourSize, defaultRetailPrice);
  const suggestedRetail = calculateSuggestedPrice(metrics.costPerPour, pourCostGoal / 100);

  const handleEdit = () => {
    router.push({
      pathname: '/ingredient-form',
      params: {
        id: ingredient.id,
        name: ingredient.name,
        type: ingredient.type,
        productSize: JSON.stringify(ingredient.productSize),
        productCost: ingredient.productCost.toString(),
        notForSale: ingredient.notForSale ? 'true' : 'false',
        description: ingredient.description,
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

  // Alternating row background for pricing section
  const pricingRows = [
    { label: 'Purchase Price', value: formatCurrency(ingredient.productCost) },
    { label: 'Cost per Oz', value: formatCurrency(metrics.costPerOz) },
    { label: 'Cost per Pour', value: formatCurrency(metrics.costPerPour) },
    ...(!isNotForSale ? [
      { label: 'Retail Price', value: formatCurrency(defaultRetailPrice) },
      { label: 'Margin', value: formatCurrency(metrics.pourCostMargin) },
    ] : []),
  ];

  return (
    <GradientBackground>
      <ActionSheet
        visible={showActions}
        onClose={() => setShowActions(false)}
        actions={[
          { label: 'Edit', icon: 'create-outline', onPress: handleEdit },
          { label: 'Delete', icon: 'trash-outline', onPress: handleDelete, destructive: true },
        ]}
      />

      <ScrollView className="flex-1">
        <View className="p-4 pt-6 flex-col gap-6">
          {/* Name */}
          <Text className="text-2xl" style={{ color: colors.text, fontWeight: '700' }}>
            {ingredient.name}
          </Text>

          {/* Details */}
          <View className="flex-col gap-2">
            <ScreenTitle title="Details" variant="group" />
            <Text className="text-base" style={{ color: colors.textSecondary }}>
              {ingredient.type || 'Other'} • {volumeLabel(ingredient.productSize)}{isNotForSale ? ' • Not for sale' : ''}
            </Text>
            {ingredient.description ? (
              <Text className="text-base leading-6" style={{ color: colors.textTertiary }}>
                {ingredient.description}
              </Text>
            ) : null}
          </View>

          <SectionDivider />

          {/* Pricing — alternating row backgrounds */}
          <View className="flex-col gap-0">
            <ScreenTitle title="Pricing" variant="group" className="mb-2" />
            {pricingRows.map((row, index, arr) => (
              <View
                key={row.label}
                className="flex-row justify-between items-center py-3"
                style={index < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle } : undefined}
              >
                <Text className="text-base" style={{ color: colors.textSecondary }}>
                  {row.label}
                </Text>
                <Text className="text-base" style={{ color: colors.text, fontWeight: '500' }}>
                  {row.value}
                </Text>
              </View>
            ))}

            {!isNotForSale && (
              <AiSuggestionRow label="Suggested Retail" value={formatCurrency(suggestedRetail)} className="mt-2" />
            )}
          </View>

          {/* Performance — only for items that are for sale */}
          {!isNotForSale && (
            <>
              <SectionDivider />
              <PourCostPerformanceBar pourCostPercentage={metrics.pourCostPercentage} />
            </>
          )}

          {/* Footer */}
          <View className="items-center py-4">
            <Text className="text-xs" style={{ color: colors.textTertiary }}>
              Updated {new Date(ingredient.updatedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
