import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TextInput as RNTextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GradientBackground from '@/src/components/ui/GradientBackground';
import BottomSheet from '@/src/components/ui/BottomSheet';
import SearchBar from '@/src/components/ui/SearchBar';
import { palette, useThemeColors } from '@/src/contexts/ThemeContext';
import {
  WELL_CATEGORIES,
  WellCategory,
  WellQuickPick,
  COMMON_WELL_SIZES,
  EXTENDED_WELL_SIZES,
  PREFERRED_WELL_SIZE,
  bestSizeFromCanonical,
} from '@/src/lib/wells';
import { seedWells, WellSelection } from '@/src/lib/seed-wells';
import {
  searchCanonicalBySubcategory,
  type CanonicalProductSummary,
} from '@/src/lib/canonical-products';
import { Volume, SavedIngredient } from '@/src/types/models';
import { volumeLabel } from '@/src/types/models';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { FeedbackService } from '@/src/services/feedback-service';
import { HapticService } from '@/src/services/haptic-service';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { capture } from '@/src/services/analytics-service';

const SEARCH_DEBOUNCE_MS = 250;
const FOOTER_BG = '#0B1120';

/** Volume → ml for sort comparisons. */
function sizeMl(v: Volume): number {
  if (v.kind === 'milliliters') return v.ml;
  if (v.kind === 'decimalOunces') return v.ounces * 29.5735;
  if (v.kind === 'fractionalOunces')
    return (v.numerator / v.denominator) * 29.5735;
  if (v.kind === 'namedOunces') return v.ounces * 29.5735;
  return 0;
}

/** Friendly label for a size: "1 L" / "750 ml" / "1.75 L (handle)". */
function prettySizeLabel(v: Volume): string {
  if (v.kind !== 'milliliters') return volumeLabel(v);
  if (v.ml >= 1000) {
    const liters = v.ml / 1000;
    const handle = v.ml === 1750 ? ' (handle)' : v.ml === 1500 ? ' (magnum)' : '';
    return `${liters % 1 === 0 ? liters.toFixed(0) : liters} L${handle}`;
  }
  const mini = v.ml === 50 ? ' (mini)' : '';
  return `${v.ml} ml${mini}`;
}

export interface WellsPickerProps {
  onFinish: () => void;
  /** Show "Skip" link when nothing is picked. Default true. */
  skippable?: boolean;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  /**
   * onboarding: bulk-insert wells. brand-not-found is informational text only.
   * settings: pre-populates from existing wells, picker shows "From My
   *   Inventory" section, brand-not-found routes to /ingredient-form,
   *   diff-and-apply on continue (untag old, tag/insert new).
   */
  mode?: 'onboarding' | 'settings';
}

/** A tile row's currently chosen value. */
interface PickedValue {
  source: 'quick' | 'canonical' | 'inventory' | 'existing-well';
  name: string;
  productSize: Volume;
  /** Cost. Required to write the well. Pre-filled for inventory + existing-well. */
  productCost?: number;
  canonicalProductId?: string;
  /** Set when the pick references a row already in the user's bar
   *  (source === 'inventory' or 'existing-well'). Drives whether finish()
   *  inserts a new ingredient or updates is_well on an existing one. */
  existingIngredientId?: string;
  /** Available sizes for this pick. Sourced from canonical default_sizes
   *  when picked from the database; undefined for quick picks. Drives the
   *  size picker so we only offer real sizes. */
  availableSizes?: Volume[];
}

