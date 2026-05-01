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

const minCocktailPriceOptions = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 18, 20, 25].map((v) => ({
  value: v,
  label: `$${v.toFixed(2)}`,
}));

const minIngredientPriceOptions = [4, 5, 6, 7, 8, 9, 10, 12, 15].map((v) => ({
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
    pourCostGoal,
    beerPourCostGoal,
    winePourCostGoal,
    defaultPourSize, setDefaultPourSize,
    defaultRetailPrice, setDefaultRetailPrice,
    minCocktailPrice, setMinCocktailPrice,
    minIngredientPrice, setMinIngredientPrice,
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
    navigation.setOptions({ title: 'Pricing' });
  }, [navigation]);

  const [showPourSizePicker, setShowPourSizePicker] = useState(false);
  const [showRetailPricePicker, setShowRetailPricePicker] = useState(false);
  const [showMinCocktailPicker, setShowMinCocktailPicker] = useState(false);
  const [showMinIngredientPicker, setShowMinIngredientPicker] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [showRoundingPicker, setShowRoundingPicker] = useState(false);

  const currentOrderLabel = orderDropdownOptions.find((o) => o.value === ingredientOrderPref)?.label ?? 'Manual';
  const currentRoundingLabel = roundingOptions.find((o) => o.value === suggestedPriceRounding)?.label ?? 'Off (exact)';

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="px-6 pt-4 pb-6 flex-col gap-6">
          <View className="flex-col gap-3">
            <ScreenTitle variant="group" title="Targets" />
            {/* Pour Cost Targets is now a dedicated page — shows the cocktail
                goal, beer goal, wine goal, and the spirits tier ladder all in
                one place. Visible to everyone; tier editing is gated by
                Pro Mode (admin-only for now, paid post-launch). */}
            <SettingsCard
              title="Pour Cost Targets"
              description={`Cocktails ${pourCostGoal}%, Beer ${beerPourCostGoal}%, Wine ${winePourCostGoal}%, Spirits tiered`}
              iconName="analytics-outline"
              onPress={() => router.push('/settings-tiers' as any)}
              showCaret
            />
          </View>

          <SectionDivider />

          <View className="flex-col gap-3">
            <ScreenTitle variant="group" title="Defaults" />
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
            <ScreenTitle variant="group" title="Pricing Floors" />
            <SettingsCard
              title="Minimum Cocktail Price"
              description={`$${minCocktailPrice.toFixed(2)}`}
              iconName="trending-up-outline"
              onPress={() => setShowMinCocktailPicker(true)}
              showCaret
            />
            <SettingsCard
              title="Minimum Spirit Pour Price"
              description={`$${minIngredientPrice.toFixed(2)}`}
              iconName="wine-outline"
              onPress={() => setShowMinIngredientPicker(true)}
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

      {showPourSizePicker && (
        <PickerSheet
          title="Default Pour Size"
          subtitle="Pre-fills the pour size when you build a cocktail or look at an ingredient's per-pour math."
          options={pourSizeDropdownOptions}
          value={JSON.stringify(defaultPourSize)}
          onSelect={(val) => { try { setDefaultPourSize(JSON.parse(val) as Volume); debouncedSave(); } catch {} }}
          onClose={() => setShowPourSizePicker(false)}
        />
      )}
      {showRetailPricePicker && (
        <PickerSheet
          title="Default Retail Price"
          subtitle="Pre-fills the retail price field when you create a new ingredient or cocktail. Override per-item anytime."
          options={retailPriceOptions}
          value={defaultRetailPrice}
          onSelect={(val) => { setDefaultRetailPrice(val); debouncedSave(); }}
          onClose={() => setShowRetailPricePicker(false)}
        />
      )}
      {showOrderPicker && (
        <PickerSheet
          title="Ingredient Order"
          subtitle="How ingredient pours are sorted in the cocktail Build column on detail pages."
          options={orderDropdownOptions}
          value={ingredientOrderPref}
          onSelect={(val) => { setIngredientOrderPref(val as IngredientOrderPref); debouncedSave(); }}
          onClose={() => setShowOrderPicker(false)}
        />
      )}
      {showRoundingPicker && (
        <PickerSheet
          title="Suggested Price Rounding"
          subtitle="Always rounds UP to the next increment so suggested prices hit (or beat) your pour cost goal."
          options={roundingOptions}
          value={suggestedPriceRounding}
          onSelect={(val) => { setSuggestedPriceRounding(val as PriceRounding); }}
          onClose={() => setShowRoundingPicker(false)}
        />
      )}
      {showMinCocktailPicker && (
        <PickerSheet
          title="Minimum Cocktail Price"
          subtitle="Suggested cocktail prices won't go below this. Stops cheap recipes from suggesting sub-floor prices no bar would actually charge."
          options={minCocktailPriceOptions}
          value={minCocktailPrice}
          onSelect={(val) => { setMinCocktailPrice(val); debouncedSave(); }}
          onClose={() => setShowMinCocktailPicker(false)}
        />
      )}
      {showMinIngredientPicker && (
        <PickerSheet
          title="Minimum Spirit Pour Price"
          subtitle="Suggested per-pour ingredient prices won't go below this — wells and call brands stay realistically priced."
          options={minIngredientPriceOptions}
          value={minIngredientPrice}
          onSelect={(val) => { setMinIngredientPrice(val); debouncedSave(); }}
          onClose={() => setShowMinIngredientPicker(false)}
        />
      )}
    </GradientBackground>
  );
}
