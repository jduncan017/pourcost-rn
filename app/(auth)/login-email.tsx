import { useState } from 'react';
import { View, Text, Image, Pressable, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import TextInput from '@/src/components/ui/TextInput';
import { useAuth } from '@/src/contexts/AuthContext';
import { palette } from '@/src/contexts/ThemeContext';
import { supabase } from '@/src/lib/supabase';

export default function LoginEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email above first');
      return;
    }
    setError(null);
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'pourcostrn://reset-password',
    });
    setSuccessMessage('Check your email for a reset link');
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
            <Text className="text-2xl" style={{ color: palette.Y4, fontWeight: '700' }}>
              Sign In with Email
            </Text>
          </View>

          {/* Form */}
          <View className="flex-col gap-4 mb-6">
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

            <Pressable onPress={handleForgotPassword} className="items-end">
              <Text style={{ color: palette.N3, fontSize: 13 }}>Forgot password?</Text>
            </Pressable>

            {successMessage && (
              <Text className="text-sm text-center" style={{ color: palette.G3 }}>
                {successMessage}
              </Text>
            )}
            {error && (
              <Text className="text-sm text-center" style={{ color: palette.R3 }}>
                {error}
              </Text>
            )}
          </View>

          <View style={{ flex: 1, minHeight: 24 }} />

          <Pressable
            onPress={handleSignIn}
            style={[styles.primaryButton, isLoading && styles.disabled]}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Signing in...' : 'Sign In'}
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
