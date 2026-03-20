import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { HARDCODED_MEASUREMENT_SYSTEM, HARDCODED_BASE_CURRENCY } from '@/src/stores/app-store';
import CustomSlider from '@/src/components/ui/CustomSlider';
import BottleSizeDropdown from '@/src/components/BottleSizeDropdown';
import Card from '@/src/components/ui/Card';
import GradientBackground from '@/src/components/ui/GradientBackground';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import SectionDivider from '@/src/components/ui/SectionDivider';
import Button from '@/src/components/ui/Button';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { formatCurrency } from '@/src/services/calculation-service';

// Calculator ingredient interface
interface CalculatorIngredient {
  id: string;
  name: string;
  bottleSize: number;
  bottlePrice: number;
  pourSize: number;
  pourCostPercentage: number;
  costPerOz: number;
  costPerPour: number;
}

/**
 * Calculator screen - supports both quick single ingredient calculations and cocktail building
 * Automatically switches between single ingredient mode and cocktail mode
 */
export default function CalculatorScreen() {
  const measurementSystem = HARDCODED_MEASUREMENT_SYSTEM;
  const baseCurrency = HARDCODED_BASE_CURRENCY;

  // Mode state
  const [mode, setMode] = useState<'single' | 'cocktail'>('single');
  const [cocktailIngredients, setCocktailIngredients] = useState<
    CalculatorIngredient[]
  >([]);
  const [cocktailName, setCocktailName] = useState('');

  // Single ingredient state
  const [bottleSize, setBottleSize] = useState(750); // ml
  const [bottlePrice, setBottlePrice] = useState(25.0);
  const [pourSize, setPourSize] = useState(1.5); // oz
  const [pourCostPercentage, setPourCostPercentage] = useState(20); // 20%

  // Convert bottle size from ml to oz for calculation
  const bottleSizeOz = bottleSize / 29.5735;

  // Calculate cost per pour: product price / product size (oz) * pour size (oz)
  const costPerPour = (bottlePrice / bottleSizeOz) * pourSize;

  // Calculate cost per oz
  const costPerOz = bottlePrice / bottleSizeOz;

  // Calculate suggested charge: cost per pour / pour cost percentage
  const suggestedCharge = costPerPour / (pourCostPercentage / 100);

  // Calculate pour cost margin
  const pourCostMargin = suggestedCharge - costPerPour;

  // Calculate cocktail totals
  const totalCocktailCost = cocktailIngredients.reduce(
    (sum, ing) => sum + ing.costPerPour,
    0
  );
  const averagePourCostPercentage =
    cocktailIngredients.length > 0
      ? cocktailIngredients.reduce(
          (sum, ing) => sum + ing.pourCostPercentage,
          0
        ) / cocktailIngredients.length
      : 20;
  const totalSuggestedCharge =
    totalCocktailCost / (averagePourCostPercentage / 100);
  const totalMargin = totalSuggestedCharge - totalCocktailCost;

  // Remove ingredient from cocktail
  const removeFromCocktail = (id: string) => {
    const updated = cocktailIngredients.filter((ing) => ing.id !== id);
    setCocktailIngredients(updated);

    // Switch back to single mode if no ingredients left
    if (updated.length === 0) {
      setMode('single');
      setCocktailName('');
    }
  };

  // Edit ingredient in cocktail
  const editCocktailIngredient = (id: string) => {
    const ingredient = cocktailIngredients.find((ing) => ing.id === id);
    if (ingredient) {
      Alert.alert(
        'Edit Ingredient',
        `Would open edit form for ${ingredient.name}`
      );
    }
  };

  // Save cocktail
  const saveCocktail = () => {
    if (cocktailIngredients.length === 0) {
      Alert.alert(
        'No Ingredients',
        'Add ingredients to your cocktail before saving.'
      );
      return;
    }

    const name = cocktailName.trim() || 'Untitled Cocktail';
    Alert.alert(
      'Cocktail Saved',
      `"${name}" has been saved with ${cocktailIngredients.length} ingredients.\n\nTotal Cost: $${totalCocktailCost.toFixed(2)}\nSuggested Price: $${totalSuggestedCharge.toFixed(2)}`
    );
  };

  // Clear cocktail
  const clearCocktail = () => {
    Alert.alert(
      'Clear Cocktail',
      'Are you sure you want to clear all ingredients?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setCocktailIngredients([]);
            setCocktailName('');
            setMode('single');
          },
        },
      ]
    );
  };

  // Handle saving single ingredient
  const handleSaveIngredient = () => {
    Alert.prompt(
      'Save Ingredient',
      'Enter a name for this ingredient:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Save',
          onPress: (ingredientName: string | undefined) => {
            if (ingredientName && ingredientName.trim()) {
              // Mock save functionality - would save to ingredients store
              const ingredientData = {
                name: ingredientName.trim(),
                bottleSize,
                bottlePrice,
                pourSize,
                pourCostPercentage,
                costPerOz,
                retailPrice: suggestedCharge,
                costPerPour,
                pourCostMargin,
                type: 'Liquor', // Default type
                createdAt: new Date().toISOString(),
              };

              Alert.alert(
                'Ingredient Saved',
                `"${ingredientName}" has been saved to your ingredients list.\n\nCost/Oz: $${costPerOz.toFixed(2)}\nSuggested Retail: $${suggestedCharge.toFixed(2)}`
              );
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // Dynamic step functions matching original PourCost
  const getPriceStep = (value: number): number => {
    if (value < 30) return 0.25;
    if (value < 50) return 0.5;
    if (value < 100) return 1;
    if (value < 150) return 2;
    if (value < 200) return 5;
    if (value < 300) return 10;
    if (value < 1000) return 25;
    if (value < 2000) return 50;
    return 100;
  };

  const getPourCostStep = (value: number): number => {
    if (value < 5) return 1;
    if (value < 10) return 0.5;
    if (value < 30) return 0.25;
    if (value < 50) return 2;
    if (value < 75) return 5;
    return 5;
  };

  const colors = useThemeColors();

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="flex-col gap-5 p-4">
          {/* Subtitle */}
          <Text
            className="text-base pb-4"
            style={{ color: colors.textSecondary, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}
          >
            Quickly calculate the cost and pricing for a single spirit
          </Text>

          {/* INPUTS section */}
          <ScreenTitle title="INPUTS" variant="group" />

          <Card displayClasses="flex flex-col gap-4" padding="large">
            <BottleSizeDropdown
              label="Bottle Size"
              value={bottleSize}
              onValueChange={setBottleSize}
            />

            <CustomSlider
              label="Product Cost"
              minValue={1}
              maxValue={5000}
              value={bottlePrice}
              onValueChange={setBottlePrice}
              unit={` ${baseCurrency} `}
              dynamicStep={getPriceStep}
              logarithmic={true}
            />

            <CustomSlider
              label="Pour Size"
              minValue={0.25}
              maxValue={8}
              value={pourSize}
              onValueChange={setPourSize}
              unit=" oz"
              step={0.25}
            />

            <CustomSlider
              label="Pour Cost %"
              minValue={1}
              maxValue={100}
              value={pourCostPercentage}
              onValueChange={setPourCostPercentage}
              unit="%"
              dynamicStep={getPourCostStep}
              pourCostScale={true}
            />
          </Card>

          <SectionDivider />

          {/* RESULTS section */}
          <ScreenTitle title="Results" variant="group" className="mb-2" />

          <Card padding="large">
            {/* Hero result */}
            <View className="items-center pb-4 mb-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text className="text-sm" style={{ color: colors.textTertiary }}>Cost Per Pour</Text>
              <Text className="text-4xl mt-1" style={{ color: colors.text, fontWeight: '700' }}>
                {formatCurrency(costPerPour)}
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textTertiary }}>
                {pourSize.toFixed(2)}oz pour • {pourCostPercentage}% pour cost
              </Text>
            </View>

            {/* Metric rows */}
            {[
              { label: 'Suggested Charge', value: formatCurrency(suggestedCharge) },
              { label: 'Cost per Oz', value: formatCurrency(costPerOz) },
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
          </Card>

          {/* Save action */}
          <Button
            variant="success"
            icon="bookmark"
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
            Save your calculated ingredient for use in cocktail recipes
          </Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
