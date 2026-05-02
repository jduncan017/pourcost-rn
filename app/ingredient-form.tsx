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
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { useAppStore } from '@/src/stores/app-store';
import { Ionicons } from '@expo/vector-icons';
import Toggle from '@/src/components/ui/Toggle';
import DetailLevelToggle from '@/src/components/ui/DetailLevelToggle';
import TextInput from '@/src/components/ui/TextInput';
import type { TextInput as RNTextInput } from 'react-native';
import GradientBackground from '@/src/components/ui/GradientBackground';
import FormSaveBar from '@/src/components/ui/FormSaveBar';
import { useUnsavedChangesGuard } from '@/src/lib/useUnsavedChangesGuard';
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
import {
  getCanonicalProductDetail,
  type CanonicalProductDetail,
} from '@/src/lib/canonical-products';
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
  const [canonicalProductId, setCanonicalProductId] = useState<string | undefined>(
    (params.canonicalProductId as string) || undefined
  );
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

  // Override fields — render only in Detailed form mode. All optional;
  // empty string / null = no override, canonical fallback applies on display.
  const [brand, setBrand] = useState(liveIngredient?.brand ?? '');
  const [origin, setOrigin] = useState(liveIngredient?.origin ?? '');
  const [productionRegion, setProductionRegion] = useState(
    liveIngredient?.productionRegion ?? '',
  );
  const [parentCompany, setParentCompany] = useState(
    liveIngredient?.parentCompany ?? '',
  );
  const [foundedYearText, setFoundedYearText] = useState(
    liveIngredient?.foundedYear?.toString() ?? '',
  );
  const [agingYearsText, setAgingYearsText] = useState(
    liveIngredient?.agingYears?.toString() ?? '',
  );
  const [flavorNotesText, setFlavorNotesText] = useState(
    (liveIngredient?.flavorNotes ?? []).join(', '),
  );

  // Form mode local state (independent of the detail-screen detailLevel).
  // Default to Detailed when there's a canonical link OR any saved override
  // — those signal the user is working with a database-backed product.
  const hasAnyOverride =
    !!liveIngredient?.brand ||
    !!liveIngredient?.origin ||
    !!liveIngredient?.productionRegion ||
    !!liveIngredient?.parentCompany ||
    liveIngredient?.foundedYear != null ||
    liveIngredient?.agingYears != null ||
    (liveIngredient?.flavorNotes && liveIngredient.flavorNotes.length > 0);
  const [formMode, setFormMode] = useState<'simple' | 'detailed'>(
    canonicalProductId || hasAnyOverride ? 'detailed' : 'simple',
  );

  // Fetch the linked canonical so Detailed-mode inputs can prefill with its
  // values (UX: users see the data is already there). On save we compare each
  // input back to the canonical — matching values save as undefined (NULL),
  // so the linking-fallback stays clean and only intentional edits become
  // overrides in the DB.
  const canonicalRef = useRef<CanonicalProductDetail | null>(null);
  // `prefillReady` is state (not a ref) so the dirty-tracking effect below
  // can wait for prefill to finish before capturing its initial snapshot.
  // Otherwise canonical-prefill writes count as user changes and pop the
  // unsaved-changes guard on innocent back-presses.
  const [prefillReady, setPrefillReady] = useState(!canonicalProductId);
  useEffect(() => {
    if (!canonicalProductId || prefillReady) return;
    let cancelled = false;
    getCanonicalProductDetail(canonicalProductId).then((c) => {
      if (cancelled) return;
      canonicalRef.current = c;
      if (c) {
        // Only prefill fields the user hasn't already saved an override for.
        // Reading liveIngredient gives us the persisted state; if a column is
        // null there, fall back to canonical for the form display.
        if (!liveIngredient?.brand && c.brand) setBrand(c.brand);
        if (!liveIngredient?.origin && c.origin) setOrigin(c.origin);
        if (!liveIngredient?.productionRegion && c.productionRegion)
          setProductionRegion(c.productionRegion);
        if (!liveIngredient?.parentCompany && c.parentCompany)
          setParentCompany(c.parentCompany);
        if (liveIngredient?.foundedYear == null && c.foundedYear)
          setFoundedYearText(String(c.foundedYear));
        if (liveIngredient?.agingYears == null && c.agingYears != null)
          setAgingYearsText(String(c.agingYears));
        if (
          (!liveIngredient?.flavorNotes || liveIngredient.flavorNotes.length === 0) &&
          c.flavorNotes.length > 0
        ) {
          setFlavorNotesText(c.flavorNotes.join(', '));
        }
      }
      setPrefillReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [canonicalProductId, liveIngredient, prefillReady]);
  const { cocktails } = useCocktailsStore();
  const [isSaving, setIsSaving] = useState(false);
  const [showInUseSheet, setShowInUseSheet] = useState(false);
  const saveRef = useRef<() => void>(() => {});

  // Refs for the keyboard "Next" chain. Description is multiline (return =
  // newline) and ABV/Retail are decimal-pad (no return key), so the realistic
  // chain is just Name → ABV. Description gets filled later or via tap.
  const abvInputRef = useRef<RNTextInput>(null);

  // Dirty tracking — capture initial form state once, compare on every render.
  const initialSnapshotRef = useRef<string | null>(null);
  const currentSnapshot = useMemo(
    () => JSON.stringify({
      name, canonicalProductId, forSale, description, retailPriceText, abvText, inputValues,
      brand, origin, productionRegion, parentCompany, foundedYearText, agingYearsText, flavorNotesText,
    }),
    [
      name, canonicalProductId, forSale, description, retailPriceText, abvText, inputValues,
      brand, origin, productionRegion, parentCompany, foundedYearText, agingYearsText, flavorNotesText,
    ],
  );
  useEffect(() => {
    if (initialSnapshotRef.current !== null) return;
    // Wait until canonical-driven prefill has settled (or there's no
    // canonical to wait for) so the snapshot reflects the user's true
    // starting state — not the empty-then-prefilled flicker.
    if (!prefillReady) return;
    initialSnapshotRef.current = currentSnapshot;
  }, [currentSnapshot, prefillReady]);
  const isDirty =
    initialSnapshotRef.current !== null &&
    currentSnapshot !== initialSnapshotRef.current;
  const guard = useUnsavedChangesGuard(isDirty);

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
      const foundedYearValue =
        foundedYearText.trim() === '' ? undefined : parseInt(foundedYearText, 10);
      const agingYearsValue =
        agingYearsText.trim() === '' ? undefined : Number(agingYearsText);
      const flavorNotesValue = flavorNotesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      // When a canonical is linked, compare each override input back to the
      // canonical's value. If they match, save undefined so the column stays
      // NULL — display falls back to the canonical and stays in sync if the
      // canonical is later updated. Only typed-and-different values become
      // real overrides in the DB.
      const canonical = canonicalRef.current;
      const overrideOrUndefined = <T,>(input: T | undefined, canonicalValue: T | null | undefined): T | undefined => {
        if (input === undefined || input === null) return undefined;
        if (typeof input === 'string' && input === '') return undefined;
        if (canonical && input === canonicalValue) return undefined;
        return input;
      };
      const flavorNotesMatchCanonical = (): boolean => {
        if (!canonical) return false;
        const cn = canonical.flavorNotes ?? [];
        if (cn.length !== flavorNotesValue.length) return false;
        const a = [...cn].map((s) => s.trim().toLowerCase()).sort();
        const b = [...flavorNotesValue].map((s) => s.trim().toLowerCase()).sort();
        return a.every((v, i) => v === b[i]);
      };

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
        canonicalProductId,
        // Override fields — undefined whenever input matches canonical OR is
        // empty, so the column stays NULL and inheritance applies on display.
        brand: overrideOrUndefined(brand.trim(), canonical?.brand),
        origin: overrideOrUndefined(origin.trim(), canonical?.origin),
        productionRegion: overrideOrUndefined(productionRegion.trim(), canonical?.productionRegion),
        parentCompany: overrideOrUndefined(parentCompany.trim(), canonical?.parentCompany),
        foundedYear: overrideOrUndefined(foundedYearValue, canonical?.foundedYear),
        agingYears: overrideOrUndefined(agingYearsValue, canonical?.agingYears),
        flavorNotes:
          flavorNotesValue.length === 0 || flavorNotesMatchCanonical()
            ? undefined
            : flavorNotesValue,
      };

      if (isEditing) {
        await updateIngredient(ingredientId, data);
      } else {
        await addIngredient(data);
      }
      guard.bypass();
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
        guard.bypass();
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
    });
  }, [isEditing, navigation, colors]);

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
            {/* Form mode toggle — Simple keeps the form short; Detailed
                exposes override fields (brand, origin, flavor notes, etc.)
                that live alongside the linked canonical product. */}
            <View className="flex-row justify-center">
              <DetailLevelToggle
                simpleLabel="SIMPLE"
                detailedLabel="DETAILED"
                value={formMode}
                onChange={(v) => setFormMode(v)}
              />
            </View>

            {/* Identity — Name, Description, ABV, For Sale.
                Catalog search lives on the dedicated /ingredient-create
                picker that routes here with prefill params (or empty for
                "Create from scratch"). */}
            <View className="flex-col gap-5">
              <TextInput
                label="Ingredient Name *"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (canonicalProductId) setCanonicalProductId(undefined);
                }}
                placeholder="e.g., Vodka (Premium), Simple Syrup"
                autoCapitalize="words"
                autoFocus={!isEditing}
                returnKeyType="next"
                onSubmitEditing={() => abvInputRef.current?.focus()}
                blurOnSubmit={false}
              />

              <TextInput
                ref={abvInputRef}
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

            {/* Detailed-mode fields — per-ingredient overrides for the
                canonical-style identity attributes. Empty values keep the
                canonical fallback in place; typed values override on display. */}
            {formMode === 'detailed' && (
              <View className="flex-col gap-5">
                <Text
                  className="text-[11px] tracking-widest uppercase"
                  style={{ color: colors.textTertiary, fontWeight: '600' }}
                >
                  Identity Details
                </Text>

                <TextInput
                  label="Brand"
                  value={brand}
                  onChangeText={setBrand}
                  placeholder="e.g., Tito's"
                  autoCapitalize="words"
                />

                <TextInput
                  label="Description"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Brief description…"
                  multiline
                />

                <TextInput
                  label="Origin"
                  value={origin}
                  onChangeText={setOrigin}
                  placeholder="e.g., Austin, TX, USA"
                  autoCapitalize="words"
                />

                <TextInput
                  label="Production Region"
                  value={productionRegion}
                  onChangeText={setProductionRegion}
                  placeholder="e.g., Cognac, France"
                  autoCapitalize="words"
                />

                <TextInput
                  label="Parent Company"
                  value={parentCompany}
                  onChangeText={setParentCompany}
                  placeholder="e.g., Diageo"
                  autoCapitalize="words"
                />

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <TextInput
                      label="Founded"
                      value={foundedYearText}
                      onChangeText={(t) => setFoundedYearText(t.replace(/[^0-9]/g, ''))}
                      placeholder="e.g., 1997"
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                  </View>
                  <View className="flex-1">
                    <TextInput
                      label="Aging (years)"
                      value={agingYearsText}
                      onChangeText={(t) => setAgingYearsText(t.replace(/[^0-9.]/g, ''))}
                      placeholder="e.g., 12"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <TextInput
                  label="Flavor Notes (comma-separated)"
                  value={flavorNotesText}
                  onChangeText={setFlavorNotesText}
                  placeholder="e.g., clean, peppery, citrus"
                  autoCapitalize="none"
                />
              </View>
            )}

            {/* Details — type chips, subtype, pour size.
                Edit mode hides product size + cost (those live in the Sizes section).
                pourSizeOverride collapses the per-ingredient pour size unless the
                user explicitly customizes it; the global default lives in Settings. */}
            <IngredientInputs
              variant="form"
              values={{ ...inputValues, notForSale: !forSale }}
              onChange={handleInputChange}
              hideRetailPrice
              hideProductSize={isEditing}
              noCard
              pourSizeOverride
              defaultPourSizeOz={volumeToOunces(useAppStore.getState().defaultPourSize)}
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

            <FormSaveBar
              onPress={() => saveRef.current()}
              disabled={!isValid || isSaving}
              isSaving={isSaving}
            />

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
