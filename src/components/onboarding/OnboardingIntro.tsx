import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { palette } from '@/src/contexts/ThemeContext';

export interface OnboardingIntroProps {
  /** STEP N OF M eyebrow label. */
  step: string;
  /** Hero icon name (Ionicons). */
  iconName: keyof typeof Ionicons.glyphMap;
  /** Tint applied to the hero icon and its halo. */
  iconColor: string;
  title: string;
  /** Body copy explaining what this step does + why it matters. */
  body: string;
  /** Optional list of bullet points framing what'll happen if they continue. */
  bullets?: string[];
  /** CTA label for the primary action. */
  primaryLabel: string;
  onPrimary: () => void;
  /** Skip CTA label. */
  skipLabel?: string;
  onSkip: () => void;
}

/**
 * Shared intro card used before each major onboarding step. Lets the user
 * commit ("yes do this now") or defer ("skip for now, I'll set this up later")
 * with explicit framing instead of a buried skip link.
 *
 * Used by:
 *   - app/(auth)/onboarding-wells-intro.tsx (before wells picker)
 *   - app/(auth)/onboarding-cocktails-intro.tsx (before cocktails picker)
 */
export default function OnboardingIntro({
  step,
  iconName,
  iconColor,
  title,
  body,
  bullets,
  primaryLabel,
  onPrimary,
  skipLabel = 'Skip for Now',
  onSkip,
}: OnboardingIntroProps) {
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground>
      <View
        className="flex-1 px-6"
        style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}
      >
        {/* Step eyebrow */}
        <View className="py-2">
          <Text style={{ color: palette.N4, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 }}>
            {step.toUpperCase()}
          </Text>
        </View>

        {/* Hero */}
        <View className="flex-1 items-center justify-center">
          <View
            style={{
              backgroundColor: iconColor + '15',
              borderRadius: 999,
              padding: 24,
              marginBottom: 28,
            }}
          >
            <Ionicons name={iconName} size={56} color={iconColor} />
          </View>

          <Text
            className="text-2xl text-center"
            style={{ color: palette.N2, fontWeight: '700' }}
          >
            {title}
          </Text>

          <Text
            className="text-base text-center mt-3 leading-6"
            style={{ color: palette.N3, paddingHorizontal: 8 }}
          >
            {body}
          </Text>

          {bullets && bullets.length > 0 && (
            <View className="self-stretch flex-col gap-2 mt-6 px-4">
              {bullets.map((bullet, idx) => (
                <View key={idx} className="flex-row items-start gap-2">
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={iconColor}
                    style={{ marginTop: 1 }}
                  />
                  <Text
                    className="flex-1"
                    style={{ color: palette.N3, fontSize: 14, lineHeight: 20 }}
                  >
                    {bullet}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Footer */}
        <View className="flex-col gap-2">
          <Pressable onPress={onPrimary} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
          </Pressable>
          <Pressable onPress={onSkip} className="py-3 items-center">
            <Text style={{ color: palette.N4, fontSize: 14, fontWeight: '500' }}>
              {skipLabel}
            </Text>
          </Pressable>
        </View>
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
