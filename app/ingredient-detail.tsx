import { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useAppStore } from '@/src/stores/app-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AiSuggestionRow from '@/src/components/ui/AiSuggestionRow';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import ActionSheet from '@/src/components/ui/ActionSheet';
import StatCard from '@/src/components/ui/StatCard';
import DetailLevelToggle from '@/src/components/ui/DetailLevelToggle';
import PourCostHero from '@/src/components/PourCostHero';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { FeedbackService } from '@/src/services/feedback-service';
import { volumeLabel } from '@/src/types/models';
import { buildIngredientEditParams } from '@/src/lib/buildIngredientEditParams';
import {
  calculateIngredientMetrics,
  calculateSuggestedPrice,
  formatCurrency,
} from '@/src/services/calculation-service';
import PriceHistory from '@/src/components/PriceHistory';

/** One row in the LEDGER open list — no dividers between rows. */
function LedgerRow({
  label,
  value,
  valueColor,
  colors,
}: {
  label: string;
  value: string;
  valueColor?: string;
  colors: any;
}) {
  return (
    <View className="flex-row justify-between items-center py-2">
      <Text className="text-base" style={{ color: colors.textSecondary }}>
        {label}
      </Text>
      <Text
        className="text-base"
        style={{ color: valueColor ?? colors.text, fontWeight: '600' }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function IngredientDetailScreen() {
  const { defaultPourSize, defaultRetailPrice, pourCostGoal, detailLevel } = useAppStore();
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
          <Text style={{ color: colors.text }} className="text-lg">
            Loading...
          </Text>
        </View>
      </GradientBackground>
    );
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <DetailLevelToggle />,
      headerTitleAlign: 'center',
      headerRight: () => (
        <Pressable onPress={() => setShowActions(true)} className="p-2">
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </Pressable>
      ),
    });
  }, [navigation, colors.text]);

  const isDetailed = detailLevel === 'detailed';
  const isNotForSale = ingredient.notForSale === true;
  const effectivePourSize = ingredient.pourSize ?? defaultPourSize;
  const effectiveRetailPrice = ingredient.retailPrice ?? defaultRetailPrice;
  const metrics = calculateIngredientMetrics(
    ingredient,
    effectivePourSize,
    effectiveRetailPrice
  );
  const suggestedRetail = calculateSuggestedPrice(
    metrics.costPerPour,
    pourCostGoal / 100
  );

  const handleEdit = () => {
    router.navigate({
      pathname: '/ingredient-form',
      params: buildIngredientEditParams(ingredient),
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

  return (
    <GradientBackground>
      <ActionSheet
        visible={showActions}
        onClose={() => setShowActions(false)}
        actions={[
          { label: 'Edit', icon: 'create-outline', onPress: handleEdit },
          {
            label: 'Delete',
            icon: 'trash-outline',
            onPress: handleDelete,
            destructive: true,
          },
        ]}
      />

      <ScrollView className="flex-1">
        <View className="pt-4 pb-6 flex-col gap-7">
          {/* Identity */}
          <View className="px-6 flex-col gap-1.5">
            <Text
              className="text-3xl"
              style={{ color: colors.text, fontWeight: '700' }}
              numberOfLines={2}
            >
              {ingredient.name}
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {ingredient.type || 'Other'} • {volumeLabel(ingredient.productSize)}
              {isNotForSale ? ' • Not for sale' : ''}
            </Text>
            {ingredient.description ? (
              <Text
                className="text-sm leading-5 mt-1"
                style={{ color: colors.textTertiary }}
              >
                {ingredient.description}
              </Text>
            ) : null}
          </View>

          {/* Stats group — twin stat cards + AI suggestion, equal gap */}
          <View className="px-6 flex-col gap-3">
            {!isNotForSale ? (
              <View className="flex-row gap-3">
                <StatCard
                  label="Retail Price"
                  value={formatCurrency(effectiveRetailPrice)}
                />
                <StatCard
                  label="Margin"
                  value={formatCurrency(metrics.pourCostMargin)}
                />
              </View>
            ) : (
              <View className="flex-row gap-3">
                <StatCard
                  label="Purchase Price"
                  value={formatCurrency(ingredient.productCost)}
                />
                <StatCard
                  label="Cost / Pour"
                  value={formatCurrency(metrics.costPerPour)}
                />
              </View>
            )}
            {isDetailed && !isNotForSale && (
              <AiSuggestionRow
                label="Suggested Retail"
                value={formatCurrency(suggestedRetail)}
              />
            )}
          </View>

          {/* Pour Cost hero — detailed + for-sale only */}
          {isDetailed && !isNotForSale && (
            <PourCostHero pourCostPercentage={metrics.pourCostPercentage} />
          )}

          {/* LEDGER — open rows, top hairline separator */}
          <View
            className="px-6 pt-4 flex-col gap-1"
            style={{ borderTopWidth: 1, borderTopColor: colors.borderSubtle }}
          >
            <ScreenTitle title="Ledger" variant="muted" className="mb-1" />
            <LedgerRow
              label="Purchase Price"
              value={formatCurrency(ingredient.productCost)}
              colors={colors}
            />
            {isDetailed && (
              <LedgerRow
                label="Cost per Oz"
                value={formatCurrency(metrics.costPerOz)}
                colors={colors}
              />
            )}
            <LedgerRow
              label="Cost per Pour"
              value={formatCurrency(metrics.costPerPour)}
              colors={colors}
            />
            <LedgerRow
              label="Pour Size"
              value={volumeLabel(effectivePourSize)}
              colors={colors}
            />
            {isDetailed && !isNotForSale && (
              <LedgerRow
                label="Type"
                value={ingredient.type || 'Other'}
                colors={colors}
              />
            )}
          </View>

          {/* Price History — detailed only (self-wraps in Card when non-empty) */}
          {isDetailed && (
            <View className="px-6">
              <PriceHistory ingredientId={ingredient.id} />
            </View>
          )}

          {/* Updated footer — detailed only */}
          {isDetailed && (
            <View className="items-center pt-2">
              <Text className="text-xs" style={{ color: colors.textTertiary }}>
                Updated {new Date(ingredient.updatedAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
