import { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useAppStore, HARDCODED_BASE_CURRENCY } from '@/src/stores/app-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ImagePlaceholder from '@/src/components/ui/ImagePlaceholder';
import AiSuggestionRow from '@/src/components/ui/AiSuggestionRow';
import MetricRow from '@/src/components/ui/MetricRow';
import SectionDivider from '@/src/components/ui/SectionDivider';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import ActionSheet from '@/src/components/ui/ActionSheet';
import PourCostPerformanceBar from '@/src/components/PourCostPerformanceBar';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { FeedbackService } from '@/src/services/feedback-service';
import { Volume, volumeLabel, volumeToOunces } from '@/src/types/models';

/** Display-friendly pour size: "2oz", "3/4oz", "1 1/2oz" — fractions when possible */
function pourLabel(v: Volume): string {
  const oz = volumeToOunces(v);
  // Common fractions
  const fractions: [number, string][] = [
    [0.25, '1/4'], [0.5, '1/2'], [0.75, '3/4'],
    [1, '1'], [1.25, '1 1/4'], [1.5, '1 1/2'], [1.75, '1 3/4'],
    [2, '2'], [2.25, '2 1/4'], [2.5, '2 1/2'], [2.75, '2 3/4'],
    [3, '3'], [3.5, '3 1/2'], [4, '4'], [5, '5'], [6, '6'],
  ];
  const match = fractions.find(([val]) => Math.abs(val - oz) < 0.001);
  if (match) return `${match[1]}oz`;
  // Named volumes (dash, bspn, etc.) use volumeLabel
  if (v.kind === 'namedOunces' || v.kind === 'unitQuantity') return volumeLabel(v);
  return `${oz % 1 === 0 ? oz : oz.toFixed(1)}oz`;
}
import {
  calculateCocktailMetrics,
  calculatePourCostPercentage,
  formatCurrency,
  formatPercentage,
} from '@/src/services/calculation-service';

