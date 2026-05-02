/**
 * Shared ingredient input component used by both the Quick Calculator and Ingredient Form.
 * Renders inside a Card with type chips, subtypes, product size, cost, pour size.
 *
 * variant="calculator" — shows pour cost slider, no retail price input
 * variant="form" — shows retail price input, no pour cost slider
 */

import React, { useState } from 'react';
import { View, Text, Pressable, TextInput as RNTextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ChipSelector from '@/src/components/ui/ChipSelector';
import Card from '@/src/components/ui/Card';
import TextInput from '@/src/components/ui/TextInput';
import Dropdown from '@/src/components/ui/Dropdown';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { useAppStore } from '@/src/stores/app-store';
import {
  INGREDIENT_TYPES,
  SUBTYPES_BY_TYPE,
  DEFAULT_PRODUCT_SIZE,
  DEFAULT_PRODUCT_SIZE_BY_SUBTYPE,
  getProductSizesForType,
  getProductSizeSection,
  getPourChipsForContext,
  type IngredientType,
} from '@/src/constants/appConstants';
import { Volume, volumeLabel } from '@/src/types/models';

// ==========================================
// CONSTANTS
// ==========================================

// Types that show subtypes on calculator (functional subtypes only)
const CALC_SUBTYPE_TYPES = ['Beer', 'Non-Alc'] as const;

const GARNISH_UNITS = [
  { value: 'units', label: 'Units' },
  { value: 'oz', label: 'Ounces' },
  { value: 'ml', label: 'Milliliters' },
];

// ==========================================
// TYPES
// ==========================================

export interface IngredientInputValues {
  ingredientType: IngredientType;
  subType: string;
  productSize: Volume;
  productCost: number;
  pourSize: number; // in oz
  retailPrice: number;
  pourCostPct: number;
  notForSale: boolean;
  // Garnish-specific
  garnishAmount: number;
  garnishUnit: string;
  servingAmount: number;
}

interface IngredientInputsProps {
  variant: 'calculator' | 'form';
  values: IngredientInputValues;
  onChange: (updates: Partial<IngredientInputValues>) => void;
  /** Hide "Other" from type options (calculator hides it) */
  hideOtherType?: boolean;
  /** Hide retail price input (when rendered externally) */
  hideRetailPrice?: boolean;
  /** Render without Card wrapper */
  noCard?: boolean;
  /** Hide product size + product cost inputs.
   *  Used by the edit-ingredient form, where sizes/costs live in the
   *  separate "Sizes" section and per-config edit screen. */
  hideProductSize?: boolean;
  /** When set, renders the pour-size section as a collapsed override:
   *  shows current pour with a "Customize" toggle. Used by ingredient-form
   *  where the default lives in settings and per-ingredient pour is an
   *  optional override. Pass the user's global default in oz for the
   *  "matches default" indicator. */
  pourSizeOverride?: boolean;
  defaultPourSizeOz?: number;
}

// ==========================================
// COMPONENT
// ==========================================

export default function IngredientInputs({
  variant,
  values,
  onChange,
  hideOtherType = false,
  hideRetailPrice = false,
  noCard = false,
  hideProductSize = false,
  pourSizeOverride = false,
  defaultPourSizeOz,
}: IngredientInputsProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const enabledProductSizes = useAppStore((s) => s.enabledProductSizes);

  const {
    ingredientType, subType, productSize, productCost,
    pourSize, retailPrice, pourCostPct, notForSale,
    garnishAmount, garnishUnit, servingAmount,
  } = values;
  const currentSizeLabel = volumeLabel(productSize);

  // Local text state for numeric inputs
  const [productCostText, setProductCostText] = useState(productCost.toString());
  const [retailPriceText, setRetailPriceText] = useState(retailPrice.toString());
  const [garnishAmountText, setGarnishAmountText] = useState(garnishAmount.toString());
  const [servingAmountText, setServingAmountText] = useState(servingAmount.toString());
  const [customPourText, setCustomPourText] = useState('');
  const [showCustomPour, setShowCustomPour] = useState(false);
  // Override pattern: when pourSizeOverride is enabled, the pour size lives
  // collapsed by default ("Using your default") with a Customize CTA. Users
  // who don't need a per-ingredient override never see the picker.
  const matchesDefaultPour =
    defaultPourSizeOz != null && Math.abs(defaultPourSizeOz - pourSize) < 0.001;
  const [pourOverrideExpanded, setPourOverrideExpanded] = useState(
    pourSizeOverride ? !matchesDefaultPour : false
  );

  const isGarnish = ingredientType === 'Garnish';
  const showCalcSubtypes = (CALC_SUBTYPE_TYPES as readonly string[]).includes(ingredientType);
  const showFormSubtypes = !!SUBTYPES_BY_TYPE[ingredientType];
  const showSubtypes = variant === 'calculator' ? showCalcSubtypes : showFormSubtypes;
  const subtypes = SUBTYPES_BY_TYPE[ingredientType];

  const pourChips = getPourChipsForContext(ingredientType, productSize);
  const selectedPourChip = pourChips.find(c => Math.abs(c.oz - pourSize) < 0.001)?.label || '';

  const garnishUnitLabel = GARNISH_UNITS.find(u => u.value === garnishUnit)?.label.toLowerCase() || 'units';
  const garnishProductLabel = `${garnishAmount} ${garnishUnitLabel}`;

  const typeOptions = hideOtherType
    ? [...INGREDIENT_TYPES].filter(t => t !== 'Other')
    : [...INGREDIENT_TYPES];

  // ── Helpers ──

  const findDefaultSize = (type: string, st?: string): Volume => {
    const sizes = getProductSizesForType(type, st);
    const defaultLabel = (st && DEFAULT_PRODUCT_SIZE_BY_SUBTYPE[st]) || DEFAULT_PRODUCT_SIZE[type] || '750ml';
    return sizes.find(s => volumeLabel(s) === defaultLabel) ?? sizes[0] ?? { kind: 'milliliters', ml: 750 };
  };

  const applyDefaults = (type: string, st?: string) => {
    const newSize = findDefaultSize(type, st);
    const chips = getPourChipsForContext(type, newSize);
    const defaultChip = type === 'Prepped' ? chips.find(c => c.oz === 1) : undefined;
    const newPourSize = defaultChip?.oz ?? chips[0]?.oz ?? 1.5;
    onChange({
      productSize: newSize,
      pourSize: newPourSize,
    });
    setShowCustomPour(false);
    setCustomPourText('');
  };

  const handleTypeChange = (val: string) => {
    onChange({ ingredientType: val as IngredientType, subType: '' });
    if (val === 'Garnish') {
      onChange({
        ingredientType: val as IngredientType,
        subType: '',
        garnishAmount: 50,
        garnishUnit: 'units',
        servingAmount: 1,
        productCost: 25,
      });
      setGarnishAmountText('50');
      setServingAmountText('1');
      setProductCostText('25.00');
    } else {
      applyDefaults(val);
    }
  };

  const handleSubTypeChange = (val: string) => {
    onChange({ subType: val });
    applyDefaults(ingredientType, val);
  };

  const handleProductSizeChange = (selectedLabel: string) => {
    const match = getProductSizesForType(ingredientType, subType || undefined, enabledProductSizes, currentSizeLabel)
      .find(s => volumeLabel(s) === selectedLabel);
    if (match) {
      const chips = getPourChipsForContext(ingredientType, match);
      onChange({
        productSize: match,
        pourSize: chips[0]?.oz ?? pourSize,
      });
      setShowCustomPour(false);
      setCustomPourText('');
    }
  };

  const productSizeOptions = getProductSizesForType(ingredientType, subType || undefined, enabledProductSizes, currentSizeLabel).map((size) => ({
    value: volumeLabel(size),
    label: volumeLabel(size),
    section: getProductSizeSection(size),
  }));

  const Wrapper = noCard ? View : Card;
  const wrapperProps = noCard
    ? { className: 'flex flex-col gap-5' }
    : { displayClasses: 'flex flex-col gap-5', padding: 'large' as const };

  return (
    <Wrapper {...wrapperProps as any}>
      {/* Type */}
      <ChipSelector
        label="Type"
        options={typeOptions}
        selectedOption={ingredientType}
        onSelectionChange={handleTypeChange}
        variant="filter"
      />

      {/* Subtype */}
      {showSubtypes && subtypes && (
        <ChipSelector
          label={`${ingredientType} Type`}
          options={[...subtypes]}
          selectedOption={subType}
          onSelectionChange={handleSubTypeChange}
          variant="compact"
          />
      )}

      {isGarnish ? (
        <>
          {/* ── GARNISH ── */}
          <View className="flex-row items-end gap-3">
            <View className="flex-1">
              <TextInput
                label="Product Size"
                        value={garnishAmountText}
                onChangeText={(text) => {
                  if (text === '' || /^\d*\.?\d*$/.test(text)) {
                    setGarnishAmountText(text);
                    onChange({ garnishAmount: text === '' ? 0 : parseFloat(text) || 0 });
                  }
                }}
                placeholder="50"
                keyboardType="decimal-pad"
              />
            </View>
            <Dropdown
              value={garnishUnit}
              onValueChange={(val) => onChange({ garnishUnit: val })}
              options={GARNISH_UNITS}
              label=""
              className="w-[130px]"
            />
          </View>

          <TextInput
            label={`Cost / ${garnishProductLabel}`}
                value={productCostText}
            onChangeText={(text) => {
              if (text === '' || /^\d*\.?\d*$/.test(text)) {
                setProductCostText(text);
                onChange({ productCost: text === '' ? 0 : parseFloat(text) || 0 });
              }
            }}
            placeholder="0.00"
            keyboardType="decimal-pad"
            prefix="$"
          />

          <TextInput
            label={`Serving Size (${garnishUnitLabel})`}
                value={servingAmountText}
            onChangeText={(text) => {
              if (text === '' || /^\d*\.?\d*$/.test(text)) {
                setServingAmountText(text);
                onChange({ servingAmount: text === '' ? 0 : parseFloat(text) || 0 });
              }
            }}
            placeholder="1"
            keyboardType="decimal-pad"
          />
        </>
      ) : (
        <>
          {/* ── STANDARD ── */}
          {!hideProductSize && (
            <Dropdown
              value={volumeLabel(productSize)}
              onValueChange={handleProductSizeChange}
              options={productSizeOptions}
              label={ingredientType === 'Prepped' ? 'Batch Yield' : 'Product Size'}
                  placeholder="Select size"
              sheetHeaderRight={variant === 'form' ? (closeSheet) => (
                <Pressable
                  onPress={() => {
                    closeSheet();
                    router.push('/container-sizes' as any);
                  }}
                  className="flex-row items-center gap-1 p-1"
                >
                  <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Edit</Text>
                </Pressable>
              ) : undefined}
            />
          )}

          {!hideProductSize && (
            <TextInput
              label={ingredientType === 'Prepped'
                ? `Batch Cost (${volumeLabel(productSize)})`
                : `Cost / ${volumeLabel(productSize)}`}
                  value={productCostText}
              onChangeText={(text) => {
                if (text === '' || /^\d*\.?\d*$/.test(text)) {
                  setProductCostText(text);
                  onChange({ productCost: text === '' ? 0 : parseFloat(text) || 0 });
                }
              }}
              placeholder="0.00"
              keyboardType="decimal-pad"
              prefix="$"
            />
          )}

          {/* Serving pour size. In form mode (pourSizeOverride=true), starts
              collapsed showing the user's default with a Customize CTA. In
              calculator mode, always-visible chip selector (current behavior). */}
          {pourSizeOverride && !pourOverrideExpanded ? (
            <View className="flex-col gap-1.5">
              <Text
                className="text-xs"
                style={{ color: colors.textTertiary, letterSpacing: 0.5, fontWeight: '600' }}
              >
                SERVING POUR
              </Text>
              <Pressable
                onPress={() => setPourOverrideExpanded(true)}
                className="flex-row items-center justify-between rounded-xl px-4 py-3"
                style={{
                  backgroundColor: colors.inputBg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <View className="flex-col">
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>
                    {pourSize} oz
                  </Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
                    {matchesDefaultPour ? 'Using your default pour size' : 'Custom for this ingredient'}
                  </Text>
                </View>
                <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 14 }}>
                  Customize
                </Text>
              </Pressable>
              <Text className="text-xs" style={{ color: colors.textTertiary }}>
                How much you sell per drink. Change the default in Settings.
              </Text>
            </View>
          ) : (
            <View className="flex-col gap-1.5">
              <ChipSelector
                label={pourSizeOverride ? 'Serving Pour Size' : 'Pour Size'}
                options={pourChips.map(c => c.label)}
                selectedOption={selectedPourChip}
                onSelectionChange={(label) => {
                  const chip = pourChips.find(c => c.label === label);
                  if (chip) {
                    onChange({ pourSize: chip.oz });
                    setShowCustomPour(false);
                  }
                }}
                variant="compact"
                trailingChip={
                  <CustomPourChip
                    key="custom-pour"
                    isActive={showCustomPour || (!selectedPourChip && !showCustomPour)}
                    value={customPourText}
                    onChangeText={setCustomPourText}
                    onSubmit={() => {
                      const val = parseFloat(customPourText);
                      if (!isNaN(val) && val > 0) {
                        onChange({ pourSize: val });
                        setShowCustomPour(true);
                      }
                    }}
                    colors={colors}
                  />
                }
              />
              {pourSizeOverride && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs flex-1" style={{ color: colors.textTertiary }}>
                    How much you sell per drink. Used for cost-per-pour math.
                  </Text>
                  {defaultPourSizeOz != null && !matchesDefaultPour && (
                    <Pressable
                      onPress={() => {
                        onChange({ pourSize: defaultPourSizeOz });
                        setShowCustomPour(false);
                        setPourOverrideExpanded(false);
                      }}
                      hitSlop={6}
                    >
                      <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '600' }}>
                        Reset To Default
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Retail Price — form only, when for sale, unless hidden */}
          {variant === 'form' && !notForSale && !hideRetailPrice && (
            <TextInput
              label="Retail Price"
                    value={retailPriceText}
              onChangeText={(text) => {
                if (text === '' || /^\d*\.?\d*$/.test(text)) {
                  setRetailPriceText(text);
                  onChange({ retailPrice: text === '' ? 0 : parseFloat(text) || 0 });
                }
              }}
              placeholder="0.00"
              keyboardType="decimal-pad"
              prefix="$"
            />
          )}
        </>
      )}

    </Wrapper>
  );
}

// ==========================================
// CUSTOM POUR CHIP
// ==========================================

function CustomPourChip({
  isActive,
  value,
  onChangeText,
  onSubmit,
  colors,
}: {
  isActive: boolean;
  value: string;
  onChangeText: (t: string) => void;
  onSubmit: () => void;
  colors: any;
}) {
  const [editing, setEditing] = useState(false);

  if (editing || (isActive && value)) {
    return (
      <View className="flex-row items-center rounded-lg overflow-hidden border" style={{ borderColor: colors.accent, backgroundColor: colors.accent + '15' }}>
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="oz"
          placeholderTextColor={colors.textTertiary}
          keyboardType="decimal-pad"
          autoFocus
          onSubmitEditing={() => { onSubmit(); setEditing(false); }}
          onBlur={() => { if (value) onSubmit(); setEditing(false); }}
          style={{ color: colors.text, paddingHorizontal: 10, paddingVertical: 8, minWidth: 50, fontSize: 14, textAlign: 'center' }}
        />
        <Pressable onPress={() => { onSubmit(); setEditing(false); }} className="pr-2">
          <Ionicons name="checkmark" size={16} color={colors.accent} />
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => setEditing(true)}
      className="px-3.5 py-2 rounded-lg border"
      style={{
        backgroundColor: isActive ? colors.accent + '15' : colors.surface,
        borderColor: isActive ? colors.accent : colors.border,
      }}
    >
      <Text
        className="text-base"
        style={{ color: isActive ? colors.accent : colors.textSecondary, fontWeight: '500' }}
      >
        {isActive && value ? `${value}oz` : 'Custom'}
      </Text>
    </Pressable>
  );
}
