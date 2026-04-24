import { useState, useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { useAppStore } from '@/src/stores/app-store';
import { Ionicons } from '@expo/vector-icons';
import Toggle from '@/src/components/ui/Toggle';
import TextInput from '@/src/components/ui/TextInput';
import Button from '@/src/components/ui/Button';
import GradientBackground from '@/src/components/ui/GradientBackground';
import HeaderSavePill from '@/src/components/ui/HeaderSavePill';
import IngredientInUseSheet from '@/src/components/ui/IngredientInUseSheet';
import IngredientInputs, {
  IngredientInputValues,
} from '@/src/components/IngredientInputs';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import {
  INITIAL_PRODUCT_SIZE,
  SUBTYPES_BY_TYPE,
  type IngredientType,
} from '@/src/constants/appConstants';
import { Volume, volumeLabel, volumeToOunces } from '@/src/types/models';
import { FeedbackService } from '@/src/services/feedback-service';
import { sanitizeName, sanitizeDescription } from '@/src/lib/sanitize';

export default function IngredientFormScreen() {
  const router = useGuardedRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const colors = useThemeColors();

  const isEditing = Boolean(params.id);
  const ingredientId = params.id as string;

  // Form state — name, description, notForSale are form-only
  const [name, setName] = useState((params.name as string) || '');
  const [forSale, setForSale] = useState(
    params.notForSale === 'true' ? false : true
  );
  const [description, setDescription] = useState(
    (params.description as string) || ''
  );
  const [retailPriceText, setRetailPriceText] = useState(
    (params.retailPrice as string) || '8.00'
  );
  const [abvText, setAbvText] = useState((params.abv as string) || '');

  // Shared input values
  const [inputValues, setInputValues] = useState<IngredientInputValues>(() => {
    let productSize = INITIAL_PRODUCT_SIZE;
    try {
      if (params.productSize)
        productSize = JSON.parse(params.productSize as string) as Volume;
    } catch {
      FeedbackService.showWarning('Parse Error', 'Could not read product size. Using default.');
    }

    let pourSize = volumeToOunces(useAppStore.getState().defaultPourSize);
    try {
      if (params.pourSize)
        pourSize = volumeToOunces(
          JSON.parse(params.pourSize as string) as Volume
        );
    } catch {
      FeedbackService.showWarning('Parse Error', 'Could not read pour size. Using default.');
    }

    return {
      ingredientType: (params.type as IngredientType) || 'Spirit',
      subType: (params.subType as string) || '',
      productSize,
      productCost: Number(params.productCost) || 25.0,
      pourSize,
      retailPrice: Number(params.retailPrice) || 8.0,
      pourCostPct: useAppStore.getState().pourCostGoal,
      notForSale: !forSale,
      garnishAmount: 50,
      garnishUnit: 'units',
      servingAmount: 1,
    };
  });

  const handleInputChange = (updates: Partial<IngredientInputValues>) => {
    setInputValues((prev) => ({ ...prev, ...updates }));
    if (updates.notForSale !== undefined) setForSale(!updates.notForSale);
  };

  // Pull live ingredient + configurations when editing — the Sizes section
  // reflects the latest server state without needing a re-mount after returning
  // from the size-form screen.
  const liveIngredient = useIngredientsStore((s) =>
    isEditing ? s.ingredients.find((i) => i.id === ingredientId) : undefined
  );
  const configurations = liveIngredient?.configurations ?? [];

  // Pour size for saving — held on the ingredient, consumed by every size's cost analysis.
  const pourSizeVolume: Volume = {
    kind: 'decimalOunces',
    ounces: inputValues.pourSize,
  };

  // Validation — retail required when for-sale. Product size+cost still required for CREATE
  // (first bottle must have a price); edit mode relies on existing values.
  const isValid =
    name.trim().length > 0 &&
    inputValues.productCost > 0 &&
    volumeToOunces(inputValues.productSize) > 0 &&
    (!forSale || inputValues.retailPrice > 0);

  const { addIngredient, updateIngredient, deleteIngredient } =
    useIngredientsStore();
  const { cocktails } = useCocktailsStore();
  const [isSaving, setIsSaving] = useState(false);
  const [showInUseSheet, setShowInUseSheet] = useState(false);
  const saveRef = useRef<() => void>(() => {});

  // Cocktails that reference this ingredient — blocks deletion when non-empty.
  const affectedCocktails = isEditing
    ? cocktails.filter((c) =>
        c.ingredients.some((ci) => ci.ingredientId === ingredientId)
      )
    : [];

  const handleSave = async () => {
    if (!isValid) {
      Alert.alert(
        'Invalid Data',
        'Please fill in all required fields with valid values.'
      );
      return;
    }

    setIsSaving(true);
    try {
      const abvValue = abvText.trim() === '' ? undefined : Number(abvText);
      const data = {
        name: sanitizeName(name),
        productSize: inputValues.productSize,
        productCost: inputValues.productCost,
        retailPrice: !forSale ? undefined : inputValues.retailPrice,
        pourSize: !forSale ? undefined : pourSizeVolume,
        type: inputValues.ingredientType,
        subType: SUBTYPES_BY_TYPE[inputValues.ingredientType]
          ? inputValues.subType || undefined
          : undefined,
        abv: abvValue != null && !Number.isNaN(abvValue) ? abvValue : undefined,
        notForSale: !forSale,
        description: sanitizeDescription(description) || undefined,
      };

      if (isEditing) {
        await updateIngredient(ingredientId, data);
      } else {
        await addIngredient(data);
      }
      router.back();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save ingredient'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (affectedCocktails.length > 0) {
      setShowInUseSheet(true);
      return;
    }
    FeedbackService.showDeleteConfirmation(
      name,
      async () => {
        await deleteIngredient(ingredientId);
        router.back();
      },
      'ingredient'
    );
  };

  const handleOpenCocktail = (cocktailId: string) => {
    setShowInUseSheet(false);
    router.navigate({
      pathname: '/cocktail-detail',
      params: { id: cocktailId },
    });
  };

  saveRef.current = handleSave;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Ingredient' : 'Create Ingredient',
      headerLeft: () => (
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 p-2"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
            Cancel
          </Text>
        </Pressable>
      ),
      headerRight: () => (
        <HeaderSavePill
          onPress={() => saveRef.current()}
          disabled={!isValid || isSaving}
          isSaving={isSaving}
        />
      ),
    });
  }, [isEditing, navigation, colors, isValid, isSaving]);

  return (
    <GradientBackground>
      <IngredientInUseSheet
        visible={showInUseSheet}
        onClose={() => setShowInUseSheet(false)}
        ingredientName={name}
        cocktails={affectedCocktails}
        onOpenCocktail={handleOpenCocktail}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="FormScroll flex-1"
          keyboardShouldPersistTaps="handled"
          pointerEvents={isSaving ? 'none' : 'auto'}
        >
          <View className="px-6 pt-4 pb-6 flex-col gap-8">
            {/* Identity — Name, Description, ABV, For Sale */}
            <View className="flex-col gap-5">
              <TextInput
                label="Ingredient Name *"
                value={name}
                onChangeText={setName}
                placeholder="e.g., Vodka (Premium), Simple Syrup"
              />

              <TextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Brief description..."
                multiline
              />

              <TextInput
                label="ABV %"
                value={abvText}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  const parts = cleaned.split('.');
                  const limited =
                    parts.length > 2
                      ? `${parts[0]}.${parts.slice(1).join('')}`
                      : cleaned;
                  setAbvText(limited);
                }}
                placeholder="Optional. e.g., 40"
                keyboardType="decimal-pad"
              />

              <Toggle
                value={forSale}
                onValueChange={(val) => {
                  setForSale(val);
                  handleInputChange({ notForSale: !val });
                }}
                label={forSale ? 'For Sale' : 'Not For Sale'}
                description={
                  forSale
                    ? 'Spirits, wine, beer, etc.'
                    : 'House-made items, garnishes, etc.'
                }
              />
            </View>

            {/* Details — type chips, subtype, pour size.
                Edit mode hides product size + cost (those live in the Sizes section). */}
            <IngredientInputs
              variant="form"
              values={{ ...inputValues, notForSale: !forSale }}
              onChange={handleInputChange}
              hideRetailPrice
              hideProductSize={isEditing}
              noCard
            />

            {/* Retail Price — set here, referenced on the size page while
                the user enters bottle costs. Placed BEFORE sizes so the
                retail anchor exists when they tap through to each bottle. */}
            {forSale && (
              <View className="flex-col gap-5">
                <TextInput
                  label="Retail Price *"
                  value={retailPriceText}
                  onChangeText={(text) => {
                    if (text === '' || /^\d*\.?\d*$/.test(text)) {
                      setRetailPriceText(text);
                      const price = text === '' ? 0 : parseFloat(text) || 0;
                      handleInputChange({ retailPrice: price });
                    }
                  }}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  prefix="$"
                />
              </View>
            )}

            {/* Sizes section — edit mode only. Lists the primary inline size +
                any configurations. Tap to edit, plus button to add.
                Cost analysis for each size happens on the size-form screen. */}
            {isEditing && (
              <View className="flex-col gap-3">
                <Text
                  className="text-[11px] tracking-widest uppercase"
                  style={{ color: colors.textTertiary, fontWeight: '600' }}
                >
                  Sizes
                </Text>

                {/* Primary (inline) */}
                <SizeRow
                  label={volumeLabel(inputValues.productSize)}
                  cost={inputValues.productCost}
                  isDefault
                  onPress={() =>
                    router.push({
                      pathname: '/ingredient-size-form',
                      params: { ingredientId, configId: 'default' },
                    } as any)
                  }
                />

                {/* Additional configurations */}
                {configurations.map((c) => (
                  <SizeRow
                    key={c.id}
                    label={volumeLabel(c.productSize)}
                    cost={c.productCost}
                    onPress={() =>
                      router.push({
                        pathname: '/ingredient-size-form',
                        params: { ingredientId, configId: c.id },
                      } as any)
                    }
                  />
                ))}

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/ingredient-size-form',
                      params: { ingredientId },
                    } as any)
                  }
                  className="flex-row items-center justify-center gap-2 py-3 rounded-xl"
                  style={{
                    backgroundColor: colors.accent + '15',
                    borderWidth: 1,
                    borderColor: colors.accent + '99',
                    borderStyle: 'dashed',
                  }}
                >
                  <Ionicons name="add" size={18} color={colors.accent} />
                  <Text
                    style={{
                      color: colors.accent,
                      fontWeight: '600',
                      fontSize: 15,
                    }}
                  >
                    Add Size
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Delete button (edit mode only) */}
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
                  Delete Ingredient
                </Text>
              </Pressable>
            )}

            {/* Save button — create mode only (edit uses HeaderSavePill).
                Kept for create so first-time users see a clear primary CTA. */}
            {!isEditing && (
              <Button
                variant="primary"
                fullWidth
                size="large"
                disabled={!isValid || isSaving}
                onPress={() => saveRef.current()}
              >
                {isSaving ? 'Saving...' : 'Save Ingredient'}
              </Button>
            )}

            <View className="h-8" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

/** A row in the edit-form's Sizes section: size label + cost on the left,
 *  optional "Default" chip + chevron on the right. */
function SizeRow({
  label,
  cost,
  isDefault,
  onPress,
}: {
  label: string;
  cost: number;
  isDefault?: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-3 px-4 rounded-xl"
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      })}
    >
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            className="text-base"
            style={{ color: colors.text, fontWeight: '600' }}
          >
            {label}
          </Text>
          {isDefault && (
            <View
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: colors.gold + '22' }}
            >
              <Text
                className="text-[10px] tracking-widest uppercase"
                style={{ color: colors.gold, fontWeight: '700' }}
              >
                Default
              </Text>
            </View>
          )}
        </View>
        <Text
          className="text-sm mt-0.5"
          style={{ color: colors.textTertiary }}
        >
          ${cost.toFixed(2)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}
