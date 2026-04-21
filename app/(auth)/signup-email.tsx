import { useState, useMemo } from 'react';
import { View, Text, Image, Pressable, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import TextInput from '@/src/components/ui/TextInput';
import { useAuth } from '@/src/contexts/AuthContext';
import { FeedbackService } from '@/src/services/feedback-service';
import { palette } from '@/src/contexts/ThemeContext';

const PASSWORD_RULES = [
  { label: '8+ characters', test: (pw: string) => pw.length >= 8 },
  { label: 'Uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'Number', test: (pw: string) => /[0-9]/.test(pw) },
  { label: 'Symbol', test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
  {
    label: 'Passwords match',
    test: (_pw: string, confirm: string, pw: string) =>
      pw.length > 0 && confirm.length > 0 && pw === confirm,
  },
];

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
    () => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password, confirmPassword, password) })),
    [password, confirmPassword]
  );

  const allRulesPassed = ruleResults.every((r) => r.passed);
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
      const isExisting =
        result.error.toLowerCase().includes('already registered') ||
        result.error.toLowerCase().includes('already been registered') ||
        result.error.toLowerCase().includes('user already registered');

      if (isExisting) {
        FeedbackService.showError(
          'Account Already Exists',
          'An account with this email already exists. Try signing in instead.'
        );
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    } else {
      router.replace('/(auth)/onboarding-profile' as any);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 28,
            paddingHorizontal: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <Pressable onPress={() => router.back()} className="flex-row items-center py-2 -ml-1">
            <Ionicons name="chevron-back" size={22} color={palette.N3} />
            <Text style={{ color: palette.N3, fontSize: 16 }}>Back</Text>
          </Pressable>

          {/* Header */}
          <View className="items-center mt-8 mb-8">
            <Image
              source={require('@/assets/images/PC-Logo-Gold.png')}
              style={{ width: 160, height: 40, marginBottom: 16 }}
              resizeMode="contain"
            />
            <Text className="text-2xl" style={{ color: palette.N2, fontWeight: '700' }}>
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
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
            />
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              secureTextEntry
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
              </View>
            )}

            {error && (
              <Text className="text-sm text-center" style={{ color: palette.R3 }}>
                {error}
              </Text>
            )}
          </View>

          {/* Spacer pushes button to bottom */}
          <View style={{ flex: 1, minHeight: 24 }} />

          <Pressable
            onPress={handleSignUp}
            style={[styles.primaryButton, isLoading && styles.disabled]}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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
