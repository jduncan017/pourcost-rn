import { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '@/src/components/ui/GradientBackground';
import TextInput from '@/src/components/ui/TextInput';
import Button from '@/src/components/ui/Button';
import { useAuth } from '@/src/contexts/AuthContext';
import { themeColors } from '@/src/contexts/ThemeContext';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = isSignUp
      ? await signUp(email.trim(), password)
      : await signIn(email.trim(), password);

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
          className="flex-1 justify-center px-6"
          style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
          {/* Logo / Brand */}
          <View className="items-center mb-12">
            <Text
              className="text-4xl tracking-wider"
              style={{ color: themeColors.n2, fontWeight: '800' }}
            >
              POUR COST
            </Text>
            <Text
              className="text-base mt-2"
              style={{ color: themeColors.n4 }}
            >
              Calculate. Optimize. Profit.
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
                style={{ color: themeColors.e1 }}
              >
                {error}
              </Text>
            )}

            <Button
              onPress={handleSubmit}
              variant="primary"
              size="large"
              disabled={isLoading}
            >
              {isLoading
                ? 'Please wait...'
                : isSignUp
                  ? 'Create Account'
                  : 'Sign In'}
            </Button>

            <Pressable
              onPress={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="items-center py-3"
            >
              <Text style={{ color: themeColors.g2 }}>
                {isSignUp
                  ? 'Already have an account? '
                  : "Don't have an account? "}
                <Text style={{ color: themeColors.p1, fontWeight: '600' }}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </Text>
            </Pressable>
          </View>

          {/* Future OAuth buttons will go here */}
          {/* <View className="mt-8">
            <Button variant="secondary" icon="logo-facebook">Continue with Facebook</Button>
            <Button variant="secondary" icon="logo-google">Continue with Google</Button>
          </View> */}
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}
