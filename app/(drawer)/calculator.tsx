import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { type Href } from 'expo-router';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import GradientBackground from '@/src/components/ui/GradientBackground';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import Button from '@/src/components/ui/Button';
import StatCard from '@/src/components/ui/StatCard';
import Card from '@/src/components/ui/Card';
import CustomSlider from '@/src/components/ui/CustomSlider';
import IngredientInputs, { IngredientInputValues } from '@/src/components/IngredientInputs';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { useAppStore } from '@/src/stores/app-store';
import { formatCurrency, roundSuggestedPrice } from '@/src/services/calculation-service';
import { getPourChipsForContext } from '@/src/constants/appConstants';
import { Volume, volumeLabel, volumeToOunces } from '@/src/types/models';

export default function CalculatorScreen() {
  const router = useGuardedRouter();
  const colors = useThemeColors();
  const { pourCostGoal, suggestedPriceRounding } = useAppStore();

  const [values, setValues] = useState<IngredientInputValues>({
    ingredientType: 'Spirit',
    subType: '',
    productSize: { kind: 'milliliters', ml: 750 },
    productCost: 25.0,
    pourSize: 1.5,
    retailPrice: 8.0,
    pourCostPct: pourCostGoal,
    notForSale: false,
    garnishAmount: 50,
    garnishUnit: 'units',
    servingAmount: 1,
  });

  const handleChange = (updates: Partial<IngredientInputValues>) => {
    setValues(prev => ({ ...prev, ...updates }));
  };

  // Calculations
  const isGarnish = values.ingredientType === 'Garnish';
  const productSizeOz = volumeToOunces(values.productSize);
  const costPerOz = productSizeOz > 0 ? values.productCost / productSizeOz : 0;
  const standardCostPerPour = costPerOz * values.pourSize;
  const garnishCostPerServing = values.garnishAmount > 0
    ? (values.productCost / values.garnishAmount) * values.servingAmount
    : 0;

  const costPerPour = isGarnish ? garnishCostPerServing : standardCostPerPour;
  const rawSuggested = values.pourCostPct > 0 ? costPerPour / (values.pourCostPct / 100) : 0;
  const suggestedCharge = roundSuggestedPrice(rawSuggested, suggestedPriceRounding);
  const pourCostMargin = suggestedCharge - costPerPour;

  const garnishUnitLabel = isGarnish
    ? (['units', 'oz', 'ml'].find(u => u === values.garnishUnit) === 'units' ? 'units' : values.garnishUnit)
    : '';

  // Dynamic pour label: "1 Can", "16 oz", "1 Bottle", "32oz Growler", etc.
  const pourChips = getPourChipsForContext(values.ingredientType, values.productSize);
  const matchedChip = pourChips.find(c => Math.abs(c.oz - values.pourSize) < 0.001);
  const pourLabel = matchedChip?.label ?? `${values.pourSize} oz`;

  // Size labels used for the margin stat cards.
  const perPourSizeLabel = isGarnish
    ? `${values.servingAmount} ${garnishUnitLabel}`
    : pourLabel;
  const perProductSizeLabel = isGarnish
    ? `${values.garnishAmount} ${garnishUnitLabel}`
    : volumeLabel(values.productSize);

  // Total margin across the whole product (per-pour margin × uses per product).
  const usesPerProduct = isGarnish
    ? (values.servingAmount > 0 ? values.garnishAmount / values.servingAmount : 0)
    : (values.pourSize > 0 ? productSizeOz / values.pourSize : 0);
  const marginPerProduct = pourCostMargin * usesPerProduct;

  const handleSaveIngredient = () => {
    if (isGarnish) {
      const garnishVolume: Volume = values.garnishUnit === 'ml'
        ? { kind: 'milliliters', ml: values.garnishAmount }
        : values.garnishUnit === 'oz'
          ? { kind: 'decimalOunces', ounces: values.garnishAmount }
          : { kind: 'unitQuantity', unitType: 'oneThing', name: `${values.garnishAmount} units`, quantity: values.garnishAmount, ounces: values.garnishAmount };
      const servingVolume: Volume = values.garnishUnit === 'ml'
        ? { kind: 'milliliters', ml: values.servingAmount }
        : { kind: 'decimalOunces', ounces: values.servingAmount };

      router.navigate({
        pathname: '/ingredient-form',
        params: {
          type: values.ingredientType,
          productSize: JSON.stringify(garnishVolume),
          productCost: values.productCost.toString(),
          pourSize: JSON.stringify(servingVolume),
          notForSale: 'true',
        },
      } as Href);
    } else {
      router.navigate({
        pathname: '/ingredient-form',
        params: {
          type: values.ingredientType,
          subType: values.subType || '',
          productSize: JSON.stringify(values.productSize),
          productCost: values.productCost.toString(),
          retailPrice: suggestedCharge.toFixed(2),
          pourSize: JSON.stringify({ kind: 'decimalOunces', ounces: values.pourSize }),
        },
      } as Href);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="flex-col gap-7 pt-4 pb-16">
            {/* Inputs */}
            <View className="px-6 flex-col gap-3">
              <ScreenTitle title="Inputs" variant="muted" />
              <IngredientInputs
                variant="calculator"
                values={values}
                onChange={handleChange}
                hideOtherType
                noCard
              />
            </View>

            {/* Results — 2×2 stat grid */}
            <View className="px-6 flex-col gap-3">
              <ScreenTitle title="Results" variant="muted" className="mb-1" />
              <View className="flex-row gap-3">
                <StatCard
                  label={`Cost / ${perPourSizeLabel}`}
                  value={formatCurrency(costPerPour)}
                />
                <StatCard
                  label={`Margin / ${perPourSizeLabel}`}
                  value={formatCurrency(pourCostMargin)}
                  infoTermKey="margin"
                />
              </View>
              <View className="flex-row gap-3">
                <StatCard
                  label="Suggested Price"
                  value={formatCurrency(suggestedCharge)}
                  infoTermKey="suggestedPrice"
                />
                <StatCard
                  label={`Margin / ${perProductSizeLabel}`}
                  value={formatCurrency(marginPerProduct)}
                  infoTermKey="margin"
                />
              </View>

              {/* Pour Cost slider — styled as a stat card you can drag */}
              <Card padding="medium">
                <CustomSlider
                  variant="stat"
                  label="Pour Cost"
                  value={values.pourCostPct}
                  onValueChange={(val) => handleChange({ pourCostPct: Math.round(val) })}
                  minValue={10}
                  maxValue={35}
                  step={1}
                  formatValue={(v) => `${Math.round(v)}%`}
                />
              </Card>
            </View>

            {/* Save action */}
            <View className="px-6 flex-col gap-2">
              <Button
                variant="primary"
                icon="arrow-forward-circle-outline"
                fullWidth
                size="large"
                onPress={handleSaveIngredient}
              >
                Save as Ingredient
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}
