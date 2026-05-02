import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import FormSaveBar from '@/src/components/ui/FormSaveBar';
import { useUnsavedChangesGuard } from '@/src/lib/useUnsavedChangesGuard';
import TextInput from '@/src/components/ui/TextInput';
import Dropdown from '@/src/components/ui/Dropdown';
import MetricRow from '@/src/components/ui/MetricRow';
import AiSuggestionRow from '@/src/components/ui/AiSuggestionRow';
import PourCostHero from '@/src/components/PourCostHero';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useAppStore } from '@/src/stores/app-store';
import { Volume, volumeLabel, volumeToOunces } from '@/src/types/models';
import {
  getProductSizesForType,
  getProductSizeSection,
} from '@/src/constants/appConstants';
import {
  calculateCostPerOz,
  calculateCostPerPour,
  calculateSuggestedPrice,
  formatCurrency,
  roundSuggestedPrice,
} from '@/src/services/calculation-service';
import { useHeroTargetForIngredient } from '@/src/lib/useHeroTarget';
import { FeedbackService } from '@/src/services/feedback-service';

/**
 * Per-size editor for an ingredient.
 *
 * Three modes, all driven by route params:
 *   - { ingredientId }                   → add a new configuration
 *   - { ingredientId, configId: 'default' } → edit the ingredient's primary inline size
 *   - { ingredientId, configId: <uuid> }    → edit a stored configuration
 *
 * The ingredient's pour size + retail price + global pour-cost goal drive the
 * preview metrics so the user sees the impact of this specific bottle's price
 * before saving.
 */
