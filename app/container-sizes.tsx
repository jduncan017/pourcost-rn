import { useLayoutEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { useAppStore } from '@/src/stores/app-store';
import { PRODUCT_SIZES } from '@/src/constants/appConstants';
import { volumeLabel } from '@/src/types/models';

export default function ContainerSizesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { enabledProductSizes, toggleProductSize, setEnabledProductSizes, saveProfile } = useAppStore();

  const allLabels = PRODUCT_SIZES.map(volumeLabel);
  const allEnabled = enabledProductSizes.length === 0;
  const enabledCount = allEnabled ? allLabels.length : enabledProductSizes.length;

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

  const isEnabled = (label: string) => allEnabled || enabledProductSizes.includes(label);

  const handleToggle = (label: string) => {
    if (allEnabled) {
      setEnabledProductSizes(allLabels.filter(l => l !== label));
    } else {
      toggleProductSize(label);
    }
  };

  const handleSelectAll = () => {
    setEnabledProductSizes([]);
  };

  const groups = [
    {
      title: 'Bottles',
      sizes: PRODUCT_SIZES.filter(v =>
        v.kind === 'milliliters' || v.kind === 'decimalOunces'
      ),
    },
    {
      title: 'Kegs & Barrels',
      sizes: PRODUCT_SIZES.filter(v =>
        v.kind === 'namedOunces' && !v.name.includes('Crowler') && !v.name.includes('Growler')
      ),
    },
    {
      title: 'Cans, Growlers & Packs',
      sizes: PRODUCT_SIZES.filter(v =>
        v.kind === 'unitQuantity' ||
        (v.kind === 'namedOunces' && (v.name.includes('Crowler') || v.name.includes('Growler')))
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

          {/* Show All toggle */}
          <View
            className="flex-row items-center justify-between py-3"
            style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
          >
            <Text className="text-lg" style={{ color: colors.text, fontWeight: '600' }}>
              Show all sizes
            </Text>
            <Switch
              value={allEnabled}
              onValueChange={handleSelectAll}
              trackColor={{ false: colors.border, true: colors.success }}
            />
          </View>

          {groups.map((group) => (
            <View key={group.title}>
              <Text
                className="text-sm uppercase tracking-wider mb-2"
                style={{ color: colors.gold, fontWeight: '600' }}
              >
                {group.title}
              </Text>
              {group.sizes.map((size, idx) => {
                const label = volumeLabel(size);
                const enabled = isEnabled(label);
                return (
                  <View key={`${label}-${idx}`}>
                    <Pressable
                      onPress={() => handleToggle(label)}
                      className="flex-row items-center justify-between py-3"
                    >
                      <Text
                        className="text-lg"
                        style={{ color: enabled ? colors.text : colors.textTertiary }}
                      >
                        {label}
                      </Text>
                      <Switch
                        value={enabled}
                        onValueChange={() => handleToggle(label)}
                        trackColor={{ false: colors.border, true: colors.success }}
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
