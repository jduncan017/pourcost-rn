import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import ChipSelector from '@/src/components/ui/ChipSelector';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { useAppStore } from '@/src/stores/app-store';
import TextInput from '@/src/components/ui/TextInput';
import EmptyState from '@/src/components/EmptyState';
import PourCostPerformanceBar from '@/src/components/PourCostPerformanceBar';
import ActionSheet from '@/src/components/ui/ActionSheet';
import GradientBackground from '@/src/components/ui/GradientBackground';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import CocktailIngredientItem from '@/src/components/CocktailIngredientItem';
import { useIngredientSelectionStore } from '@/src/stores/ingredient-selection-store';
import {
  COCKTAIL_CATEGORIES,
} from '@/src/constants/appConstants';
import { CocktailIngredient, CocktailCategory, Volume, volumeToOunces, volumeLabel } from '@/src/types/models';
import { calculateCostPerPour, calculateCostPerOz } from '@/src/services/calculation-service';

/**
 * Cocktail creation and editing form
 * Handles both creating new cocktails and editing existing ones
 */
export default function CocktailFormScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { selectedIngredient, selectedIngredients, clearSelection } =
    useIngredientSelectionStore();
  const { defaultRetailPrice } = useAppStore();

  const colors = useThemeColors();
  const [showActions, setShowActions] = useState(false);

  // Check if we're editing an existing cocktail
  const isEditing = Boolean(params.id);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Cocktail' : 'Create Cocktail',
      headerRight: isEditing
        ? () => (
            <Pressable onPress={() => setShowActions(true)} className="p-2">
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
            </Pressable>
          )
        : undefined,
    });
  }, [isEditing, navigation, colors.text]);

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
    (params.retailPrice as string) || defaultRetailPrice.toFixed(2)
  );
  const [preparationNotes, setPreparationNotes] = useState(
    (params.preparationNotes as string) || ''
  );
  const [ingredients, setIngredients] = useState<CocktailIngredient[]>([]);

  // Load existing ingredients when editing
  useEffect(() => {
    if (isEditing && params.ingredients) {
      try {
        const existingIngredients =
          typeof params.ingredients === 'string'
            ? JSON.parse(params.ingredients)
            : params.ingredients;

        if (Array.isArray(existingIngredients)) {
          const formattedIngredients: CocktailIngredient[] = existingIngredients.map(
            (ingredient: any) => ({
              ingredientId: ingredient.ingredientId || ingredient.id,
              name: ingredient.name,
              productSize: ingredient.productSize,
              productCost: ingredient.productCost || 0,
              pourSize: ingredient.pourSize,
              cost: ingredient.cost || 0,
            })
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
        setIngredients((prevIngredients) => [
          ...prevIngredients,
          ...selectedIngredients.filter(
            (newIng) =>
              !prevIngredients.some((existing) => existing.ingredientId === newIng.ingredientId)
          ),
        ]);
        clearSelection();
      } else if (selectedIngredient) {
        setIngredients((prev) => {
          if (prev.some((ing) => ing.ingredientId === selectedIngredient.ingredientId)) return prev;
          return [...prev, selectedIngredient];
        });
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

  // Remove ingredient
  const removeIngredient = (ingredientId: string) => {
    setIngredients(ingredients.filter((ing) => ing.ingredientId !== ingredientId));
  };

  // Update ingredient pour size (in ounces)
  const updateIngredientAmount = (ingredientId: string, newOzAmount: number) => {
    setIngredients(
      ingredients.map((ing) => {
        if (ing.ingredientId === ingredientId) {
          const newPourSize: Volume = { kind: 'decimalOunces', ounces: newOzAmount };
          const newCost = calculateCostPerPour(ing.productSize, ing.productCost, newPourSize);
          return { ...ing, pourSize: newPourSize, cost: newCost };
        }
        return ing;
      })
    );
  };

  const { addCocktail, updateCocktail, deleteCocktail } = useCocktailsStore();
  const [isSaving, setIsSaving] = useState(false);
  const cocktailId = params.id as string;

  // Handle save
  const handleSave = async () => {
    if (!isValid) {
      Alert.alert('Invalid Data', 'Please enter a cocktail name and add at least one ingredient.');
      return;
    }

    setIsSaving(true);
    try {
      const cocktailData = {
        name: name.trim(),
        description: description.trim() || undefined,
        category: category as CocktailCategory,
        notes: notes.trim() || undefined,
        ingredients,
        retailPrice: parseFloat(retailPrice) || undefined,
        favorited: false,
      };

      if (isEditing) {
        await updateCocktail(cocktailId, cocktailData);
      } else {
        await addCocktail(cocktailData);
      }
      router.back();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save cocktail');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = () => {
    Alert.alert(
      'Delete Cocktail',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCocktail(cocktailId);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete cocktail');
            }
          },
        },
      ]
    );
  };

  return (
    <GradientBackground>
      <ScrollView
        className="FormScroll flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View className="p-4 pt-6 flex-col gap-6">
          {/* Basic Information */}
          <View className="flex-col gap-4">
            <View className="flex flex-row gap-4">
              {/* Image Box */}
              <Pressable className="w-24 h-24 bg-g2/30 dark:bg-p3/60 rounded-lg flex items-center justify-center border border-g2/50 dark:border-p2/50">
                <Ionicons name="add" size={24} color={colors.textSecondary} />
                <Text className="text-xs text-g3 dark:text-g2 mt-1 font-bold">
                  Add Photo
                </Text>
              </Pressable>

              {/* Cocktail Name */}
              <View className="flex-1 justify-center">
                <TextInput
                  label="Cocktail Name *"
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Classic Margarita"
                  size="large"
                />
              </View>
            </View>

            {/* Category */}
            <ChipSelector
              label="Category"
              options={COCKTAIL_CATEGORIES.filter((cat) => cat !== 'All')}
              selectedOption={category}
              onSelectionChange={(cat) => setCategory(cat as CocktailCategory)}
              variant="filter"
            />
          </View>

          {/* Divider */}
          <View className="h-px bg-g2/30 dark:bg-p2/50" />

          {/* Ingredients */}
          <View className="flex-col gap-3">
            <View className="flex-row items-center justify-between">
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
              <View className="flex-col gap-2">
                {ingredients.map((ingredient, index) => (
                  <CocktailIngredientItem
                    key={ingredient.ingredientId + '-' + index}
                    ingredient={ingredient}
                    onRemove={removeIngredient}
                    onUpdateAmount={updateIngredientAmount}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Divider */}
          <View className="h-px bg-g2/30 dark:bg-p2/50" />

          {/* Cost Analysis */}
          <View className="flex-col gap-3">
            <ScreenTitle
              title="Cost Analysis"
              variant="section"
            />

            <TextInput
              label="Retail Price *"
              value={retailPrice}
              onChangeText={setRetailPrice}
              placeholder="8.00"
              keyboardType="decimal-pad"
            />

            <View className="flex-row justify-between">
              <Text className="text-g3 dark:text-n1">Total Cost:</Text>
              <Text className="text-g4 dark:text-n1" style={{ fontWeight: '500' }}>
                ${totalCost.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-g3 dark:text-n1">Retail Price:</Text>
              <Text className="text-g4 dark:text-n1" style={{ fontWeight: '500' }}>
                ${retailPriceNum.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-g3 dark:text-n1">Profit Margin:</Text>
              <Text className="text-s22 dark:text-s21" style={{ fontWeight: '500' }}>
                ${profitMargin.toFixed(2)}
              </Text>
            </View>

            <View className="pt-3 border-t border-g2/40 dark:border-p2/50">
              <PourCostPerformanceBar
                pourCostPercentage={pourCostPercentage}
              />
            </View>
          </View>

          {/* Divider */}
          <View className="h-px bg-g2/30 dark:bg-p2/50" />

          {/* Details */}
          <View className="flex-col gap-4">
            <ScreenTitle title="Details" variant="section" />

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

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={!isValid || isSaving}
            className={`rounded-lg p-4 flex-row items-center justify-center gap-2 ${
              isValid && !isSaving ? 'bg-s21 dark:bg-s22' : 'bg-g3 dark:bg-g2/80'
            }`}
          >
            <Text className="text-white text-base" style={{ fontWeight: '600' }}>
              {isSaving ? 'Saving...' : isEditing ? 'Update Cocktail' : 'Save Cocktail'}
            </Text>
          </Pressable>

          <Text
            className="text-center text-g3 dark:text-n1 text-xs my-4"
            style={{}}
          >
            * Required fields
          </Text>

          {/* Action Sheet for delete (edit mode) */}
          <ActionSheet
            visible={showActions}
            onClose={() => setShowActions(false)}
            actions={[
              { label: 'Delete Cocktail', icon: 'trash-outline', onPress: handleDelete, destructive: true },
            ]}
          />
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
