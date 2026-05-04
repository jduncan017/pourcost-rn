import { useEffect, useMemo, useState } from 'react';
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
import { palette, useThemeColors } from '@/src/contexts/ThemeContext';
import { Volume } from '@/src/types/models';
import { volumeLabel } from '@/src/types/models';
import {
  COMMON_WELL_SIZES,
  EXTENDED_WELL_SIZES,
  bestSizeFromCanonical,
} from '@/src/lib/wells';
import { MissingIngredientGroup } from '@/src/lib/library-recipes';
import { PricedMissingIngredient } from '@/src/lib/recipe-adopter';
import { getCategoryCostPrior } from '@/src/lib/category-cost-priors';
import { HapticService } from '@/src/services/haptic-service';

const FOOTER_BG = '#0B1120';

export interface MissingIngredientsFormProps {
  /** Deduped list of missing items collected from the picker step. */
  missing: MissingIngredientGroup[];
  /** Total cocktails being added (for footer summary copy). */
  cocktailCount: number;
  /** Total staples being auto-added (for footer summary copy). */
  stapleCount: number;
  /** Called with priced items + a "save now" trigger. */
  onContinue: (priced: PricedMissingIngredient[]) => void;
  /** Allow the user to back out without pricing — they may want to drop a
   *  cocktail rather than enter all this. */
  onBack?: () => void;
  /** Whether the picker has at least one cocktail selected; controls whether
   *  the footer button is enabled even with 0 priced items (lets user finish
   *  with cocktails that have no missing-priced-items requirements). */
  busy?: boolean;
}

interface RowState {
  /** The size selected in the size picker. Defaults to the canonical's best
   *  size if available, else 1L. */
  size: Volume;
  /** Local string state so partial input ("1", "1.") doesn't commit until
   *  blur. Mirrors the WellTile pattern. */
  costText: string;
  /** Numeric value, set on blur. Drives validation. */
  cost: number | undefined;
  /** True when the displayed cost is the category-level wholesale prior,
   *  not user input. Drives the purple "Suggested" pill. Flips to false on
   *  the first keystroke; resettable via the "Use Suggested" pill. */
  isSuggesting: boolean;
  /** Cached prior at the current size (recomputes when size changes). Null
   *  when no prior is available for this group's category. Used to drive
   *  both the initial suggestion and the reset action. */
  suggestedCost: number | null;
}

