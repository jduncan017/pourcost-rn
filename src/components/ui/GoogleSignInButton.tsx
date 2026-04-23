import { useState } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useAuth } from '@/src/contexts/AuthContext';
import { FeedbackService } from '@/src/services/feedback-service';
import { palette } from '@/src/contexts/ThemeContext';

interface GoogleSignInButtonProps {
  onSuccess?: (isNewUser: boolean) => void;
  mode?: 'sign-in' | 'sign-up';
}

export default function GoogleSignInButton({ onSuccess, mode = 'sign-in' }: GoogleSignInButtonProps) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.canceled) return;
      if (result.error) {
        if (result.alreadyExists) {
          FeedbackService.showError(
            'Account Already Exists',
            'An account with this email already exists. Sign in with your original method, then link Google in Settings.'
          );
        } else {
          FeedbackService.showError('Google Sign-In Failed', result.error);
        }
        return;
      }
      onSuccess?.(!!result.isNewUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      style={[styles.button, loading && styles.loading]}
    >
      {loading ? (
        <View className="flex-row items-center gap-3">
          <ActivityIndicator size="small" color={palette.N1} />
          <Text style={styles.text}>Signing in…</Text>
        </View>
      ) : (
        <>
          <AntDesign name="google" size={20} color="#4285F4" />
          <Text style={styles.text}>{mode === 'sign-up' ? 'Sign up with Google' : 'Sign in with Google'}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  loading: {
    opacity: 0.7,
  },
  text: {
    color: palette.N1,
    fontSize: 16,
    fontWeight: '500',
  },
});
