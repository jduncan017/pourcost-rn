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
import { useUnsavedChangesGuard } from '@/src/lib/useUnsavedChangesGuard';
import IngredientInUseSheet from '@/src/components/ui/IngredientInUseSheet';
import BottomSheet from '@/src/components/ui/BottomSheet';
import Dropdown from '@/src/components/ui/Dropdown';
import IngredientInputs, {
  IngredientInputValues,
} from '@/src/components/IngredientInputs';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import {
  INITIAL_PRODUCT_SIZE,
  SUBTYPES_BY_TYPE,
  type IngredientType,
} from '@/src/constants/appConstants';
import { Volume, volumeLabel, volumeToOunces } from '@/src/types/models';
import SuggestedRetailInput from '@/src/components/ui/SuggestedRetailInput';
import PourCostHero, { getPerformance } from '@/src/components/PourCostHero';
import { useHeroTargetForIngredient } from '@/src/lib/useHeroTarget';
import {
  applyPriceFloor,
  calculateCostPerPour,
  calculateSuggestedPrice,
  formatCurrency,
  roundSuggestedPrice,
} from '@/src/services/calculation-service';
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
    (params.retailPrice as string) || ''
  );
  // True once the user has typed into the retail field. Until then the
  // input shows the live suggestion with a purple "Suggested" pill; typing
  // flips this true. The "Use Suggested" reset pill flips it back.
  const [retailIsManual, setRetailIsManual] = useState(
    !!(params.retailPrice as string),
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

    const initialType = (params.type as IngredientType) || 'Spirit';
    const pourSizes = useAppStore.getState().defaultPourSizes;
    let pourSize = volumeToOunces(pourSizes[initialType] ?? pourSizes.Spirit);
    try {
      if (params.pourSize)
        pourSize = volumeToOunces(
          JSON.parse(params.pourSize as string) as Volume
        );
    } catch {
      FeedbackService.showWarning('Parse Error', 'Could not read pour size. Using default.');
    }

    return {
      ingredientType: initialType,
      subType: (params.subType as string) || '',
      productSize,
      // 0 in create mode means "not entered yet" — drives progressive
      // disclosure: pricing block + Other Sizes section stay hidden until
      // the user enters a cost. Edit mode prefills from params with the
      // saved value so pricing renders immediately.
      productCost: params.productCost ? Number(params.productCost) : 0,
      pourSize,
      retailPrice:
        Number(params.retailPrice) ||
        useAppStore.getState().defaultRetailPrices[initialType] ||
        8.0,
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

  // Create-mode pending extra sizes — there's no ingredient row yet, so we
  // can't write configurations to the DB. Hold them in local state and
  // flush them as configurations after the ingredient is inserted on Save.
  // The "default" size is still entered inline via IngredientInputs.
  type PendingSize = { id: string; productSize: Volume; productCost: number };
  const [pendingExtraSizes, setPendingExtraSizes] = useState<PendingSize[]>([]);
  const [showSizeSheet, setShowSizeSheet] = useState(false);
  const [editingPendingSize, setEditingPendingSize] = useState<PendingSize | null>(null);

  // Sync local inputValues.productSize/productCost from the store whenever
  // the persisted ingredient changes underneath us — e.g. after the user
  // promoted a different size to default via the size form. Without this,
  // the SizeRow + pricing block render stale values from the original
  // initialization.
  useEffect(() => {
    if (!liveIngredient) return;
    setInputValues((prev) => {
      const sizeChanged =
        volumeLabel(prev.productSize) !== volumeLabel(liveIngredient.productSize);
      const costChanged = prev.productCost !== liveIngredient.productCost;
      if (!sizeChanged && !costChanged) return prev;
      return {
        ...prev,
        productSize: liveIngredient.productSize,
        productCost: liveIngredient.productCost,
      };
    });
  }, [liveIngredient?.productSize, liveIngredient?.productCost]);

  // One-way latch: once a cost has been entered (or prefilled in edit mode),
  // the pricing/sizes blocks stay revealed even if the user clears the field.
  // Prevents jarring layout shifts when someone backspaces while editing.
  const [pricingRevealed, setPricingRevealed] = useState(
    inputValues.productCost > 0,
  );
  useEffect(() => {
    if (!pricingRevealed && inputValues.productCost > 0) {
      setPricingRevealed(true);
    }
  }, [inputValues.productCost, pricingRevealed]);

  // Reactive reads for the inline pricing block. Pulled here (not via
  // getState in the IIFE) so re-renders pick up changes correctly.
  const suggestedPriceRounding = useAppStore((s) => s.suggestedPriceRounding);
  const minIngredientPrice = useAppStore((s) => s.minIngredientPrice);
  const { targetGoal: tieredTarget, targetLabel } = useHeroTargetForIngredient({
    type: inputValues.ingredientType,
    productCost: inputValues.productCost,
  });

  // Live suggested retail — recomputed whenever the inputs that drive it
  // change. Hoisted so save logic + suggested-mode display can both reach it.
  const suggestedRetail = (() => {
    const pourSizeVol: Volume = {
      kind: 'decimalOunces',
      ounces: inputValues.pourSize,
    };
    const cpp = calculateCostPerPour(
      inputValues.productSize,
      inputValues.productCost,
      pourSizeVol,
    );
    return applyPriceFloor(
      roundSuggestedPrice(
        calculateSuggestedPrice(cpp, tieredTarget / 100),
        suggestedPriceRounding,
      ),
      minIngredientPrice,
    );
  })();
  const effectiveRetail = retailIsManual
    ? parseFloat(retailPriceText) || 0
    : suggestedRetail;

  // Pour size for saving — held on the ingredient, consumed by every size's cost analysis.
  const pourSizeVolume: Volume = {
    kind: 'decimalOunces',
    ounces: inputValues.pourSize,
  };

  // Validation — retail required when for-sale (covered by effectiveRetail
  // which falls back to the live suggestion when the user hasn't manually
  // typed). Product size+cost still required for CREATE (first bottle must
  // have a price); edit mode relies on existing values. SubType is required
  // whenever the chosen type defines a subtype list (e.g. Spirit → Whiskey/
  // Vodka/etc, used by tier-based pour-cost targets).
  const requiresSubType = !!SUBTYPES_BY_TYPE[inputValues.ingredientType];
  const isValid =
    name.trim().length > 0 &&
    inputValues.productCost > 0 &&
    volumeToOunces(inputValues.productSize) > 0 &&
    (!requiresSubType || inputValues.subType.length > 0) &&
    (!forSale || effectiveRetail > 0);

  const { addIngredient, updateIngredient, deleteIngredient, addConfiguration } =
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

  // Per-field "user has overridden the canonical inheritance" flags. Drive
  // the purple "Inherited" pill in suggested mode and the "Use Canonical"
  // reset pill in manual mode. Initialized from the persisted override —
  // any column with a saved value starts as manual; everything else starts
  // inherited (subject to canonical prefill below).
  const [isBrandManual, setIsBrandManual] = useState(!!liveIngredient?.brand);
  const [isOriginManual, setIsOriginManual] = useState(!!liveIngredient?.origin);
  const [isProductionRegionManual, setIsProductionRegionManual] = useState(
    !!liveIngredient?.productionRegion,
  );
  const [isParentCompanyManual, setIsParentCompanyManual] = useState(
    !!liveIngredient?.parentCompany,
  );
  const [isFoundedYearManual, setIsFoundedYearManual] = useState(
    liveIngredient?.foundedYear != null,
  );
  const [isAgingYearsManual, setIsAgingYearsManual] = useState(
    liveIngredient?.agingYears != null,
  );
  const [isFlavorNotesManual, setIsFlavorNotesManual] = useState(
    !!(liveIngredient?.flavorNotes && liveIngredient.flavorNotes.length > 0),
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
  // Cache canonical in state (not just a ref) so the override-field UI can
  // resolve "Inherited" status from canonical values during render.
  const [canonical, setCanonical] = useState<CanonicalProductDetail | null>(null);
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
      setCanonical(c);
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
      name, canonicalProductId, forSale, description, retailPriceText, retailIsManual,
      abvText, inputValues,
      brand, origin, productionRegion, parentCompany, foundedYearText, agingYearsText, flavorNotesText,
    }),
    [
      name, canonicalProductId, forSale, description, retailPriceText, retailIsManual,
      abvText, inputValues,
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
        retailPrice: !forSale
          ? undefined
          : effectiveRetail > 0
            ? effectiveRetail
            : undefined,
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
        const created = await addIngredient(data);
        // Flush any extra sizes the user added during create. The default
        // size lives inline on the ingredient row; these extras become
        // configurations attached to the just-created ingredient.
        for (const p of pendingExtraSizes) {
          try {
            await addConfiguration(created.id, {
              productSize: p.productSize,
              productCost: p.productCost,
            });
          } catch (err) {
            // Non-fatal; surface a single error toast at the end. We don't
            // roll back the ingredient since the default size is valid.
            if (__DEV__) console.warn('[ingredient-form] addConfiguration failed', err);
          }
        }
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
                label="Ingredient Name"
                required
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

                <SuggestedRetailInput
                  label="Brand"
                  value={brand}
                  onChangeText={(t) => {
                    setBrand(t);
                    setIsBrandManual(true);
                  }}
                  isSuggesting={
                    !isBrandManual && !!canonical?.brand && brand === canonical.brand
                  }
                  onResetToSuggested={
                    canonical?.brand
                      ? () => {
                          setBrand(canonical.brand!);
                          setIsBrandManual(false);
                        }
                      : undefined
                  }
                  pillLabel="Inherited"
                  resetLabel="Use Canonical"
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

                <SuggestedRetailInput
                  label="Origin"
                  value={origin}
                  onChangeText={(t) => {
                    setOrigin(t);
                    setIsOriginManual(true);
                  }}
                  isSuggesting={
                    !isOriginManual && !!canonical?.origin && origin === canonical.origin
                  }
                  onResetToSuggested={
                    canonical?.origin
                      ? () => {
                          setOrigin(canonical.origin!);
                          setIsOriginManual(false);
                        }
                      : undefined
                  }
                  pillLabel="Inherited"
                  resetLabel="Use Canonical"
                  placeholder="e.g., Austin, TX, USA"
                  autoCapitalize="words"
                />

                <SuggestedRetailInput
                  label="Production Region"
                  value={productionRegion}
                  onChangeText={(t) => {
                    setProductionRegion(t);
                    setIsProductionRegionManual(true);
                  }}
                  isSuggesting={
                    !isProductionRegionManual &&
                    !!canonical?.productionRegion &&
                    productionRegion === canonical.productionRegion
                  }
                  onResetToSuggested={
                    canonical?.productionRegion
                      ? () => {
                          setProductionRegion(canonical.productionRegion!);
                          setIsProductionRegionManual(false);
                        }
                      : undefined
                  }
                  pillLabel="Inherited"
                  resetLabel="Use Canonical"
                  placeholder="e.g., Cognac, France"
                  autoCapitalize="words"
                />

                <SuggestedRetailInput
                  label="Parent Company"
                  value={parentCompany}
                  onChangeText={(t) => {
                    setParentCompany(t);
                    setIsParentCompanyManual(true);
                  }}
                  isSuggesting={
                    !isParentCompanyManual &&
                    !!canonical?.parentCompany &&
                    parentCompany === canonical.parentCompany
                  }
                  onResetToSuggested={
                    canonical?.parentCompany
                      ? () => {
                          setParentCompany(canonical.parentCompany!);
                          setIsParentCompanyManual(false);
                        }
                      : undefined
                  }
                  pillLabel="Inherited"
                  resetLabel="Use Canonical"
                  placeholder="e.g., Diageo"
                  autoCapitalize="words"
                />

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <SuggestedRetailInput
                      label="Founded"
                      value={foundedYearText}
                      onChangeText={(t) => {
                        setFoundedYearText(t.replace(/[^0-9]/g, ''));
                        setIsFoundedYearManual(true);
                      }}
                      isSuggesting={
                        !isFoundedYearManual &&
                        canonical?.foundedYear != null &&
                        foundedYearText === String(canonical.foundedYear)
                      }
                      onResetToSuggested={
                        canonical?.foundedYear != null
                          ? () => {
                              setFoundedYearText(String(canonical.foundedYear));
                              setIsFoundedYearManual(false);
                            }
                          : undefined
                      }
                      pillLabel="Inherited"
                      resetLabel="Use Canonical"
                      placeholder="e.g., 1997"
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                  </View>
                  <View className="flex-1">
                    <SuggestedRetailInput
                      label="Aging (years)"
                      value={agingYearsText}
                      onChangeText={(t) => {
                        setAgingYearsText(t.replace(/[^0-9.]/g, ''));
                        setIsAgingYearsManual(true);
                      }}
                      isSuggesting={
                        !isAgingYearsManual &&
                        canonical?.agingYears != null &&
                        agingYearsText === String(canonical.agingYears)
                      }
                      onResetToSuggested={
                        canonical?.agingYears != null
                          ? () => {
                              setAgingYearsText(String(canonical.agingYears));
                              setIsAgingYearsManual(false);
                            }
                          : undefined
                      }
                      pillLabel="Inherited"
                      resetLabel="Use Canonical"
                      placeholder="e.g., 12"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <SuggestedRetailInput
                  label="Flavor Notes (comma-separated)"
                  value={flavorNotesText}
                  onChangeText={(t) => {
                    setFlavorNotesText(t);
                    setIsFlavorNotesManual(true);
                  }}
                  isSuggesting={
                    !isFlavorNotesManual &&
                    !!canonical?.flavorNotes?.length &&
                    flavorNotesText === canonical.flavorNotes.join(', ')
                  }
                  onResetToSuggested={
                    canonical?.flavorNotes?.length
                      ? () => {
                          setFlavorNotesText(canonical.flavorNotes!.join(', '));
                          setIsFlavorNotesManual(false);
                        }
                      : undefined
                  }
                  pillLabel="Inherited"
                  resetLabel="Use Canonical"
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
              defaultPourSizeOz={volumeToOunces(
                useAppStore.getState().defaultPourSizes[inputValues.ingredientType]
                  ?? useAppStore.getState().defaultPourSize,
              )}
            />

            {/* Multi-size hint — only when no cost has been entered yet in
                create mode. Surfaces the multi-size capability before the
                Other Sizes section is gated open. Once pricing is revealed
                the actual Other Sizes section takes over and the hint is
                no longer needed. */}
            {!isEditing && !pricingRevealed && (
              <Text
                className="text-xs leading-4"
                style={{ color: colors.textTertiary }}
              >
                Carry this in multiple sizes? Add more below after entering cost.
              </Text>
            )}

            {/* Sizes section — edit mode only. Lists the primary inline size +
                any configurations. Tap to edit, plus button to add. Cost
                analysis for each size happens on the size-form screen. */}
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

            {/* Other Sizes — create mode only. The size + cost shown above
                in IngredientInputs is the default; this section collects any
                additional sizes the user wants to configure during create.
                They become configurations attached to the new ingredient
                after Save. Edit mode uses the unified Sizes section above. */}
            {!isEditing && pricingRevealed && (
              <View className="flex-col gap-3">
                <Text
                  className="text-[11px] tracking-widest uppercase"
                  style={{ color: colors.textTertiary, fontWeight: '600' }}
                >
                  Other Sizes
                </Text>

                {pendingExtraSizes.map((p) => (
                  <SizeRow
                    key={p.id}
                    label={volumeLabel(p.productSize)}
                    cost={p.productCost}
                    onPress={() => {
                      setEditingPendingSize(p);
                      setShowSizeSheet(true);
                    }}
                  />
                ))}

                <Pressable
                  onPress={() => {
                    setEditingPendingSize(null);
                    setShowSizeSheet(true);
                  }}
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

            {/* Pricing — retail price + Pour Cost Hero. Hidden until the
                default size has a cost set; without cost there's nothing to
                anchor the pricing math against. Numbers here are based on
                the DEFAULT size only — the detail page breaks down each
                size separately. */}
            {forSale && pricingRevealed && (
              <View className="flex-col gap-5">
                <SuggestedRetailInput
                  label="Retail Price"
                  required
                  value={
                    retailIsManual
                      ? retailPriceText
                      : suggestedRetail > 0
                        ? suggestedRetail.toFixed(2)
                        : ''
                  }
                  onChangeText={(text) => {
                    if (text === '' || /^\d*\.?\d*$/.test(text)) {
                      setRetailPriceText(text);
                      setRetailIsManual(true);
                      const price = text === '' ? 0 : parseFloat(text) || 0;
                      handleInputChange({ retailPrice: price });
                    }
                  }}
                  isSuggesting={!retailIsManual && suggestedRetail > 0}
                  onResetToSuggested={() => {
                    setRetailIsManual(false);
                    setRetailPriceText('');
                    handleInputChange({ retailPrice: suggestedRetail });
                  }}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  prefix="$"
                />

                {(() => {
                  // Pour cost % from the effective retail (suggested or manual).
                  const pourSizeVol: Volume = {
                    kind: 'decimalOunces',
                    ounces: inputValues.pourSize,
                  };
                  const costPerPour = calculateCostPerPour(
                    inputValues.productSize,
                    inputValues.productCost,
                    pourSizeVol,
                  );
                  const pourCostPercentage =
                    effectiveRetail > 0 ? (costPerPour / effectiveRetail) * 100 : 0;
                  return (
                    <View className="flex-col gap-2 -mx-6">
                      <PourCostHero
                        pourCostPercentage={pourCostPercentage}
                        targetGoal={tieredTarget}
                        targetLabel={targetLabel ?? undefined}
                      />
                      <Text
                        className="text-xs px-6"
                        style={{ color: colors.textTertiary }}
                      >
                        Based on your default size. Each size has its own pour cost on the detail page.
                      </Text>
                    </View>
                  );
                })()}
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

            <View className="h-8" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Inline size editor — used in create mode (no DB ingredient yet) to
          add or edit a pending extra size. In edit mode the user goes to
          the dedicated /ingredient-size-form screen instead. */}
      <PendingSizeSheet
        visible={showSizeSheet}
        onClose={() => {
          setShowSizeSheet(false);
          setEditingPendingSize(null);
        }}
        editing={editingPendingSize}
        ingredientType={inputValues.ingredientType}
        ingredientSubType={inputValues.subType}
        existingSizes={[
          inputValues.productSize,
          ...pendingExtraSizes.map((p) => p.productSize),
        ]}
        onSave={(size, cost) => {
          if (editingPendingSize) {
            setPendingExtraSizes((prev) =>
              prev.map((p) =>
                p.id === editingPendingSize.id
                  ? { ...p, productSize: size, productCost: cost }
                  : p,
              ),
            );
          } else {
            setPendingExtraSizes((prev) => [
              ...prev,
              {
                id: Math.random().toString(36).slice(2),
                productSize: size,
                productCost: cost,
              },
            ]);
          }
          setShowSizeSheet(false);
          setEditingPendingSize(null);
        }}
        onDelete={
          editingPendingSize
            ? () => {
                setPendingExtraSizes((prev) =>
                  prev.filter((p) => p.id !== editingPendingSize.id),
                );
                setShowSizeSheet(false);
                setEditingPendingSize(null);
              }
            : undefined
        }
      />
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

// ============================================================
// PendingSizeSheet — inline size + cost editor used during create.
// We can't write to ingredient_configurations until the ingredient
// row exists, so create-mode extras live in local state and flush
// on Save. Edit mode uses the dedicated /ingredient-size-form screen.
// ============================================================

function PendingSizeSheet({
  visible,
  onClose,
  editing,
  ingredientType,
  ingredientSubType,
  existingSizes,
  onSave,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  editing: { id: string; productSize: Volume; productCost: number } | null;
  ingredientType: string;
  ingredientSubType?: string;
  existingSizes: Volume[];
  onSave: (size: Volume, cost: number) => void;
  onDelete?: () => void;
}) {
  const colors = useThemeColors();
  const router = useGuardedRouter();
  const enabledProductSizes = useAppStore((s) => s.enabledProductSizes);

  const [size, setSize] = useState<Volume>(
    editing?.productSize ?? ({ kind: 'milliliters', ml: 750 } as Volume),
  );
  const [costText, setCostText] = useState(
    editing ? editing.productCost.toFixed(2) : '0.00',
  );

  // Reset state whenever the sheet opens fresh.
  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setSize(editing.productSize);
      setCostText(editing.productCost.toFixed(2));
    } else {
      const allForType = (
        require('@/src/constants/appConstants') as typeof import('@/src/constants/appConstants')
      ).getProductSizesForType(ingredientType, ingredientSubType, enabledProductSizes);
      const taken = new Set(existingSizes.map((s) => volumeLabel(s)));
      const firstFree = allForType.find((s) => !taken.has(volumeLabel(s)));
      setSize(
        firstFree ?? allForType[0] ?? ({ kind: 'milliliters', ml: 750 } as Volume),
      );
      setCostText('0.00');
    }
  }, [visible, editing, ingredientType, ingredientSubType, enabledProductSizes, existingSizes]);

  const sizeOptions = useMemo(() => {
    const {
      getProductSizesForType: gp,
      getProductSizeSection: gs,
    } = require('@/src/constants/appConstants') as typeof import('@/src/constants/appConstants');
    const currentLabel = volumeLabel(size);
    return gp(ingredientType, ingredientSubType, enabledProductSizes, currentLabel).map(
      (s) => ({
        value: volumeLabel(s),
        label: volumeLabel(s),
        section: gs(s),
      }),
    );
  }, [ingredientType, ingredientSubType, enabledProductSizes, size]);

  const handleSizeChange = (selectedLabel: string) => {
    const {
      getProductSizesForType: gp,
    } = require('@/src/constants/appConstants') as typeof import('@/src/constants/appConstants');
    const match = gp(ingredientType, ingredientSubType, enabledProductSizes, volumeLabel(size)).find(
      (s) => volumeLabel(s) === selectedLabel,
    );
    if (match) setSize(match);
  };

  const cost = parseFloat(costText) || 0;
  const isValid = cost > 0 && volumeToOunces(size) > 0;
  const isDuplicate =
    !editing &&
    existingSizes.some((s) => volumeLabel(s) === volumeLabel(size));
  const sizeChangedToConflict =
    !!editing &&
    volumeLabel(size) !== volumeLabel(editing.productSize) &&
    existingSizes.some((s) => volumeLabel(s) === volumeLabel(size));

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={editing ? 'Edit Size' : 'Add Size'}
    >
      <View className="px-4 pb-6 flex-col gap-5">
        <Dropdown
          value={volumeLabel(size)}
          onValueChange={handleSizeChange}
          options={sizeOptions}
          label="Bottle Size"
          placeholder="Select size"
          sheetHeaderRight={(close) => (
            <Pressable
              onPress={() => {
                close();
                onClose();
                router.push('/container-sizes' as any);
              }}
              className="px-3 py-1.5"
              hitSlop={6}
            >
              <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 14 }}>
                Edit
              </Text>
            </Pressable>
          )}
        />

        <TextInput
          label={`Cost / ${volumeLabel(size)}`}
          required
          value={costText}
          onChangeText={(text) => {
            if (text === '' || /^\d*\.?\d*$/.test(text)) setCostText(text);
          }}
          placeholder="0.00"
          keyboardType="decimal-pad"
          prefix="$"
        />

        {(isDuplicate || sizeChangedToConflict) && (
          <Text className="text-sm" style={{ color: colors.error }}>
            This size is already configured.
          </Text>
        )}

        <View className="flex-row gap-3">
          {onDelete && (
            <Pressable
              onPress={onDelete}
              className="flex-row items-center justify-center gap-2 py-3 rounded-xl flex-1"
              style={{
                borderWidth: 1,
                borderColor: colors.error + '60',
              }}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
              <Text style={{ color: colors.error, fontWeight: '600', fontSize: 14 }}>
                Delete
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => {
              if (!isValid || isDuplicate || sizeChangedToConflict) return;
              onSave(size, cost);
            }}
            disabled={!isValid || isDuplicate || sizeChangedToConflict}
            className="py-3 rounded-xl flex-1 items-center justify-center"
            style={{
              backgroundColor: colors.go,
              opacity: !isValid || isDuplicate || sizeChangedToConflict ? 0.4 : 1,
            }}
          >
            <Text style={{ color: palette.N1, fontWeight: '700', fontSize: 15 }}>
              {editing ? 'Update' : 'Add Size'}
            </Text>
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}
