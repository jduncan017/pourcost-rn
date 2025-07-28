import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TextInput from '@/src/components/ui/TextInput';
import EmptyState from '@/src/components/EmptyState';
import PourCostPerformanceBar from '@/src/components/PourCostPerformanceBar';
import Card from '@/src/components/ui/Card';
import GradientBackground from '@/src/components/ui/GradientBackground';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import BackButton from '@/src/components/ui/BackButton';
import CocktailIngredientItem from '@/src/components/CocktailIngredientItem';
import { useIngredientSelectionStore } from '@/src/stores/ingredient-selection-store';
import {
  COCKTAIL_CATEGORIES,
  type CocktailCategory,
} from '@/src/constants/appConstants';

// Temporary local interface - will be replaced with canonical types in Phase 3.2
interface LocalCocktailIngredient {
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
  const { selectedIngredient, selectedIngredients, clearSelection } =
    useIngredientSelectionStore();

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
  const [retailPrice, setRetailPrice] = useState(
    (params.retailPrice as string) || '8.00'
  );
  const [preparationNotes, setPreparationNotes] = useState(
    (params.preparationNotes as string) || ''
  );
  const [ingredients, setIngredients] = useState<LocalCocktailIngredient[]>([]);

  // Load existing ingredients when editing
  useEffect(() => {
    if (isEditing && params.ingredients) {
      try {
        // Parse ingredients from params (assuming they're passed as JSON string)
        const existingIngredients =
          typeof params.ingredients === 'string'
            ? JSON.parse(params.ingredients)
            : params.ingredients;

        if (Array.isArray(existingIngredients)) {
          const formattedIngredients = existingIngredients.map(
            (ingredient: any) => {
              const bottleSizeOz = ingredient.bottleSize / 29.5735;
              const costPerOz = ingredient.bottlePrice / bottleSizeOz;
              const cost = costPerOz * ingredient.amount;

              return {
                id: ingredient.id,
                name: ingredient.name,
                amount: ingredient.amount || 0,
                unit: ingredient.unit || 'oz',
                bottleSize: ingredient.bottleSize || 750,
                bottlePrice: ingredient.bottlePrice || 0,
                type: ingredient.type || 'Unknown',
                costPerOz,
                cost,
              } as LocalCocktailIngredient;
            }
          );

          setIngredients(formattedIngredients);
        }
      } catch (error) {
        console.error('Error parsing existing ingredients:', error);
      }
    }
  }, [isEditing, params.ingredients]);

  // Listen for selected ingredients from ingredient selector
  useFocusEffect(
    React.useCallback(() => {
      if (selectedIngredients.length > 0) {
        // Add all selected ingredients at once
        const newIngredients = selectedIngredients.map((ingredient) => {
          const bottleSizeOz = ingredient.bottleSize / 29.5735;
          const costPerOz = ingredient.bottlePrice / bottleSizeOz;

          return {
            id: ingredient.id,
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            bottleSize: ingredient.bottleSize,
            bottlePrice: ingredient.bottlePrice,
            type: ingredient.type || 'Unknown',
            costPerOz,
            cost: ingredient.cost,
          } as LocalCocktailIngredient;
        });

        setIngredients((prevIngredients) => [
          ...prevIngredients,
          ...newIngredients.filter(
            (newIng) =>
              !prevIngredients.some((existing) => existing.id === newIng.id)
          ),
        ]);
        clearSelection();
      } else if (selectedIngredient) {
        addIngredient(selectedIngredient);
        clearSelection();
      }
    }, [selectedIngredients, selectedIngredient])
  );

  // Calculate totals with actual retail price
  const totalCost = ingredients.reduce((sum, ing) => sum + ing.cost, 0);
  const retailPriceNum = parseFloat(retailPrice) || 0;
  const profitMargin = retailPriceNum - totalCost;
  const pourCostPercentage =
    totalCost > 0 && retailPriceNum > 0
      ? (totalCost / retailPriceNum) * 100
      : 0;