export default function CocktailDetailScreen() {
  const { defaultRetailPrice, ingredientOrderPref, pourCostGoal } = useAppStore();
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const [showActions, setShowActions] = useState(false);

  const { getCocktailById, loadCocktails, deleteCocktail } = useCocktailsStore();
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
          <Text style={{ color: colors.text }} className="text-lg">Loading...</Text>
        </View>
      </GradientBackground>
    );
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Cocktail',
      headerRight: () => (
        <Pressable onPress={() => setShowActions(true)} className="p-2">
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </Pressable>
      ),
    });
  }, [navigation, colors.text]);

  const metrics = calculateCocktailMetrics(cocktail.ingredients, pourCostGoal / 100);
  const retailPrice = cocktail.retailPrice ?? defaultRetailPrice;
  const pourCostPct = retailPrice > 0 ? calculatePourCostPercentage(metrics.totalCost, retailPrice) : 0;
  const totalVolume = cocktail.ingredients.reduce((sum, ing) => sum + volumeToOunces(ing.pourSize), 0);

  // Sort ingredients based on user preference
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

  // Image handling
  const cocktailImages: Record<string, any> = {
    margarita: require('@/assets/images/cocktail-images/margarita.jpg'),
    manhattan: require('@/assets/images/cocktail-images/manhattan.jpg'),
    mojito: require('@/assets/images/cocktail-images/mojito.jpg'),
    'espresso-martini': require('@/assets/images/cocktail-images/espresso-martini.jpg'),
    'gin-and-tonic': require('@/assets/images/cocktail-images/gin-and-tonic.jpg'),
  };

  const getImage = () => {
    if (!cocktail.imagePath) return null;
    if (cocktail.imagePath.startsWith('http')) return { uri: cocktail.imagePath };
    const key = cocktail.imagePath.replace('.jpg', '');
    return cocktailImages[key] ?? null;
  };

  const imageSource = getImage();

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
          {/* Hero — image + name + details */}
          <View className="flex-row gap-4">
            <ImagePlaceholder imageSource={imageSource} size="large" />

            {/* Name + Details */}
            <View className="flex-1 flex-col justify-center gap-2">
              <Text
                className="text-2xl pb-2 mb-1"
                style={{ color: colors.text, fontWeight: '700', borderBottomWidth: 1, borderBottomColor: palette.N1 }}
              >
                {cocktail.name}
              </Text>
              <Text className="text-lg" style={{ color: colors.textTertiary, fontWeight: '500' }}>
                Category: <Text style={{ color: colors.textSecondary }}>{cocktail.category || 'Other'}</Text>
              </Text>
              <Text className="text-lg" style={{ color: colors.textTertiary, fontWeight: '500' }}>
                Retail: <Text style={{ color: colors.textSecondary }}>{formatCurrency(retailPrice)}</Text>
              </Text>
              <Text className="text-lg" style={{ color: colors.textTertiary, fontWeight: '500' }}>
                Volume: <Text style={{ color: colors.textSecondary }}>{totalVolume.toFixed(1)}oz</Text>
              </Text>
            </View>
          </View>

          {/* Description / Notes */}
          {(cocktail.description || cocktail.notes) && (
            <View className="flex-col gap-2">
              <ScreenTitle title="Description" variant="group" />
              {cocktail.description && (
                <Text className="text-base leading-6" style={{ color: colors.textSecondary }}>
                  {cocktail.description}
                </Text>
              )}
              {cocktail.notes && (
                <Text className="text-sm leading-5" style={{ color: colors.textTertiary }}>
                  {cocktail.notes}
                </Text>
              )}
            </View>
          )}

          <SectionDivider />

          {/* Ingredients */}
          <View className="flex-col">
            <ScreenTitle title="Ingredients" variant="group" className="mb-2" />

            {sortedIngredients.map((ingredient, index) => {
              const pourOz = volumeToOunces(ingredient.pourSize);
              const costPerOz = pourOz > 0 ? ingredient.cost / pourOz : 0;
              const source = allIngredients.find(i => i.id === ingredient.ingredientId);

              return (
                <View key={ingredient.ingredientId + '-' + index}>
                  {index > 0 && <SectionDivider />}
                  <View style={{ paddingTop: 12, paddingBottom: 12 }}>
                    <View className="flex-row items-baseline justify-between">
                      <Text className="text-base flex-1" style={{ color: colors.text, fontWeight: '500' }}>
                        {pourLabel(ingredient.pourSize)} {ingredient.name}
                      </Text>
                      <Text className="text-base" style={{ color: colors.text, fontWeight: '600' }}>
                        {formatCurrency(ingredient.cost)}
                      </Text>
                    </View>
                    <View className="flex-row items-baseline justify-between" style={{ marginTop: 4 }}>
                      <Text className="text-sm" style={{ color: colors.textTertiary }}>
                        {source?.type || ''}
                      </Text>
                      <Text className="text-sm" style={{ color: colors.textTertiary }}>
                        {formatCurrency(costPerOz)}/oz
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          <SectionDivider />

          {/* Pricing */}
          <View className="flex-col gap-0">
            <ScreenTitle title="Pricing" variant="group" className="mb-2" />
            {[
              { label: 'Total Cost', value: formatCurrency(metrics.totalCost) },
              { label: 'Retail Price', value: formatCurrency(retailPrice) },
              { label: 'Margin', value: formatCurrency(metrics.profitMargin) },
              { label: 'Pour Cost', value: formatPercentage(pourCostPct) },
            ].map((row, index, arr) => (
              <View
                key={row.label}
                className="flex-row justify-between items-center py-3"
                style={index < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle } : undefined}
              >
                <Text className="text-base" style={{ color: colors.textSecondary }}>{row.label}</Text>
                <Text className="text-base" style={{ color: colors.text, fontWeight: '500' }}>{row.value}</Text>
              </View>
            ))}

            <AiSuggestionRow label="Suggested Price" value={formatCurrency(metrics.suggestedPrice)} className="mt-2" />
          </View>

          <SectionDivider />

          {/* Performance */}
          <PourCostPerformanceBar pourCostPercentage={pourCostPct} />

          {/* Footer */}
          <View className="items-center py-4">
            <Text className="text-xs" style={{ color: colors.textTertiary }}>
              Updated {new Date(cocktail.updatedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
