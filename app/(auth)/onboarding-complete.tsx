import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { palette } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppStore } from '@/src/stores/app-store';
import { capture } from '@/src/services/analytics-service';

/**
 * Final onboarding screen — saves the user's profile preferences, fires the
 * onboarding_complete event, and drops them into the app.
 *
 * The sample bar that previously seeded here is gone — the wells picker +
 * cocktail picker now populate the bar from the user's actual choices.
 * Users who skip both wells and cocktails land in an empty bar; the empty
 * states on My Inventory and Cocktails route them back into setup.
 */
export default function OnboardingComplete() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { clearNewSignUp } = useAuth();
  const saveProfile = useAppStore((s) => s.saveProfile);
  const [busy, setBusy] = useState(false);

  const handleFinish = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await saveProfile();
      capture('onboarding_complete');
      clearNewSignUp();
      router.replace('/(drawer)/cocktails' as any);
    } finally {
      setBusy(false);
    }
  };

  return (
    <GradientBackground>
      <View
        className="flex-1 justify-between px-6"
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }}
      >
        <View className="flex-1 items-center justify-center">
          <View
            style={{
              backgroundColor: palette.G3 + '15',
              borderRadius: 999,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <Ionicons name="checkmark-circle" size={56} color={palette.G3} />
          </View>

          <Text className="text-2xl text-center" style={{ color: palette.N2, fontWeight: '700' }}>
            You're All Set!
          </Text>
          <Text
            className="text-base text-center mt-3 leading-6 px-4"
            style={{ color: palette.N3 }}
          >
            Your bar is ready. Open Cocktails to see live cost and margin on every recipe, or jump into Bar Inventory to add more.
          </Text>
        </View>

        <Pressable
          onPress={handleFinish}
          disabled={busy}
          style={[styles.primaryButton, busy && styles.disabled]}
        >
          {busy ? (
            <ActivityIndicator color={palette.N1} />
          ) : (
            <View className="flex-row items-center gap-2">
              <Text style={styles.primaryButtonText}>Start Using PourCost</Text>
              <Ionicons name="arrow-forward" size={18} color={palette.N1} />
            </View>
          )}
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
  disabled: {
    opacity: 0.5,
  },
});
