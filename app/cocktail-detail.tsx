import { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useAppStore } from '@/src/stores/app-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AiSuggestionRow from '@/src/components/ui/AiSuggestionRow';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import ActionSheet from '@/src/components/ui/ActionSheet';
import InfoIcon from '@/src/components/ui/InfoIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatCard from '@/src/components/ui/StatCard';
import DetailLevelToggle from '@/src/components/ui/DetailLevelToggle';
import PourCostHero from '@/src/components/PourCostHero';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { FeedbackService } from '@/src/services/feedback-service';
import { Volume, volumeLabel, volumeToOunces } from '@/src/types/models';
import { ensureDate } from '@/src/lib/ensureDate';
import {
  calculateCocktailMetrics,
  calculatePourCostPercentage,
  formatCurrency,
} from '@/src/services/calculation-service';

/** Display-friendly pour size: "2oz", "3/4oz", "1 1/2oz" — fractions when possible */
function pourLabel(v: Volume): string {
  const oz = volumeToOunces(v);
  const fractions: [number, string][] = [
    [0.25, '1/4'],
    [0.5, '1/2'],
    [0.75, '3/4'],
    [1, '1'],
    [1.25, '1 1/4'],
    [1.5, '1 1/2'],
    [1.75, '1 3/4'],
    [2, '2'],
    [2.25, '2 1/4'],
    [2.5, '2 1/2'],
    [2.75, '2 3/4'],
    [3, '3'],
    [3.5, '3 1/2'],
    [4, '4'],
    [5, '5'],
    [6, '6'],
  ];
  const match = fractions.find(([val]) => Math.abs(val - oz) < 0.001);
  if (match) return `${match[1]}oz`;
  if (v.kind === 'namedOunces' || v.kind === 'unitQuantity')
    return volumeLabel(v);
  return `${oz % 1 === 0 ? oz : oz.toFixed(1)}oz`;
}

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

export default function CocktailDetailScreen() {
  const { defaultRetailPrice, ingredientOrderPref, pourCostGoal, detailLevel } =
    useAppStore();
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const [showActions, setShowActions] = useState(false);

  const { getCocktailById, loadCocktails, deleteCocktail } =
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

          {/* Stats group — twin stat cards + AI suggestion, equal gap */}
          <View className="px-6 flex-col gap-3">
            <View className="flex-row gap-3">
              <StatCard
                label="Menu Price"
                value={formatCurrency(retailPrice)}
              />
              <StatCard
                label="Margin"
                value={formatCurrency(metrics.profitMargin)}
                infoTermKey="margin"
              />
            </View>
            {isDetailed && (
              <AiSuggestionRow
                label="Suggested Price"
                value={formatCurrency(metrics.suggestedPrice)}
                infoTermKey="suggestedPrice"
              />
            )}
          </View>

          {/* THE BUILD — open 3-col list. Page anchor for both bartender and manager. */}
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
                  {/* Col 3: cost */}
                  <Text
                    className="text-base"
                    style={{ color: colors.text, fontWeight: '600' }}
                  >
                    {formatCurrency(ingredient.cost)}
                  </Text>
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

          {/* Pour Cost hero — detailed only, edge-to-edge. Sits below the recipe. */}
          {isDetailed && <PourCostHero pourCostPercentage={pourCostPct} />}

          {/* LEDGER — detailed only. Final section: edge-to-edge gradient runs
              to the bottom of the page. Updated date lives here as the last row. */}
          {isDetailed && (
            <LinearGradient
              colors={[palette.B9 + '50', palette.N9] as const}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ marginTop: 'auto' }}
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
                  label="Cost Of Goods"
                  value={formatCurrency(metrics.totalCost)}
                  colors={colors}
                  infoTermKey="cogs"
                />
                <LedgerRow
                  label="Total Volume"
                  value={`${totalVolume.toFixed(2)} oz`}
                  colors={colors}
                />
                <LedgerRow
                  label="Category"
                  value={cocktail.category || 'Other'}
                  colors={colors}
                />
                <LedgerRow
                  label="Last Updated"
                  value={new Date(cocktail.updatedAt).toLocaleDateString()}
                  colors={colors}
                />
              </View>
            </LinearGradient>
          )}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
