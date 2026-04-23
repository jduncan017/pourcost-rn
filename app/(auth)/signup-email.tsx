import { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import TextInput from '@/src/components/ui/TextInput';
import AuthHeader from '@/src/components/ui/AuthHeader';
import { useAuth } from '@/src/contexts/AuthContext';
import { FeedbackService } from '@/src/services/feedback-service';
import { HapticService } from '@/src/services/haptic-service';
import { palette } from '@/src/contexts/ThemeContext';
import { PASSWORD_RULES } from '@/src/lib/password-rules';

export default function SignUpEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) })),
    [password]
  );
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const allRulesPassed = ruleResults.every((r) => r.passed) && passwordsMatch;
  const showRules = password.length > 0 || confirmPassword.length > 0;

  const handleSignUp = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!allRulesPassed) {
      setError('Please meet all password requirements');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await signUp(email.trim(), password);

    if (result.error) {
      const err = result.error.toLowerCase();
      const isExisting =
        err.includes('already registered') ||
        err.includes('already been registered') ||
        err.includes('user already registered') ||
        err.includes('user already exists') ||
        err.includes('already exists');

      if (isExisting) {
        FeedbackService.showError(
          'Account Already Exists',
          'An account with this email already exists. Try signing in instead.'
        );
      } else {
        setError(result.error);
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(false);

    if (result.needsConfirmation) {
      FeedbackService.showSuccess(
        'Check Your Email',
        `We sent a confirmation link to ${email.trim()}. Tap the link to finish creating your account, then come back and sign in.`
      );
      router.replace('/(auth)/login-email' as any);
      return;
    }

    router.replace('/(auth)/onboarding-profile' as any);
  };

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 48,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
          <AuthHeader />

          {/* Top-aligned content so the keyboard doesn't cover the inputs */}
          <View className="flex-1">
          <View className="items-center mt-10 mb-8">
            <Text className="text-3xl" style={{ color: palette.N2, fontWeight: '700' }}>
              Sign Up with Email
            </Text>
          </View>

          {/* Form */}
          <View className="flex-col gap-4">
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
            />
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={handleSignUp}
            />

            {/* Password requirements — compact row, only shown once user starts typing */}
            {showRules && (
              <View className="flex-row flex-wrap gap-x-3 gap-y-1 mt-1">
                {ruleResults.map((rule, i) => (
                  <View key={i} className="flex-row items-center gap-1">
                    <Ionicons
                      name={rule.passed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={13}
                      color={rule.passed ? palette.G3 : palette.N4}
                    />
                    <Text style={{ fontSize: 12, color: rule.passed ? palette.G3 : palette.N4 }}>
                      {rule.label}
                    </Text>
                  </View>
                ))}
                <View className="flex-row items-center gap-1">
                  <Ionicons
                    name={passwordsMatch ? 'checkmark-circle' : 'ellipse-outline'}
                    size={13}
                    color={passwordsMatch ? palette.G3 : palette.N4}
                  />
                  <Text style={{ fontSize: 12, color: passwordsMatch ? palette.G3 : palette.N4 }}>
                    Passwords match
                  </Text>
                </View>
              </View>
            )}

            {error && (
              <Text className="text-sm text-center" style={{ color: palette.R3 }}>
                {error}
              </Text>
            )}
          </View>

          </View>

          <Pressable
            onPress={() => { HapticService.buttonPress(); handleSignUp(); }}
            style={[styles.primaryButton, { marginTop: 24 }, isLoading && styles.disabled]}
            disabled={isLoading}
          >
            <View className="flex-row items-center gap-3">
              {isLoading && <ActivityIndicator size="small" color={palette.N1} />}
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Creating account…' : 'Create Account'}
              </Text>
            </View>
          </Pressable>
      </ScrollView>
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
