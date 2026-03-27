import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import TextInput from '@/src/components/ui/TextInput';
import CustomSlider from '@/src/components/ui/CustomSlider';
import { palette } from '@/src/contexts/ThemeContext';
import { useAppStore } from '@/src/stores/app-store';
import { fraction, volumeToOunces } from '@/src/types/models';

export default function OnboardingProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    displayName,
    setDisplayName,
    pourCostGoal,
    setPourCostGoal,
    defaultPourSize,
    setDefaultPourSize,
  } = useAppStore();

  const pourSizeOz = volumeToOunces(defaultPourSize);

  return (
    <GradientBackground>
      <View
        className="flex-1 justify-between px-6"
        style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }}
      >
        {/* Back button */}
        <Pressable onPress={() => router.back()} className="flex-row items-center py-2 -ml-1">
          <Ionicons name="chevron-back" size={22} color={palette.N3} />
          <Text style={{ color: palette.N3, fontSize: 16 }}>Back</Text>
        </Pressable>

        <View className="flex-col gap-8 flex-1 mt-4">
          {/* Header */}
          <View>
            <Text
              className="text-2xl"
              style={{ color: palette.Y4, fontWeight: '700' }}
            >
              Set Up Your Profile
            </Text>
            <Text
              className="text-lg mt-2"
              style={{ color: palette.N3 }}
            >
              These defaults are used across the app. You can always change them later in Settings.
            </Text>
          </View>

          {/* Display Name */}
          <TextInput
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name or bar name"
            autoCapitalize="words"
          />

          {/* Pour Cost Goal — slider 10-30% */}
          <CustomSlider
            label="Target Pour Cost"
            value={pourCostGoal}
            onValueChange={(val) => setPourCostGoal(Math.round(val))}
            minValue={10}
            maxValue={30}
            step={1}
            formatValue={(v) => `${Math.round(v)}%`}
          />

          {/* Default Pour Size — slider 1-3 oz */}
          <CustomSlider
            label="Default Pour Size"
            value={pourSizeOz}
            onValueChange={(val) => {
              const rounded = Math.round(val * 4) / 4; // snap to 0.25 oz increments
              setDefaultPourSize({ kind: 'decimalOunces', ounces: rounded });
            }}
            minValue={1}
            maxValue={3}
            step={0.25}
            formatValue={(v) => `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)} oz`}
          />
        </View>

        <Pressable
          onPress={() => router.push('/(auth)/onboarding-complete' as any)}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: palette.B5,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: palette.N1,
    fontSize: 16,
    fontWeight: '600',
  },
});
