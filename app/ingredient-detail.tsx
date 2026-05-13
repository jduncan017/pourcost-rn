import { useMemo, useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { useAppStore } from '@/src/stores/app-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AiSuggestionRow from '@/src/components/ui/AiSuggestionRow';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import ActionSheet from '@/src/components/ui/ActionSheet';
import StatCard from '@/src/components/ui/StatCard';
import DetailLevelToggle from '@/src/components/ui/DetailLevelToggle';
import PourCostHero, { getPerformance } from '@/src/components/PourCostHero';
import { useHeroTargetForIngredient } from '@/src/lib/useHeroTarget';
import GradientBackground from '@/src/components/ui/GradientBackground';
import Dropdown from '@/src/components/ui/Dropdown';
import IngredientInUseSheet from '@/src/components/ui/IngredientInUseSheet';
import { FeedbackService } from '@/src/services/feedback-service';
import { SavedIngredient, Volume, IngredientConfiguration, volumeLabel, volumeToOunces } from '@/src/types/models';
import { buildIngredientEditParams } from '@/src/lib/buildIngredientEditParams';
import {
  calculateIngredientMetrics,
  calculateSuggestedPrice,
  applyPriceFloor,
  formatCurrency,
  roundSuggestedPrice,
} from '@/src/services/calculation-service';
import PriceHistory from '@/src/components/PriceHistory';
import EducationPanel from '@/src/components/EducationPanel';
import { ingredientTypeIcon } from '@/src/lib/type-icons';

/** Display-friendly pour size: "2oz", "0.75oz", "1.5oz". Decimal everywhere.
 *  Mirrors the helper in cocktail-detail.tsx; keeping local copies until the
 *  formatter consolidates into a shared lib. */
function pourLabel(v: Volume): string {
  if (v.kind === 'namedOunces' || v.kind === 'unitQuantity') return volumeLabel(v);
  const oz = volumeToOunces(v);
  const formatted = oz % 1 === 0 ? oz : Number(oz.toFixed(2));
  return `${formatted}oz`;
}

/** Single label/value row inside the More Details card. Hairline divider
 *  above each row except the first. Larger text than LedgerRow so the card
 *  reads as a real list, not a flat ledger. */
function DetailRow({
  label,
  value,
  isFirst,
}: {
  label: string;
  value: string;
  isFirst?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: isFirst ? 0 : 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <Text className="text-base" style={{ color: palette.N3 }}>
        {label}
      </Text>
      <Text className="text-base" style={{ color: palette.N1, fontWeight: '600' }}>
        {value}
      </Text>
    </View>
  );
}

/** Display-friendly bottle size with a container noun: "750ml Bottle",
 *  "1L Bottle", "1.75L Handle", etc. Falls back to volumeLabel for
 *  named/unit-quantity volumes which already include their own noun
 *  ("Sixth Barrel Keg", "1 jar (40 cherries)"). */
function sizeWithUnit(v: Volume): string {
  if (v.kind === 'namedOunces' || v.kind === 'unitQuantity') return volumeLabel(v);
  if (v.kind !== 'milliliters') return volumeLabel(v);
  switch (v.ml) {
    case 50: return '50ml Mini';
    case 100: return '100ml';
    case 200: return '200ml Nip';
    case 375: return '375ml Half Pint';
    case 500: return '500ml';
    case 750: return '750ml Bottle';
    case 1000: return '1L Bottle';
    case 1500: return '1.5L Magnum';
    case 1750: return '1.75L Handle';
    case 3000: return '3L Double Magnum';
    default: return v.ml >= 1000 ? `${v.ml / 1000}L` : `${v.ml}ml`;
  }
}

export default function IngredientDetailScreen() {
  const {
    defaultPourSize,
    defaultRetailPrice,
    defaultRetailPrices,
    detailLevel,
    suggestedPriceRounding,
    minIngredientPrice,
  } = useAppStore();
  const router = useGuardedRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [showActions, setShowActions] = useState(false);
  const [showInUseSheet, setShowInUseSheet] = useState(false);

  const { ingredients, loadIngredients, deleteIngredient, updateIngredient } = useIngredientsStore();
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
  const effectiveRetailPrice =
    ingredient.retailPrice ??
    defaultRetailPrices[ingredient.type as keyof typeof defaultRetailPrices] ??
    defaultRetailPrice;

  // Selectable size: the inline default + any stored non-default configurations.
  // The isDefault config row (if present) is merged into the 'default' entry so
  // pack/distributor info is accessible without creating a duplicate dropdown option.
  const sizeOptions = useMemo(() => {
    const defaultConfig = ingredient.configurations?.find((c) => c.isDefault) ?? null;
    const opts: { value: string; label: string; size: Volume; cost: number; config: IngredientConfiguration | null }[] = [
      { value: 'default', label: volumeLabel(ingredient.productSize), size: ingredient.productSize, cost: ingredient.productCost, config: defaultConfig },
    ];
    for (const c of ingredient.configurations ?? []) {
      if (!c.isDefault) {
        opts.push({ value: c.id, label: volumeLabel(c.productSize), size: c.productSize, cost: c.productCost, config: c });
      }
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
  // Tier + pricing-mode-aware target. Free mode = bar-wide goal, no label.
  // Pro mode = tier ladder for spirits + per-category goals + tier label.
  const { targetGoal: tieredTarget, targetLabel } = useHeroTargetForIngredient({
    type: viewIngredient.type,
    productCost: Number(viewIngredient.productCost) || 0,
  });
  const suggestedRetail = applyPriceFloor(
    roundSuggestedPrice(
      calculateSuggestedPrice(metrics.costPerPour, tieredTarget / 100),
      suggestedPriceRounding,
    ),
    minIngredientPrice,
  );
  // Mirror cocktail-detail: only surface a Suggested Retail row when the
  // current pour cost is outside the target band. On-target = no noise.
  const ingredientPerf =
    tieredTarget > 0 && metrics.pourCostPercentage > 0
      ? getPerformance(
          metrics.pourCostPercentage / tieredTarget,
          metrics.pourCostPercentage - tieredTarget,
        )
      : { tier: 'onTarget' as const, label: 'On Target' };
  const isOnTarget = ingredientPerf.tier === 'onTarget';
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

      <ScrollView
        className="flex-1"
        bounces={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="pt-4 flex-col gap-6" style={{ flex: 1 }}>
          {/* Identity — icon left, eyebrow + name + identity subinfo right.
              The icon row covers exactly 3 lines (eyebrow, name, type/subtype/ABV);
              everything below — retail/pour subinfo, About section, etc. — flows
              full-width so we get out of the cramped right-column trap. */}
          <View className="px-6 flex-col gap-4">
            <View className="flex-row gap-4 items-start">
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
                      size={48}
                      color={icon.color}
                    />
                  );
                })()}
              </View>
              <View className="flex-1 flex-col justify-center gap-1">
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
                {/* Subinfo — type identity. Lives next to the icon. */}
                <Text className="text-base" style={{ color: colors.textSecondary }}>
                  {[
                    ingredient.type || 'Other',
                    ingredient.subType,
                    ingredient.abv != null ? `${ingredient.abv}% ABV` : null,
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </Text>
              </View>
            </View>
          </View>

          {/* ============================================================
              INFO TAB (detailLevel === 'simple')
              At-a-glance retail price + user notes + canonical About.
              ============================================================ */}
          {!isDetailed && (
            <>
              {/* Same StatCard as the Numbers tab. Wrapped in flex-row so the
                  StatCard's internal flex-1 has a row container to stretch
                  inside (otherwise the card collapses to 0 width on first
                  render — the bug where it "disappeared until you loaded
                  Numbers and came back"). */}
              <View className="px-6 flex-row">
                <StatCard
                  label={
                    isNotForSale
                      ? `${pourLabel(effectivePourSize)} Cost / Pour`
                      : `${pourLabel(effectivePourSize)} Retail Price`
                  }
                  value={
                    isNotForSale
                      ? formatCurrency(metrics.costPerPour)
                      : formatCurrency(effectiveRetailPrice)
                  }
                />
              </View>

              {ingredient.description ? (
                <View className="px-6 flex-col gap-2">
                  <ScreenTitle title="Notes" variant="muted" />
                  <Text
                    className="text-base leading-6"
                    style={{ color: colors.textSecondary }}
                  >
                    {ingredient.description}
                  </Text>
                </View>
              ) : null}

              <EducationPanel
                canonicalProductId={ingredient.canonicalProductId}
                overrides={{
                  brand: ingredient.brand,
                  origin: ingredient.origin,
                  flavorNotes: ingredient.flavorNotes,
                  parentCompany: ingredient.parentCompany,
                  foundedYear: ingredient.foundedYear,
                  productionRegion: ingredient.productionRegion,
                  agingYears: ingredient.agingYears,
                  educationData: ingredient.educationData,
                }}
              />
            </>
          )}

          {/* ============================================================
              NUMBERS TAB (detailLevel === 'detailed')
              Pour cost hero up top, then a single "Numbers" section with the
              bottle size header (dropdown if multi-size) + every cost detail
              the manager wants on screen. No bottom drawer.
              ============================================================ */}
          {isDetailed && (
            <>
              {/* Top StatCards — same layout as cocktail-detail. Retail + Margin
                  for sellable items; Purchase + Cost/Pour for not-for-sale. The
                  Retail label encodes the pour size to match the Info tab. */}
              <View className="px-6 flex-col gap-3">
                {!isNotForSale ? (
                  <View className="flex-row gap-3">
                    <StatCard
                      label={`${pourLabel(effectivePourSize)} Retail Price`}
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
                      value={formatCurrency(selectedOption.cost)}
                    />
                    <StatCard
                      label={`${pourLabel(effectivePourSize)} Cost / Pour`}
                      value={formatCurrency(metrics.costPerPour)}
                    />
                  </View>
                )}
                {!isNotForSale && !isOnTarget && (
                  <AiSuggestionRow
                    label="Suggested Retail"
                    value={formatCurrency(suggestedRetail)}
                    infoTermKey="suggestedPrice"
                    onApply={
                      suggestedRetail > 0
                        ? () => updateIngredient(ingredient.id, { retailPrice: suggestedRetail })
                        : undefined
                    }
                  />
                )}
              </View>

              {/* Pour Cost hero — for-sale only (cost-only items have no goal). */}
              {!isNotForSale && (
                <PourCostHero
                  pourCostPercentage={metrics.pourCostPercentage}
                  targetGoal={tieredTarget}
                  targetLabel={targetLabel ?? undefined}
                />
              )}

              {/* More Details — simple list of label/value pairs separated
                  by hairline dividers. Header reads "More Details" with the
                  size + container noun on the right (or a dropdown when the
                  ingredient has multiple sizes). Lives inline; no drawer. */}
              <View className="px-6 flex-col gap-3">
                <View className="flex-row items-center justify-between">
                  <ScreenTitle title="More Details" variant="muted" />
                  {hasMultipleSizes ? (
                    <View style={{ minWidth: 180 }}>
                      <Dropdown
                        value={selectedSizeKey}
                        onValueChange={setSelectedSizeKey}
                        options={sizeOptions.map((o) => ({
                          value: o.value,
                          label: sizeWithUnit(o.size),
                          sublabel: `$${o.cost.toFixed(2)}`,
                        }))}
                        label=""
                        placeholder={sizeWithUnit(selectedOption.size)}
                      />
                    </View>
                  ) : (
                    <Text
                      className="text-base"
                      style={{ color: colors.textSecondary, fontWeight: '600' }}
                    >
                      {sizeWithUnit(selectedOption.size)}
                    </Text>
                  )}
                </View>

                <View
                  className="rounded-xl px-4"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                  }}
                >
                  <DetailRow
                    label="Purchase Price"
                    value={formatCurrency(selectedOption.cost)}
                    isFirst
                  />
                  {selectedOption.config?.packSize != null && selectedOption.config.packSize > 1 && (
                    <DetailRow
                      label="Pack Size"
                      value={`${selectedOption.config.packSize} units`}
                    />
                  )}
                  {selectedOption.config?.packCost != null && (
                    <DetailRow
                      label="Pack Cost"
                      value={formatCurrency(selectedOption.config.packCost)}
                    />
                  )}
                  {selectedOption.config?.distributorName != null && (
                    <DetailRow
                      label="Distributor"
                      value={selectedOption.config.distributorName}
                    />
                  )}
                  <DetailRow
                    label="Cost / Oz"
                    value={formatCurrency(metrics.costPerOz)}
                  />
                  <DetailRow
                    label={`${pourLabel(effectivePourSize)} Cost / Pour`}
                    value={formatCurrency(metrics.costPerPour)}
                  />
                  <DetailRow
                    label="Pours / Bottle"
                    value={`${Math.floor(volumeToOunces(selectedOption.size) / Math.max(volumeToOunces(effectivePourSize), 0.01))}`}
                  />
                  <DetailRow
                    label="Last Updated"
                    value={new Date(ingredient.updatedAt).toLocaleDateString()}
                  />
                </View>
              </View>

              {/* Price History — only renders when there's invoice-driven history. */}
              <View className="px-6">
                <PriceHistory ingredientId={ingredient.id} />
              </View>
            </>
          )}

          {/* Bottom padding so content doesn't slam against the safe area. */}
          <View style={{ height: insets.bottom + 16 }} />
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
