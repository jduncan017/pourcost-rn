import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/src/stores/app-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { Ionicons } from '@expo/vector-icons';
import CustomSlider from '@/src/components/ui/CustomSlider';
import BottleSizeDropdown from '@/src/components/BottleSizeDropdown';
import TextInput from '@/src/components/ui/TextInput';
import Card from '@/src/components/ui/Card';
import GradientBackground from '@/src/components/ui/GradientBackground';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import BackButton from '@/src/components/ui/BackButton';
import { IngredientWithCalculations } from '@/src/types/models';
import { FeedbackService } from '@/src/services/feedback-service';
import { IngredientService } from '@/src/services/ingredient-service';
import { getIngredientsWithCalculations } from '@/src/services/mock-data';

// Ingredient type options
const INGREDIENT_TYPES = [
  'Beer',
  'Wine',
  'Liquor',
  'Mixer',
  'Syrup',
  'Juice',
  'Other',
] as const;
type IngredientType = (typeof INGREDIENT_TYPES)[number];

// Use IngredientWithCalculations from models.ts instead of local interface

/**
 * Ingredient detail and edit screen
 * Shows comprehensive ingredient data and allows editing
 */
export default function IngredientDetailScreen() {
  const insets = useSafeAreaInsets();
  const { baseCurrency } = useAppStore();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get ingredient store
  const { ingredients, loadIngredients, deleteIngredient, updateIngredient } = useIngredientsStore();
  
  // Get ingredient ID from params
  const ingredientId = params.id as string;
  
  // Parse ingredient data from params (in real app, would fetch by ID)
  const [isEditing, setIsEditing] = useState(false);

  // Find the ingredient from the store
  const storeIngredient = ingredients.find(ing => ing.id === ingredientId);
  
  // Load ingredients if not already loaded
  useEffect(() => {
    if (!storeIngredient && ingredients.length === 0) {
      loadIngredients();
    }
  }, [ingredientId, ingredients.length]); // Use ingredientId and ingredients.length as stable deps

  // Show loading if ingredient not found
  if (!storeIngredient) {
    return (
      <GradientBackground>
        <View style={{ paddingTop: insets.top }} className="flex-1 items-center justify-center">
          <Text className="text-n1 text-lg">Loading ingredient...</Text>
        </View>
      </GradientBackground>
    );
  }

  // State for ingredient with calculations
  const [ingredient, setIngredient] = useState<IngredientWithCalculations | null>(null);
  
  // Separate state for retail price (not stored in ingredient model)
  const [retailPrice, setRetailPrice] = useState(8.0);
  
  // Convert SavedIngredient to IngredientWithCalculations when store ingredient changes
  useEffect(() => {
    if (storeIngredient) {
      const pourSize = 1.5; // Default pour size in oz
      const ingredientWithCalcs = IngredientService.calculateIngredientMetrics(
        storeIngredient, 
        pourSize, 
        retailPrice, 
        baseCurrency
      );
      setIngredient(ingredientWithCalcs);
    }
  }, [storeIngredient, retailPrice, baseCurrency]);

  // Global pour cost goal (would come from settings store)
  const globalPourCostGoal = 20; // 20%

  // Show loading if ingredient state not ready
  if (!ingredient) {
    return (
      <GradientBackground>
        <View style={{ paddingTop: insets.top }} className="flex-1 items-center justify-center">
          <Text className="text-n1 text-lg">Loading ingredient...</Text>
        </View>
      </GradientBackground>
    );
  }
  
  // Calculate suggested retail price to meet pour cost goal (after null check)
  const suggestedRetailPrice = ingredient.costPerPour / (globalPourCostGoal / 100);

  // Calculate derived values when core values change
  const calculateDerivedValues = (updatedIngredient: Partial<IngredientWithCalculations>) => {
    const updated = { ...ingredient, ...updatedIngredient };

    // Calculate cost per oz from bottle price and size
    const bottleSizeOz = updated.bottleSize / 29.5735;
    const costPerOz = updated.bottlePrice / bottleSizeOz;

    // Calculate pour cost percentage (cost for 1.5oz / retail price)
    const costFor15oz = costPerOz * 1.5;
    const pourCost = (costFor15oz / retailPrice) * 100;

    // Calculate suggested retail based on global pour cost goal
    const suggestedRetail = costFor15oz / (globalPourCostGoal / 100);

    // Calculate pour cost margin
    const pourCostMargin = retailPrice - costFor15oz;

    return {
      ...updated,
      costPerOz,
      pourCostPercentage: pourCost,
      costPerPour: costFor15oz,
      pourCostMargin,
      updatedAt: new Date(),
    };
  };

  // Handle ingredient updates
  const handleUpdate = (field: keyof IngredientWithCalculations, value: any) => {
    const updatedIngredient = calculateDerivedValues({ [field]: value });
    setIngredient(updatedIngredient);
  };

  // Handle save
  const handleSave = async () => {
    try {
      await updateIngredient({
        id: ingredient.id,
        name: ingredient.name,
        bottlePrice: ingredient.bottlePrice,
        type: ingredient.type,
        bottleSize: ingredient.bottleSize,
      });
      setIsEditing(false);
    } catch (error) {
      // Error will be handled by the feedback service
    }
  };

  // Handle delete
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

  // Get pour cost color
  const getPourCostColor = (pourCost: number) => {
    if (pourCost <= 15) return 'text-s22';
    if (pourCost <= 25) return 'text-s12';
    return 'text-e3';
  };

  // Dynamic step functions
  const getPriceStep = (value: number): number => {
    if (value < 30) return 0.25;
    if (value < 50) return 0.5;
    if (value < 100) return 1;
    if (value < 150) return 2;
    if (value < 200) return 5;
    if (value < 300) return 10;
    if (value < 1000) return 25;
    return 50;
  };

  return (
    <GradientBackground style={{ paddingTop: insets.top }}>
      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-3">
              <BackButton />
              <View>
                <ScreenTitle
                  title={isEditing ? `Edit ${ingredient.name}` : ingredient.name}
                  variant="main"
                />
                <Text
                  className="text-g3 dark:text-n1"
                  style={{}}
                >
                  {ingredient.type} • Created{' '}
                  {new Date(ingredient.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-2">
              {!isEditing ? (
                <>
                  <Pressable
                    onPress={() => setIsEditing(true)}
                    className="bg-p2 dark:bg-p1 rounded-lg p-3 flex-row items-center gap-2"
                  >
                    <Ionicons name="pencil" size={16} color="white" />
                    <Text
                      className="text-white"
                      style={{ fontWeight: '500' }}
                    >
                      Edit
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleDelete}
                    className="bg-e2 dark:bg-e3 rounded-lg p-3"
                  >
                    <Ionicons name="trash" size={16} color="white" />
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    onPress={() => setIsEditing(false)}
                    className="bg-g3 dark:bg-g4 rounded-lg p-3"
                  >
                    <Text
                      className="text-white"
                      style={{ fontWeight: '500' }}
                    >
                      Cancel
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleSave}
                    className="bg-s21 dark:bg-s22 rounded-lg p-3 flex-row items-center gap-2"
                  >
                    <Ionicons name="checkmark" size={16} color="white" />
                    <Text
                      className="text-white"
                      style={{ fontWeight: '500' }}
                    >
                      Save
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* Basic Information */}
          <Card className="mb-4">
            <ScreenTitle
              title="Basic Information"
              variant="section"
              className="mb-4"
            />

            {isEditing ? (
              <View className="space-y-4">
                <TextInput
                  label="Name"
                  value={ingredient.name}
                  onChangeText={(value) => handleUpdate('name', value)}
                  placeholder="Enter ingredient name"
                />

                <View>
                  <Text
                    className="text-sm text-g4 dark:text-n1 mb-2"
                    style={{ fontWeight: '500' }}
                  >
                    Type
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {INGREDIENT_TYPES.map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => handleUpdate('type', type)}
                        className={`px-3 py-2 rounded-lg border ${
                          ingredient.type === type
                            ? 'bg-p1 border-p1'
                            : 'bg-n1/80 dark:bg-p3/80 border-g2/50 dark:border-p2/50'
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            ingredient.type === type
                              ? 'text-white'
                              : 'text-g4 dark:text-n1'
                          }`}
                          style={{ fontWeight: '500' }}
                        >
                          {type}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <BottleSizeDropdown
                  label="Bottle Size"
                  value={ingredient.bottleSize}
                  onValueChange={(value) => handleUpdate('bottleSize', value)}
                />
              </View>
            ) : (
              <View className="space-y-3">
                <View className="flex-row justify-between">
                  <Text
                    className="text-g3 dark:text-n1"
                    style={{}}
                  >
                    Name:
                  </Text>
                  <Text
                    className="text-g4 dark:text-n1"
                    style={{ fontWeight: '500' }}
                  >
                    {ingredient.name}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text
                    className="text-g3 dark:text-n1"
                    style={{}}
                  >
                    Type:
                  </Text>
                  <Text
                    className="text-g4 dark:text-n1"
                    style={{ fontWeight: '500' }}
                  >
                    {ingredient.type}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text
                    className="text-g3 dark:text-n1"
                    style={{}}
                  >
                    Bottle Size:
                  </Text>
                  <Text
                    className="text-g4 dark:text-n1"
                    style={{ fontWeight: '500' }}
                  >
                    {ingredient.bottleSize}ml
                  </Text>
                </View>
              </View>
            )}
          </Card>

          {/* Pricing Information */}
          <Card className="mb-4">
            <ScreenTitle
              title="Pricing & Costs"
              variant="section"
              className="mb-4"
            />

            {isEditing ? (
              <View className="space-y-4">
                <CustomSlider
                  label="Bottle Price"
                  minValue={1}
                  maxValue={500}
                  value={ingredient.bottlePrice}
                  onValueChange={(value) => handleUpdate('bottlePrice', value)}
                  unit={` ${baseCurrency} `}
                  dynamicStep={getPriceStep}
                  logarithmic={true}
                />

                <CustomSlider
                  label="Retail Price (1.5oz)"
                  minValue={0.5}
                  maxValue={50}
                  value={retailPrice}
                  onValueChange={(value) => setRetailPrice(value)}
                  unit={` ${baseCurrency} `}
                  step={0.25}
                />
              </View>
            ) : (
              <View className="space-y-3">
                <View className="flex-row justify-between">
                  <Text
                    className="text-g3 dark:text-n1"
                    style={{}}
                  >
                    Bottle Price:
                  </Text>
                  <Text
                    className="text-g4 dark:text-n1"
                    style={{ fontWeight: '500' }}
                  >
                    ${(ingredient.bottlePrice || 0).toFixed(2)}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text
                    className="text-g3 dark:text-n1"
                    style={{}}
                  >
                    Retail Price (1.5oz):
                  </Text>
                  <Text
                    className="text-g4 dark:text-n1"
                    style={{ fontWeight: '500' }}
                  >
                    ${retailPrice.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
          </Card>

          {/* Calculated Values */}
          <Card className="mb-4">
            <ScreenTitle
              title="Calculated Values"
              variant="section"
              className="mb-4"
            />

            <View className="space-y-3">
              <View className="flex-row justify-between items-center">
                <Text
                  className="text-g3 dark:text-n1"
                  style={{}}
                >
                  Cost per Oz:
                </Text>
                <Text
                  className="text-g4 dark:text-n1"
                  style={{ fontWeight: '500' }}
                >
                  ${(ingredient.costPerOz || 0).toFixed(3)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text
                  className="text-g3 dark:text-n1"
                  style={{}}
                >
                  Pour Cost:
                </Text>
                <Text
                  className={`font-geist ${getPourCostColor(ingredient.pourCostPercentage)}`}
                  style={{ fontWeight: '500' }}
                >
                  {(ingredient.pourCostPercentage || 0).toFixed(1)}%
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text
                  className="text-g3 dark:text-n1"
                  style={{}}
                >
                  Suggested Retail ({globalPourCostGoal}% target):
                </Text>
                <Text
                  className="text-p2 dark:text-p1"
                  style={{ fontWeight: '500' }}
                >
                  ${(suggestedRetailPrice || 0).toFixed(2)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text
                  className="text-g3 dark:text-n1"
                  style={{}}
                >
                  Pour Cost Margin:
                </Text>
                <Text
                  className="text-s22 dark:text-s21"
                  style={{ fontWeight: '500' }}
                >
                  ${(ingredient.pourCostMargin || 0).toFixed(2)}
                </Text>
              </View>
            </View>
          </Card>

          {/* Performance Metrics */}
          <Card className="mb-4">
            <ScreenTitle
              title="Performance Metrics"
              variant="section"
              className="mb-4"
            />

            <View className="space-y-4">
              {/* Pour Cost Indicator */}
              <View>
                <View className="flex-row justify-between mb-2">
                  <Text
                    className="text-sm text-g3 dark:text-n1"
                    style={{}}
                  >
                    Pour Cost Performance
                  </Text>
                  <Text
                    className={`text-sm ${getPourCostColor(ingredient.pourCostPercentage)}`}
                    style={{ fontWeight: '500' }}
                  >
                    {(ingredient.pourCostPercentage || 0).toFixed(1)}% of {globalPourCostGoal}%
                    target
                  </Text>
                </View>
                <View className="h-3 bg-g1/80 rounded-full overflow-hidden">
                  <View
                    className={`h-full rounded-full ${
                      ingredient.pourCostPercentage <= 15
                        ? 'bg-s22'
                        : ingredient.pourCostPercentage <= 25
                          ? 'bg-s12'
                          : 'bg-e2'
                    }`}
                    style={{
                      width: `${Math.min((ingredient.pourCostPercentage / globalPourCostGoal) * 100, 100)}%`,
                    }}
                  />
                </View>
              </View>

              {/* Profit Analysis */}
              <View className="bg-n1 dark:bg-p3/80 p-3 rounded-lg">
                <Text
                  className="text-sm text-g4 dark:text-n1 mb-2"
                  style={{ fontWeight: '500' }}
                >
                  Profit Analysis
                </Text>
                <Text
                  className="text-xs text-g3 dark:text-n1"
                  style={{}}
                >
                  Current retail price of ${(retailPrice || 0).toFixed(2)}{' '}
                  generates a margin of ${(ingredient.pourCostMargin || 0).toFixed(2)}{' '}
                  per 1.5oz serve.
                  {ingredient.pourCostPercentage > globalPourCostGoal
                    ? ` Consider raising price to $${(suggestedRetailPrice || 0).toFixed(2)} to meet ${globalPourCostGoal}% target.`
                    : ` You're ${(globalPourCostGoal - (ingredient.pourCostPercentage || 0)).toFixed(1)}% below target - good performance!`}
                </Text>
              </View>
            </View>
          </Card>

          {/* Last Updated */}
          <Card>
            <Text
              className="text-sm text-g3 dark:text-n1 text-center"
              style={{}}
            >
              Last updated: {new Date(ingredient.updatedAt).toLocaleString()}
            </Text>
          </Card>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
