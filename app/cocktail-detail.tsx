import { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { useAppStore } from '@/src/stores/app-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AiSuggestionRow from '@/src/components/ui/AiSuggestionRow';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import ActionSheet from '@/src/components/ui/ActionSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatCard from '@/src/components/ui/StatCard';
import DetailLevelToggle from '@/src/components/ui/DetailLevelToggle';
import PourCostHero, { getPerformance } from '@/src/components/PourCostHero';
import { useHeroTargetForCocktail } from '@/src/lib/useHeroTarget';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { FeedbackService } from '@/src/services/feedback-service';
import { Volume, volumeLabel, volumeToOunces } from '@/src/types/models';
import { ensureDate } from '@/src/lib/ensureDate';
import {
  calculateCocktailMetrics,
  calculatePourCostPercentage,
  formatCurrency,
  roundSuggestedPrice,
  applyPriceFloor,
} from '@/src/services/calculation-service';

/** Display-friendly pour size: "2oz", "0.75oz", "1.5oz". Decimal everywhere.
 *  For garnish-style unit quantities (a cherry, a peel, a twist) we render
 *  just the count — the noun is duplicated in the ingredient name in col 2,
 *  so "1 Maraschino Cherry" reads cleaner than "1 cherry Maraschino Cherry".
 *  Pack-style unit quantities (oneCanOrBottle, e.g. "6 pack") keep their
 *  descriptive name since the ingredient name doesn't repeat the size. */
function pourLabel(v: Volume): string {
  if (v.kind === 'unitQuantity') {
    if (v.unitType === 'oneThing') return String(v.quantity);
    return volumeLabel(v);
  }
  if (v.kind === 'namedOunces') return volumeLabel(v);
  const oz = volumeToOunces(v);
  const formatted = oz % 1 === 0 ? oz : Number(oz.toFixed(2));
  return `${formatted}oz`;
}

/** Mirror of ingredient-detail's DetailRow. Single label/value row with a
 *  hairline divider above each row except the first. Used in the Numbers-tab
 *  More Details list (replaces the previous bottom-drawer Ledger). */
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


export default function CocktailDetailScreen() {
  const {
    defaultRetailPrice,
    ingredientOrderPref,
    pourCostGoal,
    detailLevel,
    suggestedPriceRounding,
    minCocktailPrice,
  } = useAppStore();
  const router = useGuardedRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const [showActions, setShowActions] = useState(false);

  const { getCocktailById, loadCocktails, deleteCocktail, updateCocktail } =
    useCocktailsStore();
  const { ingredients: allIngredients } = useIngredientsStore();
  const cocktailId = params.id as string;
  const cocktail = getCocktailById(cocktailId);

  useEffect(() => {
    if (!cocktail) loadCocktails();
  }, [cocktail, loadCocktails]);

  if (!cocktail) {
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
      headerTitle: () => <DetailLevelToggle simpleLabel="SPECS" detailedLabel="NUMBERS" />,
      headerTitleAlign: 'center',
      headerRight: () => (
        <Pressable onPress={() => setShowActions(true)} className="p-2">
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </Pressable>
      ),
    });
  }, [navigation, colors.text]);

  const isDetailed = detailLevel === 'detailed';
  const { targetLabel: cocktailTargetLabel } = useHeroTargetForCocktail();
  const retailPrice = cocktail.retailPrice ?? defaultRetailPrice;
  const metrics = calculateCocktailMetrics(
    cocktail.ingredients,
    pourCostGoal / 100,
    retailPrice
  );
  const pourCostPct =
    retailPrice > 0
      ? calculatePourCostPercentage(metrics.totalCost, retailPrice)
      : 0;
  // Hide the Suggested Price row when pour cost is already on target. It's
  // noise when the user's existing menu price is dialed in; only shows up
  // when there's a meaningful delta to act on.
  const performance =
    pourCostGoal > 0 && pourCostPct > 0
      ? getPerformance(pourCostPct / pourCostGoal, pourCostPct - pourCostGoal)
      : { tier: 'onTarget' as const };
  const isOnTarget = performance.tier === 'onTarget';
  const totalVolume = cocktail.ingredients.reduce(
    (sum, ing) => sum + volumeToOunces(ing.pourSize),
    0
  );

  const sortedIngredients = [...cocktail.ingredients].sort((a, b) => {
    switch (ingredientOrderPref) {
      case 'most-to-least':
        return volumeToOunces(b.pourSize) - volumeToOunces(a.pourSize);
      case 'least-to-most':
        return volumeToOunces(a.pourSize) - volumeToOunces(b.pourSize);
      case 'cost-high-low':
        return b.cost - a.cost;
      case 'manual':
      default:
        return (a.order ?? 0) - (b.order ?? 0);
    }
  });

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
        createdAt: ensureDate(cocktail.createdAt).toISOString(),
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

  const cocktailImages: Record<string, any> = {
    margarita: require('@/assets/images/cocktail-images/margarita.jpg'),
    manhattan: require('@/assets/images/cocktail-images/manhattan.jpg'),
    mojito: require('@/assets/images/cocktail-images/mojito.jpg'),
    'espresso-martini': require('@/assets/images/cocktail-images/espresso-martini.jpg'),
    'gin-and-tonic': require('@/assets/images/cocktail-images/gin-and-tonic.jpg'),
  };

  const getImage = () => {
    if (!cocktail.imagePath) return null;
    if (cocktail.imagePath.startsWith('http'))
      return { uri: cocktail.imagePath };
    const key = cocktail.imagePath.replace('.jpg', '');
    return cocktailImages[key] ?? null;
  };

  const imageSource = getImage();
  const insets = useSafeAreaInsets();
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
          {/* Identity — image + name + description */}
          <View className="px-6 flex-row gap-4">
            {imageSource && (
              <Image
                source={imageSource}
                className="w-20 h-20 rounded-xl"
                style={{ borderWidth: 1, borderColor: colors.borderSubtle }}
                resizeMode="cover"
              />
            )}
            <View className="flex-1 flex-col gap-1.5">
              <Text
                className="text-xs"
                style={{
                  color: colors.gold,
                  letterSpacing: 1.5,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                }}
              >
                Cocktail
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: 'PlayfairDisplay_600SemiBold_Italic',
                  fontSize: 32,
                  lineHeight: 38,
                }}
                numberOfLines={2}
              >
                {cocktail.name}
              </Text>
              {cocktail.description ? (
                <Text
                  className="text-sm leading-5"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={3}
                >
                  {cocktail.description}
                </Text>
              ) : (
                <Text
                  className="text-sm"
                  style={{ color: colors.textTertiary }}
                >
                  {cocktail.category || 'Other'}
                </Text>
              )}
            </View>
          </View>

          {/* Menu Price — always visible. Sits between the hero and the
              recipe so the bartender + manager both anchor on what the
              cocktail sells for before reading the build. */}
          <View className="px-6 flex-col gap-3">
            <View className="flex-row gap-3">
              <StatCard
                label="Menu Price"
                value={formatCurrency(retailPrice)}
              />
              {isDetailed && (
                <StatCard
                  label="Margin"
                  value={formatCurrency(metrics.profitMargin)}
                  infoTermKey="margin"
                />
              )}
            </View>
          </View>

          {/* THE BUILD — open 3-col list. Page anchor for both bartender and
              manager. Sits ABOVE the Pour Cost Hero per the dual-persona
              design: bartender reads the recipe; manager scrolls past for
              the financial story. */}
          <View className="px-6 flex-col gap-1">
            <ScreenTitle title="The Build" variant="muted" className="mb-1" />

            {sortedIngredients.map((ingredient, index) => {
              const pourOz = volumeToOunces(ingredient.pourSize);
              const costPerOz = pourOz > 0 ? ingredient.cost / pourOz : 0;
              const source = allIngredients.find(
                (i) => i.id === ingredient.ingredientId
              );
              const subtitle = [
                source?.subType || source?.type,
                `${formatCurrency(costPerOz)}/oz`,
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <View
                  key={ingredient.ingredientId + '-' + index}
                  className="flex-row items-start py-3"
                  style={
                    index < sortedIngredients.length - 1
                      ? {
                          borderBottomWidth: 1,
                          borderBottomColor: colors.borderSubtle,
                        }
                      : undefined
                  }
                >
                  {/* Col 1: gold pour size (weight 500) */}
                  <View style={{ width: 64 }}>
                    <Text
                      className="text-base"
                      style={{ color: colors.gold, fontWeight: '500' }}
                    >
                      {pourLabel(ingredient.pourSize)}
                    </Text>
                  </View>
                  {/* Col 2: name (weight 700, cream) + metadata */}
                  <View className="flex-1 pr-2">
                    <Text
                      className="text-base"
                      style={{ color: palette.N2, fontWeight: '700' }}
                      numberOfLines={1}
                    >
                      {ingredient.name}
                    </Text>
                    {isDetailed && subtitle ? (
                      <Text
                        className="text-xs mt-0.5"
                        style={{ color: colors.textTertiary }}
                        numberOfLines={1}
                      >
                        {subtitle}
                      </Text>
                    ) : null}
                  </View>
                  {/* Col 3: cost — detailed only. Simple mode stays focused
                      on the recipe build, not the cost breakdown. */}
                  {isDetailed && (
                    <Text
                      className="text-base"
                      style={{ color: colors.text, fontWeight: '600' }}
                    >
                      {formatCurrency(ingredient.cost)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Notes — build/prep instructions, shown whenever present (both modes).
              Placed here so the recipe + prep reads as one unit before performance data. */}
          {cocktail.notes ? (
            <View className="px-6 flex-col gap-2">
              <ScreenTitle title="Notes" variant="muted" />
              <Text
                className="text-sm leading-5"
                style={{ color: colors.textTertiary }}
              >
                {cocktail.notes}
              </Text>
            </View>
          ) : null}

          {/* ============================================================
              NUMBERS TAB (detailLevel === 'detailed')
              Pour Cost hero, suggested price (when off-target), and the
              inline More Details list. Replaces the old bottom-drawer Ledger. */}
          {isDetailed && (
            <>
              {/* Pour Cost hero — edge-to-edge, headline performance metric. */}
              <PourCostHero
                pourCostPercentage={pourCostPct}
                targetLabel={cocktailTargetLabel ?? undefined}
              />

              {/* Suggested Price with Apply — only when off-target AND the
                  suggestion would actually change the price. Without the
                  delta gate, recipes with retail already at the floor or
                  rounding-equal to the suggestion render an Apply that
                  writes the same value (looks like Apply does nothing). */}
              {!isOnTarget && (() => {
                const suggested = applyPriceFloor(
                  roundSuggestedPrice(metrics.suggestedPrice, suggestedPriceRounding),
                  minCocktailPrice,
                );
                const wouldChangePrice = Math.abs(suggested - retailPrice) >= 0.01;
                if (suggested <= 0 || !wouldChangePrice) return null;
                return (
                  <View className="px-6">
                    <AiSuggestionRow
                      label="Suggested Price"
                      value={formatCurrency(suggested)}
                      infoTermKey="suggestedPrice"
                      onApply={() =>
                        updateCocktail(cocktail.id, { retailPrice: suggested })
                      }
                    />
                  </View>
                );
              })()}

              {/* More Details — inline list (mirrors ingredient-detail). */}
              <View className="px-6 flex-col gap-3">
                <ScreenTitle title="More Details" variant="muted" />
                <View
                  className="rounded-xl px-4"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                  }}
                >
                  <DetailRow
                    label="Cost Of Goods"
                    value={formatCurrency(metrics.totalCost)}
                    isFirst
                  />
                  <DetailRow
                    label="Total Volume"
                    value={`${totalVolume.toFixed(2)} oz`}
                  />
                  <DetailRow
                    label="Category"
                    value={cocktail.category || 'Other'}
                  />
                  <DetailRow
                    label="Last Updated"
                    value={new Date(cocktail.updatedAt).toLocaleDateString()}
                  />
                </View>
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
