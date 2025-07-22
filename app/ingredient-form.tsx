import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/src/stores/app-store';
import { Ionicons } from '@expo/vector-icons';
import CustomSlider from '@/src/components/ui/CustomSlider';
import BottleSizeDropdown from '@/src/components/BottleSizeDropdown';
import TextInput from '@/src/components/ui/TextInput';
import PourCostPerformanceBar from '@/src/components/PourCostPerformanceBar';
import Card from '@/src/components/ui/Card';
import GradientBackground from '@/src/components/ui/GradientBackground';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import BackButton from '@/src/components/ui/BackButton';

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

/**
 * Ingredient creation and editing form
 * Handles both creating new ingredients and editing existing ones
 */
export default function IngredientFormScreen() {
  const insets = useSafeAreaInsets();
  const { baseCurrency } = useAppStore();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Check if we're editing an existing ingredient
  const isEditing = Boolean(params.id);
  const ingredientId = params.id as string;

  // Form state
  const [name, setName] = useState((params.name as string) || '');
  const [type, setType] = useState<IngredientType>(
    (params.type as IngredientType) || 'Liquor'
  );
  const [bottleSize, setBottleSize] = useState(
    Number(params.bottleSize) || 750
  );
  const [bottlePrice, setBottlePrice] = useState(
    Number(params.bottlePrice) || 25.0
  );
  const [retailPrice, setRetailPrice] = useState(
    Number(params.retailPrice) || 8.0
  );

  // Calculated values
  const bottleSizeOz = bottleSize / 29.5735;
  const costPerOz = bottlePrice / bottleSizeOz;
  const costFor15oz = costPerOz * 1.5;
  const pourCostPercentage = (costFor15oz / retailPrice) * 100;
  const suggestedRetail = costFor15oz / 0.2; // 20% pour cost target
  const pourCostMargin = retailPrice - costFor15oz;

  // Validation
  const isValid =
    name.trim().length > 0 &&
    bottlePrice > 0 &&
    retailPrice > 0 &&
    bottleSize > 0;

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

  // Get pour cost color
  const getPourCostColor = (pourCost: number) => {
    if (pourCost <= 15) return 'text-s22';
    if (pourCost <= 25) return 'text-s12';
    return 'text-e3';
  };

  // Handle save
  const handleSave = () => {
    if (!isValid) {
      Alert.alert(
        'Invalid Data',
        'Please fill in all required fields with valid values.'
      );
      return;
    }

    const ingredientData = {
      id: isEditing ? ingredientId : Date.now().toString(),
      name: name.trim(),
      type,
      bottleSize,
      price: bottlePrice,
      costPerOz,
      retailPrice,
      pourCost: pourCostPercentage,
      suggestedRetail,
      pourCostMargin,
      createdAt: isEditing
        ? (params.createdAt as string)
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    Alert.alert(
      isEditing ? 'Ingredient Updated' : 'Ingredient Created',
      `\"${name}\" has been ${isEditing ? 'updated' : 'saved'} successfully.\\n\\nCost/Oz: $${costPerOz.toFixed(3)}\\nPour Cost: ${pourCostPercentage.toFixed(1)}%`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  // Handle delete (only for editing)
  const handleDelete = () => {
    Alert.alert(
      'Delete Ingredient',
      `Are you sure you want to delete \"${name}\"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Deleted', `\"${name}\" has been deleted.`);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <GradientBackground>
      <ScrollView className="flex-1" style={{ paddingTop: insets.top }}>
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-3">
              <BackButton />
              <View>
                <ScreenTitle
                  title={isEditing ? 'Edit Ingredient' : 'Create Ingredient'}
                  variant="main"
                />
                <Text
                  className="text-g3 dark:text-n1"
                  style={{ fontFamily: 'Geist' }}
                >
                  {isEditing
                    ? 'Update ingredient details'
                    : 'Add a new ingredient to your library'}
                </Text>
              </View>
            </View>
          </View>

          {/* Basic Information */}
          <Card className="mb-4">
            <ScreenTitle
              title="Basic Information"
              variant="section"
              className="mb-4"
            />

            <View className="flex flex-col gap-4">
              <TextInput
                label="Ingredient Name *"
                value={name}
                onChangeText={setName}
                placeholder="e.g., Vodka (Premium), Simple Syrup"
              />

              <View>
                <Text
                  className="text-sm text-g4 dark:text-n1 mb-2"
                  style={{ fontFamily: 'Geist', fontWeight: '500' }}
                >
                  Type *
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {INGREDIENT_TYPES.map((ingredientType) => (
                    <Pressable
                      key={ingredientType}
                      onPress={() => setType(ingredientType)}
                      className={`px-3 py-2 rounded-lg border ${
                        type === ingredientType
                          ? 'bg-p1 border-p1'
                          : 'bg-n1/80 dark:bg-p3/80 border-g2/50 dark:border-p2/50'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          type === ingredientType
                            ? 'text-white'
                            : 'text-g4 dark:text-n1'
                        }`}
                        style={{ fontFamily: 'Geist', fontWeight: '500' }}
                      >
                        {ingredientType}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <BottleSizeDropdown
                label="Bottle Size *"
                value={bottleSize}
                onValueChange={setBottleSize}
              />
            </View>
          </Card>

          {/* Pricing Information */}
          <Card className="mb-4">
            <ScreenTitle
              title="Pricing & Costs"
              variant="section"
              className="mb-4"
            />

            <View className="flex flex-col gap-4">
              <CustomSlider
                label="Bottle Price *"
                minValue={1}
                maxValue={500}
                value={bottlePrice}
                onValueChange={setBottlePrice}
                unit={` ${baseCurrency} `}
                dynamicStep={getPriceStep}
                logarithmic={true}
              />

              <CustomSlider
                label="Retail Price (1.5oz) *"
                minValue={0.5}
                maxValue={50}
                value={retailPrice}
                onValueChange={setRetailPrice}
                unit={` ${baseCurrency} `}
                step={0.25}
              />
            </View>
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
                  style={{ fontFamily: 'Geist' }}
                >
                  Cost per Oz:
                </Text>
                <Text
                  className="text-g4 dark:text-n1"
                  style={{ fontFamily: 'Geist', fontWeight: '500' }}
                >
                  ${costPerOz.toFixed(3)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text
                  className="text-g3 dark:text-n1"
                  style={{ fontFamily: 'Geist' }}
                >
                  Cost for 1.5oz:
                </Text>
                <Text
                  className="text-g4 dark:text-n1"
                  style={{ fontFamily: 'Geist', fontWeight: '500' }}
                >
                  ${costFor15oz.toFixed(2)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text
                  className="text-g3 dark:text-n1"
                  style={{ fontFamily: 'Geist' }}
                >
                  Pour Cost:
                </Text>
                <Text
                  className={`${getPourCostColor(pourCostPercentage)}`}
                  style={{ fontFamily: 'Geist', fontWeight: '500' }}
                >
                  {pourCostPercentage.toFixed(1)}%
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text
                  className="text-g3 dark:text-n1"
                  style={{ fontFamily: 'Geist' }}
                >
                  Suggested Retail (20% target):
                </Text>
                <Text
                  className="text-p2 dark:text-p1"
                  style={{ fontFamily: 'Geist', fontWeight: '500' }}
                >
                  ${suggestedRetail.toFixed(2)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text
                  className="text-g3 dark:text-n1"
                  style={{ fontFamily: 'Geist' }}
                >
                  Profit Margin:
                </Text>
                <Text
                  className="text-s22 dark:text-s21"
                  style={{ fontFamily: 'Geist', fontWeight: '500' }}
                >
                  ${pourCostMargin.toFixed(2)}
                </Text>
              </View>
            </View>
          </Card>

          {/* Performance Indicator */}
          <Card className="mb-6">
            <ScreenTitle
              title="Performance Preview"
              variant="section"
              className="mb-4"
            />

            <PourCostPerformanceBar pourCostPercentage={pourCostPercentage} />
          </Card>

          {/* Action Buttons */}
          <View className="space-y-3">
            <Pressable
              onPress={handleSave}
              disabled={!isValid}
              className={`rounded-lg p-4 flex-row items-center justify-center gap-2 ${
                isValid ? 'bg-s21 dark:bg-s22' : 'bg-g2 dark:bg-g3'
              }`}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text
                className="text-white"
                style={{ fontFamily: 'Geist', fontWeight: '600' }}
              >
                {isEditing ? 'Update Ingredient' : 'Save Ingredient'}
              </Text>
            </Pressable>

            {isEditing && (
              <Pressable
                onPress={handleDelete}
                className="bg-e2 dark:bg-e3 rounded-lg p-4 flex-row items-center justify-center gap-2"
              >
                <Ionicons name="trash" size={20} color="white" />
                <Text
                  className="text-white"
                  style={{ fontFamily: 'Geist', fontWeight: '600' }}
                >
                  Delete Ingredient
                </Text>
              </Pressable>
            )}
          </View>

          <Text
            className="text-center text-g3 dark:text-n1 text-xs my-4"
            style={{ fontFamily: 'Geist' }}
          >
            * Required fields
          </Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
