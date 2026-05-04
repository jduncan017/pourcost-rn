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
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppStore, IngredientOrderPref, PriceRounding } from '@/src/stores/app-store';
import { volumeLabel } from '@/src/types/models';

const pourCostDropdownOptions = Array.from({ length: 41 }, (_, i) => {
  const val = 10 + i;
  return { value: val, label: `${val}%` };
});

const orderDropdownOptions: { value: IngredientOrderPref; label: string }[] = [
  { value: 'manual', label: 'Manual (drag to reorder)' },
  { value: 'most-to-least', label: 'Largest Pour First' },
  { value: 'least-to-most', label: 'Smallest Pour First' },
  { value: 'cost-high-low', label: 'Most Expensive First' },
];

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
  const { isAdmin } = useAuth();
  const {
    pourCostGoal,
    beerPourCostGoal,
    winePourCostGoal,
    defaultPourSizes,
    defaultRetailPrices,
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
    navigation.setOptions({ title: 'Calculations' });
  }, [navigation]);

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
              title={isAdmin ? 'Pour Cost Targets' : 'Pour Cost Goal'}
              description={
                isAdmin
                  ? `Cocktails ${pourCostGoal}%, Beer ${beerPourCostGoal}%, Wine ${winePourCostGoal}%, Spirits tiered`
                  : `${pourCostGoal}%`
              }
              iconName="target"
              iconFamily="mci"
              onPress={() => router.push('/settings-tiers' as any)}
              showCaret
            />
          </View>

          <SectionDivider />

          <View className="flex-col gap-3">
            <ScreenTitle variant="group" title="Defaults" />
            <SettingsCard
              title="Default Pour Sizes"
              description={`Spirit ${volumeLabel(defaultPourSizes.Spirit)}, Beer ${volumeLabel(defaultPourSizes.Beer)}, Wine ${volumeLabel(defaultPourSizes.Wine)}`}
              iconName="water-outline"
              onPress={() => router.push('/settings-pour-sizes' as any)}
              showCaret
            />
            <SettingsCard
              title="Default Retail Prices"
              description={`Spirit $${defaultRetailPrices.Spirit.toFixed(0)}, Beer $${defaultRetailPrices.Beer.toFixed(0)}, Wine $${defaultRetailPrices.Wine.toFixed(0)}`}
              iconName="pricetag-outline"
              onPress={() => router.push('/settings-retail-prices' as any)}
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
              iconName="arrow-up-circle-outline"
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
              iconName="glass-cocktail"
              iconFamily="mci"
              onPress={() => setShowMinCocktailPicker(true)}
              showCaret
            />
            <SettingsCard
              title="Minimum Spirit Pour Price"
              description={`$${minIngredientPrice.toFixed(2)}`}
              iconName="bottle-tonic-outline"
              iconFamily="mci"
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
              iconName="package-variant-closed"
              iconFamily="mci"
              onPress={() => router.push('/container-sizes' as any)}
              showCaret
            />
          </View>

          <View className="h-8" />
        </View>
      </ScrollView>

      {showOrderPicker && (
        <PickerSheet
          title="Ingredient Order"
          subtitle="How ingredients are listed in a cocktail's recipe."
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
          subtitle="Suggested cocktail prices won't drop below this, even when cheap recipes would technically allow it."
          options={minCocktailPriceOptions}
          value={minCocktailPrice}
          onSelect={(val) => { setMinCocktailPrice(val); debouncedSave(); }}
          onClose={() => setShowMinCocktailPicker(false)}
        />
      )}
      {showMinIngredientPicker && (
        <PickerSheet
          title="Minimum Spirit Pour Price"
          subtitle="Suggested per-pour ingredient prices won't drop below this. Keeps wells and call brands realistically priced."
          options={minIngredientPriceOptions}
          value={minIngredientPrice}
          onSelect={(val) => { setMinIngredientPrice(val); debouncedSave(); }}
          onClose={() => setShowMinIngredientPicker(false)}
        />
      )}
    </GradientBackground>
  );
}