export default function IngredientSizeFormScreen() {
  const router = useGuardedRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const colors = useThemeColors();

  const ingredientId = params.ingredientId as string;
  const configIdParam = params.configId as string | undefined;
  const isEditingDefault = configIdParam === 'default';
  const isEditingConfig = !!configIdParam && !isEditingDefault;
  const isAdding = !configIdParam;

  const { ingredients, updateIngredient, addConfiguration, updateConfiguration, deleteConfiguration } =
    useIngredientsStore();
  const { suggestedPriceRounding, enabledProductSizes } = useAppStore();
  const ingredient = ingredients.find((i) => i.id === ingredientId);

  // Initial size + price values come from whichever record we're editing.
  const initial = useMemo(() => {
    if (!ingredient) return null;
    if (isEditingDefault) {
      return { productSize: ingredient.productSize, productCost: ingredient.productCost };
    }
    if (isEditingConfig) {
      const cfg = ingredient.configurations?.find((c) => c.id === configIdParam);
      if (cfg) return { productSize: cfg.productSize, productCost: cfg.productCost };
    }
    // Adding a new size — default to a sensible bottle for this ingredient type.
    const defaults = getProductSizesForType(ingredient.type, ingredient.subType);
    return {
      productSize: defaults[0] ?? ({ kind: 'milliliters', ml: 750 } as Volume),
      productCost: 0,
    };
  }, [ingredient, isEditingDefault, isEditingConfig, configIdParam]);

  const [productSize, setProductSize] = useState<Volume>(
    initial?.productSize ?? ({ kind: 'milliliters', ml: 750 } as Volume)
  );
  const [productCostText, setProductCostText] = useState(
    initial ? initial.productCost.toFixed(2) : '0.00'
  );
  const productCost = parseFloat(productCostText) || 0;

  const currentSizeLabel = volumeLabel(productSize);
  const sizeOptions = useMemo(() => {
    if (!ingredient) return [];
    return getProductSizesForType(
      ingredient.type,
      ingredient.subType,
      enabledProductSizes,
      currentSizeLabel,
    ).map((size) => ({
      value: volumeLabel(size),
      label: volumeLabel(size),
      section: getProductSizeSection(size),
    }));
  }, [ingredient, enabledProductSizes, currentSizeLabel]);

  const handleSizeChange = (selectedLabel: string) => {
    if (!ingredient) return;
    const match = getProductSizesForType(
      ingredient.type,
      ingredient.subType,
      enabledProductSizes,
      currentSizeLabel,
    ).find((s) => volumeLabel(s) === selectedLabel);
    if (match) setProductSize(match);
  };

  // Preview — uses the ingredient's pour size + retail price.
  const effectivePourSize = ingredient?.pourSize ?? useAppStore.getState().defaultPourSize;
  const effectiveRetail = ingredient?.retailPrice ?? useAppStore.getState().defaultRetailPrice;
  const costPerOz = calculateCostPerOz(productSize, productCost);
  const costPerPour = calculateCostPerPour(productSize, productCost, effectivePourSize);

  // Tier + pricing-mode-aware target driven by the LIVE productCost being edited.
  const { targetGoal: targetPct, targetLabel } = useHeroTargetForIngredient({
    type: ingredient?.type,
    productCost,
  });
  const suggestedRetail = roundSuggestedPrice(
    calculateSuggestedPrice(costPerPour, targetPct / 100),
    suggestedPriceRounding
  );
  const pourCostPercentage =
    effectiveRetail > 0 ? (costPerPour / effectiveRetail) * 100 : 0;

  const isValid = productCost > 0 && volumeToOunces(productSize) > 0;
  const isDuplicate = useMemo(() => {
    if (!ingredient || isEditingDefault || isEditingConfig) return false;
    const sameAsDefault = volumeLabel(ingredient.productSize) === volumeLabel(productSize);
    const sameAsConfig = (ingredient.configurations ?? []).some(
      (c) => c.id !== configIdParam && volumeLabel(c.productSize) === volumeLabel(productSize)
    );
    return sameAsDefault || sameAsConfig;
  }, [ingredient, productSize, isEditingDefault, isEditingConfig, configIdParam]);

  const [isSaving, setIsSaving] = useState(false);
  const saveRef = useRef<() => void>(() => {});

  // Dirty tracking — snapshot the form once, prompt before back-nav if it has changed.
  const initialSnapshotRef = useRef<string | null>(null);
  const currentSnapshot = useMemo(
    () => JSON.stringify({ productSize, productCostText }),
    [productSize, productCostText],
  );
  useEffect(() => {
    if (initialSnapshotRef.current === null) {
      initialSnapshotRef.current = currentSnapshot;
    }
  }, [currentSnapshot]);
  const isDirty =
    initialSnapshotRef.current !== null &&
    currentSnapshot !== initialSnapshotRef.current;
  const guard = useUnsavedChangesGuard(isDirty);

  const handleSave = async () => {
    if (!ingredient) return;
    if (!isValid) {
      Alert.alert('Invalid', 'Enter a price greater than $0.');
      return;
    }
    if (isDuplicate) {
      Alert.alert('Duplicate Size', `${volumeLabel(productSize)} is already configured for this ingredient.`);
      return;
    }

    setIsSaving(true);
    try {
      if (isEditingDefault) {
        await updateIngredient(ingredient.id, { productSize, productCost });
      } else if (isEditingConfig && configIdParam) {
        await updateConfiguration(ingredient.id, configIdParam, { productSize, productCost });
      } else {
        await addConfiguration(ingredient.id, { productSize, productCost });
      }
      guard.bypass();
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save size');
    } finally {
      setIsSaving(false);
    }
  };
  saveRef.current = handleSave;

  const handleDelete = () => {
    if (!ingredient || !configIdParam) return;
    FeedbackService.showDeleteConfirmation(
      volumeLabel(productSize),
      async () => {
        await deleteConfiguration(ingredient.id, configIdParam);
        guard.bypass();
        router.back();
      },
      'size'
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isAdding ? 'Add Size' : 'Edit Size',
      headerLeft: () => (
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 p-2"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Cancel</Text>
        </Pressable>
      ),
    });
  }, [navigation, colors, isAdding]);

  if (!ingredient) {
    return (
      <GradientBackground>
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          pointerEvents={isSaving ? 'none' : 'auto'}
        >
          <View className="px-6 pt-4 pb-6 flex-col gap-7">
            {/* Context — which ingredient we're editing + the retail price
                that drives suggested pricing / pour-cost % in the preview below. */}
            <View className="flex-col gap-3">
              <View className="flex-col gap-1">
                <Text
                  className="text-[11px] tracking-widest uppercase"
                  style={{ color: colors.textTertiary, fontWeight: '600' }}
                >
                  For Ingredient
                </Text>
                <Text className="text-lg" style={{ color: colors.text, fontWeight: '600' }}>
                  {ingredient.name}
                </Text>
              </View>

              {!ingredient.notForSale && (
                <View
                  className="flex-row items-center justify-between px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                  }}
                >
                  <View className="flex-col">
                    <Text
                      className="text-[10px] tracking-widest uppercase"
                      style={{ color: colors.textTertiary, fontWeight: '600' }}
                    >
                      Retail Price
                    </Text>
                    <Text
                      className="text-base"
                      style={{ color: colors.text, fontWeight: '600' }}
                    >
                      {formatCurrency(effectiveRetail)}
                    </Text>
                  </View>
                  <Text
                    className="text-xs"
                    style={{ color: colors.textTertiary }}
                  >
                    Set on ingredient
                  </Text>
                </View>
              )}
            </View>

            {/* Size + price */}
            <View className="flex-col gap-5">
              <Dropdown
                value={volumeLabel(productSize)}
                onValueChange={handleSizeChange}
                options={sizeOptions}
                label="Bottle Size"
                placeholder="Select size"
              />

              <TextInput
                label={`Cost / ${volumeLabel(productSize)} *`}
                value={productCostText}
                onChangeText={(text) => {
                  if (text === '' || /^\d*\.?\d*$/.test(text)) {
                    setProductCostText(text);
                  }
                }}
                placeholder="0.00"
                keyboardType="decimal-pad"
                prefix="$"
              />

              {isDuplicate && (
                <Text className="text-sm" style={{ color: colors.error }}>
                  This size is already configured for this ingredient.
                </Text>
              )}
            </View>

            {/* Preview metrics — driven by the ingredient's default pour size + retail. */}
            <View className="flex-col gap-3">
              <Text
                className="text-[11px] tracking-widest uppercase"
                style={{ color: colors.textTertiary, fontWeight: '600' }}
              >
                Preview at this Price
              </Text>
              <MetricRow label="Cost / Oz:" value={`$${costPerOz.toFixed(3)}`} />
              <MetricRow
                label={`Cost / ${volumeLabel(effectivePourSize)} pour:`}
                value={formatCurrency(costPerPour)}
              />
              {ingredient.notForSale ? null : (
                <AiSuggestionRow
                  label="Suggested Retail"
                  value={formatCurrency(suggestedRetail)}
                  infoTermKey="suggestedPrice"
                />
              )}
            </View>

            {ingredient.notForSale ? null : (
              <View className="-mx-6">
                <PourCostHero
                  pourCostPercentage={pourCostPercentage}
                  targetGoal={targetPct}
                  targetLabel={targetLabel ?? undefined}
                />
              </View>
            )}

            <FormSaveBar
              onPress={() => saveRef.current()}
              disabled={!isValid || isSaving}
              isSaving={isSaving}
            />

            {/* Delete — only available on stored configurations (not the default) */}
            {isEditingConfig && (
              <Pressable
                onPress={handleDelete}
                className="flex-row items-center justify-center gap-2 py-3"
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
                <Text style={{ color: colors.error, fontWeight: '500', fontSize: 16 }}>
                  Delete Size
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
