import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useNavigation } from 'expo-router';
import GradientBackground from '@/src/components/ui/GradientBackground';
import SettingsCard from '@/src/components/ui/SettingsCard';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import PickerSheet from '@/src/components/ui/PickerSheet';
import { useAppStore } from '@/src/stores/app-store';
import { type IngredientType } from '@/src/constants/appConstants';
import { Volume, fraction, volumeLabel, volumeToOunces } from '@/src/types/models';

// Curated pour-size options per ingredient type. Picked to cover the realistic
// range bartenders would actually pour without burying the user in sizes.
const oz = (n: number): Volume => ({ kind: 'decimalOunces', ounces: n });
const POUR_OPTIONS_BY_TYPE: Record<
  Exclude<IngredientType, 'Garnish'>,
  Volume[]
> = {
  Spirit: [
    fraction(1, 1),
    fraction(5, 4),
    fraction(3, 2),
    fraction(7, 4),
    fraction(2, 1),
  ],
  Beer: [oz(8), oz(12), oz(14), oz(16), oz(20)],
  Wine: [oz(4), oz(5), oz(6), oz(8), oz(9)],
  'Non-Alc': [
    fraction(1, 2),
    fraction(3, 4),
    fraction(1, 1),
    fraction(5, 4),
    fraction(3, 2),
  ],
  Prepped: [
    fraction(1, 2),
    fraction(3, 4),
    fraction(1, 1),
    fraction(3, 2),
    fraction(2, 1),
  ],
  Other: [fraction(1, 2), fraction(1, 1), fraction(3, 2), fraction(2, 1)],
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

export default function SettingsPourSizesScreen() {
  const navigation = useNavigation();
  const { defaultPourSizes, setDefaultPourSizeForType, saveProfile } = useAppStore();

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
    navigation.setOptions({ title: 'Default Pour Sizes' });
  }, [navigation]);

  const [activePicker, setActivePicker] = useState<RowConfig['type'] | null>(null);

  const activeOptions = activePicker ? POUR_OPTIONS_BY_TYPE[activePicker] : [];
  const activeValue = activePicker ? defaultPourSizes[activePicker] : null;

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="px-6 pt-4 pb-6 flex-col gap-3">
          <ScreenTitle variant="group" title="Per Type" />
          {ROWS.map((row) => {
            const value = defaultPourSizes[row.type];
            return (
              <SettingsCard
                key={row.type}
                title={row.type}
                description={volumeLabel(value)}
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

      {activePicker && activeValue && (
        <PickerSheet
          title={`${activePicker} Pour Size`}
          subtitle="Pre-fills the pour size when you create a new ingredient of this type."
          options={activeOptions.map((v) => ({
            value: JSON.stringify(v),
            label: volumeLabel(v),
          }))}
          value={JSON.stringify(
            // Normalize to a canonical representation matching the option list,
            // so the picker highlights the current value even when persistence
            // stored it in a slightly different Volume kind.
            activeOptions.find(
              (o) => Math.abs(volumeToOunces(o) - volumeToOunces(activeValue)) < 0.001,
            ) ?? activeValue,
          )}
          onSelect={(val) => {
            try {
              const parsed = JSON.parse(val) as Volume;
              setDefaultPourSizeForType(activePicker, parsed);
              debouncedSave();
            } catch {}
          }}
          onClose={() => setActivePicker(null)}
        />
      )}
    </GradientBackground>
  );
}
