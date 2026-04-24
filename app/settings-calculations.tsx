import { useCallback, useLayoutEffect, useState, useRef, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { useNavigation } from 'expo-router';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import GradientBackground from '@/src/components/ui/GradientBackground';
import SettingsCard from '@/src/components/ui/SettingsCard';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import SectionDivider from '@/src/components/ui/SectionDivider';
import PickerSheet from '@/src/components/ui/PickerSheet';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { useAppStore, IngredientOrderPref, PriceRounding } from '@/src/stores/app-store';
import { US_POUR_SIZES } from '@/src/constants/appConstants';
import { volumeLabel, Volume } from '@/src/types/models';

const POUR_SIZE_OPTIONS = US_POUR_SIZES.filter((v) => {
  if (v.kind !== 'fractionalOunces') return false;
  const oz = v.numerator / v.denominator;
  return oz >= 0.5 && oz <= 3;
});

const pourSizeDropdownOptions = POUR_SIZE_OPTIONS.map((v) => ({
  value: JSON.stringify(v),
  label: volumeLabel(v),
}));

const pourCostDropdownOptions = Array.from({ length: 41 }, (_, i) => {
  const val = 10 + i;
  return { value: val, label: `${val}%` };
});

const orderDropdownOptions: { value: IngredientOrderPref; label: string }[] = [
  { value: 'most-to-least', label: 'Most → Least' },
  { value: 'least-to-most', label: 'Least → Most' },
  { value: 'cost-high-low', label: 'Cost High → Low' },
];

const retailPriceOptions = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 25, 30].map((v) => ({
  value: v,
  label: `$${v.toFixed(2)}`,
}));

const roundingOptions: { value: PriceRounding; label: string }[] = [
  { value: 'off', label: 'Off (exact)' },
  { value: '0.25', label: 'Nearest $0.25' },
  { value: '0.5', label: 'Nearest $0.50' },
  { value: '1', label: 'Nearest $1' },
];

export default function SettingsCalculationsScreen() {
  const router = useGuardedRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const {
    pourCostGoal, setPourCostGoal,
    defaultPourSize, setDefaultPourSize,
    defaultRetailPrice, setDefaultRetailPrice,
    ingredientOrderPref, setIngredientOrderPref,
    suggestedPriceRounding, setSuggestedPriceRounding,
    saveProfile,
  } = useAppStore();

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedSave = useCallback(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => { saveProfile(); }, 1000);
  }, [saveProfile]);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
        saveProfile();
      }
    };
  }, [saveProfile]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Calculations' });
  }, [navigation]);

  const [showPourCostPicker, setShowPourCostPicker] = useState(false);
  const [showPourSizePicker, setShowPourSizePicker] = useState(false);
  const [showRetailPricePicker, setShowRetailPricePicker] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [showRoundingPicker, setShowRoundingPicker] = useState(false);

  const currentOrderLabel = orderDropdownOptions.find((o) => o.value === ingredientOrderPref)?.label ?? 'Manual';
  const currentRoundingLabel = roundingOptions.find((o) => o.value === suggestedPriceRounding)?.label ?? 'Off (exact)';

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="px-6 pt-4 pb-6 flex-col gap-6">
          <View className="flex-col gap-3">
            <ScreenTitle variant="group" title="Defaults" />
            <SettingsCard
              title="Pour Cost Goal"
              description={`${pourCostGoal}%`}
              iconName="analytics-outline"
              onPress={() => setShowPourCostPicker(true)}
              showCaret
            />
            <SettingsCard
              title="Default Pour Size"
              description={volumeLabel(defaultPourSize)}
              iconName="water-outline"
              onPress={() => setShowPourSizePicker(true)}
              showCaret
            />
            <SettingsCard
              title="Default Retail Price"
              description={`$${defaultRetailPrice.toFixed(2)}`}
              iconName="pricetag-outline"
              onPress={() => setShowRetailPricePicker(true)}
              showCaret
            />
            <SettingsCard
              title="Ingredient Order"
              description={currentOrderLabel}
              iconName="swap-vertical-outline"
              onPress={() => setShowOrderPicker(true)}
              showCaret
            />
            <SettingsCard
              title="Suggested Price Rounding"
              description={currentRoundingLabel}
              iconName="calculator-outline"
              onPress={() => setShowRoundingPicker(true)}
              showCaret
            />
          </View>

          <SectionDivider />

          <View className="flex-col gap-3">
            <ScreenTitle variant="group" title="Inventory" />
            <SettingsCard
              title="Container Sizes"
              description="Choose visible bottle & keg sizes"
              iconName="resize-outline"
              onPress={() => router.push('/container-sizes' as any)}
              showCaret
            />
          </View>

          <View className="h-8" />
        </View>
      </ScrollView>

      {showPourCostPicker && (
        <PickerSheet
          title="Pour Cost Goal"
          options={pourCostDropdownOptions}
          value={pourCostGoal}
          onSelect={(val) => { setPourCostGoal(val); debouncedSave(); }}
          onClose={() => setShowPourCostPicker(false)}
        />
      )}
      {showPourSizePicker && (
        <PickerSheet
          title="Default Pour Size"
          options={pourSizeDropdownOptions}
          value={JSON.stringify(defaultPourSize)}
          onSelect={(val) => { try { setDefaultPourSize(JSON.parse(val) as Volume); debouncedSave(); } catch {} }}
          onClose={() => setShowPourSizePicker(false)}
        />
      )}
      {showRetailPricePicker && (
        <PickerSheet
          title="Default Retail Price"
          options={retailPriceOptions}
          value={defaultRetailPrice}
          onSelect={(val) => { setDefaultRetailPrice(val); debouncedSave(); }}
          onClose={() => setShowRetailPricePicker(false)}
        />
      )}
      {showOrderPicker && (
        <PickerSheet
          title="Ingredient Order"
          options={orderDropdownOptions}
          value={ingredientOrderPref}
          onSelect={(val) => { setIngredientOrderPref(val as IngredientOrderPref); debouncedSave(); }}
          onClose={() => setShowOrderPicker(false)}
        />
      )}
      {showRoundingPicker && (
        <PickerSheet
          title="Suggested Price Rounding"
          options={roundingOptions}
          value={suggestedPriceRounding}
          onSelect={(val) => { setSuggestedPriceRounding(val as PriceRounding); }}
          onClose={() => setShowRoundingPicker(false)}
        />
      )}
    </GradientBackground>
  );
}
