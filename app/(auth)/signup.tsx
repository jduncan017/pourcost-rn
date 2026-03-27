import { useState, useMemo } from 'react';
import { View, Text, Image, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import TextInput from '@/src/components/ui/TextInput';
import { useAuth } from '@/src/contexts/AuthContext';
import { palette } from '@/src/contexts/ThemeContext';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
  { label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'One number', test: (pw: string) => /[0-9]/.test(pw) },
  { label: 'One symbol', test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
  { label: 'Passwords match', test: (_pw: string, confirm: string, pw: string) => pw.length > 0 && confirm.length > 0 && pw === confirm },
];

export default function SignUpScreen() {
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

  const handleSignUp = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!allRulesPassed) {
      setError('Please fix the password requirements above');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await signUp(email.trim(), password);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push('/(auth)/onboarding-profile' as any);
      setIsLoading(false);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View
          className="flex-1 justify-between px-6"
          style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }}
        >
          {/* Back button */}
          <Pressable onPress={() => router.back()} className="flex-row items-center py-2 -ml-1">
            <Ionicons name="chevron-back" size={22} color={palette.N3} />
            <Text style={{ color: palette.N3, fontSize: 16 }}>Back</Text>
          </Pressable>

          <View className="flex-col gap-8 flex-1 justify-center">
            {/* Header */}
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
                Create Your Account
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

              {/* Password requirements */}
              <View className="flex-col gap-2 mt-1">
                {ruleResults.map((rule, i) => (
                  <View key={i} className="flex-row items-center gap-2">
                    <Ionicons
                      name={rule.passed ? 'checkmark-circle' : 'close-circle'}
                      size={16}
                      color={rule.passed ? palette.G3 : palette.R3}
                    />
                    <Text
                      className="text-sm"
                      style={{ color: rule.passed ? palette.G3 : palette.R3 }}
                    >
                      {rule.label}
                    </Text>
                  </View>
                ))}
              </View>

              {error && (
                <Text
                  className="text-sm text-center"
                  style={{ color: palette.R3 }}
                >
                  {error}
                </Text>
              )}
            </View>
          </View>

          <Pressable
            onPress={handleSignUp}
            style={[styles.primaryButton, isLoading && styles.disabled]}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </Text>
          </Pressable>
        </View>
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
