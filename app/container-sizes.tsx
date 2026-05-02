import { useLayoutEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Toggle from '@/src/components/ui/Toggle';
import { useNavigation } from 'expo-router';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { useAppStore } from '@/src/stores/app-store';
import { PRODUCT_SIZES } from '@/src/constants/appConstants';
import { volumeLabel, Volume } from '@/src/types/models';

/** Aux info shown beneath a size label — adds capacity/yield hints for kegs
 *  and BIBs whose names alone don't make the actual volume obvious. Returns
 *  null for sizes whose label already conveys the size (bottles, packs). */
function getProductSizeAuxInfo(size: Volume): string | null {
  if (size.kind !== 'namedOunces') return null;
  if (size.name.includes('BIB')) {
    const finishedGal = Math.round(size.ounces / 128);
    return `~${finishedGal} gal finished (5:1 yield)`;
  }
  if (size.name.includes('Barrel') || size.name.includes('Keg')) {
    return `${Math.round(size.ounces)} oz`;
  }
  return null;
}

export default function ContainerSizesScreen() {
  const router = useGuardedRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { enabledProductSizes, toggleProductSize, setEnabledProductSizes, saveProfile } = useAppStore();

  const allLabels = PRODUCT_SIZES.map(volumeLabel);
  const enabledCount = enabledProductSizes.length;
  const allEnabled = allLabels.every((l) => enabledProductSizes.includes(l));

  const handleBack = useCallback(() => {
    saveProfile();
    router.back();
  }, [saveProfile, router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Container Sizes',
      headerLeft: () => (
        <Pressable onPress={handleBack} className="flex-row items-center gap-1 p-2">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Back</Text>
        </Pressable>
      ),
    });
  }, [navigation, colors, handleBack]);

  const isEnabled = (label: string) => enabledProductSizes.includes(label);

  const handleToggle = (label: string) => {
    toggleProductSize(label);
  };

  // Toggle all: any-off → turn everything on; all-on → turn everything off.
  const handleToggleAll = () => {
    if (allEnabled) {
      setEnabledProductSizes([]);
    } else {
      setEnabledProductSizes([...allLabels]);
    }
  };

  const groups = [
    {
      title: 'Bottles',
      description: 'Spirits, wine, liqueurs, mixers',
      sizes: PRODUCT_SIZES.filter(v =>
        v.kind === 'milliliters' || v.kind === 'decimalOunces'
      ),
    },
    {
      title: 'Kegs & Barrels',
      description: 'Beer, kegged wine, kombucha',
      sizes: PRODUCT_SIZES.filter(v =>
        v.kind === 'namedOunces' &&
        !v.name.includes('Crowler') &&
        !v.name.includes('Growler') &&
        !v.name.includes('BIB')
      ),
    },
    {
      title: 'Cans, Growlers & Packs',
      description: 'Beer, hard seltzers, canned wine, growler fills',
      sizes: PRODUCT_SIZES.filter(v =>
        v.kind === 'unitQuantity' ||
        (v.kind === 'namedOunces' && (v.name.includes('Crowler') || v.name.includes('Growler')))
      ),
    },
    {
      title: 'Bag-in-Box',
      description: 'Soda fountain syrups',
      sizes: PRODUCT_SIZES.filter(v =>
        v.kind === 'namedOunces' && v.name.includes('BIB')
      ),
    },
  ];

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="p-4 flex-col gap-6">
          <Text className="text-base" style={{ color: colors.textSecondary }}>
            Choose which container sizes appear when creating ingredients. {enabledCount} of {allLabels.length} enabled.
          </Text>

          {/* Toggle all — any-off shows the switch as off; tap turns
              everything on. All-on shows the switch as on; tap turns
              everything off. */}
          <View
            className="flex-row items-center justify-between py-3"
            style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
          >
            <Text className="text-lg" style={{ color: colors.text, fontWeight: '600' }}>
              Toggle All
            </Text>
            <Toggle value={allEnabled} onValueChange={handleToggleAll} />
          </View>

          {groups.map((group) => (
            <View key={group.title}>
              <Text
                className="text-sm uppercase tracking-wider"
                style={{ color: colors.gold, fontWeight: '600' }}
              >
                {group.title}
              </Text>
              <Text
                className="text-xs mb-2"
                style={{ color: colors.textTertiary }}
              >
                {group.description}
              </Text>
              {group.sizes.map((size, idx) => {
                const label = volumeLabel(size);
                const enabled = isEnabled(label);
                const aux = getProductSizeAuxInfo(size);
                return (
                  <View key={`${label}-${idx}`}>
                    <Pressable
                      onPress={() => handleToggle(label)}
                      className="flex-row items-center justify-between py-3"
                    >
                      <View className="flex-1 pr-3">
                        <Text
                          className="text-lg"
                          style={{ color: enabled ? colors.text : colors.textTertiary }}
                        >
                          {label}
                        </Text>
                        {aux && (
                          <Text
                            className="text-xs mt-0.5"
                            style={{ color: colors.textTertiary }}
                          >
                            {aux}
                          </Text>
                        )}
                      </View>
                      <Toggle
                        value={enabled}
                        onValueChange={() => handleToggle(label)}
                      />
                    </Pressable>
                    {idx < group.sizes.length - 1 && (
                      <View style={{ height: 1, backgroundColor: colors.border + '40' }} />
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
