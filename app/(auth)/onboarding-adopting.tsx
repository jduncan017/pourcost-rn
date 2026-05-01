import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { palette } from '@/src/contexts/ThemeContext';
import { useOnboardingCocktailsStore } from '@/src/stores/onboarding-cocktails-store';
import { adoptLibraryRecipes } from '@/src/lib/recipe-adopter';
import { FeedbackService } from '@/src/services/feedback-service';
import { capture } from '@/src/services/analytics-service';

const PHASES: { icon: keyof typeof Ionicons.glyphMap; text: string; color: string }[] = [
  { icon: 'flask-outline', text: 'Stocking your shelves…', color: palette.B5 },
  { icon: 'beaker-outline', text: 'Measuring exact ounces…', color: palette.Y4 },
  { icon: 'wine-outline', text: 'Pouring cocktails…', color: palette.G3 },
  { icon: 'sparkles-outline', text: 'Polishing the glassware…', color: palette.P3 },
];

const PHASE_INTERVAL_MS = 1400;
/** Don't proceed before this even if adoption finishes faster, so the user
 *  sees at least the first 2 phases instead of a flash. */
const MINIMUM_DURATION_MS = 3500;

/**
 * Loader screen that runs the actual adoption (recipe-adopter) while
 * cycling through phase messages. Replaces the cocktails-prices Continue
 * "do everything inline + flood toasts" experience.
 *
 * Routes to onboarding-complete on success. On total failure (no cocktails
 * created), surfaces a toast on the next screen — we don't block the user
 * here since they can always retry from My Inventory + Cocktails screens.
 */
export default function OnboardingAdopting() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { selectedRecipes, analyses, pricedMissing, reset } = useOnboardingCocktailsStore();
  const [phaseIdx, setPhaseIdx] = useState(0);
  const startedRef = useRef(false);

  // Cycle phase text every PHASE_INTERVAL_MS until adoption finishes.
  useEffect(() => {
    const t = setInterval(() => {
      setPhaseIdx((i) => (i + 1) % PHASES.length);
    }, PHASE_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  // Run adoption + minimum-duration guard.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    const start = Date.now();

    (async () => {
      try {
        const result = await adoptLibraryRecipes({
          recipes: selectedRecipes,
          analyses,
          pricedMissing,
        });

        if (cancelled) return;

        capture('onboarding_cocktails_adopted', {
          cocktails_created: result.cocktailsCreated,
          ingredients_created: result.ingredientsCreated,
          error_count: result.errors.length,
        });

        if (result.errors.length > 0 && __DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[adopt] errors:', result.errors);
        }

        if (result.errors.length > 0 && result.cocktailsCreated === 0) {
          FeedbackService.showError(
            'Could Not Add Cocktails',
            result.errors[0] ?? 'Try again from the Cocktails screen.',
          );
        }

        // Hold for the minimum so phases play out.
        const elapsed = Date.now() - start;
        const wait = Math.max(0, MINIMUM_DURATION_MS - elapsed);
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));

        if (cancelled) return;
        reset();
        router.replace('/(auth)/onboarding-complete' as any);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Adoption failed';
        FeedbackService.showError('Setup Failed', msg);
        reset();
        router.replace('/(auth)/onboarding-complete' as any);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentPhase = PHASES[phaseIdx];

  return (
    <GradientBackground>
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <PulsingIcon iconName={currentPhase.icon} color={currentPhase.color} />

        <Text
          className="text-xl text-center mt-8"
          style={{ color: palette.N2, fontWeight: '600' }}
        >
          {currentPhase.text}
        </Text>

        {/* Phase dot indicator */}
        <View className="flex-row gap-2 mt-6">
          {PHASES.map((_, i) => (
            <View
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  i === phaseIdx ? currentPhase.color : 'rgba(255,255,255,0.18)',
              }}
            />
          ))}
        </View>

        <Text
          className="text-sm text-center mt-10 leading-5 px-6"
          style={{ color: palette.N4 }}
        >
          We're setting up your bar. Hang tight, this only takes a moment.
        </Text>
      </View>
    </GradientBackground>
  );
}

// ============================================================
// PulsingIcon — soft pulse animation behind the phase icon
// ============================================================

function PulsingIcon({
  iconName,
  color,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  const scale = useSharedValue(1);
  const haloOpacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    haloOpacity.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.25, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(scale);
      cancelAnimation(haloOpacity);
    };
  }, [scale, haloOpacity]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: haloOpacity.value,
  }));

  return (
    <View style={{ width: 140, height: 140, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          styles.halo,
          { borderColor: color, backgroundColor: color + '15' },
          haloStyle,
        ]}
      />
      <Animated.View style={iconStyle}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: color + '22',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={iconName} size={48} color={color} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
  },
});