export default function MissingIngredientsForm({
  missing,
  cocktailCount,
  stapleCount,
  onContinue,
  onBack,
  busy = false,
}: MissingIngredientsFormProps) {
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<Record<string, RowState>>(() => initialRows(missing));
  const [activeSizeKey, setActiveSizeKey] = useState<string | null>(null);

  // Re-init if the missing list ever changes shape (shouldn't during this
  // screen's lifetime but defensive).
  useEffect(() => {
    setRows(initialRows(missing));
  }, [missing]);

  const validCount = Object.values(rows).filter((r) => r.cost != null && r.cost > 0).length;
  const allValid = validCount === missing.length;
  const canContinue = !busy && (missing.length === 0 || allValid);

  const updateRow = (key: string, patch: Partial<RowState>) => {
    setRows((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const onCostChange = (key: string, text: string) => {
    setRows((prev) => {
      const row = prev[key];
      if (!row) return prev;
      return { ...prev, [key]: { ...row, costText: text, isSuggesting: false } };
    });
  };

  const onSizeChange = (key: string, size: Volume) => {
    setRows((prev) => {
      const row = prev[key];
      if (!row) return prev;
      const group = missing.find((g) => g.key === key);
      const newPrior = group
        ? getCategoryCostPrior(group.canonicalCategory, group.canonicalSubcategory, size)
        : null;
      // If the row was in suggested mode, refresh the displayed cost to the
      // new size's prior; otherwise leave the user's typed value alone.
      if (row.isSuggesting && newPrior != null) {
        return {
          ...prev,
          [key]: {
            ...row,
            size,
            suggestedCost: newPrior,
            costText: newPrior.toFixed(2),
            cost: newPrior,
          },
        };
      }
      return { ...prev, [key]: { ...row, size, suggestedCost: newPrior } };
    });
  };

  const resetToSuggested = (key: string) => {
    setRows((prev) => {
      const row = prev[key];
      if (!row || row.suggestedCost == null) return prev;
      return {
        ...prev,
        [key]: {
          ...row,
          isSuggesting: true,
          costText: row.suggestedCost.toFixed(2),
          cost: row.suggestedCost,
        },
      };
    });
    HapticService.buttonPress();
  };

  const commitCost = (key: string) => {
    const row = rows[key];
    if (!row) return;
    // Suggested rows already have cost set; nothing to commit on blur.
    if (row.isSuggesting) return;
    const cleaned = row.costText.trim();
    if (cleaned === '') {
      updateRow(key, { cost: undefined });
      return;
    }
    const num = parseFloat(cleaned);
    if (Number.isFinite(num) && num > 0) {
      updateRow(key, { cost: num, costText: num.toFixed(2) });
    } else {
      updateRow(key, { cost: undefined });
    }
  };

  const handleContinue = () => {
    if (!canContinue) return;
    const priced: PricedMissingIngredient[] = missing
      .filter((g) => rows[g.key]?.cost != null && rows[g.key].cost! > 0)
      .map((g) => ({
        group: g,
        productSize: rows[g.key].size,
        productCost: rows[g.key].cost!,
      }));
    onContinue(priced);
  };

  const activeGroup =
    activeSizeKey != null ? missing.find((g) => g.key === activeSizeKey) ?? null : null;
  const activeRow = activeSizeKey != null ? rows[activeSizeKey] : null;
  const activeSizeOptions = useMemo(() => {
    if (!activeGroup) return COMMON_WELL_SIZES;
    // Only constrain to canonical sizes when the catalog has at least 2 of
    // them — single-size canonicals (often the case for generics) shouldn't
    // straitjacket the user into one option.
    if (activeGroup.canonicalDefaultSizes.length >= 2) {
      return activeGroup.canonicalDefaultSizes
        .slice()
        .sort((a, b) => sizeMl(a) - sizeMl(b))
        .map((v) => ({ value: v, label: prettySizeLabel(v) }));
    }
    return COMMON_WELL_SIZES;
  }, [activeGroup]);

  // Empty-state: nothing to price means everything resolved cleanly already.
  if (missing.length === 0) {
    return (
      <GradientBackground>
        <View
          className="flex-1"
          style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
        >
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="checkmark-circle" size={56} color={palette.G3} />
            <Text className="text-2xl mt-4" style={{ color: palette.N2, fontWeight: '700' }}>
              Nothing to price!
            </Text>
            <Text
              className="text-base text-center mt-3 leading-6"
              style={{ color: palette.N3 }}
            >
              The cocktails you picked use only your wells and pantry staples. Tap continue to add them to your bar.
            </Text>
          </View>
          <View className="px-6">
            <Pressable
              onPress={() => onContinue([])}
              disabled={busy}
              style={[styles.primaryButton, busy && styles.disabled]}
            >
              {busy ? (
                <ActivityIndicator color={palette.N1} />
              ) : (
                <Text style={styles.primaryButtonText}>Add Cocktails</Text>
              )}
            </Pressable>
          </View>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View
        className="flex-1"
        style={{ paddingTop: insets.top + 12, paddingBottom: 0 }}
      >
        {onBack && (
          <Pressable
            onPress={onBack}
            className="flex-row items-center py-2 px-5 -ml-1"
          >
            <Ionicons name="chevron-back" size={22} color={palette.N3} />
            <Text style={{ color: palette.N3, fontSize: 16 }}>Back</Text>
          </Pressable>
        )}

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 200 + insets.bottom,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mt-4 mb-5">
            <Text className="text-2xl" style={{ color: palette.N2, fontWeight: '700' }}>
              Set Up Missing Ingredients
            </Text>
            <Text className="text-base mt-2 leading-6" style={{ color: palette.N3 }}>
              These are needed for the cocktails you picked. We've prefilled typical wholesale costs. Tap any to adjust, or update later from Bar Inventory.
            </Text>
          </View>

          <View className="flex-col gap-3">
            {missing.map((group) => {
              const row = rows[group.key];
              const isReady = row?.cost != null && row.cost > 0;
              const isSuggesting = row?.isSuggesting ?? false;
              const hasPrior = row?.suggestedCost != null;
              const inputBorderColor = isSuggesting
                ? palette.P3 + '70'
                : isReady
                  ? palette.B5 + '60'
                  : palette.Y4 + '60';
              return (
                <View
                  key={group.key}
                  className="rounded-2xl"
                  style={{
                    backgroundColor: isReady ? palette.B5 + '14' : 'rgba(255,255,255,0.04)',
                    borderWidth: 1,
                    borderColor: isReady ? palette.B5 + '40' : palette.Y4 + '50',
                  }}
                >
                  <View className="px-4 pt-3 pb-2 flex-col gap-1">
                    <Text
                      style={{ color: palette.N1, fontSize: 16, fontWeight: '600' }}
                      numberOfLines={1}
                    >
                      {group.displayName}
                    </Text>
                    <Text style={{ color: palette.N4, fontSize: 12 }} numberOfLines={2}>
                      Used in {group.usedInRecipes.slice(0, 3).join(', ')}
                      {group.usedInRecipes.length > 3
                        ? ` +${group.usedInRecipes.length - 3} more`
                        : ''}
                    </Text>
                  </View>
                  <View
                    className="px-4 pb-3 pt-2 flex-row items-center gap-2"
                    style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}
                  >
                    <Pressable
                      onPress={() => setActiveSizeKey(group.key)}
                      className="flex-row items-center gap-1 rounded-lg px-2 py-1.5"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.18)',
                      }}
                    >
                      <Text style={{ color: palette.N2, fontSize: 13, fontWeight: '500' }}>
                        {volumeLabel(row?.size ?? COMMON_WELL_SIZES[0].value)}
                      </Text>
                      <Ionicons name="chevron-down" size={14} color={palette.N3} />
                    </Pressable>
                    <View className="flex-1" />
                    {isSuggesting ? (
                      <View
                        className="rounded-full px-2 py-1"
                        style={{ backgroundColor: palette.P3 + '24' }}
                      >
                        <Text style={{ color: palette.P2, fontSize: 11, fontWeight: '700' }}>
                          Suggested
                        </Text>
                      </View>
                    ) : hasPrior ? (
                      <Pressable
                        onPress={() => resetToSuggested(group.key)}
                        hitSlop={6}
                        className="flex-row items-center gap-1 rounded-full px-2 py-1"
                        style={{
                          backgroundColor: palette.P3 + '14',
                          borderWidth: 1,
                          borderColor: palette.P3 + '40',
                        }}
                      >
                        <Ionicons name="sparkles" size={11} color={palette.P2} />
                        <Text style={{ color: palette.P2, fontSize: 11, fontWeight: '600' }}>
                          Use Suggested
                        </Text>
                      </Pressable>
                    ) : (
                      <Text style={{ color: palette.N3, fontSize: 13 }}>Bottle cost</Text>
                    )}
                    <View
                      className="flex-row items-center rounded-lg px-2"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        borderWidth: 1,
                        borderColor: inputBorderColor,
                      }}
                    >
                      <Text style={{ color: palette.N2, fontSize: 15 }}>$</Text>
                      <RNTextInput
                        value={row?.costText ?? ''}
                        onChangeText={(text) => onCostChange(group.key, text)}
                        onBlur={() => commitCost(group.key)}
                        onSubmitEditing={() => commitCost(group.key)}
                        keyboardType="decimal-pad"
                        returnKeyType="done"
                        placeholder="0.00"
                        placeholderTextColor={palette.N4 + '80'}
                        // Select-all-on-focus while showing the prior so the
                        // first keystroke replaces "22.00" cleanly.
                        selectTextOnFocus={isSuggesting}
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
                  </View>
                </View>
              );
            })}
          </View>

          <Text
            className="text-xs text-center mt-6 px-4 leading-5"
            style={{ color: palette.N4 }}
          >
            Estimate for now, change later. We'll auto-include {stapleCount}{' '}
            {stapleCount === 1 ? 'pantry staple' : 'pantry staples'} (lime juice, simple syrup, cherries, etc.) using typical wholesale prices. Adjust from Bar Inventory if your costs differ.
          </Text>
        </ScrollView>

        {/* Footer */}
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
            <Text className="text-xs text-center mb-2" style={{ color: palette.N4 }}>
              {allValid
                ? `Adding ${cocktailCount} cocktails + ${missing.length + stapleCount} ingredients`
                : `${missing.length - validCount} ${missing.length - validCount === 1 ? 'item needs' : 'items need'} a cost`}
            </Text>
            <Pressable
              onPress={handleContinue}
              disabled={!canContinue}
              style={[styles.primaryButton, !canContinue && styles.disabled]}
            >
              {busy ? (
                <ActivityIndicator color={palette.N1} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {allValid ? 'Add Everything' : 'Fill in costs to continue'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        {activeGroup && activeRow && (
          <SizePickerSheet
            groupName={activeGroup.displayName}
            value={activeRow.size}
            options={activeSizeOptions}
            // Allow extended sizes when we're using COMMON_WELL_SIZES (either
            // no canonical sizes OR only one). Hide the expander when
            // canonical sizes are authoritative.
            allowExtended={activeGroup.canonicalDefaultSizes.length < 2}
            onSelect={(size) => {
              onSizeChange(activeGroup.key, size);
              setActiveSizeKey(null);
            }}
            onClose={() => setActiveSizeKey(null)}
          />
        )}
      </View>
    </GradientBackground>
  );
}

// ============================================================
// Helpers
// ============================================================

function initialRows(missing: MissingIngredientGroup[]): Record<string, RowState> {
  const out: Record<string, RowState> = {};
  for (const g of missing) {
    const size =
      g.canonicalDefaultSizes.length > 0
        ? bestSizeFromCanonical(g.canonicalDefaultSizes)
        : COMMON_WELL_SIZES[1].value; // 750ml index in COMMON; close to 1L
    const prior = getCategoryCostPrior(g.canonicalCategory, g.canonicalSubcategory, size);
    out[g.key] = {
      size,
      suggestedCost: prior,
      isSuggesting: prior != null,
      costText: prior != null ? prior.toFixed(2) : '',
      cost: prior ?? undefined,
    };
  }
  return out;
}

function sizeMl(v: Volume): number {
  if (v.kind === 'milliliters') return v.ml;
  if (v.kind === 'decimalOunces') return v.ounces * 29.5735;
  if (v.kind === 'fractionalOunces')
    return (v.numerator / v.denominator) * 29.5735;
  if (v.kind === 'namedOunces') return v.ounces * 29.5735;
  return 0;
}

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

// ============================================================
// SizePickerSheet — same pattern as wells (extracted to shared later if needed)
// ============================================================

interface SizePickerSheetProps {
  groupName: string;
  value: Volume;
  options: { value: Volume; label: string }[];
  allowExtended: boolean;
  onSelect: (size: Volume) => void;
  onClose: () => void;
}

function SizePickerSheet({
  groupName,
  value,
  options,
  allowExtended,
  onSelect,
  onClose,
}: SizePickerSheetProps) {
  const colors = useThemeColors();
  const [showExtended, setShowExtended] = useState(false);
  const currentLabel = volumeLabel(value);

  const renderRow = (item: { value: Volume; label: string }, isLast: boolean) => {
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
    <BottomSheet visible onClose={onClose} title={`${groupName} — Bottle Size`} maxHeight={520}>
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
