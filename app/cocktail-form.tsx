import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useUnsavedChangesGuard } from '@/src/lib/useUnsavedChangesGuard';
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
import { useHeroTargetForCocktail } from '@/src/lib/useHeroTarget';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { sanitizeName, sanitizeDescription } from '@/src/lib/sanitize';
import SuggestedRetailInput from '@/src/components/ui/SuggestedRetailInput';
import StatCard from '@/src/components/ui/StatCard';
import CocktailIngredientItem from '@/src/components/CocktailIngredientItem';
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
  const { targetLabel: cocktailTargetLabel } = useHeroTargetForCocktail();

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
  // True once the user has typed into the retail price field. Until then
  // the input shows the live suggested value with a purple "Suggested"
  // pill on the right; typing flips this to true and the visual collapses
  // to a plain input. Reset pill flips it back to false.
  const [retailIsManual, setRetailIsManual] = useState(
    !!(params.retailPrice as string),
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

  // Calculate totals
  const totalCost = ingredients.reduce((sum, ing) => sum + ing.cost, 0);

  // Suggested retail derived from cost + bar-wide pour cost goal, with the
  // user's rounding preference and the cocktail price floor applied.
  const suggestedPrice =
    totalCost > 0
      ? applyPriceFloor(
          roundSuggestedPrice(
            calculateSuggestedPrice(totalCost, pourCostGoal / 100),
            suggestedPriceRounding,
          ),
          minCocktailPrice,
        )
      : 0;

  // Effective retail used for all downstream math. Manual mode → user's
  // typed value; suggested mode → live computed suggestion.
  const effectiveRetail = retailIsManual
    ? parseFloat(retailPrice) || 0
    : suggestedPrice;
  const profitMargin = effectiveRetail - totalCost;
  const pourCostPercentage =
    totalCost > 0 && effectiveRetail > 0
      ? (totalCost / effectiveRetail) * 100
      : 0;

  // Validation — effectiveRetail covers both suggested and manual modes.
  const isValid =
    name.trim().length > 0 &&
    ingredients.length > 0 &&
    effectiveRetail > 0;

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

  // Dirty tracking — capture initial state once (after async ingredient load
  // settles on edit). Snapshot mismatch = user has unsaved edits.
  const initialSnapshotRef = useRef<string | null>(null);
  const currentSnapshot = useMemo(
    () => JSON.stringify({
      name, description, category, notes, retailPrice, retailIsManual, ingredients,
    }),
    [name, description, category, notes, retailPrice, retailIsManual, ingredients],
  );
  useEffect(() => {
    if (initialSnapshotRef.current !== null) return;
    // On edit, wait until ingredients have populated from params before snapshotting.
    if (isEditing && params.ingredients && ingredients.length === 0) return;
    initialSnapshotRef.current = currentSnapshot;
  }, [isEditing, params.ingredients, ingredients.length, currentSnapshot]);
  const isDirty =
    initialSnapshotRef.current !== null &&
    currentSnapshot !== initialSnapshotRef.current;
  const guard = useUnsavedChangesGuard(isDirty);

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
        retailPrice: effectiveRetail > 0 ? effectiveRetail : undefined,
        favorited: false,
      };

      if (isEditing) {
        await updateCocktail(cocktailId, cocktailData);
      } else {
        await addCocktail(cocktailData);
      }
      guard.bypass();
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
        guard.bypass();
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
      headerRight: () => {
        const inactive = !isValid || isSaving;
        return (
          <Pressable
            onPress={() => saveRef.current()}
            disabled={inactive}
            className="flex-row items-center gap-1 px-3 py-1.5"
            hitSlop={6}
            style={{ opacity: inactive ? 0.4 : 1 }}
          >
            <Ionicons name="checkmark" size={16} color={colors.go} />
            <Text style={{ color: colors.go, fontSize: 15, fontWeight: '700' }}>
              {isSaving ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        );
      },
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
          {/* Identity — Name + Category + Description + Notes */}
          <View className="flex-col gap-5">
            <TextInput
              label="Cocktail Name"
              required
              value={name}
              onChangeText={setName}
              placeholder="e.g., Classic Margarita"
              autoCapitalize="words"
            />

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

          {/* Pricing + Analysis — hidden until at least one ingredient is
              added. Without ingredients there's no cost, so retail price,
              margin, suggested price, and the pour-cost bar are all
              unanchored noise. */}
          {ingredients.length > 0 && (
            <View className="flex-col gap-5">
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

              <SuggestedRetailInput
                label="Retail Price"
                required
                value={
                  retailIsManual
                    ? retailPrice
                    : suggestedPrice > 0
                      ? suggestedPrice.toFixed(2)
                      : ''
                }
                onChangeText={(text) => {
                  setRetailPrice(text);
                  setRetailIsManual(true);
                }}
                isSuggesting={!retailIsManual && suggestedPrice > 0}
                onResetToSuggested={() => {
                  setRetailIsManual(false);
                  setRetailPrice('');
                }}
                placeholder="0.00"
                keyboardType="decimal-pad"
                prefix="$"
              />

              <View className="-mx-6">
                <PourCostHero
                  pourCostPercentage={pourCostPercentage}
                  targetLabel={cocktailTargetLabel ?? undefined}
                />
              </View>
            </View>
          )}

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
