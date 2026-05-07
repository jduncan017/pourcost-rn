import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import AppleSignInButton from '@/src/components/ui/AppleSignInButton';
import GoogleSignInButton from '@/src/components/ui/GoogleSignInButton';
import AuthHeader from '@/src/components/ui/AuthHeader';
import { palette } from '@/src/contexts/ThemeContext';
import { HapticService } from '@/src/services/haptic-service';

export default function SignUpScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground>
      <View
        className="flex-1 px-6"
        style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 48 }}
      >
        <AuthHeader />

        {/* Header — vertically centered in available space */}
        <View className="flex-1 justify-center items-center">
          <Image
            source={require('@/assets/images/PC-Logo-Gold.png')}
            style={{ width: 220, height: 55, marginBottom: 24 }}
            resizeMode="contain"
          />
          <Text className="text-2xl" style={{ color: palette.N2, fontWeight: '700' }}>
            Create Your Account
          </Text>
          <Text className="text-base text-center mt-2" style={{ color: palette.N4 }}>
            Choose how you'd like to sign up
          </Text>
        </View>

        {/* Auth options */}
        <View className="flex-col gap-3" style={{ marginTop: 24 }}>
          <AppleSignInButton
            mode="sign-up"
            onSuccess={(isNewUser) => {
              if (isNewUser) {
                router.replace({
                  pathname: '/getting-started',
                  params: { from: 'onboarding' },
                } as any);
              }
              // For existing users, let _layout.tsx redirect to cocktails — no explicit push.
            }}
          />
          <GoogleSignInButton
            mode="sign-up"
            onSuccess={(isNewUser) => {
              if (isNewUser) {
                router.replace({
                  pathname: '/getting-started',
                  params: { from: 'onboarding' },
                } as any);
              }
            }}
          />

          {/* Divider */}
          <View className="flex-row items-center gap-3 my-2">
            <View className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
            <Text style={{ color: palette.N4, fontSize: 13 }}>or</Text>
            <View className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
          </View>

          <Pressable
            onPress={() => { HapticService.buttonPress(); router.push('/(auth)/signup-email' as any); }}
            style={styles.emailButton}
          >
            <Ionicons name="mail-outline" size={20} color={palette.N1} />
            <Text style={styles.emailButtonText}>Sign Up With Email</Text>
          </Pressable>
        </View>

        {/* Sign in link */}
        <View className="flex-row justify-center items-center mt-8 gap-1">
          <Text style={{ color: palette.N4, fontSize: 14 }}>Already have an account?</Text>
          <Pressable onPress={() => { HapticService.buttonPress(); router.replace('/(auth)/login' as any); }}>
            <Text style={{ color: palette.Y4, fontSize: 14, fontWeight: '600' }}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    height: 52,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  emailButtonText: {
    color: palette.N1,
    fontSize: 16,
    fontWeight: '500',
  },
});