  // Validation
  const isValid =
    name.trim().length > 0 &&
    ingredients.length > 0 &&
    parseFloat(retailPrice) > 0;

  // Add ingredient to cocktail (adapter for canonical CocktailIngredient)
  const addIngredient = (canonicalIngredient: any) => {
    // Convert canonical to local format
    const bottleSizeOz = canonicalIngredient.bottleSize / 29.5735;
    const costPerOz = canonicalIngredient.bottlePrice / bottleSizeOz;

    const localIngredient: LocalCocktailIngredient = {
      id: canonicalIngredient.id,
      name: canonicalIngredient.name,
      amount: canonicalIngredient.amount,
      unit: canonicalIngredient.unit,
      bottleSize: canonicalIngredient.bottleSize,
      bottlePrice: canonicalIngredient.bottlePrice,
      type: canonicalIngredient.type || 'Unknown',
      costPerOz,
      cost: canonicalIngredient.cost,
    };

    setIngredients([...ingredients, localIngredient]);
  };

  // Remove ingredient
  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  // Update ingredient amount
  const updateIngredientAmount = (id: string, newAmount: number) => {
    setIngredients(
      ingredients.map((ing) => {
        if (ing.id === id) {
          const bottleSizeOz = ing.bottleSize / 29.5735;
          const costPerOz = ing.bottlePrice / bottleSizeOz;
          const newCost = costPerOz * newAmount;
          return { ...ing, amount: newAmount, cost: newCost };
        }
        return ing;
      })
    );
  };

