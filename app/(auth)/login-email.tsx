import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '@/src/components/ui/GradientBackground';
import TextInput from '@/src/components/ui/TextInput';
import AuthHeader from '@/src/components/ui/AuthHeader';
import { useAuth } from '@/src/contexts/AuthContext';
import { palette } from '@/src/contexts/ThemeContext';
import { HapticService } from '@/src/services/haptic-service';

export default function LoginEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleForgotPassword = () => {
    router.push({
      pathname: '/(auth)/forgot-password' as any,
      params: email.trim() ? { email: email.trim() } : undefined,
    });
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }
    setIsLoading(true);
    setError(null);
    const result = await signIn(email.trim(), password);
    if (result.error) setError(result.error);
    setIsLoading(false);
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
              Sign In with Email
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
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSignIn}
            />

            <Pressable onPress={() => { HapticService.buttonPress(); handleForgotPassword(); }} className="items-end">
              <Text style={{ color: palette.N3, fontSize: 13 }}>Forgot password?</Text>
            </Pressable>

            {error && (
              <Text className="text-sm text-center" style={{ color: palette.R3 }}>
                {error}
              </Text>
            )}
          </View>
          </View>

          <Pressable
            onPress={() => { HapticService.buttonPress(); handleSignIn(); }}
            style={[styles.primaryButton, { marginTop: 24 }, isLoading && styles.disabled]}
            disabled={isLoading}
          >
            <View className="flex-row items-center gap-3">
              {isLoading && <ActivityIndicator size="small" color={palette.N1} />}
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Signing in…' : 'Sign In'}
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
