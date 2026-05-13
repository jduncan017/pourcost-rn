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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { useUnsavedChangesGuard } from '@/src/lib/useUnsavedChangesGuard';
import TextInput from '@/src/components/ui/TextInput';
import Dropdown from '@/src/components/ui/Dropdown';
import Toggle from '@/src/components/ui/Toggle';
import BottomSheet from '@/src/components/ui/BottomSheet';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useAppStore } from '@/src/stores/app-store';
import { Volume, volumeLabel, volumeToOunces } from '@/src/types/models';
import {
  getProductSizesForType,
  getProductSizeSection,
} from '@/src/constants/appConstants';
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
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const colors = useThemeColors();

  const ingredientId = params.ingredientId as string;
  const configIdParam = params.configId as string | undefined;
  const isEditingDefault = configIdParam === 'default';
  const isEditingConfig = !!configIdParam && !isEditingDefault;
  const isAdding = !configIdParam;

  const {
    ingredients,
    updateIngredient,
    addConfiguration,
    updateConfiguration,
    deleteConfiguration,
    setDefaultConfiguration,
  } = useIngredientsStore();
  const enabledProductSizes = useAppStore((s) => s.enabledProductSizes);
  const ingredient = ingredients.find((i) => i.id === ingredientId);

  // Initial size + price values come from whichever record we're editing.
  const initial = useMemo(() => {
    if (!ingredient) return null;
    if (isEditingDefault) {
      const defaultCfg = ingredient.configurations?.find((c) => c.isDefault);
      return {
        productSize: ingredient.productSize,
        productCost: ingredient.productCost,
        packSize: defaultCfg?.packSize,
        packCost: defaultCfg?.packCost,
        distributorName: defaultCfg?.distributorName,
      };
    }
    if (isEditingConfig) {
      const cfg = ingredient.configurations?.find((c) => c.id === configIdParam);
      if (cfg) return {
        productSize: cfg.productSize,
        productCost: cfg.productCost,
        packSize: cfg.packSize,
        packCost: cfg.packCost,
        distributorName: cfg.distributorName,
      };
    }
    // Adding a new size — pick the first size for this ingredient type that
    // isn't already configured (so the dropdown doesn't open with a duplicate
    // pre-selected and immediately raise a "size already configured" error).
    const allForType = getProductSizesForType(
      ingredient.type,
      ingredient.subType,
      enabledProductSizes,
    );
    const taken = new Set<string>([
      volumeLabel(ingredient.productSize),
      ...(ingredient.configurations ?? []).map((c) => volumeLabel(c.productSize)),
    ]);
    const firstFree = allForType.find((s) => !taken.has(volumeLabel(s)));
    return {
      productSize:
        firstFree ?? allForType[0] ?? ({ kind: 'milliliters', ml: 750 } as Volume),
      productCost: 0,
      packSize: undefined as number | undefined,
      packCost: undefined as number | undefined,
      distributorName: undefined as string | undefined,
    };
  }, [ingredient, isEditingDefault, isEditingConfig, configIdParam, enabledProductSizes]);

  const [productSize, setProductSize] = useState<Volume>(
    initial?.productSize ?? ({ kind: 'milliliters', ml: 750 } as Volume)
  );
  const [productCostText, setProductCostText] = useState(
    initial ? initial.productCost.toFixed(2) : '0.00'
  );
  const productCost = parseFloat(productCostText) || 0;

  const [packSizeText, setPackSizeText] = useState(
    initial?.packSize != null ? String(initial.packSize) : ''
  );
  const [packCostText, setPackCostText] = useState(
    initial?.packCost != null ? initial.packCost.toFixed(2) : ''
  );
  const [distributorText, setDistributorText] = useState(
    initial?.distributorName ?? ''
  );

  // Set-as-default toggle. Initialized:
  //   - editing the default → on, locked (already default)
  //   - editing a config or adding new → off (user opts in)
  // Applied at save time (after the size + cost write succeeds), not
  // immediately on toggle.
  const [setAsDefault, setSetAsDefault] = useState(isEditingDefault);

  // Pick-new-default sheet shown when the user tries to delete the default
  // size and there are other configurations to promote to default.
  const [showPickNewDefault, setShowPickNewDefault] = useState(false);

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

  const isValid = productCost > 0 && volumeToOunces(productSize) > 0;
  const packSize = packSizeText ? parseInt(packSizeText, 10) || undefined : undefined;

  const isDuplicate = useMemo(() => {
    if (!ingredient || isEditingDefault || isEditingConfig) return false;
    const configKey = `${volumeLabel(productSize)}:${packSize ?? 1}`;
    const defaultCfgRow = ingredient.configurations?.find((c) => c.isDefault);
    const defaultKey = `${volumeLabel(ingredient.productSize)}:${defaultCfgRow?.packSize ?? 1}`;
    if (configKey === defaultKey) return true;
    return (ingredient.configurations ?? [])
      .filter((c) => !c.isDefault && c.id !== configIdParam)
      .some((c) => `${volumeLabel(c.productSize)}:${c.packSize ?? 1}` === configKey);
  }, [ingredient, productSize, packSize, isEditingDefault, isEditingConfig, configIdParam]);

  const [isSaving, setIsSaving] = useState(false);
  const saveRef = useRef<() => void>(() => {});

  // Dirty tracking — snapshot the form once, prompt before back-nav if it has changed.
  const initialSnapshotRef = useRef<string | null>(null);
  const currentSnapshot = useMemo(
    () => JSON.stringify({ productSize, productCostText, packSizeText, packCostText, distributorText }),
    [productSize, productCostText, packSizeText, packCostText, distributorText],
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
    const packCost = packCostText ? parseFloat(packCostText) || undefined : undefined;
    const distributor = distributorText.trim() || undefined;

    try {
      let configIdToPromote: string | null = null;
      if (isEditingDefault) {
        await updateIngredient(ingredient.id, { productSize, productCost });
        // Update the isDefault config row with any pack/distributor changes
        const defaultCfgId = ingredient.configurations?.find((c) => c.isDefault)?.id;
        if (defaultCfgId) {
          await updateConfiguration(ingredient.id, defaultCfgId, {
            packSize,
            packCost,
            distributorName: distributor,
          });
        }
      } else if (isEditingConfig && configIdParam) {
        await updateConfiguration(ingredient.id, configIdParam, {
          productSize,
          productCost,
          packSize,
          packCost,
          distributorName: distributor,
        });
        if (setAsDefault) configIdToPromote = configIdParam;
      } else {
        const created = await addConfiguration(ingredient.id, {
          productSize,
          productCost,
          packSize,
          packCost,
          distributorName: distributor,
        });
        if (setAsDefault) configIdToPromote = created.id;
      }
      // Apply set-as-default after the row exists so the swap has a valid
      // target. No-op if the toggle was off or this row is already the default.
      if (configIdToPromote) {
        await setDefaultConfiguration(ingredient.id, configIdToPromote);
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

  const otherConfigs = useMemo(
    () =>
      ingredient
        ? (ingredient.configurations ?? []).filter((c) => c.id !== configIdParam)
        : [],
    [ingredient, configIdParam],
  );
  const canDelete = isEditingConfig || (isEditingDefault && otherConfigs.length > 0);

  const handleDelete = () => {
    if (!ingredient) return;
    if (isEditingDefault) {
      // Default size — promote a sibling first, then delete the previous
      // default (which has been demoted to a config row by the swap).
      if (otherConfigs.length === 0) return; // canDelete guards this in UI
      setShowPickNewDefault(true);
      return;
    }
    if (!configIdParam) return;
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

  const handleConfirmNewDefault = async (newDefaultConfigId: string) => {
    if (!ingredient) return;
    setShowPickNewDefault(false);
    try {
      // Step 1: swap → promoted config becomes default; old default's
      // values move into that config row.
      await setDefaultConfiguration(ingredient.id, newDefaultConfigId);
      // Step 2: delete the row that's now holding the OLD default values.
      await deleteConfiguration(ingredient.id, newDefaultConfigId);
      guard.bypass();
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete size');
    }
  };

  // Header right Save — small "+ Save" target gets iOS 26's auto Liquid
  // Glass treatment, matches the canonical preview screen pattern.
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
  }, [navigation, colors, isAdding, isValid, isSaving]);

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
          <View className="px-6 pt-4 pb-6 flex-col gap-6">
            {/* Context — which ingredient we're editing. The "(default size)"
                line replaces the toggle when this row is already the default,
                since you can't un-make-it default in place. */}
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
              {isEditingDefault && (
                <Text className="text-sm" style={{ color: colors.textTertiary }}>
                  (default size)
                </Text>
              )}
            </View>

            {/* Size + cost */}
            <View className="flex-col gap-5">
              <Dropdown
                value={volumeLabel(productSize)}
                onValueChange={handleSizeChange}
                options={sizeOptions}
                label="Bottle Size"
                placeholder="Select size"
                sheetHeaderRight={(close) => (
                  <Pressable
                    onPress={() => {
                      close();
                      router.push('/container-sizes' as any);
                    }}
                    className="px-3 py-1.5"
                    hitSlop={6}
                  >
                    <Text
                      style={{ color: colors.accent, fontWeight: '600', fontSize: 14 }}
                    >
                      Edit
                    </Text>
                  </Pressable>
                )}
              />

              <TextInput
                label={`Cost / ${volumeLabel(productSize)}`}
                required
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

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <TextInput
                    label="Pack Size"
                    value={packSizeText}
                    onChangeText={(text) => {
                      if (text === '' || /^\d+$/.test(text)) setPackSizeText(text);
                    }}
                    placeholder="e.g. 12"
                    keyboardType="number-pad"
                  />
                </View>
                <View className="flex-1">
                  <TextInput
                    label="Pack Cost"
                    value={packCostText}
                    onChangeText={(text) => {
                      if (text === '' || /^\d*\.?\d*$/.test(text)) setPackCostText(text);
                    }}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    prefix="$"
                  />
                </View>
              </View>

              <TextInput
                label="Distributor"
                value={distributorText}
                onChangeText={setDistributorText}
                placeholder="e.g. Republic National"
              />

              {isDuplicate && (
                <Text className="text-sm" style={{ color: colors.error }}>
                  This size is already configured for this ingredient.
                </Text>
              )}
            </View>

            {/* Set As Default — toggle. Hidden on the default page (the
                line under the ingredient name covers that state). On a
                config or new-size page, flipping this on swaps after the
                size+cost write succeeds inside Save. */}
            {!isEditingDefault && (
              <View
                className="flex-row items-center justify-between rounded-xl px-4 py-3"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <Text
                  style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}
                >
                  Set as default size
                </Text>
                <Toggle value={setAsDefault} onValueChange={setSetAsDefault} />
              </View>
            )}
          </View>
        </ScrollView>

        {/* Delete — anchored to the bottom of the screen as a sibling of the
            ScrollView so it stays at the bottom regardless of content height.
            Hidden when this is the only size on the ingredient (delete the
            ingredient itself from the ingredient form instead). */}
        {canDelete && (
          <Pressable
            onPress={handleDelete}
            className="flex-row items-center justify-center gap-2"
            style={{
              paddingTop: 12,
              paddingBottom: insets.bottom + 16,
            }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={{ color: colors.error, fontWeight: '500', fontSize: 16 }}>
              Delete Size
            </Text>
          </Pressable>
        )}
      </KeyboardAvoidingView>

      {/* Pick-new-default sheet — fires when the user taps Delete on the
          default size and there are other configs to promote. */}
      <BottomSheet
        visible={showPickNewDefault}
        onClose={() => setShowPickNewDefault(false)}
        title="Pick New Default"
      >
        <View className="px-4 pb-6 flex-col gap-2">
          <Text className="text-sm leading-5 mb-2" style={{ color: colors.textSecondary }}>
            Pick a new default. Then we'll delete the {volumeLabel(productSize)}.
          </Text>
          {otherConfigs.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => handleConfirmNewDefault(c.id)}
              className="flex-row items-center justify-between rounded-xl px-4 py-3"
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              })}
            >
              <View className="flex-col">
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>
                  {volumeLabel(c.productSize)}
                </Text>
                <Text style={{ color: colors.textTertiary, fontSize: 13 }}>
                  ${c.productCost.toFixed(2)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </GradientBackground>
  );
}