export default function WellsPicker({
  onFinish,
  skippable = true,
  title = 'Set Up Your Wells',
  subtitle = "Pick the house-pour brand for each category. We'll add them to Bar Inventory so you can start building cocktails right away.",
  showBack = true,
  mode = 'onboarding',
}: WellsPickerProps) {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();

  // Settings mode reads existing wells from the store; onboarding starts blank.
  const ingredients = useIngredientsStore((s) => s.ingredients);

  const [picks, setPicks] = useState<Record<string, PickedValue | undefined>>({});
  /** Snapshot of picks at mount/load time (settings mode). Drives the diff
   *  on Continue so we know what to untag, what to insert, what to leave. */
  const [initialPicks, setInitialPicks] = useState<Record<string, PickedValue | undefined>>({});
  const [showMore, setShowMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [sizePickerKey, setSizePickerKey] = useState<string | null>(null);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  // Pre-populate from existing wells (settings mode only).
  useEffect(() => {
    if (mode !== 'settings' || hasLoadedInitial) return;
    const wells = ingredients.filter((i) => i.isWell);
    const next: Record<string, PickedValue> = {};
    for (const cat of WELL_CATEGORIES) {
      // Match by exact subType. Ties broken by most recently created.
      const match = wells
        .filter((i) => i.subType === cat.subType)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      if (!match) continue;
      next[cat.key] = {
        source: 'existing-well',
        name: match.name,
        productSize: match.productSize,
        productCost: match.productCost,
        canonicalProductId: match.canonicalProductId,
        existingIngredientId: match.id,
      };
    }
    setPicks(next);
    setInitialPicks(next);
    // Auto-expand "more wells" section if any pre-populated wells live there.
    const moreKeys = WELL_CATEGORIES.filter((c) => !c.defaultExpanded).map((c) => c.key);
    if (moreKeys.some((k) => next[k])) setShowMore(true);
    setHasLoadedInitial(true);
  }, [mode, ingredients, hasLoadedInitial]);

  const defaultCategories = WELL_CATEGORIES.filter((c) => c.defaultExpanded);
  const moreCategories = WELL_CATEGORIES.filter((c) => !c.defaultExpanded);

  const validEntries = Object.entries(picks).filter(
    ([, p]) => !!p && p.productCost != null && p.productCost > 0
  );
  const validCount = validEntries.length;
  const pickedCount = Object.values(picks).filter(Boolean).length;
  const unpricedCount = pickedCount - validCount;

  const canContinue =
    !busy && (mode === 'settings' || validCount >= 1);

  const setPick = (categoryKey: string, value: PickedValue | undefined) => {
    HapticService.selection();
    setPicks((prev) => ({ ...prev, [categoryKey]: value }));
  };

  const setPickedCost = (categoryKey: string, cost: number | undefined) => {
    setPicks((prev) => {
      const current = prev[categoryKey];
      if (!current) return prev;
      return { ...prev, [categoryKey]: { ...current, productCost: cost } };
    });
  };

  const setPickedSize = (categoryKey: string, size: Volume) => {
    setPicks((prev) => {
      const current = prev[categoryKey];
      if (!current) return prev;
      return { ...prev, [categoryKey]: { ...current, productSize: size } };
    });
  };

  /** Onboarding write: bulk-insert all valid picks. */
  const writeOnboarding = async () => {
    if (validCount === 0) return;
    const payload: WellSelection[] = validEntries.map(([categoryKey, v]) => ({
      categoryKey,
      name: v!.name,
      productSize: v!.productSize,
      productCost: v!.productCost!,
      canonicalProductId: v!.canonicalProductId,
    }));
    try {
      await seedWells(payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save wells';
      FeedbackService.showError(
        'Wells Setup Failed',
        `${msg}. You can add these later from Bar Inventory.`
      );
    }
  };

  /** Settings write: diff old vs new, untag/insert/tag per category. */
  const writeSettingsDiff = async () => {
    const store = useIngredientsStore.getState();

    for (const category of WELL_CATEGORIES) {
      const oldPick = initialPicks[category.key];
      const newPick = picks[category.key];

      // Identical (same existing ingredient OR both undefined): skip.
      if (oldPick?.existingIngredientId === newPick?.existingIngredientId &&
          oldPick?.name === newPick?.name) {
        continue;
      }

      try {
        // Untag the previous well if there was one.
        if (oldPick?.existingIngredientId) {
          await store.updateIngredient(oldPick.existingIngredientId, { isWell: false });
        }

        if (!newPick) continue; // category cleared

        // Tag-existing path.
        if (newPick.existingIngredientId && newPick.source === 'inventory') {
          await store.updateIngredient(newPick.existingIngredientId, {
            isWell: true,
            subType: category.subType,
          });
          continue;
        }

        // Insert path (canonical or quick pick).
        if (newPick.productCost != null && newPick.productCost > 0) {
          await store.addIngredient({
            name: newPick.name,
            productSize: newPick.productSize,
            productCost: newPick.productCost,
            type: category.canonicalCategory ?? 'Spirit',
            subType: category.subType,
            notForSale: false,
            isWell: true,
            canonicalProductId: newPick.canonicalProductId,
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not update well';
        FeedbackService.showError(`${category.label} update failed`, msg);
      }
    }
  };

  const finish = async (skipSeeding: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      if (!skipSeeding) {
        if (mode === 'onboarding') {
          await writeOnboarding();
        } else {
          await writeSettingsDiff();
        }
      }
      capture('wells_picker_complete', {
        skipped: skipSeeding,
        well_count: validCount,
        mode,
      });
      onFinish();
    } finally {
      setBusy(false);
    }
  };

  // Inventory list for the active category's picker (settings mode only).
  // EXACT subType match — no family fallbacks. If you want to designate a
  // Rye as your Bourbon well, that's a sign you should be filling the Rye
  // row instead. Family fallbacks are for the cocktail-time substitution
  // walk (V1.1 picker), not for wells assignment.
  const activeCategory =
    activeKey != null ? WELL_CATEGORIES.find((c) => c.key === activeKey) ?? null : null;

  const activeInventory = useMemo<SavedIngredient[]>(() => {
    if (mode !== 'settings' || !activeCategory) return [];
    const currentWellId = picks[activeCategory.key]?.existingIngredientId;
    return ingredients
      .filter((i) => i.subType === activeCategory.subType)
      .filter((i) => i.id !== currentWellId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [mode, activeCategory, ingredients, picks]);

  // Sizes shown in the size picker for the active row. For canonical picks
  // we restrict to that product's default_sizes (whatever the catalog says
  // is real). For quick picks (no canonical link) we fall back to the
  // hand-curated COMMON_WELL_SIZES list.
  const sizePickerCategory =
    sizePickerKey != null
      ? WELL_CATEGORIES.find((c) => c.key === sizePickerKey) ?? null
      : null;
  const sizePickerPicked = sizePickerKey != null ? picks[sizePickerKey] : null;
  const sizePickerOptions = useMemo<{ value: Volume; label: string }[]>(() => {
    if (!sizePickerPicked) return COMMON_WELL_SIZES;
    // Only constrain to canonical sizes when the catalog has 2+ entries —
    // single-size canonicals (common for generics) shouldn't trap the user
    // into one option.
    if (sizePickerPicked.availableSizes && sizePickerPicked.availableSizes.length >= 2) {
      return sizePickerPicked.availableSizes
        .slice()
        .sort((a, b) => sizeMl(a) - sizeMl(b))
        .map((v) => ({ value: v, label: prettySizeLabel(v) }));
    }
    return COMMON_WELL_SIZES;
  }, [sizePickerPicked]);

  const renderTile = (category: WellCategory) => {
    const picked = picks[category.key];
    const isExisting = picked?.source === 'existing-well';
    return (
      <WellTile
        key={category.key}
        category={category}
        picked={picked}
        readonlyCost={isExisting}
        onTap={() => setActiveKey(category.key)}
        onClear={() => setPick(category.key, undefined)}
        onCostChange={(cost) => setPickedCost(category.key, cost)}
        onOpenSizePicker={() => setSizePickerKey(category.key)}
      />
    );
  };

  // Footer caption + button label adapt to mode.
  const continueLabel = (() => {
    if (busy) return null;
    if (mode === 'settings') return 'Save Changes';
    return validCount > 0 ? 'Continue' : 'Add at least one well';
  })();

  return (
    <GradientBackground>
      <View
        className="flex-1"
        // Onboarding (showBack=true): no parent header, so we own the safe-area
        // top padding. Settings (showBack=false): parent Stack renders a header
        // that already accounts for the status bar — adding insets.top here
        // would push content well below the header.
        style={{ paddingTop: showBack ? insets.top + 12 : 8, paddingBottom: 0 }}
      >
        {showBack && (
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center py-2 px-5 -ml-1"
          >
            <Ionicons name="chevron-back" size={22} color={palette.N3} />
            <Text style={{ color: palette.N3, fontSize: 16 }}>Back</Text>
          </Pressable>
        )}

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 180 + insets.bottom,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className={showBack ? 'mt-6 mb-6' : 'mt-3 mb-6'}>
            {/* In-body title — skipped when the parent Stack provides a header
                with the same title (settings mode), to avoid the duplicate. */}
            {showBack && (
              <Text className="text-2xl" style={{ color: palette.N2, fontWeight: '700' }}>
                {title}
              </Text>
            )}
            <Text
              className={`text-base leading-6 ${showBack ? 'mt-2' : ''}`}
              style={{ color: palette.N3 }}
            >
              {subtitle}
            </Text>
            <Text
              className="text-xs mt-3 leading-5"
              style={{ color: palette.N4 }}
            >
              Estimate costs for now, you can update anytime from Bar Inventory.
            </Text>
          </View>

          <View className="flex-col gap-3">{defaultCategories.map(renderTile)}</View>

          <Pressable
            onPress={() => setShowMore((s) => !s)}
            className="flex-row items-center justify-center gap-2 mt-5 py-3"
          >
            <Ionicons
              name={showMore ? 'remove-circle-outline' : 'add-circle-outline'}
              size={18}
              color={palette.N3}
            />
            <Text style={{ color: palette.N3, fontSize: 14, fontWeight: '500' }}>
              {showMore
                ? 'Hide extra wells'
                : 'Add more wells (Rye, Scotch, Vermouth, Tiki rums…)'}
            </Text>
          </Pressable>

          {showMore && <View className="flex-col gap-3 mt-2">{moreCategories.map(renderTile)}</View>}
        </ScrollView>

        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <LinearGradient
            colors={['rgba(11, 17, 32, 0)', FOOTER_BG]}
            style={{ height: 36 }}
            pointerEvents="none"
          />
          <View
            style={{
              backgroundColor: FOOTER_BG,
              paddingHorizontal: 24,
              paddingTop: 4,
              paddingBottom: insets.bottom + 16,
            }}
          >
            {pickedCount > 0 && mode === 'onboarding' && (
              <Text className="text-xs text-center mb-2" style={{ color: palette.N4 }}>
                {unpricedCount > 0
                  ? `${unpricedCount} ${unpricedCount === 1 ? 'pick needs' : 'picks need'} a bottle cost`
                  : `${validCount} of ${WELL_CATEGORIES.length} wells ready`}
              </Text>
            )}
            <Pressable
              onPress={() => finish(false)}
              disabled={!canContinue}
              style={[styles.primaryButton, !canContinue && styles.disabled]}
            >
              {busy ? (
                <ActivityIndicator color={palette.N1} />
              ) : (
                <Text style={styles.primaryButtonText}>{continueLabel}</Text>
              )}
            </Pressable>
            {skippable && validCount === 0 && mode === 'onboarding' && (
              <Pressable
                onPress={() => finish(true)}
                disabled={busy}
                className="py-2 items-center"
              >
                <Text style={{ color: palette.N4, fontSize: 13 }}>Skip Wells Setup</Text>
              </Pressable>
            )}
          </View>
        </View>

        <PickerSheetModal
          category={activeCategory}
          visible={activeCategory != null}
          mode={mode}
          inventory={activeInventory}
          onClose={() => setActiveKey(null)}
          onSelectQuickPick={(qp) => {
            if (!activeCategory) return;
            setPick(activeCategory.key, {
              source: 'quick',
              name: qp.name,
              productSize: qp.productSize,
              productCost: undefined,
            });
            setActiveKey(null);
          }}
          onSelectCanonical={(product) => {
            if (!activeCategory) return;
            setPick(activeCategory.key, {
              source: 'canonical',
              name: product.name,
              productSize: bestSizeFromCanonical(product.defaultSizes),
              productCost: undefined,
              canonicalProductId: product.id,
              availableSizes: product.defaultSizes,
            });
            setActiveKey(null);
          }}
          onSelectInventory={(ing) => {
            if (!activeCategory) return;
            setPick(activeCategory.key, {
              source: 'inventory',
              name: ing.name,
              productSize: ing.productSize,
              productCost: ing.productCost,
              canonicalProductId: ing.canonicalProductId,
              existingIngredientId: ing.id,
            });
            setActiveKey(null);
          }}
          onCustomCreate={() => {
            if (!activeCategory) return;
            setActiveKey(null);
            router.push({
              pathname: '/ingredient-form',
              params: {
                type: activeCategory.canonicalCategory ?? 'Spirit',
                subType: activeCategory.subType,
              },
            } as any);
          }}
        />

        {sizePickerCategory && sizePickerPicked && (
          <SizePickerSheet
            category={sizePickerCategory}
            value={sizePickerPicked.productSize}
            options={sizePickerOptions}
            // Allow extended sizes when we're showing COMMON (no canonical
            // constraint or only a single canonical size). Hide expander
            // when canonical sizes are authoritative (2+ entries).
            allowExtended={
              !sizePickerPicked.availableSizes || sizePickerPicked.availableSizes.length < 2
            }
            onSelect={(size) => {
              setPickedSize(sizePickerCategory.key, size);
              setSizePickerKey(null);
            }}
            onClose={() => setSizePickerKey(null)}
          />
        )}
      </View>
    </GradientBackground>
  );
}

// ============================================================
// WellTile — one row per category
// ============================================================

interface WellTileProps {
  category: WellCategory;
  picked: PickedValue | undefined;
  /** When true, hide the editable cost input (existing well — already saved
   *  with a real cost; if user wants to change cost, they edit the ingredient
   *  directly from Bar Inventory). */
  readonlyCost?: boolean;
  onTap: () => void;
  onClear: () => void;
  onCostChange: (cost: number | undefined) => void;
  onOpenSizePicker: () => void;
}

function WellTile({
  category,
  picked,
  readonlyCost,
  onTap,
  onClear,
  onCostChange,
  onOpenSizePicker,
}: WellTileProps) {
  const [costText, setCostText] = useState<string>('');

  useEffect(() => {
    if (picked?.productCost != null && picked.productCost > 0) {
      setCostText(picked.productCost.toFixed(2));
    } else {
      setCostText('');
    }
  }, [picked?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitCost = () => {
    if (!picked) return;
    const cleaned = costText.trim();
    if (cleaned === '') {
      onCostChange(undefined);
      return;
    }
    const num = parseFloat(cleaned);
    if (Number.isFinite(num) && num > 0) {
      onCostChange(num);
      setCostText(num.toFixed(2));
    } else {
      onCostChange(undefined);
    }
  };

  const isReady = picked && picked.productCost != null && picked.productCost > 0;

  return (
    <View
      className="rounded-2xl"
      style={{
        backgroundColor: picked ? palette.B5 + '14' : 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: picked
          ? isReady
            ? palette.B5 + '40'
            : palette.Y4 + '60'
          : 'rgba(255,255,255,0.12)',
      }}
    >
      <Pressable onPress={onTap} className="flex-row items-center px-4 py-3.5">
        <View className="flex-1 flex-col gap-0.5">
          <Text
            style={{ color: palette.N4, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 }}
          >
            {category.label.toUpperCase()}
          </Text>
          {picked ? (
            <Text
              style={{ color: palette.N1, fontSize: 16, fontWeight: '600' }}
              numberOfLines={1}
            >
              {picked.name}
            </Text>
          ) : (
            <Text style={{ color: palette.N3, fontSize: 15 }}>Tap to pick a brand</Text>
          )}
        </View>
        {picked ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onClear();
            }}
            hitSlop={10}
            className="ml-3 p-1"
          >
            <Ionicons name="close-circle" size={22} color={palette.N4} />
          </Pressable>
        ) : (
          <Ionicons name="chevron-forward" size={20} color={palette.N4} />
        )}
      </Pressable>

      {picked && (
        <View
          className="px-4 pb-3 pt-2 flex-row items-center gap-2"
          style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}
        >
          <Pressable
            onPress={onOpenSizePicker}
            className="flex-row items-center gap-1 rounded-lg px-2 py-1.5"
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.18)',
            }}
          >
            <Text style={{ color: palette.N2, fontSize: 13, fontWeight: '500' }}>
              {volumeLabel(picked.productSize)}
            </Text>
            <Ionicons name="chevron-down" size={14} color={palette.N3} />
          </Pressable>

          <View className="flex-1" />

          <Text style={{ color: palette.N3, fontSize: 13 }}>Bottle cost</Text>

          {readonlyCost ? (
            <View
              className="flex-row items-center rounded-lg px-2 py-1.5"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            >
              <Text style={{ color: palette.N2, fontSize: 14 }}>
                ${picked.productCost?.toFixed(2) ?? '0.00'}
              </Text>
            </View>
          ) : (
            <View
              className="flex-row items-center rounded-lg px-2"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderColor: isReady ? palette.B5 + '60' : palette.Y4 + '60',
              }}
            >
              <Text style={{ color: palette.N2, fontSize: 15 }}>$</Text>
              <RNTextInput
                value={costText}
                onChangeText={setCostText}
                onBlur={commitCost}
                onSubmitEditing={commitCost}
                keyboardType="decimal-pad"
                returnKeyType="done"
                placeholder="0.00"
                placeholderTextColor={palette.N4 + '80'}
                style={{
                  color: palette.N1,
                  fontSize: 15,
                  paddingVertical: 6,
                  paddingHorizontal: 4,
                  minWidth: 70,
                  textAlign: 'right',
                }}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ============================================================
// PickerSheetModal — bottom sheet with quick picks + canonical search
// ============================================================

interface PickerSheetModalProps {
  category: WellCategory | null;
  visible: boolean;
  mode: 'onboarding' | 'settings';
  /** Settings mode only — user's existing ingredients matching this category. */
  inventory: SavedIngredient[];
  onClose: () => void;
  onSelectQuickPick: (pick: WellQuickPick) => void;
  onSelectCanonical: (product: CanonicalProductSummary) => void;
  onSelectInventory: (ingredient: SavedIngredient) => void;
  onCustomCreate: () => void;
}

function PickerSheetModal({
  category,
  visible,
  mode,
  inventory,
  onClose,
  onSelectQuickPick,
  onSelectCanonical,
  onSelectInventory,
  onCustomCreate,
}: PickerSheetModalProps) {
  const colors = useThemeColors();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CanonicalProductSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setResults([]);
      setLoading(false);
    }
  }, [visible, category?.key]);

  useEffect(() => {
    if (!category) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const found = await searchCanonicalBySubcategory(query, {
        category: category.canonicalCategory,
        subcategories: category.canonicalSubcategories,
        nameKeyword: category.nameKeyword,
      });
      setResults(found);
      setLoading(false);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, category]);

  // Filter inventory by query string when user is searching.
  const filteredInventory = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return inventory;
    return inventory.filter((i) => i.name.toLowerCase().includes(q));
  }, [inventory, query]);

  if (!category) return null;

  const isSearching = query.trim().length >= 2;
  const showInventory = mode === 'settings' && filteredInventory.length > 0;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={category.label} maxHeight={620}>
      <View className="px-4 pt-3 pb-6 flex-col gap-4">
        <SearchBar
          placeholder={`Search ${category.label.replace('Well ', '').toLowerCase()}…`}
          value={query}
          onChangeText={setQuery}
        />

        {/* From Bar Inventory — settings mode only */}
        {showInventory && (
          <View className="flex-col gap-2">
            <Text
              className="text-xs uppercase"
              style={{ color: colors.textTertiary, letterSpacing: 1 }}
            >
              From Bar Inventory
            </Text>
            <View
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              {filteredInventory.map((ing, idx) => (
                <Pressable
                  key={ing.id}
                  onPress={() => onSelectInventory(ing)}
                  className="flex-row items-center justify-between px-4 py-3"
                  style={
                    idx < filteredInventory.length - 1
                      ? { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }
                      : undefined
                  }
                >
                  <View className="flex-1 flex-col gap-0.5 pr-3">
                    <Text
                      style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}
                      numberOfLines={1}
                    >
                      {ing.name}
                    </Text>
                    <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
                      {volumeLabel(ing.productSize)} • ${ing.productCost.toFixed(2)}
                      {ing.subType && ing.subType !== category.subType
                        ? ` • ${ing.subType}`
                        : ''}
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle-outline" size={22} color={palette.G3} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {!isSearching && (
          <View className="flex-col gap-2">
            <Text
              className="text-xs uppercase"
              style={{ color: colors.textTertiary, letterSpacing: 1 }}
            >
              Popular wells
            </Text>
            <View
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              {category.quickPicks.map((qp, idx) => (
                <Pressable
                  key={qp.name}
                  onPress={() => onSelectQuickPick(qp)}
                  className="flex-row items-center justify-between px-4 py-3"
                  style={
                    idx < category.quickPicks.length - 1
                      ? { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }
                      : undefined
                  }
                >
                  <Text
                    className="flex-1 pr-3"
                    style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}
                    numberOfLines={1}
                  >
                    {qp.name}
                  </Text>
                  <Ionicons name="add-circle-outline" size={22} color={colors.textSecondary} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {isSearching && (
          <View className="flex-col gap-2">
            {loading ? (
              <View className="flex-row items-center gap-2 py-3">
                <ActivityIndicator size="small" color={colors.textSecondary} />
                <Text style={{ color: colors.textTertiary, fontSize: 14 }}>
                  Searching Spirit Database…
                </Text>
              </View>
            ) : results.length > 0 ? (
              <>
                <Text
                  className="text-xs uppercase"
                  style={{ color: colors.textTertiary, letterSpacing: 1 }}
                >
                  Spirit Database ({results.length})
                </Text>
                <View
                  className="rounded-lg overflow-hidden"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                  }}
                >
                  {results.map((product, idx) => {
                    const subtitle = [product.brand, product.subcategory]
                      .filter((s) => s && s !== product.name)
                      .join(' · ');
                    return (
                      <Pressable
                        key={product.id}
                        onPress={() => onSelectCanonical(product)}
                        className="flex-row items-center justify-between px-4 py-3"
                        style={
                          idx < results.length - 1
                            ? { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }
                            : undefined
                        }
                      >
                        <View className="flex-1 flex-col gap-0.5 pr-3">
                          <Text
                            style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}
                            numberOfLines={1}
                          >
                            {product.name}
                          </Text>
                          {subtitle ? (
                            <Text
                              style={{ color: colors.textTertiary, fontSize: 12 }}
                              numberOfLines={1}
                            >
                              {subtitle}
                            </Text>
                          ) : null}
                        </View>
                        <Ionicons
                          name="add-circle-outline"
                          size={22}
                          color={colors.textSecondary}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <Text className="text-sm text-center py-4" style={{ color: colors.textTertiary }}>
                No matches in the Spirit Database. Try a different search.
              </Text>
            )}
          </View>
        )}

        {/* Don't see your brand */}
        {mode === 'settings' ? (
          <Pressable
            onPress={onCustomCreate}
            className="flex-row items-center justify-center gap-2 py-3 mt-1 rounded-xl"
            style={{
              backgroundColor: palette.Y4 + '14',
              borderWidth: 1,
              borderColor: palette.Y4 + '60',
            }}
          >
            <Ionicons name="add-circle" size={18} color={palette.Y4} />
            <Text style={{ color: palette.Y4, fontSize: 15, fontWeight: '600' }}>
              Add a custom brand
            </Text>
          </Pressable>
        ) : (
          <View
            className="flex-row items-start gap-2 py-3 px-3 mt-1 rounded-xl"
            style={{
              backgroundColor: palette.Y4 + '0E',
              borderWidth: 1,
              borderColor: palette.Y4 + '40',
            }}
          >
            <Ionicons name="information-circle-outline" size={18} color={palette.Y4} style={{ marginTop: 1 }} />
            <Text className="flex-1" style={{ color: palette.N2, fontSize: 13, lineHeight: 18 }}>
              Don't see your brand? You can add custom brands from{' '}
              <Text style={{ color: palette.Y4, fontWeight: '600' }}>Bar Inventory</Text> after wells setup.
            </Text>
          </View>
        )}
      </View>
    </BottomSheet>
  );
}

// ============================================================
// SizePickerSheet — common 4 sizes + "Other" expander
// ============================================================

interface SizePickerSheetProps {
  category: WellCategory;
  value: Volume;
  options: { value: Volume; label: string }[];
  /** When true (quick picks), tapping "Other sizes" reveals EXTENDED_WELL_SIZES.
   *  When false (canonical picks), the options list is already authoritative
   *  and we hide the expander. */
  allowExtended: boolean;
  onSelect: (size: Volume) => void;
  onClose: () => void;
}

function SizePickerSheet({
  category,
  value,
  options,
  allowExtended,
  onSelect,
  onClose,
}: SizePickerSheetProps) {
  const colors = useThemeColors();
  const [showExtended, setShowExtended] = useState(false);
  const currentLabel = volumeLabel(value);

  const renderRow = (
    item: { value: Volume; label: string },
    isLast: boolean,
  ) => {
    const isSelected = volumeLabel(item.value) === currentLabel;
    return (
      <Pressable
        key={item.label}
        onPress={() => onSelect(item.value)}
        className="flex-row items-center justify-between px-4 py-3"
        style={[
          isSelected ? { backgroundColor: colors.accent + '15' } : undefined,
          !isLast ? { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle } : undefined,
        ]}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: isSelected ? '600' : '500',
          }}
        >
          {item.label}
        </Text>
        {isSelected && <Ionicons name="checkmark" size={20} color={colors.accent} />}
      </Pressable>
    );
  };

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title={`${category.label} — Bottle Size`}
      maxHeight={520}
    >
      <View className="px-4 pt-3 pb-6 flex-col gap-3">
        <View
          className="rounded-lg overflow-hidden"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          }}
        >
          {options.map((item, idx) =>
            renderRow(item, idx === options.length - 1 && !showExtended),
          )}
          {showExtended &&
            EXTENDED_WELL_SIZES.map((item, idx) =>
              renderRow(item, idx === EXTENDED_WELL_SIZES.length - 1),
            )}
        </View>
        {allowExtended && !showExtended && (
          <Pressable
            onPress={() => setShowExtended(true)}
            className="flex-row items-center justify-center gap-2 py-2"
          >
            <Text style={{ color: palette.B5, fontSize: 14, fontWeight: '600' }}>
              Other sizes…
            </Text>
            <Ionicons name="chevron-down" size={14} color={palette.B5} />
          </Pressable>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: palette.B5,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: palette.N1,
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.4,
  },
});
