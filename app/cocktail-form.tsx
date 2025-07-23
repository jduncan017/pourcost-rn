import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TextInput from '@/src/components/ui/TextInput';
import EmptyState from '@/src/components/EmptyState';
import PourCostPerformanceBar from '@/src/components/PourCostPerformanceBar';
import Card from '@/src/components/ui/Card';
import GradientBackground from '@/src/components/ui/GradientBackground';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import IngredientSearchBar from '@/src/components/IngredientSearchBar';
import BackButton from '@/src/components/ui/BackButton';

// Cocktail category options
const COCKTAIL_CATEGORIES = [
  'Classic',
  'Modern',
  'Tropical',
  'Whiskey',
  'Vodka',
  'Rum',
  'Gin',
  'Tequila',
  'Other',
] as const;
type CocktailCategory = (typeof COCKTAIL_CATEGORIES)[number];

interface CocktailIngredient {
  id: string;
  name: string;
  amount: number;
  unit: 'oz' | 'ml' | 'drops' | 'splash';
  bottleSize: number;
  bottlePrice: number;
  type: string;
  costPerOz: number;
  cost: number; // cost for this amount
}

/**
 * Cocktail creation and editing form
 * Handles both creating new cocktails and editing existing ones
 */
export default function CocktailFormScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Check if we're editing an existing cocktail
  const isEditing = Boolean(params.id);

  // Form state
  const [name, setName] = useState((params.name as string) || '');
  const [description, setDescription] = useState(
    (params.description as string) || ''
  );
  const [category, setCategory] = useState<CocktailCategory>(
    (params.category as CocktailCategory) || 'Classic'
  );
  const [notes, setNotes] = useState((params.notes as string) || '');
  const [ingredients, setIngredients] = useState<CocktailIngredient[]>([]);

  // Calculate totals
  const totalCost = ingredients.reduce((sum, ing) => sum + ing.cost, 0);
  const averagePourCostPercentage = 20; // Default target
  const suggestedPrice = totalCost / (averagePourCostPercentage / 100);
  const profitMargin = suggestedPrice - totalCost;
  const pourCostPercentage =
    totalCost > 0 ? (totalCost / suggestedPrice) * 100 : 0;

  // Validation
  const isValid = name.trim().length > 0 && ingredients.length > 0;

  // Add ingredient to cocktail
  const addIngredient = (ingredient: CocktailIngredient) => {
    setIngredients([...ingredients, ingredient]);
  };

  // Remove ingredient
  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  // Handle save
  const handleSave = () => {
    if (!isValid) {
      Alert.alert(
        'Invalid Data',
        'Please enter a cocktail name and add at least one ingredient.'
      );
      return;
    }

    // Here we would save the cocktail data to the store/database
    // const cocktailData = { ... }

    Alert.alert(
      isEditing ? 'Cocktail Updated' : 'Cocktail Created',
      `\"${name}\" has been ${isEditing ? 'updated' : 'saved'} successfully.\\n\\nIngredients: ${ingredients.length}\\nTotal Cost: $${totalCost.toFixed(2)}\\nSuggested Price: $${suggestedPrice.toFixed(2)}`,
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
      'Delete Cocktail',
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

  // Get pour cost color
  const getPourCostColor = (pourCost: number) => {
    if (pourCost <= 15) return 'text-s22';
    if (pourCost <= 25) return 'text-s12';
    return 'text-e3';
  };

  return (
    <GradientBackground>
      <ScrollView 
        className="FormScroll flex-1"
        style={{ paddingTop: insets.top }}
      >
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-3">
              <BackButton />
              <View>
                <ScreenTitle
                  title={isEditing ? 'Edit Cocktail' : 'Create Cocktail'}
                  variant="main"
                />
                <Text
                  className="text-g3 dark:text-n1"
                  style={{}}
                >
                  {isEditing
                    ? 'Update cocktail recipe'
                    : 'Build your cocktail recipe'}
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
                label="Cocktail Name *"
                value={name}
                onChangeText={setName}
                placeholder="e.g., Classic Margarita, Espresso Martini"
              />

              <TextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Brief description of the cocktail"
                multiline
              />

              <View>
                <Text
                  className="text-sm text-g4 dark:text-n1 mb-2"
                  style={{ fontWeight: '500' }}
                >
                  Category
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row gap-2"
                >
                  {COCKTAIL_CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      className={`px-3 py-2 rounded-lg border ${
                        category === cat
                          ? 'bg-p1 border-p1'
                          : 'bg-n1/80 dark:bg-p3/80 border-g2/50 dark:border-p2/50'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          category === cat
                            ? 'text-white'
                            : 'text-g4 dark:text-n1'
                        }`}
                        style={{ fontWeight: '500' }}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Card>

          {/* Ingredients */}
          <Card className="mb-4">
            <ScreenTitle
              title={`Ingredients (${ingredients.length})`}
              variant="section"
              className="mb-4"
            />

            {/* Ingredient Search Bar */}
            <View className="mb-4">
              <IngredientSearchBar
                onAddIngredient={addIngredient}
                placeholder="Search and add ingredients..."
              />
            </View>

            {ingredients.length === 0 ? (
              <EmptyState
                icon="wine"
                title="No ingredients added"
                description="Search and add ingredients above to build your cocktail"
              />
            ) : (
              <View className="flex flex-col gap-2">
                {ingredients.map((ingredient) => (
                  <View key={ingredient.id} className="mb-2">
                    {/* Ingredient display matching screenshot design */}
                    <View className="bg-p3/90 dark:bg-p4/90 p-3 rounded-lg">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text
                            className="text-n1 text-lg"
                            style={{ fontWeight: '600' }}
                          >
                            {ingredient.name}
                          </Text>
                          <Text
                            className="text-n1/80 text-sm"
                            style={{}}
                          >
                            {ingredient.type}
                          </Text>
                        </View>

                        <View className="flex-row items-center gap-4">
                          {/* Amount */}
                          <Text
                            className="text-n1"
                            style={{ fontWeight: '500' }}
                          >
                            {ingredient.amount}
                            {ingredient.unit}
                          </Text>

                          {/* ABV placeholder */}
                          <Text
                            className="text-n1/80"
                            style={{ fontWeight: '500' }}
                          >
                            40% ABV
                          </Text>

                          {/* Cost per unit */}
                          <Text
                            className="text-n1"
                            style={{ fontWeight: '600' }}
                          >
                            ${ingredient.costPerOz.toFixed(2)}/{ingredient.unit}
                          </Text>

                          {/* Total cost */}
                          <Text
                            className="text-s12 dark:text-s11"
                            style={{ fontWeight: '700' }}
                          >
                            Total: ${ingredient.cost.toFixed(2)}
                          </Text>

                          {/* Delete button */}
                          <Pressable
                            onPress={() => removeIngredient(ingredient.id)}
                            className="ml-2 p-1"
                          >
                            <Ionicons
                              name="close-circle"
                              size={20}
                              color="rgba(255,255,255,0.8)"
                            />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>

          {/* Cost Analysis */}
          {ingredients.length > 0 && (
            <Card className="mb-4">
              <ScreenTitle
                title="Cost Analysis"
                variant="section"
                className="mb-4"
              />

              <View className="flex flex-col gap-3">
                <View className="flex-row justify-between">
                  <Text
                    className="text-g3 dark:text-n1"
                    style={{}}
                  >
                    Total Cost:
                  </Text>
                  <Text
                    className="text-g4 dark:text-n1"
                    style={{ fontWeight: '500' }}
                  >
                    ${totalCost.toFixed(2)}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text
                    className="text-g3 dark:text-n1"
                    style={{}}
                  >
                    Suggested Price:
                  </Text>
                  <Text
                    className="text-g4 dark:text-n1"
                    style={{ fontWeight: '500' }}
                  >
                    ${suggestedPrice.toFixed(2)}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text
                    className="text-g3 dark:text-n1"
                    style={{}}
                  >
                    Pour Cost:
                  </Text>
                  <Text
                    className={`${getPourCostColor(pourCostPercentage)}`}
                    style={{ fontWeight: '500' }}
                  >
                    {pourCostPercentage.toFixed(1)}%
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text
                    className="text-g3 dark:text-n1"
                    style={{}}
                  >
                    Profit Margin:
                  </Text>
                  <Text
                    className="text-s22 dark:text-s21"
                    style={{ fontWeight: '500' }}
                  >
                    ${profitMargin.toFixed(2)}
                  </Text>
                </View>

                {/* Performance Indicator */}
                <View className="mt-4 pt-3 border-t border-g2/40 dark:border-p2/50">
                  <PourCostPerformanceBar
                    pourCostPercentage={pourCostPercentage}
                  />
                </View>
              </View>
            </Card>
          )}

          {/* Notes */}
          <Card className="mb-6">
            <ScreenTitle
              title="Notes & Instructions"
              variant="section"
              className="mb-4"
            />

            <TextInput
              label="Preparation Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g., Shake vigorously, serve in salt-rimmed glass"
              multiline
            />
          </Card>

          {/* Action Buttons */}
          <View className="flex flex-col gap-3">
            <Pressable
              onPress={handleSave}
              disabled={!isValid}
              className={`rounded-lg p-4 flex-row items-center justify-center gap-2 ${
                isValid ? 'bg-s21 dark:bg-s22' : 'bg-g3 dark:bg-g2/80'
              }`}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text
                className="text-white"
                style={{ fontWeight: '600' }}
              >
                {isEditing ? 'Update Cocktail' : 'Save Cocktail'}
              </Text>
            </Pressable>

            {isEditing && (
              <Pressable
                onPress={handleDelete}
                className="bg-e1 dark:bg-e2 rounded-lg p-4 flex-row items-center justify-center gap-2"
              >
                <Ionicons name="trash" size={20} color="white" />
                <Text
                  className="text-white"
                  style={{ fontWeight: '600' }}
                >
                  Delete Cocktail
                </Text>
              </Pressable>
            )}
          </View>

          <Text
            className="text-center text-g3 dark:text-n1 text-xs my-4"
            style={{}}
          >
            * Required fields
          </Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
