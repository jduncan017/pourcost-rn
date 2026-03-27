import { useState } from 'react';
import { View, Text, Image, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import TextInput from '@/src/components/ui/TextInput';
import { useAuth } from '@/src/contexts/AuthContext';
import { palette } from '@/src/contexts/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await signIn(email.trim(), password);

    if (result.error) {
      setError(result.error);
    }

    setIsLoading(false);
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
                style={{ color: palette.Y4, fontWeight: '700' }}
              >
                Welcome Back
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
            onPress={handleSignIn}
            style={[styles.primaryButton, isLoading && styles.disabled]}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Signing in...' : 'Sign In'}
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
