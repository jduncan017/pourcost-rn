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
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useAppStore } from '@/src/stores/app-store';
import { Ionicons } from '@expo/vector-icons';
import Toggle from '@/src/components/ui/Toggle';
import TextInput from '@/src/components/ui/TextInput';
import Button from '@/src/components/ui/Button';
import MetricRow from '@/src/components/ui/MetricRow';
import PourCostPerformanceBar from '@/src/components/PourCostPerformanceBar';
import GradientBackground from '@/src/components/ui/GradientBackground';
import AiSuggestionRow from '@/src/components/ui/AiSuggestionRow';
import IngredientInputs, {
  IngredientInputValues,
} from '@/src/components/IngredientInputs';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import {
  INITIAL_PRODUCT_SIZE,
  SUBTYPES_BY_TYPE,
  getPourChipsForContext,
  type IngredientType,
} from '@/src/constants/appConstants';
import { Volume, volumeLabel, volumeToOunces } from '@/src/types/models';
import {
  calculateCostPerOz,
  calculateCostPerPour,
  calculateSuggestedPrice,
  formatCurrency,
} from '@/src/services/calculation-service';
import { FeedbackService } from '@/src/services/feedback-service';
import { sanitizeName, sanitizeDescription } from '@/src/lib/sanitize';

export default function IngredientFormScreen() {
  const router = useRouter();
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
      FeedbackService.showWarning('Parse Error', 'Could not read product size — using default.');
    }

    let pourSize = volumeToOunces(useAppStore.getState().defaultPourSize);
    try {
      if (params.pourSize)
        pourSize = volumeToOunces(
          JSON.parse(params.pourSize as string) as Volume
        );
    } catch {
      FeedbackService.showWarning('Parse Error', 'Could not read pour size — using default.');
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

  // Calculated values
  const pourSizeVolume: Volume = {
    kind: 'decimalOunces',
    ounces: inputValues.pourSize,
  };
  const costPerOz = calculateCostPerOz(
    inputValues.productSize,
    inputValues.productCost
  );
  const costPerPour = calculateCostPerPour(
    inputValues.productSize,
    inputValues.productCost,
    pourSizeVolume
  );
  const pourCostPercentage =
    inputValues.retailPrice > 0
      ? (costPerPour / inputValues.retailPrice) * 100
      : 0;
  const suggestedRetail = calculateSuggestedPrice(costPerPour, 0.2);
  const pourCostMargin = inputValues.retailPrice - costPerPour;

  // Dynamic pour label
  const pourChips = getPourChipsForContext(
    inputValues.ingredientType,
    inputValues.productSize
  );
  const matchedChip = pourChips.find(
    (c) => Math.abs(c.oz - inputValues.pourSize) < 0.001
  );
  const pourLabel = matchedChip?.label ?? `${inputValues.pourSize} oz`;

  // Validation
  const isValid =
    name.trim().length > 0 &&
    inputValues.productCost > 0 &&
    volumeToOunces(inputValues.productSize) > 0 &&
    (!forSale || inputValues.retailPrice > 0);

  const { addIngredient, updateIngredient, deleteIngredient } =
    useIngredientsStore();
  const [isSaving, setIsSaving] = useState(false);
  const saveRef = useRef<() => void>(() => {});

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
    FeedbackService.showDeleteConfirmation(
      name,
      async () => {
        await deleteIngredient(ingredientId);
        router.back();
      },
      'ingredient'
    );
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
      headerRight: undefined,
    });
  }, [isEditing, navigation, colors]);

  return (
    <GradientBackground>
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

            {/* Details — type chips, subtype, product size, cost, pour size */}
            <IngredientInputs
              variant="form"
              values={{ ...inputValues, notForSale: !forSale }}
              onChange={handleInputChange}
              hideRetailPrice
              noCard
            />

            {/* Pricing — retail + cost analysis */}
            <View className="flex-col gap-5">
              {forSale && (
                <>
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
                  <AiSuggestionRow
                    label="Suggested Retail"
                    value={`$${suggestedRetail.toFixed(2)}`}
                  />
                  <PourCostPerformanceBar
                    pourCostPercentage={pourCostPercentage}
                    noCard
                  />
                </>
              )}

              <View className="flex-col gap-1">
                <Text
                  className="text-[11px] tracking-widest uppercase mb-2"
                  style={{ color: colors.textTertiary, fontWeight: '600' }}
                >
                  Cost Analysis
                </Text>

                <MetricRow
                  label="Cost / Oz:"
                  value={`$${costPerOz.toFixed(3)}`}
                />
                <MetricRow
                  label={`Cost / ${pourLabel}:`}
                  value={formatCurrency(costPerPour)}
                />

                {forSale && (
                  <MetricRow
                    label="Margin:"
                    value={formatCurrency(pourCostMargin)}
                  />
                )}
              </View>
            </View>

            {/* Save button */}
            <Button
              variant="primary"
              fullWidth
              size="large"
              disabled={!isValid || isSaving}
              onPress={() => saveRef.current()}
            >
              {isSaving
                ? 'Saving...'
                : isEditing
                  ? 'Save Changes'
                  : 'Save Ingredient'}
            </Button>

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

            <View className="h-8" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}
