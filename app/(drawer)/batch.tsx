import { useState, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '@/src/components/ui/GradientBackground';
import SearchBar from '@/src/components/ui/SearchBar';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import SectionDivider from '@/src/components/ui/SectionDivider';
import SuggestedTitle from '@/src/components/ui/SuggestedTitle';
import ResultRow from '@/src/components/ui/ResultRow';
import TextInput from '@/src/components/ui/TextInput';
import Toggle from '@/src/components/ui/Toggle';
import InfoIcon from '@/src/components/ui/InfoIcon';
import PourSizePicker from '@/src/components/ui/PourSizePicker';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import {
  Cocktail,
  CocktailIngredient,
  SavedIngredient,
  Volume,
  volumeLabel,
  volumeToOunces,
} from '@/src/types/models';
import { ensureDate } from '@/src/lib/ensureDate';
import { cocktailIcon } from '@/src/lib/type-icons';
import { HapticService } from '@/src/services/haptic-service';

// ==========================================
// CONSTANTS
// ==========================================

const DASH_OZ = 0.01691;
const BSPN_OZ = 0.16907;
const DILUTION_RATIO = 0.2;

/** Round to the nearest 0.25 oz. Bartenders work in quarter-ounce increments;
 *  regular rounding avoids over-adding volatile ingredients like bitters. */
function roundQuarterOz(oz: number): number {
  return Math.round(oz * 4) / 4;
}

/** Format an oz amount at quarter-oz resolution (e.g. 6.76 → "6.75 oz"). */
function fmtQuarterOz(oz: number): string {
  return `${roundQuarterOz(oz).toFixed(2)} oz`;
}

/** True when oz is an exact multiple of 0.25 (so no "~" needed on the total). */
function isQuarterMultiple(oz: number): boolean {
  return Math.abs(oz * 4 - Math.round(oz * 4)) < 1e-9;
}

// ==========================================
// TYPES
// ==========================================

type BatchMode = 'existing' | 'custom';
type PourUnit = 'oz' | 'dash' | 'bspn' | 'unit';

interface CustomIngredient {
  id: string;
  name: string;
  /** Pour per cocktail, stored as a full Volume so unit info survives round-trips. */
  pourVolume: Volume;
}

/** Input ingredient for the totals calculator — unified shape across modes. */
interface BatchLine {
  name: string;
  /** Per-drink amount in oz (0 when the unit is 'unit'/garnish). */
  pourOz: number;
  /** Unit hint used for formatting totals and collapsing dashes→oz. */
  unit: PourUnit;
  /** Per-drink count (for unit-type garnishes; otherwise equal to amount in that unit). */
  amount: number;
  /** Library ingredient reference, if available. */
  savedIngredient?: SavedIngredient;
  /** Bottle size the recipe was costed against — used as THE bottle for order guidance. */
  recipeProductSize?: Volume;
}

// ==========================================
// HELPERS
// ==========================================

/** Format a batch total. Dashes/bspns stay in count form until scaled ≥ 1oz,
 *  then switch to oz. Unit-type garnish shows just the count ("10 oranges"
 *  is already clear from the ingredient name). */
function formatBatchAmount(
  line: BatchLine,
  quantity: number,
  round: boolean
): string {
  // Garnish / unit — no volume math, just multiply count.
  if (line.unit === 'unit') {
    const total = line.amount * quantity;
    return `${total}`;
  }

  const scaledOz = line.pourOz * quantity;

  if (line.unit === 'dash' && scaledOz < 1) {
    const count = Math.max(1, Math.round(scaledOz / DASH_OZ));
    return `${count} dash${count === 1 ? '' : 'es'}`;
  }
  if (line.unit === 'bspn' && scaledOz < 1) {
    const count = Math.max(1, Math.round(scaledOz / BSPN_OZ));
    return `${count} bar spoon${count === 1 ? '' : 's'}`;
  }
  return round ? fmtQuarterOz(scaledOz) : `${scaledOz.toFixed(2)} oz`;
}

/** Map a Volume + name into the batch line model. Detects dash/bspn/unit
 *  from the Volume's shape so formatters can render them nicely. */
function lineFromVolume(
  name: string,
  pourSize: Volume,
  saved?: SavedIngredient,
  recipeProductSize?: Volume
): BatchLine {
  const pourOz = volumeToOunces(pourSize);
  let unit: PourUnit = 'oz';
  let amount = pourOz;
  if (pourSize.kind === 'namedOunces') {
    const n = pourSize.name.toLowerCase();
    if (n.includes('dash')) {
      unit = 'dash';
      amount = Math.round(pourOz / DASH_OZ);
    } else if (n.includes('bspn') || n.includes('bar spoon')) {
      unit = 'bspn';
      amount = Math.round(pourOz / BSPN_OZ);
    }
  } else if (pourSize.kind === 'unitQuantity') {
    unit = 'unit';
    amount = pourSize.quantity;
  }
  return { name, pourOz, unit, amount, savedIngredient: saved, recipeProductSize };
}

/** Given a target in oz and the saved ingredient, suggest the min-spare bottle combo. */
/** How many bottles of the RECIPE'S size are needed to cover the target?
 *  We use the size the recipe was costed against so the order matches what
 *  the bar already stocks, not whatever minimizes spare. */
function suggestBottleCombo(
  targetOz: number,
  bottleSize: Volume
): { count: number; size: Volume; spareOz: number } | null {
  const sizeOz = volumeToOunces(bottleSize);
  if (sizeOz <= 0) return null;
  const count = Math.ceil(targetOz / sizeOz);
  const spareOz = count * sizeOz - targetOz;
  return { count, size: bottleSize, spareOz };
}

// ==========================================
// SCREEN
// ==========================================

export default function BatchScreen() {
  const router = useGuardedRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const { cocktails } = useCocktailsStore();
  const { ingredients: savedIngredients } = useIngredientsStore();

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Batch' });
  }, [navigation]);

  const [mode, setMode] = useState<BatchMode>('existing');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(
    null
  );
  const [customIngredients, setCustomIngredients] = useState<
    CustomIngredient[]
  >([]);
  const [quantityText, setQuantityText] = useState('10');
  const [preDilute, setPreDilute] = useState(false);
  const [roundToQuarter, setRoundToQuarter] = useState(true);


  const quantity = Math.max(1, parseInt(quantityText, 10) || 0);

  // ── Cocktail picker (Existing mode) ────────────────────────────────────
  const filteredCocktails = useMemo(() => {
    if (!searchQuery.trim()) {
      return [...cocktails]
        .sort(
          (a, b) =>
            ensureDate(b.updatedAt).getTime() -
            ensureDate(a.updatedAt).getTime()
        )
        .slice(0, 5);
    }
    const q = searchQuery.toLowerCase();
    return cocktails.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [searchQuery, cocktails]);

  // ── Build the unified BatchLine list from whichever mode is active ──────
  const batchLines: BatchLine[] = useMemo(() => {
    if (mode === 'existing') {
      if (!selectedCocktail) return [];
      return selectedCocktail.ingredients.map((ci: CocktailIngredient) => {
        const saved = savedIngredients.find((s) => s.id === ci.ingredientId);
        return lineFromVolume(ci.name, ci.pourSize, saved, ci.productSize);
      });
    }
    return customIngredients
      .filter((ci) => ci.name.trim())
      .map((ci) => lineFromVolume(ci.name.trim(), ci.pourVolume));
  }, [mode, selectedCocktail, customIngredients, savedIngredients]);

  const totalBatchVolumeOz = useMemo(
    () => batchLines.reduce((sum, l) => sum + l.pourOz * quantity, 0),
    [batchLines, quantity]
  );

  const dilutionOz = preDilute ? totalBatchVolumeOz * DILUTION_RATIO : 0;

  const handleSelectCocktail = (c: Cocktail) => {
    HapticService.selection();
    setSelectedCocktail(c);
    setSearchQuery('');
  };

  const handleClearCocktail = () => {
    setSelectedCocktail(null);
  };

  const handleAddCustomIngredient = () => {
    HapticService.buttonPress();
    setCustomIngredients((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        name: '',
        // Default to 1.5 oz (standard spirit pour).
        pourVolume: { kind: 'fractionalOunces', numerator: 3, denominator: 2 },
      },
    ]);
  };

  const handleUpdateCustomName = (id: string, name: string) => {
    setCustomIngredients((prev) =>
      prev.map((ci) => (ci.id === id ? { ...ci, name } : ci))
    );
  };

  const handleUpdateCustomVolume = (id: string, pourVolume: Volume) => {
    setCustomIngredients((prev) =>
      prev.map((ci) => (ci.id === id ? { ...ci, pourVolume } : ci))
    );
  };

  const handleRemoveCustomIngredient = (id: string) => {
    setCustomIngredients((prev) => prev.filter((ci) => ci.id !== id));
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 pt-4 flex-col gap-6">
            {/* Mode toggle */}
            <View
              className="flex-row rounded-full self-start p-0.5"
              style={{
                backgroundColor: colors.inputBg,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              {(['existing', 'custom'] as BatchMode[]).map((m) => {
                const active = mode === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => {
                      if (active) return;
                      HapticService.toggle();
                      setMode(m);
                    }}
                    className="px-4 py-1.5 rounded-full"
                    style={{
                      backgroundColor: active ? colors.elevated : 'transparent',
                    }}
                  >
                    <Text
                      className="text-[11px] tracking-widest"
                      style={{
                        color: active ? colors.text : colors.textTertiary,
                        fontWeight: '700',
                      }}
                    >
                      {m === 'existing' ? 'COCKTAIL' : 'CUSTOM'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Existing mode: cocktail picker ─────────────────────── */}
            {mode === 'existing' && !selectedCocktail && (
              <View className="flex-col gap-3">
                <SearchBar
                  placeholder="Search your cocktails..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {filteredCocktails.length > 0 ? (
                  <View>
                    {!searchQuery.trim() && (
                      <SuggestedTitle title="Suggested Cocktails" />
                    )}
                    {filteredCocktails.map((c, index) => (
                      <View key={c.id}>
                        {index > 0 && <SectionDivider />}
                        <ResultRow
                          icon={cocktailIcon}
                          title={c.name}
                          subtitle={`${c.ingredients.length} ingredients`}
                          onPress={() => handleSelectCocktail(c)}
                        />
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text
                    className="text-sm text-center py-6"
                    style={{ color: colors.textTertiary }}
                  >
                    No cocktails match your search.
                  </Text>
                )}
              </View>
            )}

            {mode === 'existing' && selectedCocktail && (
              <View className="flex-col gap-2">
                <View className="flex-row items-center justify-between">
                  <ScreenTitle title="Cocktail" variant="muted" />
                  <Pressable
                    onPress={handleClearCocktail}
                    className="flex-row items-center gap-1 px-2 py-1"
                    hitSlop={6}
                  >
                    <Ionicons
                      name="swap-horizontal"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text
                      className="text-sm"
                      style={{ color: colors.textSecondary, fontWeight: '600' }}
                    >
                      Change
                    </Text>
                  </Pressable>
                </View>
                <View className="flex-row items-center py-2">
                  <MaterialCommunityIcons
                    name={cocktailIcon.name}
                    size={22}
                    color={cocktailIcon.color}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    className="flex-1 text-base"
                    style={{ color: colors.text, fontWeight: '600' }}
                  >
                    {selectedCocktail.name}
                  </Text>
                </View>
              </View>
            )}

            {/* ── Custom mode: ingredient builder ─────────────────────── */}
            {mode === 'custom' && (
              <View className="flex-col gap-3">
                <ScreenTitle title="Ingredients" variant="muted" />

                {customIngredients.length === 0 ? (
                  <Text
                    className="text-sm py-4"
                    style={{ color: colors.textTertiary }}
                  >
                    Tap "Add Ingredient" below to start building.
                  </Text>
                ) : (
                  customIngredients.map((ci, idx) => (
                    <View
                      key={ci.id}
                      className="flex-col gap-2 py-3"
                      style={{
                        borderTopWidth: idx > 0 ? 1 : 0,
                        borderTopColor: colors.borderSubtle,
                      }}
                    >
                      <View className="flex-row items-center gap-2">
                        <View className="flex-1">
                          <TextInput
                            label=""
                            value={ci.name}
                            onChangeText={(t) =>
                              handleUpdateCustomName(ci.id, t)
                            }
                            placeholder="e.g., Rye Whiskey"
                          />
                        </View>
                        <Pressable
                          onPress={() => handleRemoveCustomIngredient(ci.id)}
                          hitSlop={8}
                          className="p-1"
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color={colors.error}
                          />
                        </Pressable>
                      </View>
                      <PourSizePicker
                        value={ci.pourVolume}
                        onChange={(v) => handleUpdateCustomVolume(ci.id, v)}
                      />
                    </View>
                  ))
                )}

                <Pressable
                  onPress={handleAddCustomIngredient}
                  className="flex-row items-center justify-center gap-2 py-3 rounded-xl"
                  style={{
                    backgroundColor: palette.B5 + '15',
                    borderWidth: 1,
                    borderColor: palette.B5 + '99',
                    borderStyle: 'dashed',
                  }}
                >
                  <Ionicons name="add" size={18} color={palette.B3} />
                  <Text
                    style={{
                      color: palette.B3,
                      fontWeight: '600',
                      fontSize: 15,
                    }}
                  >
                    Add Ingredient
                  </Text>
                </Pressable>
              </View>
            )}

            {/* ── Quantity ─────────────────────────────────────────────── */}
            {batchLines.length > 0 && (
              <View className="flex-col gap-3">
                <ScreenTitle title="How Many Cocktails" variant="muted" />
                <TextInput
                  label=""
                  value={quantityText}
                  onChangeText={(t) =>
                    setQuantityText(t.replace(/[^0-9]/g, '').slice(0, 4))
                  }
                  placeholder="10"
                  keyboardType="number-pad"
                />
              </View>
            )}

            {/* ── Options ─────────────────────────────────────────────── */}
            {batchLines.length > 0 && (
              <View
                className="flex-col gap-3 py-2"
                style={{
                  borderTopWidth: 1,
                  borderBottomWidth: 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Toggle
                      value={preDilute}
                      onValueChange={setPreDilute}
                      label="Pre-Dilute"
                      description="Add ~20% water for up / chilled service"
                    />
                  </View>
                  <InfoIcon
                    title="Pre-Dilution"
                    content={
                      "Ice adds about 20% water to stirred drinks and 20-25% to shaken. If you're serving the batch up or chilled without ice, add that water yourself so it doesn't taste harsh. If you're serving over ice, skip: the ice will dilute at service."
                    }
                    learnMoreTipKey="preDiluteBatches"
                    size={18}
                  />
                </View>
                <Toggle
                  value={roundToQuarter}
                  onValueChange={setRoundToQuarter}
                  label="Round to nearest 1/4 oz"
                  description="Snap amounts to 0.25-oz for easier measuring"
                />
              </View>
            )}

            {/* ── Totals ──────────────────────────────────────────────── */}
            {batchLines.length > 0 && quantity > 0 && (
              <View className="flex-col gap-1">
                <ScreenTitle title="Totals" variant="muted" className="mb-1" />
                {batchLines.map((line, i) => (
                  <View
                    key={`${line.name}-${i}`}
                    className="flex-row justify-between items-center py-2"
                  >
                    <Text
                      className="flex-1 text-base"
                      style={{ color: colors.text, fontWeight: '500' }}
                    >
                      {line.name}
                    </Text>
                    <Text
                      className="text-base"
                      style={{ color: colors.gold, fontWeight: '700' }}
                    >
                      {formatBatchAmount(line, quantity, roundToQuarter)}
                    </Text>
                  </View>
                ))}
                {preDilute && (
                  <View
                    className="flex-row justify-between items-center py-2"
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: colors.borderSubtle,
                    }}
                  >
                    <Text
                      className="flex-1 text-base"
                      style={{
                        color: colors.textSecondary,
                        fontStyle: 'italic',
                      }}
                    >
                      Water (dilution)
                    </Text>
                    <Text
                      className="text-base"
                      style={{ color: colors.textSecondary, fontWeight: '600' }}
                    >
                      {roundToQuarter
                        ? fmtQuarterOz(dilutionOz)
                        : `${dilutionOz.toFixed(2)} oz`}
                    </Text>
                  </View>
                )}
                <View
                  className="flex-row justify-between items-center py-2 mt-1"
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: colors.borderSubtle,
                  }}
                >
                  <Text
                    className="flex-1 text-base"
                    style={{ color: colors.text, fontWeight: '700' }}
                  >
                    Total Batch Volume
                  </Text>
                  <Text
                    className="text-base"
                    style={{ color: colors.text, fontWeight: '700' }}
                  >
                    {(() => {
                      const total = totalBatchVolumeOz + dilutionOz;
                      if (!roundToQuarter) return `${total.toFixed(2)} oz`;
                      const prefix = isQuarterMultiple(total) ? '' : '~';
                      return `${prefix}${fmtQuarterOz(total)}`;
                    })()}
                  </Text>
                </View>
              </View>
            )}

            {/* ── Order guidance (Existing mode only) ─────────────────── */}
            {mode === 'existing' &&
              batchLines.length > 0 &&
              quantity > 0 &&
              batchLines.some((l) => l.recipeProductSize) && (
                <View className="flex-col gap-1">
                  <ScreenTitle
                    title="Order Guidance"
                    variant="muted"
                    className="mb-1"
                  />
                  {batchLines.map((line, i) => {
                    if (!line.recipeProductSize) return null;
                    const targetOz = line.pourOz * quantity;
                    const combo = suggestBottleCombo(
                      targetOz,
                      line.recipeProductSize
                    );
                    return (
                      <View
                        key={`order-${i}`}
                        className="flex-row justify-between items-start py-2"
                      >
                        <Text
                          className="flex-1 text-base"
                          style={{ color: colors.textSecondary }}
                        >
                          {line.name}
                        </Text>
                        <View className="items-end">
                          {combo ? (
                            <>
                              <Text
                                className="text-base"
                                style={{
                                  color: colors.text,
                                  fontWeight: '600',
                                }}
                              >
                                {combo.count} × {volumeLabel(combo.size)}
                              </Text>
                              {combo.spareOz > 0.05 && (
                                <Text
                                  className="text-xs mt-0.5"
                                  style={{ color: colors.textTertiary }}
                                >
                                  {combo.spareOz.toFixed(1)}oz spare
                                </Text>
                              )}
                            </>
                          ) : (
                            <Text
                              className="text-sm"
                              style={{ color: colors.textTertiary }}
                            >
                              —
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

            {mode === 'custom' && batchLines.length > 0 && quantity > 0 && (
              <Text
                className="text-xs italic"
                style={{ color: colors.textTertiary }}
              >
                Order guidance is only available in Cocktail mode. Custom
                ingredients aren't in your library so we can't match them to
                bottle sizes.
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}
