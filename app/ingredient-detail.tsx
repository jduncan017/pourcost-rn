import { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useAppStore } from '@/src/stores/app-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AiSuggestionRow from '@/src/components/ui/AiSuggestionRow';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import ActionSheet from '@/src/components/ui/ActionSheet';
import StatCard from '@/src/components/ui/StatCard';
import InfoIcon from '@/src/components/ui/InfoIcon';
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
import { ingredientTypeIcon } from '@/src/lib/type-icons';

/** One row in the LEDGER open list — no dividers between rows. */
function LedgerRow({
  label,
  value,
  valueColor,
  colors,
  infoTermKey,
}: {
  label: string;
  value: string;
  valueColor?: string;
  colors: any;
  infoTermKey?: import('@/src/constants/glossary').GlossaryKey;
}) {
  return (
    <View className="flex-row justify-between items-center py-2">
      <View className="flex-row items-center gap-1">
        <Text className="text-base" style={{ color: colors.textSecondary }}>
          {label}
        </Text>
        {infoTermKey && <InfoIcon termKey={infoTermKey} size={13} />}
      </View>
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
  const insets = useSafeAreaInsets();
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

      <ScrollView
        className="flex-1"
        bounces={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="pt-4 flex-col gap-7" style={{ flex: 1 }}>
          {/* Identity — type icon tile + name + metadata + description */}
          <View className="px-6 flex-row gap-4 items-center">
            <View
              className="w-20 h-20 rounded-xl items-center justify-center"
              style={{
                backgroundColor: colors.surface + '99',
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              {(() => {
                const icon = ingredientTypeIcon(ingredient.type);
                return (
                  <MaterialCommunityIcons
                    name={icon.name}
                    size={36}
                    color={icon.color}
                  />
                );
              })()}
            </View>
            <View className="flex-1 flex-col justify-center gap-1.5">
              <Text
                className="text-2xl"
                style={{ color: colors.text, fontWeight: '700' }}
                numberOfLines={2}
              >
                {ingredient.name}
              </Text>
              <Text
                className="text-sm"
                style={{ color: colors.textSecondary }}
              >
                {[
                  ingredient.type || 'Other',
                  volumeLabel(ingredient.productSize),
                  ingredient.abv != null ? `${ingredient.abv}% ABV` : null,
                  isNotForSale ? 'Not for sale' : null,
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </Text>
              {ingredient.description ? (
                <Text
                  className="text-sm leading-5"
                  style={{ color: colors.textTertiary }}
                  numberOfLines={3}
                >
                  {ingredient.description}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Stats group — pushed to bottom. marginTop:auto keeps identity at
              top and anchors stats + hero + history + ledger as one bottom block. */}
          <View className="px-6 flex-col gap-3" style={{ marginTop: 'auto' }}>
            {!isNotForSale ? (
              <View className="flex-row gap-3">
                <StatCard
                  label="Retail Price"
                  value={formatCurrency(effectiveRetailPrice)}
                />
                <StatCard
                  label="Margin"
                  value={formatCurrency(metrics.pourCostMargin)}
                  infoTermKey="margin"
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
                infoTermKey="suggestedPrice"
              />
            )}
          </View>

          {/* Pour Cost hero — detailed + for-sale only */}
          {isDetailed && !isNotForSale && (
            <PourCostHero pourCostPercentage={metrics.pourCostPercentage} />
          )}

          {/* Price History — detailed only (self-wraps in Card when non-empty).
              Placed before Ledger so Ledger can anchor the bottom of the page. */}
          {isDetailed && (
            <View className="px-6">
              <PriceHistory ingredientId={ingredient.id} />
            </View>
          )}

          {/* LEDGER — final section of the bottom-anchored group. */}
          <LinearGradient
            colors={[palette.B9 + '50', palette.N9] as const}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          >
            <View
              className="px-6 pt-5 flex-col gap-1"
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.borderSubtle,
                paddingBottom: insets.bottom + 20,
              }}
            >
              <ScreenTitle title="Ledger" variant="muted" className="mb-1" />
              <LedgerRow
                label="Purchase Price"
                value={formatCurrency(ingredient.productCost)}
                colors={colors}
              />
              {isDetailed && (
                <LedgerRow
                  label="Cost / Oz"
                  value={formatCurrency(metrics.costPerOz)}
                  colors={colors}
                />
              )}
              <LedgerRow
                label="Cost / Pour"
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
              {isDetailed && (
                <LedgerRow
                  label="Last Updated"
                  value={new Date(ingredient.updatedAt).toLocaleDateString()}
                  colors={colors}
                />
              )}
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
