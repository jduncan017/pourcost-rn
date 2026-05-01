import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { palette } from '@/src/contexts/ThemeContext';

/**
 * Confirmation screen shown after the wells picker. Animated checkmark gives
 * positive reinforcement that the picks landed; reminds the user they can
 * update wells later from Settings.
 *
 * Sits between onboarding-wells and onboarding-complete (which seeds the
 * sample bar). The wells-setup route from Settings doesn't render this —
 * it routes straight back to Settings on finish.
 */
export default function OnboardingWellsSuccess() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    // Ring expands and fades.
    ringScale.value = withTiming(1.6, { duration: 700, easing: Easing.out(Easing.quad) });
    ringOpacity.value = withSequence(
      withTiming(0.5, { duration: 200 }),
      withTiming(0, { duration: 500 }),
    );
    // Checkmark pops in with spring.
    scale.value = withSpring(1, { damping: 9, stiffness: 110, mass: 0.6 });
    opacity.value = withTiming(1, { duration: 300 });
  }, [ringScale, ringOpacity, scale, opacity]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <GradientBackground>
      <View
        className="flex-1 justify-between px-6"
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }}
      >
        <View className="flex-1 items-center justify-center">
          {/* Checkmark + expanding ring */}
          <View className="items-center justify-center" style={{ width: 140, height: 140, marginBottom: 32 }}>
            <Animated.View
              style={[
                styles.ring,
                ringStyle,
              ]}
            />
            <Animated.View style={[styles.checkBadge, checkStyle]}>
              <Ionicons name="checkmark" size={56} color={palette.N1} />
            </Animated.View>
          </View>

          <Text className="text-2xl text-center" style={{ color: palette.N2, fontWeight: '700' }}>
            Wells Set Up!
          </Text>
          <Text
            className="text-base text-center mt-3 leading-6 px-4"
            style={{ color: palette.N3 }}
          >
            Your house pours are in My Inventory. You can update or add more anytime from{' '}
            <Text style={{ color: palette.Y4, fontWeight: '600' }}>Settings → Manage Wells</Text>.
          </Text>
        </View>

        <Pressable
          onPress={() => router.replace('/(auth)/onboarding-cocktails-intro' as any)}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: palette.G3,
  },
  checkBadge: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: palette.G3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.G3,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
  },
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
