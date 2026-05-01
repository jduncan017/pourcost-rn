import { useMemo, useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { useAppStore } from '@/src/stores/app-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AiSuggestionRow from '@/src/components/ui/AiSuggestionRow';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import ActionSheet from '@/src/components/ui/ActionSheet';
import StatCard from '@/src/components/ui/StatCard';
import LedgerRow from '@/src/components/ui/LedgerRow';
import BottomSheet from '@/src/components/ui/BottomSheet';
import DetailLevelToggle from '@/src/components/ui/DetailLevelToggle';
import PourCostHero, { getPerformance } from '@/src/components/PourCostHero';
import GradientBackground from '@/src/components/ui/GradientBackground';
import Dropdown from '@/src/components/ui/Dropdown';
import IngredientInUseSheet from '@/src/components/ui/IngredientInUseSheet';
import { FeedbackService } from '@/src/services/feedback-service';
import { SavedIngredient, Volume, volumeLabel } from '@/src/types/models';
import { buildIngredientEditParams } from '@/src/lib/buildIngredientEditParams';
import {
  calculateIngredientMetrics,
  calculateSuggestedPrice,
  formatCurrency,
  roundSuggestedPrice,
} from '@/src/services/calculation-service';
import PriceHistory from '@/src/components/PriceHistory';
import EducationPanel from '@/src/components/EducationPanel';
import { ingredientTypeIcon } from '@/src/lib/type-icons';


export default function IngredientDetailScreen() {
  const { defaultPourSize, defaultRetailPrice, pourCostGoal, detailLevel, suggestedPriceRounding } = useAppStore();
  const router = useGuardedRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [showActions, setShowActions] = useState(false);
  const [showInUseSheet, setShowInUseSheet] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);

  const { ingredients, loadIngredients, deleteIngredient } = useIngredientsStore();
  const { cocktails } = useCocktailsStore();

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

  // Selectable size: the inline default + any stored configurations.
  // Each option is keyed by the volume label (one config per unique size).
  const sizeOptions = useMemo(() => {
    const opts: { value: string; label: string; size: Volume; cost: number }[] = [
      { value: 'default', label: volumeLabel(ingredient.productSize), size: ingredient.productSize, cost: ingredient.productCost },
    ];
    for (const c of ingredient.configurations ?? []) {
      opts.push({ value: c.id, label: volumeLabel(c.productSize), size: c.productSize, cost: c.productCost });
    }
    return opts;
  }, [ingredient]);

  const [selectedSizeKey, setSelectedSizeKey] = useState<string>('default');
  const selectedOption = sizeOptions.find((o) => o.value === selectedSizeKey) ?? sizeOptions[0];

  // Reset to "default" if the selected config disappears (e.g. user deleted it from edit form).
  useEffect(() => {
    if (!sizeOptions.find((o) => o.value === selectedSizeKey)) {
      setSelectedSizeKey('default');
    }
  }, [sizeOptions, selectedSizeKey]);

  // Build a synthetic ingredient pinned to the selected configuration so all
  // downstream metrics (cost/oz, suggested retail, pour-cost %) reflect THIS bottle.
  const viewIngredient: SavedIngredient = {
    ...ingredient,
    productSize: selectedOption.size,
    productCost: selectedOption.cost,
  };
  const metrics = calculateIngredientMetrics(
    viewIngredient,
    effectivePourSize,
    effectiveRetailPrice
  );
  const suggestedRetail = roundSuggestedPrice(
    calculateSuggestedPrice(metrics.costPerPour, pourCostGoal / 100),
    suggestedPriceRounding
  );
  // Mirror cocktail-detail: only surface a Suggested Retail row when the
  // current pour cost is outside the target band. On-target = no noise.
  const ingredientPerformanceLabel =
    pourCostGoal > 0 && metrics.pourCostPercentage > 0
      ? getPerformance(metrics.pourCostPercentage / pourCostGoal).label
      : 'On Target';
  const isOnTarget = ingredientPerformanceLabel === 'On Target';
  const hasMultipleSizes = sizeOptions.length > 1;

  const handleEdit = () => {
    router.navigate({
      pathname: '/ingredient-form',
      params: buildIngredientEditParams(ingredient),
    });
  };

  const affectedCocktails = cocktails.filter((c) =>
    c.ingredients.some((ci) => ci.ingredientId === ingredient.id)
  );

  const handleDelete = () => {
    if (affectedCocktails.length > 0) {
      setShowInUseSheet(true);
      return;
    }
    FeedbackService.showDeleteConfirmation(
      ingredient.name,
      async () => {
        await deleteIngredient(ingredient.id);
        router.back();
      },
      'ingredient'
    );
  };

  const handleOpenCocktail = (cocktailId: string) => {
    setShowInUseSheet(false);
    router.navigate({
      pathname: '/cocktail-detail',
      params: { id: cocktailId },
    });
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

      <IngredientInUseSheet
        visible={showInUseSheet}
        onClose={() => setShowInUseSheet(false)}
        ingredientName={ingredient.name}
        cocktails={affectedCocktails}
        onOpenCocktail={handleOpenCocktail}
      />

      <BottomSheet
        visible={showNumbers}
        onClose={() => setShowNumbers(false)}
        title="The Numbers"
      >
        <View className="px-4 pb-6 flex-col gap-1">
          <LedgerRow
            label="Purchase Price"
            value={formatCurrency(selectedOption.cost)}
          />
          {isDetailed && (
            <LedgerRow
              label="Cost / Oz"
              value={formatCurrency(metrics.costPerOz)}
            />
          )}
          <LedgerRow
            label="Cost / Pour"
            value={formatCurrency(metrics.costPerPour)}
          />
          <LedgerRow
            label="Pour Size"
            value={volumeLabel(effectivePourSize)}
          />
          <LedgerRow
            label="Bottle Size"
            value={volumeLabel(selectedOption.size)}
          />
          {isDetailed && !isNotForSale && (
            <LedgerRow
              label="Type"
              value={ingredient.type || 'Other'}
            />
          )}
          {isDetailed && (
            <LedgerRow
              label="Last Updated"
              value={new Date(ingredient.updatedAt).toLocaleDateString()}
            />
          )}
        </View>
      </BottomSheet>

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
                className="text-xs"
                style={{
                  color: palette.B5,
                  letterSpacing: 1.5,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                }}
              >
                Ingredient
              </Text>
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

          {/* Bottle size picker — only when multiple sizes exist. Drives all metrics below. */}
          {hasMultipleSizes && (
            <View className="px-6">
              <Dropdown
                value={selectedSizeKey}
                onValueChange={setSelectedSizeKey}
                options={sizeOptions.map((o) => ({
                  value: o.value,
                  label: o.label,
                  sublabel: `$${o.cost.toFixed(2)}`,
                }))}
                label="Bottle Size"
                placeholder="Select size"
              />
            </View>
          )}

          {/* Stats group — placed near top (after identity + size picker) to
              match cocktail-detail's information hierarchy. The Numbers footer
              + price history anchor the bottom of the page. Simple mode hides
              the whole stats group for not-for-sale items where every value
              is cost-derived. */}
          {(isDetailed || !isNotForSale) && (
            <View className="px-6 flex-col gap-3">
              {!isNotForSale ? (
                <View className="flex-row gap-3">
                  <StatCard
                    label="Retail Price"
                    value={formatCurrency(effectiveRetailPrice)}
                  />
                  {isDetailed && (
                    <StatCard
                      label="Margin"
                      value={formatCurrency(metrics.pourCostMargin)}
                      infoTermKey="margin"
                    />
                  )}
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
              {isDetailed && !isNotForSale && !isOnTarget && (
                <AiSuggestionRow
                  label="Suggested Retail"
                  value={formatCurrency(suggestedRetail)}
                  infoTermKey="suggestedPrice"
                />
              )}
            </View>
          )}

          {/* Pour Cost hero — detailed + for-sale only */}
          {isDetailed && !isNotForSale && (
            <PourCostHero pourCostPercentage={metrics.pourCostPercentage} />
          )}

          {/* About — canonical-driven product education. Renders nothing when
              the ingredient isn't linked to a canonical (user-typed entries
              without a catalog match). Tier 1 fields appear immediately;
              Tier 2 fields populate as the enrichment job runs. */}
          <EducationPanel canonicalProductId={ingredient.canonicalProductId} />

          {/* Price History — detailed only (self-wraps in Card when non-empty).
              Placed before Ledger so Ledger can anchor the bottom of the page. */}
          {isDetailed && (
            <View className="px-6">
              <PriceHistory ingredientId={ingredient.id} />
            </View>
          )}

          {/* THE NUMBERS summary bar — detailed only, since the sheet content
              is mostly cost/pour data which simple mode hides. */}
          {isDetailed && (
            <Pressable
              onPress={() => setShowNumbers(true)}
              style={{ marginTop: 'auto' }}
            >
              <LinearGradient
                colors={[palette.B9 + '50', palette.N9] as const}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              >
                <View
                  className="px-6 pt-4 flex-row items-center justify-between"
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: colors.borderSubtle,
                    paddingBottom: insets.bottom + 16,
                  }}
                >
                  <View className="flex-col gap-0.5">
                    <Text
                      className="text-xs uppercase"
                      style={{ color: colors.textTertiary, letterSpacing: 1 }}
                    >
                      The Numbers
                    </Text>
                    <Text
                      className="text-sm"
                      style={{ color: colors.textSecondary }}
                    >
                      View more details
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-up"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
