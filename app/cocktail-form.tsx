import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import HeaderSavePill from '@/src/components/ui/HeaderSavePill';
import ChipSelector from '@/src/components/ui/ChipSelector';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useFocusEffect, useNavigation } from 'expo-router';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { Ionicons } from '@expo/vector-icons';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { useAppStore } from '@/src/stores/app-store';
import TextInput from '@/src/components/ui/TextInput';
import EmptyState from '@/src/components/EmptyState';
import PourCostHero from '@/src/components/PourCostHero';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { sanitizeName, sanitizeDescription } from '@/src/lib/sanitize';
import AiSuggestionRow from '@/src/components/ui/AiSuggestionRow';
import StatCard from '@/src/components/ui/StatCard';
import CocktailIngredientItem from '@/src/components/CocktailIngredientItem';
import ImagePlaceholder from '@/src/components/ui/ImagePlaceholder';
import { useIngredientSelectionStore } from '@/src/stores/ingredient-selection-store';
import {
  COCKTAIL_CATEGORIES,
} from '@/src/constants/appConstants';
import { CocktailIngredient, CocktailCategory, Volume } from '@/src/types/models';
import { calculateCostPerPour, calculateSuggestedPrice, formatCurrency, roundSuggestedPrice, applyPriceFloor } from '@/src/services/calculation-service';
import { FeedbackService } from '@/src/services/feedback-service';

/**
 * Cocktail creation and editing form
 * Handles both creating new cocktails and editing existing ones
 */