  // Update ingredient unit
  const updateIngredientUnit = (
    id: string,
    newUnit: 'oz' | 'ml' | 'drops' | 'splash'
  ) => {
    setIngredients(
      ingredients.map((ing) => {
        if (ing.id === id) {
          // Convert amount if needed (simple conversion for now)
          let convertedAmount = ing.amount;
          if (ing.unit === 'oz' && newUnit === 'ml') {
            convertedAmount = ing.amount * 29.5735;
          } else if (ing.unit === 'ml' && newUnit === 'oz') {
            convertedAmount = ing.amount / 29.5735;
          }

          const bottleSizeOz = ing.bottleSize / 29.5735;
          const costPerOz = ing.bottlePrice / bottleSizeOz;
          const newCost =
            costPerOz *
            (newUnit === 'oz' ? convertedAmount : convertedAmount / 29.5735);

          return {
            ...ing,
            unit: newUnit,
            amount: convertedAmount,
            cost: newCost,
          };
        }
        return ing;
      })
    );
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
      `\"${name}\" has been ${isEditing ? 'updated' : 'saved'} successfully.\\n\\nIngredients: ${ingredients.length}\\nTotal Cost: $${totalCost.toFixed(2)}\\nRetail Price: $${retailPriceNum.toFixed(2)}`,
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

  return (
    <GradientBackground>
      <ScrollView
        className="FormScroll flex-1"
        style={{ paddingTop: insets.top + 20 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
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
                <Text className="text-g3 dark:text-n1" style={{}}>
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

            <View className="flex flex-row gap-4 mb-4">
              {/* Image Box */}
              <Pressable className="w-24 h-24 bg-g2/30 dark:bg-g1/80 rounded-lg flex items-center justify-center">
                <Ionicons name="add" size={24} color="#585858" />
                <Text className="text-xs text-g3 dark:text-g3 mt-1 font-bold">
                  Add Photo
                </Text>
              </Pressable>

              {/* Cocktail Name */}
              <View className="flex-1">
                <TextInput
                  label="Cocktail Name *"
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Classic Margarita"
                />
              </View>
            </View>

            {/* Category */}
            <View>
              <Text
                className="text-g4 dark:text-n1 mb-2"
                style={{ fontWeight: '500' }}
              >
                Category
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row"
              >
                {COCKTAIL_CATEGORIES.map((cat, index) => (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={`px-3 py-2 rounded-lg border ${
                      category === cat
                        ? 'bg-p1 border-p1'
                        : 'bg-n1/80 dark:bg-p3/80 border-g2/50 dark:border-p2/50'
                    } ${index < COCKTAIL_CATEGORIES.length - 1 ? 'mr-2' : ''}`}
                  >
                    <Text
                      className={`text-sm ${
                        category === cat ? 'text-white' : 'text-g4 dark:text-n1'
                      }`}
                      style={{ fontWeight: '500' }}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Card>

          {/* Ingredients */}
          <Card className="mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <ScreenTitle
                title={`Ingredients (${ingredients.length})`}
                variant="section"
              />
              <Pressable
                onPress={() => router.push('/ingredient-selector')}
                className="flex-row items-center gap-2 px-3 py-2 bg-p1 rounded-lg"
              >
                <Ionicons name="add" size={16} color="white" />
                <Text className="text-white text-sm font-medium">Add</Text>
              </Pressable>
            </View>

            {ingredients.length === 0 ? (
              <EmptyState
                icon="wine"
                title="No ingredients added"
                description="Search and add ingredients above to build your cocktail"
              />
            ) : (
              <View className="IngredientsContainer flex flex-col gap-2">
                {ingredients.map((ingredient) => (
                  <View key={ingredient.id} className="IngredientWrapper mb-2">
                    <CocktailIngredientItem
                      ingredient={ingredient}
                      onRemove={removeIngredient}
                      onUpdateAmount={updateIngredientAmount}
                      onUpdateUnit={updateIngredientUnit}
                    />
                  </View>
                ))}
              </View>
            )}
          </Card>

          {/* Cost Analysis */}
          <Card className="mb-4">
            <ScreenTitle
              title="Cost Analysis"
              variant="section"
              className="mb-4"
            />

            <View className="flex flex-col gap-3">
              <TextInput
                label="Retail Price *"
                value={retailPrice}
                onChangeText={setRetailPrice}
                placeholder="8.00"
                keyboardType="decimal-pad"
              />
              <View className="flex-row justify-between">
                <Text className="text-g3 dark:text-n1" style={{}}>
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
                <Text className="text-g3 dark:text-n1" style={{}}>
                  Retail Price:
                </Text>
                <Text
                  className="text-g4 dark:text-n1"
                  style={{ fontWeight: '500' }}
                >
                  ${retailPriceNum.toFixed(2)}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-g3 dark:text-n1" style={{}}>
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

          {/* Details */}
          <Card className="mb-6">
            <ScreenTitle title="Details" variant="section" className="mb-4" />

            <View className="flex flex-col gap-4">
              <TextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Brief description of the cocktail"
                multiline
              />

              <TextInput
                label="Preparation Notes"
                value={preparationNotes}
                onChangeText={setPreparationNotes}
                placeholder="e.g., Shake well with ice, strain into a chilled glass"
                multiline
              />
            </View>
          </Card>

          {/* Action Buttons */}
          <View className="flex flex-row gap-3">
            <Pressable
              onPress={handleSave}
              disabled={!isValid}
              className={`flex-1 rounded-lg p-4 flex-row items-center justify-center gap-2 ${
                isValid ? 'bg-s21 dark:bg-s22' : 'bg-g3 dark:bg-g2/80'
              }`}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text className="text-white" style={{ fontWeight: '600' }}>
                Save
              </Text>
            </Pressable>

            {isEditing && (
              <Pressable
                onPress={handleDelete}
                className="flex-1 bg-e1 dark:bg-e2 rounded-lg p-4 flex-row items-center justify-center gap-2"
              >
                <Ionicons name="trash" size={20} color="white" />
                <Text className="text-white" style={{ fontWeight: '600' }}>
                  Delete
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
