import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput as RNTextInput,
} from 'react-native';
import BottomSheet from './BottomSheet';
import Dropdown from './Dropdown';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { Volume, fraction, volumeToOunces } from '@/src/types/models';

// ==========================================
// CONSTANTS
// ==========================================

export const DASH_OZ = 0.01691;
export const BSPN_OZ = 0.16907;

export type PourUnit = 'oz' | 'dash' | 'bspn' | 'unit';

/** Unified pour-size chip list — oz-only, decimal labels. Decimals scan
 *  faster than mixed fractions ("1.25 oz" vs "1 1/4 oz"). Dash / bar spoon /
 *  garnish amounts are reachable through the Other sheet. */
export const POUR_CHIPS: { label: string; volume: Volume }[] = [
  { label: '0.25 oz', volume: fraction(1, 4) },
  { label: '0.5 oz', volume: fraction(1, 2) },
  { label: '0.75 oz', volume: fraction(3, 4) },
  { label: '1 oz', volume: fraction(1, 1) },
  { label: '1.5 oz', volume: fraction(3, 2) },
  { label: '2 oz', volume: fraction(2, 1) },
  { label: '2.5 oz', volume: fraction(5, 2) },
];

const UNIT_OPTIONS: { label: string; value: PourUnit }[] = [
  { label: 'oz', value: 'oz' },
  { label: 'dash', value: 'dash' },
  { label: 'bar spoon', value: 'bspn' },
  { label: 'unit (garnish)', value: 'unit' },
];

// ==========================================
// HELPERS
// ==========================================

/** True when two Volumes represent the same pour. Compares kind + oz + (for
 *  namedOunces) the stored name so "2 dash" and "2 bspn" don't collide. */
function volumesEqual(a: Volume, b: Volume): boolean {
  if (a.kind !== b.kind) return false;
  const oza = volumeToOunces(a);
  const ozb = volumeToOunces(b);
  if (Math.abs(oza - ozb) > 0.0005) return false;
  if (a.kind === 'namedOunces' && b.kind === 'namedOunces') {
    return a.name === b.name;
  }
  if (a.kind === 'unitQuantity' && b.kind === 'unitQuantity') {
    return a.quantity === b.quantity;
  }
  return true;
}

/** Convert (amount, unit) → Volume. */
function buildVolume(amount: number, unit: PourUnit): Volume {
  switch (unit) {
    case 'oz':
      return { kind: 'decimalOunces', ounces: amount };
    case 'dash':
      return {
        kind: 'namedOunces',
        name: amount === 1 ? 'dash' : `${amount} dash`,
        ounces: amount * DASH_OZ,
      };
    case 'bspn':
      return {
        kind: 'namedOunces',
        name: amount === 1 ? 'bspn' : `${amount} bspn`,
        ounces: amount * BSPN_OZ,
      };
    case 'unit':
      return {
        kind: 'unitQuantity',
        unitType: 'oneThing',
        name: `${amount} unit${amount === 1 ? '' : 's'}`,
        quantity: amount,
        ounces: 0,
      };
  }
}

/** Inspect a Volume and derive the (amount, unit) pair — for hydrating the
 *  Other sheet when the current value doesn't match a chip. */
function decomposeVolume(v: Volume): { amount: number; unit: PourUnit } {
  if (v.kind === 'namedOunces') {
    const name = v.name.toLowerCase();
    if (name.includes('dash')) {
      return { amount: Math.max(1, Math.round(v.ounces / DASH_OZ)), unit: 'dash' };
    }
    if (name.includes('bspn') || name.includes('bar spoon')) {
      return { amount: Math.max(1, Math.round(v.ounces / BSPN_OZ)), unit: 'bspn' };
    }
  }
  if (v.kind === 'unitQuantity') {
    return { amount: v.quantity, unit: 'unit' };
  }
  return { amount: volumeToOunces(v), unit: 'oz' };
}

/** Describe a Volume in compact text (for the Other chip label). For unit-type
 *  (garnish) the ingredient name carries the noun ("10 oranges"), so we drop
 *  "units" and show just the count. */
