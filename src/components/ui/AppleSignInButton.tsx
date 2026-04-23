import { Platform, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme, palette } from '@/src/contexts/ThemeContext';
import { FeedbackService } from '@/src/services/feedback-service';

interface AppleSignInButtonProps {
  onSuccess?: (isNewUser: boolean) => void;
  mode?: 'sign-in' | 'sign-up';
}

export default function AppleSignInButton({ onSuccess, mode = 'sign-in' }: AppleSignInButtonProps) {
  const { signInWithApple } = useAuth();
  const { isDarkMode } = useTheme();
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  if (Platform.OS !== 'ios') return null;

  if (isAvailable === null) {
    AppleAuthentication.isAvailableAsync().then(setIsAvailable);
    return null;
  }

  if (!isAvailable) return null;

  const handlePress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await signInWithApple();
      if (result.canceled) return;
      if (result.error) {
        if (result.alreadyExists) {
          FeedbackService.showError(
            'Account Already Exists',
            'An account with this email already exists. Sign in with your original method, then link Apple in Settings.'
          );
        } else {
          FeedbackService.showError('Apple Sign-In Failed', result.error);
        }
        return;
      }
      onSuccess?.(!!result.isNewUser);
    } finally {
      setLoading(false);
    }
  };

  // While loading, swap the native Apple button for a matching-sized pill with
  // a spinner. Apple's native button doesn't accept children so we can't
  // overlay — the swap is the only option.
  if (loading) {
    const bg = isDarkMode ? '#FFFFFF' : '#000000';
    const fg = isDarkMode ? '#000000' : '#FFFFFF';
    return (
      <View style={[styles.loadingPill, { backgroundColor: bg, opacity: 0.8 }]}>
        <ActivityIndicator size="small" color={fg} />
        <Text style={[styles.loadingText, { color: fg }]}>Signing in…</Text>
      </View>
    );
  }

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={mode === 'sign-up'
        ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
        : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={
        isDarkMode
          ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
          : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
      }
      cornerRadius={999}
      style={{ width: '100%', height: 52 }}
      onPress={handlePress}
    />
  );
}

const styles = StyleSheet.create({
  loadingPill: {
    width: '100%',
    height: 52,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
