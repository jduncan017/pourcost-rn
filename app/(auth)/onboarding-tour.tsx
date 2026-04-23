import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import AuthHeader from '@/src/components/ui/AuthHeader';
import { palette } from '@/src/contexts/ThemeContext';

const FEATURES = [
  {
    icon: 'pricetags' as const,
    title: 'Track Ingredients',
    description: 'Add your spirits, mixers, and garnishes with real costs from your invoices.',
  },
  {
    icon: 'wine' as const,
    title: 'Build Cocktails',
    description: 'Create recipes and instantly see your cost per drink and pour cost percentage.',
  },
  {
    icon: 'trending-up' as const,
    title: 'Optimize Pricing',
    description: 'Set retail prices that hit your target margins and maximize profitability.',
  },
];

export default function OnboardingTour() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground>
      <View
        className="flex-1 justify-between px-6"
        style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 48 }}
      >
        <AuthHeader />

        <View className="flex-col gap-8 flex-1 justify-center">
          {/* Header — centered with logo */}
          <View className="items-center">
            <Image
              source={require('@/assets/images/PC-Logo-Gold.png')}
              style={{ width: 160, height: 40, marginBottom: 16 }}
              resizeMode="contain"
            />
            <Text
              className="text-2xl"
              style={{ color: palette.N2, fontWeight: '700' }}
            >
              How It Works
            </Text>
          </View>

          {/* Feature rows */}
          <View className="flex-col gap-6">
            {FEATURES.map((feature, index) => (
              <View key={index} className="flex-row items-start gap-4">
                <View
                  style={{
                    backgroundColor: palette.Y4 + '15',
                    borderRadius: 12,
                    padding: 10,
                  }}
                >
                  <Ionicons name={feature.icon} size={22} color={palette.Y4} />
                </View>
                <View className="flex-1 flex-col gap-1">
                  <Text
                    className="text-lg"
                    style={{ color: palette.N2, fontWeight: '600' }}
                  >
                    {feature.title}
                  </Text>
                  <Text
                    className="text-base leading-6"
                    style={{ color: palette.N4 }}
                  >
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(auth)/signup' as any)}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Create Account</Text>
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
