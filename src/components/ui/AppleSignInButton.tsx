import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { FeedbackService } from '@/src/services/feedback-service';

interface AppleSignInButtonProps {
  onSuccess?: () => void;
  mode?: 'sign-in' | 'sign-up';
}

export default function AppleSignInButton({ onSuccess, mode = 'sign-in' }: AppleSignInButtonProps) {
  const { signInWithApple } = useAuth();
  const { isDarkMode } = useTheme();
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  if (Platform.OS !== 'ios') return null;

  if (isAvailable === null) {
    AppleAuthentication.isAvailableAsync().then(setIsAvailable);
    return null;
  }

  if (!isAvailable) return null;

  const handlePress = async () => {
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
    onSuccess?.();
  };

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
