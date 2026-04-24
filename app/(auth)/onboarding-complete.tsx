import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { palette } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppStore } from '@/src/stores/app-store';
import { seedSampleBar } from '@/src/lib/seed-sample-bar';
import { FeedbackService } from '@/src/services/feedback-service';

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
      try {
        await seedSampleBar();
      } catch (err) {
        // Non-fatal — user still lands in the app, just with an empty bar.
        const msg = err instanceof Error ? err.message : 'Could not load sample bar';
        FeedbackService.showError(
          'Sample Bar Unavailable',
          `${msg}. Starting you with an empty bar. You can add ingredients manually.`
        );
      }
      clearNewSignUp();
      router.replace('/(drawer)/cocktails' as any);
    } finally {
      setBusy(false);
    }
  };

  return (
    <GradientBackground>
      <View
        className="flex-1 justify-center px-6"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 48 }}
      >
        <View className="items-center flex-1 justify-center">
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

          <Text
            className="text-2xl text-center"
            style={{ color: palette.N2, fontWeight: '700' }}
          >
            You're All Set!
          </Text>
          <Text
            className="text-base text-center mt-3 leading-6 px-4"
            style={{ color: palette.N3 }}
          >
            So you can see PourCost in action right away, we'll pre-load your bar with common ingredients and classic cocktails.
          </Text>

          {/* Sample bar info card */}
          <View
            className="self-stretch flex-col gap-3 mt-8 px-5 py-4 rounded-2xl"
            style={{
              backgroundColor: palette.P3 + '12',
              borderWidth: 1,
              borderColor: palette.P3 + '40',
            }}
          >
            <View className="flex-row items-start gap-3">
              <Ionicons name="sparkles-outline" size={22} color={palette.P3} style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text style={{ color: palette.P3, fontWeight: '600', fontSize: 14 }}>
                  Sample bar included
                </Text>
                <View className="flex-col gap-1 mt-2">
                  <View className="flex-row items-start gap-2">
                    <Text style={{ color: palette.P3, fontSize: 13, lineHeight: 18 }}>•</Text>
                    <Text style={{ color: palette.N3, fontSize: 13, lineHeight: 18, flex: 1 }}>
                      14 ingredients (Bulleit, Tanqueray, Don Julio…)
                    </Text>
                  </View>
                  <View className="flex-row items-start gap-2">
                    <Text style={{ color: palette.P3, fontSize: 13, lineHeight: 18 }}>•</Text>
                    <Text style={{ color: palette.N3, fontSize: 13, lineHeight: 18, flex: 1 }}>
                      5 cocktails (Old Fashioned, Margarita, Negroni…)
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Edit / clear note */}
          <View
            className="self-stretch flex-row items-start gap-3 mt-3 px-5 py-3 rounded-2xl"
            style={{
              backgroundColor: palette.G3 + '12',
              borderWidth: 1,
              borderColor: palette.G3 + '40',
            }}
          >
            <Ionicons name="create-outline" size={18} color={palette.G3} style={{ marginTop: 1 }} />
            <Text className="flex-1" style={{ color: palette.N2, fontSize: 13, lineHeight: 18 }}>
              Edit them freely. Clear the sample bar anytime from{' '}
              <Text style={{ color: palette.G3, fontWeight: '600' }}>Settings → Getting Started</Text>.
            </Text>
          </View>
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