export default function CocktailFormScreen() {
  const insets = useSafeAreaInsets();
  const router = useGuardedRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { selectedIngredient, selectedIngredients, removedIngredientIds, clearSelection } =
    useIngredientSelectionStore();
  const { defaultRetailPrice, pourCostGoal, suggestedPriceRounding, minCocktailPrice } = useAppStore();

  const colors = useThemeColors();
  const [showActions, setShowActions] = useState(false);

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
    (params.retailPrice as string) || defaultRetailPrice.toFixed(2)
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
          // Params are JSON-decoded so every field is typed optional. Fill sane
          // fallbacks so the resulting array satisfies CocktailIngredient[].
          const DEFAULT_SIZE: Volume = { kind: 'milliliters', ml: 750 };
          const DEFAULT_POUR: Volume = {
            kind: 'fractionalOunces',
            numerator: 3,
            denominator: 2,
          };
          const formattedIngredients: CocktailIngredient[] = existingIngredients.map(
            (ingredient: Partial<CocktailIngredient> & { id?: string }) => ({
              ingredientId: ingredient.ingredientId || ingredient.id || '',
              name: ingredient.name ?? '',
              productSize: ingredient.productSize ?? DEFAULT_SIZE,
              productCost: ingredient.productCost || 0,
              pourSize: ingredient.pourSize ?? DEFAULT_POUR,
              cost: ingredient.cost || 0,
            })
          );
          setIngredients(formattedIngredients);
        }
      } catch (error) {
        if (__DEV__) console.error('Error parsing existing ingredients:', error);
      }
    }
  }, [isEditing, params.ingredients]);

  // Listen for selected ingredients from ingredient selector
  useFocusEffect(
    React.useCallback(() => {
      let updated = false;

      // Remove ingredients that were deleted in the selector
      if (removedIngredientIds.length > 0) {
        setIngredients((prev) =>
          prev.filter((ing) => !removedIngredientIds.includes(ing.ingredientId))
        );
        updated = true;
      }

      // Add new ingredients
      if (selectedIngredients.length > 0) {
        setIngredients((prevIngredients) => [
          ...prevIngredients,
          ...selectedIngredients.filter(
            (newIng) =>
              !prevIngredients.some((existing) => existing.ingredientId === newIng.ingredientId)
          ),
        ]);
        updated = true;
      } else if (selectedIngredient) {
        setIngredients((prev) => {
          if (prev.some((ing) => ing.ingredientId === selectedIngredient.ingredientId)) return prev;
          return [...prev, selectedIngredient];
        });
        updated = true;
      }

      if (updated) clearSelection();
    }, [selectedIngredients, selectedIngredient, removedIngredientIds])
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
  const updateIngredientAmount = (ingredientId: string, newPourSize: Volume) => {
    setIngredients(
      ingredients.map((ing) => {
        if (ing.ingredientId === ingredientId) {
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

  const saveRef = useRef<() => void>(() => {});

  // Handle save
  const handleSave = async () => {
    if (!isValid) {
      Alert.alert('Invalid Data', 'Please enter a cocktail name and add at least one ingredient.');
      return;
    }

    setIsSaving(true);
    try {
      const cocktailData = {
        name: sanitizeName(name),
        description: sanitizeDescription(description) || undefined,
        category: category as CocktailCategory,
        notes: sanitizeDescription(notes) || undefined,
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
    FeedbackService.showDeleteConfirmation(
      name,
      async () => {
        await deleteCocktail(cocktailId);
        router.back();
      },
      'cocktail'
    );
  };

  // Keep ref in sync so header button always calls latest version
  saveRef.current = handleSave;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Cocktail' : 'Create Cocktail',
      headerLeft: () => (
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 p-2">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Cancel</Text>
        </Pressable>
      ),
      headerRight: () => (
        <HeaderSavePill
          onPress={() => saveRef.current()}
          disabled={!isValid}
          isSaving={isSaving}
        />
      ),
    });
  }, [isEditing, navigation, colors, isValid, isSaving]);

  return (
    <GradientBackground>
      <ScrollView
        className="FormScroll flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        pointerEvents={isSaving ? 'none' : 'auto'}
      >
        <View className="px-6 pt-4 pb-6 flex-col gap-8">
          {/* Identity — Image + Name + Category + Description + Notes */}
          <View className="flex-col gap-5">
            <View className="flex flex-row gap-4">
              <ImagePlaceholder size="small" />
              <View className="flex-1 justify-center">
                <TextInput
                  label="Cocktail Name *"
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Classic Margarita"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <ChipSelector
              label="Category"
              options={COCKTAIL_CATEGORIES.filter((cat) => cat !== 'All')}
              selectedOption={category}
              onSelectionChange={(cat) => setCategory(cat as CocktailCategory)}
              variant="filter"
            />

            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of the cocktail"
              multiline
            />

            <TextInput
              label="Preparation Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g., Shake well with ice, strain into a chilled glass"
              multiline
            />
          </View>

          {/* Ingredients */}
          <View className="flex-col gap-3">
            <View className="flex-row items-center justify-between">
              <Text
                className="text-[11px] tracking-widest uppercase"
                style={{ color: colors.textTertiary, fontWeight: '600' }}
              >
                Ingredients ({ingredients.length})
              </Text>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/ingredient-selector',
                    params:
                      ingredients.length > 0
                        ? {
                            existingIngredientIds: JSON.stringify(
                              ingredients.map((i) => i.ingredientId)
                            ),
                          }
                        : undefined,
                  })
                }
                className="flex-row items-center gap-2 px-3 py-2 bg-p1 rounded-lg"
              >
                <Ionicons
                  name={ingredients.length > 0 ? 'pencil' : 'add'}
                  size={16}
                  color={palette.N1}
                />
                <Text
                  className="text-sm font-medium"
                  style={{ color: palette.N1 }}
                >
                  {ingredients.length > 0 ? 'Edit' : 'Add'}
                </Text>
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

          {/* Pricing + Analysis */}
          <View className="flex-col gap-5">
            <TextInput
              label="Retail Price *"
              value={retailPrice}
              onChangeText={setRetailPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
              prefix="$"
            />

            <AiSuggestionRow
              label="Suggested Price"
              value={formatCurrency(
                applyPriceFloor(
                  roundSuggestedPrice(
                    calculateSuggestedPrice(totalCost, pourCostGoal / 100),
                    suggestedPriceRounding,
                  ),
                  minCocktailPrice,
                )
              )}
            />

            <View className="flex-row gap-3">
              <StatCard
                label="Total Cost"
                value={formatCurrency(totalCost)}
              />
              <StatCard
                label="Profit Margin"
                value={formatCurrency(profitMargin)}
                infoTermKey="margin"
              />
            </View>

            <View className="-mx-6">
              <PourCostHero pourCostPercentage={pourCostPercentage} />
            </View>
          </View>

          {/* Delete button at bottom (edit mode only) */}
          {isEditing && (
            <Pressable
              onPress={handleDelete}
              className="flex-row items-center justify-center gap-2 py-3"
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text
                style={{
                  color: colors.error,
                  fontWeight: '500',
                  fontSize: 16,
                }}
              >
                Delete Cocktail
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
