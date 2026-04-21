import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import AppleSignInButton from '@/src/components/ui/AppleSignInButton';
import GoogleSignInButton from '@/src/components/ui/GoogleSignInButton';
import { palette } from '@/src/contexts/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground>
      <View
        className="flex-1 px-6"
        style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }}
      >
        {/* Back */}
        <Pressable onPress={() => router.back()} className="flex-row items-center py-2 -ml-1">
          <Ionicons name="chevron-back" size={22} color={palette.N3} />
          <Text style={{ color: palette.N3, fontSize: 16 }}>Back</Text>
        </Pressable>

        {/* Header */}
        <View className="items-center mt-10">
          <Image
            source={require('@/assets/images/PC-Logo-Gold.png')}
            style={{ width: 160, height: 40, marginBottom: 16 }}
            resizeMode="contain"
          />
          <Text className="text-2xl" style={{ color: palette.Y4, fontWeight: '700' }}>
            Welcome Back
          </Text>
          <Text className="text-base text-center mt-2" style={{ color: palette.N4 }}>
            Choose how you'd like to sign in
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        {/* Auth options */}
        <View className="flex-col gap-3">
          <AppleSignInButton />
          <GoogleSignInButton />

          {/* Divider */}
          <View className="flex-row items-center gap-3 my-2">
            <View className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
            <Text style={{ color: palette.N4, fontSize: 13 }}>or</Text>
            <View className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
          </View>

          <Pressable
            onPress={() => router.push('/(auth)/login-email' as any)}
            style={styles.emailButton}
          >
            <Ionicons name="mail-outline" size={20} color={palette.N1} />
            <Text style={styles.emailButtonText}>Sign in with Email</Text>
          </Pressable>
        </View>

        {/* Sign up link */}
        <View className="flex-row justify-center items-center mt-8 gap-1">
          <Text style={{ color: palette.N4, fontSize: 14 }}>Don't have an account?</Text>
          <Pressable onPress={() => router.replace('/(auth)/signup' as any)}>
            <Text style={{ color: palette.Y4, fontSize: 14, fontWeight: '600' }}>Sign Up</Text>
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
