import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import GradientBackground from '@/src/components/ui/GradientBackground';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import SectionDivider from '@/src/components/ui/SectionDivider';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';
import CustomSlider from '@/src/components/ui/CustomSlider';
import IngredientInputs, { IngredientInputValues } from '@/src/components/IngredientInputs';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { useAppStore } from '@/src/stores/app-store';
import { formatCurrency } from '@/src/services/calculation-service';
import { getPourChipsForContext } from '@/src/constants/appConstants';
import { Volume, volumeToOunces } from '@/src/types/models';

export default function CalculatorScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { pourCostGoal } = useAppStore();

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
  const suggestedCharge = values.pourCostPct > 0 ? costPerPour / (values.pourCostPct / 100) : 0;
  const pourCostMargin = suggestedCharge - costPerPour;

  const garnishUnitLabel = isGarnish
    ? (['units', 'oz', 'ml'].find(u => u === values.garnishUnit) === 'units' ? 'units' : values.garnishUnit)
    : '';

  // Dynamic pour label: "1 Can", "16 oz", "1 Bottle", "32oz Growler", etc.
  const pourChips = getPourChipsForContext(values.ingredientType, values.productSize);
  const matchedChip = pourChips.find(c => Math.abs(c.oz - values.pourSize) < 0.001);
  const pourLabel = matchedChip?.label ?? `${values.pourSize} oz`;

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
          <View className="flex-col gap-5 p-4">
            <Text
              className="text-base pb-4"
              style={{ color: colors.textSecondary, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}
            >
              Quickly calculate cost and pricing for any ingredient
            </Text>

            <ScreenTitle title="INPUTS" variant="group" />

            <IngredientInputs
              variant="calculator"
              values={values}
              onChange={handleChange}
              hideOtherType
            />

            <SectionDivider />

            <ScreenTitle title="RESULTS" variant="group" />

            <Card padding="large">
              {/* Hero — Cost per [pour label] */}
              <View className="flex-row justify-between items-center pb-4 mb-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text className="text-xl" style={{ color: colors.textSecondary, fontWeight: '500' }}>
                  {isGarnish
                    ? `Cost per ${values.servingAmount} ${garnishUnitLabel}`
                    : `Cost per ${pourLabel}`
                  }
                </Text>
                <Text className="text-2xl" style={{ color: colors.text, fontWeight: '700' }}>
                  {formatCurrency(costPerPour)}
                </Text>
              </View>

              {[
                { label: 'Suggested Charge', value: formatCurrency(suggestedCharge) },
                ...(isGarnish
                  ? [{ label: `Cost per ${garnishUnitLabel.replace(/s$/, '')}`, value: formatCurrency(values.garnishAmount > 0 ? values.productCost / values.garnishAmount : 0) }]
                  : [{ label: 'Cost per Oz', value: formatCurrency(costPerOz) }]
                ),
                { label: 'Margin', value: formatCurrency(pourCostMargin) },
              ].map((row, index) => (
                <View
                  key={row.label}
                  className="flex-row justify-between items-center py-3"
                  style={index < 2 ? { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle } : undefined}
                >
                  <Text className="text-base" style={{ color: colors.textSecondary }}>{row.label}</Text>
                  <Text className="text-base" style={{ color: colors.text, fontWeight: '500' }}>{row.value}</Text>
                </View>
              ))}

              {/* Target Pour Cost slider */}
              <View
                className="mt-4 p-4 rounded-xl"
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
              >
                <CustomSlider
                  label="Target Pour Cost"
                  value={values.pourCostPct}
                  onValueChange={(val) => handleChange({ pourCostPct: Math.round(val) })}
                  minValue={10}
                  maxValue={35}
                  step={1}
                  formatValue={(v) => `${Math.round(v)}%`}
                />
              </View>
            </Card>

            <Button
              variant="primary"
              icon="arrow-forward-circle-outline"
              fullWidth
              size="large"
              onPress={handleSaveIngredient}
            >
              Save as Ingredient
            </Button>

            <Text
              className="text-center text-sm"
              style={{ color: colors.textTertiary }}
            >
              Opens the ingredient form with these values pre-filled
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}
