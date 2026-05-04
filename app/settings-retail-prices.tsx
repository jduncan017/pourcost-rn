import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useNavigation } from 'expo-router';
import GradientBackground from '@/src/components/ui/GradientBackground';
import SettingsCard from '@/src/components/ui/SettingsCard';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import PickerSheet from '@/src/components/ui/PickerSheet';
import { useAppStore } from '@/src/stores/app-store';
import { type IngredientType } from '@/src/constants/appConstants';

// Retail price options per ingredient type. Picked to cover the realistic
// range a bar would charge for a single serving without flooding the picker.
const RETAIL_OPTIONS_BY_TYPE: Record<
  Exclude<IngredientType, 'Garnish'>,
  number[]
> = {
  Spirit: [6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 25],
  Beer: [4, 5, 6, 7, 8, 9, 10, 12],
  Wine: [7, 8, 9, 10, 11, 12, 14, 16, 18, 20],
  'Non-Alc': [2, 3, 4, 5, 6, 7, 8],
  Prepped: [4, 5, 6, 7, 8, 9, 10, 12],
  Other: [4, 5, 6, 7, 8, 10, 12],
};

interface RowConfig {
  type: Exclude<IngredientType, 'Garnish'>;
  iconName: string;
  iconFamily?: 'ionicons' | 'mci';
}

const ROWS: RowConfig[] = [
  { type: 'Spirit', iconName: 'bottle-tonic-outline', iconFamily: 'mci' },
  { type: 'Beer', iconName: 'beer-outline' },
  { type: 'Wine', iconName: 'wine-outline' },
  { type: 'Non-Alc', iconName: 'glass-mug-variant-outline', iconFamily: 'mci' },
  { type: 'Prepped', iconName: 'flask-outline' },
  { type: 'Other', iconName: 'cube-outline' },
];

export default function SettingsRetailPricesScreen() {
  const navigation = useNavigation();
  const { defaultRetailPrices, setDefaultRetailPriceForType, saveProfile } = useAppStore();

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
    navigation.setOptions({ title: 'Default Retail Prices' });
  }, [navigation]);

  const [activePicker, setActivePicker] = useState<RowConfig['type'] | null>(null);
  const activeOptions = activePicker ? RETAIL_OPTIONS_BY_TYPE[activePicker] : [];
  const activeValue = activePicker ? defaultRetailPrices[activePicker] : null;

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="px-6 pt-4 pb-6 flex-col gap-3">
          <ScreenTitle variant="group" title="Per Type" />
          {ROWS.map((row) => {
            const value = defaultRetailPrices[row.type];
            return (
              <SettingsCard
                key={row.type}
                title={row.type}
                description={`$${value.toFixed(2)}`}
                iconName={row.iconName as any}
                iconFamily={row.iconFamily}
                onPress={() => setActivePicker(row.type)}
                showCaret
              />
            );
          })}
          <View className="h-8" />
        </View>
      </ScrollView>

      {activePicker && activeValue != null && (
        <PickerSheet
          title={`${activePicker} Retail Price`}
          subtitle="Pre-fills the retail price field when you create a new ingredient of this type."
          options={activeOptions.map((v) => ({
            value: v,
            label: `$${v.toFixed(2)}`,
          }))}
          value={activeValue}
          onSelect={(val) => {
            setDefaultRetailPriceForType(activePicker, val);
            debouncedSave();
          }}
          onClose={() => setActivePicker(null)}
        />
      )}
    </GradientBackground>
  );
}