export function describeVolume(v: Volume): string {
  const chip = POUR_CHIPS.find((c) => volumesEqual(c.volume, v));
  if (chip) return chip.label;
  const { amount, unit } = decomposeVolume(v);
  if (unit === 'oz') return `${amount} oz`;
  if (unit === 'dash') return `${amount} dash${amount === 1 ? '' : 'es'}`;
  if (unit === 'bspn') return `${amount} bar spoon${amount === 1 ? '' : 's'}`;
  return `${amount}`;
}

// ==========================================
// COMPONENT
// ==========================================

interface PourSizePickerProps {
  value: Volume;
  onChange: (v: Volume) => void;
}

export default function PourSizePicker({ value, onChange }: PourSizePickerProps) {
  const colors = useThemeColors();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Which chip (if any) matches the current value exactly
  const activeChipIndex = POUR_CHIPS.findIndex((c) => volumesEqual(c.volume, value));
  const isCustom = activeChipIndex === -1;

  // Sheet state — hydrated from current value whenever the sheet opens
  const [amountText, setAmountText] = useState('');
  const [unit, setUnit] = useState<PourUnit>('oz');

  useEffect(() => {
    if (sheetOpen) {
      const { amount, unit: u } = decomposeVolume(value);
      setAmountText(amount.toString());
      setUnit(u);
    }
  }, [sheetOpen, value]);

  const submitSheet = () => {
    const amount = parseFloat(amountText);
    if (!isNaN(amount) && amount > 0) {
      onChange(buildVolume(amount, unit));
    }
    setSheetOpen(false);
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6 }}
      >
        {POUR_CHIPS.map((chip, i) => {
          const active = i === activeChipIndex;
          return (
            <Pressable
              key={chip.label}
              onPress={() => onChange(chip.volume)}
              className="px-3 py-2 rounded-lg"
              style={{
                backgroundColor: active ? colors.accent : colors.surface,
                borderWidth: 1,
                borderColor: active ? colors.accent : colors.border,
              }}
            >
              <Text
                className="text-sm"
                style={{
                  color: active ? palette.N1 : colors.text,
                  fontWeight: active ? '700' : '500',
                }}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
        {/* Other chip — open sheet for custom amount + unit */}
        <Pressable
          onPress={() => setSheetOpen(true)}
          className="px-3 py-2 rounded-lg"
          style={{
            backgroundColor: isCustom ? palette.B5 + '33' : colors.surface,
            borderWidth: 1,
            borderColor: isCustom ? palette.B5 : colors.border,
          }}
        >
          <Text
            className="text-sm"
            style={{
              color: isCustom ? palette.N1 : colors.textSecondary,
              fontWeight: '600',
            }}
          >
            {isCustom ? describeVolume(value) : 'Other'}
          </Text>
        </Pressable>
      </ScrollView>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Custom Amount"
      >
        <View className="px-4 pb-6 flex-col gap-4">
          <View className="flex-row items-end gap-3">
            <View className="flex-1">
              <Text
                className="text-[11px] tracking-widest uppercase mb-2"
                style={{ color: colors.textTertiary, fontWeight: '600' }}
              >
                Amount
              </Text>
              <RNTextInput
                value={amountText}
                onChangeText={setAmountText}
                placeholder="0"
                keyboardType="decimal-pad"
                className="rounded-lg p-4 text-base border"
                style={{
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  fontSize: 15,
                  // Matches Dropdown's p-4 Pressable height for row alignment.
                }}
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View className="w-[160px]">
              <Dropdown
                label="Unit"
                value={unit}
                onValueChange={(v: PourUnit) => setUnit(v)}
                options={UNIT_OPTIONS}
              />
            </View>
          </View>

          <Pressable
            onPress={submitSheet}
            className="flex-row items-center justify-center py-3 rounded-lg"
            style={{ backgroundColor: colors.go }}
          >
            <Text style={{ color: palette.N1, fontWeight: '600', fontSize: 15 }}>
              Set
            </Text>
          </Pressable>
        </View>
      </BottomSheet>
    </>
  );
}
