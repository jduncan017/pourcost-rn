import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import TextInput from '@/src/components/ui/TextInput';
import AuthHeader from '@/src/components/ui/AuthHeader';
import BottomSheet from '@/src/components/ui/BottomSheet';
import { useAuth } from '@/src/contexts/AuthContext';
import { palette, useThemeColors } from '@/src/contexts/ThemeContext';
import { HapticService } from '@/src/services/haptic-service';
import {
  detectInstalledEmailApps,
  getPreferredEmailApp,
  setPreferredEmailApp,
  clearPreferredEmailApp,
  openEmailScheme,
  MAILTO_FALLBACK,
  type EmailApp,
} from '@/src/services/email-app-service';

const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { sendPasswordResetEmail } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(params.email ?? '');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Email app picker state
  const [showEmailPicker, setShowEmailPicker] = useState(false);
  const [detectedApps, setDetectedApps] = useState<EmailApp[]>([]);

  // Countdown tick
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const trimmedEmail = email.trim();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

  const openPicker = async () => {
    const installed = await detectInstalledEmailApps();
    setDetectedApps(installed);
    setShowEmailPicker(true);
  };

  const handleOpenEmail = async () => {
    // Honor the user's previously-saved preference when possible. Fall back
    // to the picker if nothing is saved OR the saved app has since been
    // uninstalled.
    const preferred = await getPreferredEmailApp();
    if (preferred) {
      const ok = await openEmailScheme(preferred);
      if (ok) return;
      // Saved app no longer available — clear and fall through to picker.
      await clearPreferredEmailApp();
    }
    await openPicker();
  };

  const handlePickEmailApp = async (app: EmailApp, remember: boolean) => {
    setShowEmailPicker(false);
    if (remember && app.scheme !== MAILTO_FALLBACK.scheme) {
      await setPreferredEmailApp(app.scheme);
    }
    await openEmailScheme(app.scheme);
  };

  const handleSend = async () => {
    if (!emailValid || isSending || cooldown > 0) return;
    setIsSending(true);
    setError(null);
    const { error: resetError } = await sendPasswordResetEmail(trimmedEmail);
    setIsSending(false);
    if (resetError) {
      setError(resetError);
      return;
    }
    setSentTo(trimmedEmail);
    setCooldown(RESEND_COOLDOWN_SECONDS);
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

          <View className="flex-1">
            <View className="items-center mt-10 mb-8">
              <Text className="text-3xl" style={{ color: palette.N2, fontWeight: '700' }}>
                Reset Password
              </Text>
            </View>

            {!sentTo ? (
              <>
                <Text className="text-base text-center mb-6" style={{ color: palette.N3, lineHeight: 22 }}>
                  Enter the email for your account and we'll send you a reset link.
                </Text>
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
                    returnKeyType="go"
                    onSubmitEditing={handleSend}
                    autoFocus={!params.email}
                  />
                  {error && (
                    <Text className="text-sm text-center" style={{ color: palette.R3 }}>
                      {error}
                    </Text>
                  )}
                </View>
              </>
            ) : (
              <>
                <View className="items-center mb-6">
                  <View
                    style={{
                      backgroundColor: palette.G3 + '15',
                      borderRadius: 40,
                      padding: 16,
                      marginBottom: 20,
                    }}
                  >
                    <Ionicons name="mail-outline" size={40} color={palette.G3} />
                  </View>
                  <Text className="text-xl text-center" style={{ color: palette.N1, fontWeight: '600' }}>
                    Check your email
                  </Text>
                  <Text
                    className="text-base text-center mt-3"
                    style={{ color: palette.N3, lineHeight: 22 }}
                  >
                    We sent password reset instructions to
                  </Text>
                  <Text
                    className="text-base text-center mt-1"
                    style={{ color: palette.Y4, fontWeight: '600' }}
                  >
                    {sentTo}
                  </Text>
                  <Text
                    className="text-sm text-center mt-4 px-2"
                    style={{ color: palette.N4, lineHeight: 20 }}
                  >
                    The link opens a web page where you can set a new password. Check your spam folder if you don't see it within a minute.
                  </Text>
                </View>

                {error && (
                  <Text className="text-sm text-center mb-4" style={{ color: palette.R3 }}>
                    {error}
                  </Text>
                )}
              </>
            )}
          </View>

          {!sentTo ? (
            <Pressable
              onPress={() => { HapticService.buttonPress(); handleSend(); }}
              disabled={!emailValid || isSending}
              style={[styles.primaryButton, { marginTop: 24 }, (!emailValid || isSending) && styles.disabled]}
            >
              <View className="flex-row items-center gap-3">
                {isSending && <ActivityIndicator size="small" color={palette.N1} />}
                <Text style={styles.primaryButtonText}>
                  {isSending ? 'Sending…' : 'Send Reset Link'}
                </Text>
              </View>
            </Pressable>
          ) : (
            <View className="flex-col gap-3" style={{ marginTop: 24 }}>
              <Pressable
                onPress={() => { HapticService.buttonPress(); handleOpenEmail(); }}
                style={styles.primaryButton}
              >
                <View className="flex-row items-center gap-2">
                  <Ionicons name="mail-outline" size={18} color={palette.N1} />
                  <Text style={styles.primaryButtonText}>Open Email</Text>
                </View>
              </Pressable>
              {(() => {
                const isCoolingDown = cooldown > 0 || isSending;
                return (
                  <Pressable
                    onPress={() => { HapticService.buttonPress(); handleSend(); }}
                    disabled={isCoolingDown}
                    style={styles.resendCooling}
                  >
                    <Text style={styles.resendCoolingText}>
                      {cooldown > 0
                        ? `Resend in ${cooldown}s`
                        : isSending
                        ? 'Sending…'
                        : 'Resend Link'}
                    </Text>
                  </Pressable>
                );
              })()}
            </View>
          )}
      </ScrollView>

      <BottomSheet
        visible={showEmailPicker}
        onClose={() => setShowEmailPicker(false)}
        title="Open Email in..."
      >
        <View className="px-4 pb-6 flex-col gap-2">
          <Text style={{ color: colors.textTertiary, fontSize: 13, paddingHorizontal: 4, paddingBottom: 4 }}>
            Pick your email app. We'll remember your choice for next time.
          </Text>

          {detectedApps.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: 14, padding: 12, textAlign: 'center' }}>
              No third-party mail apps detected. Opening your default mail app.
            </Text>
          ) : (
            detectedApps.map((app) => (
              <Pressable
                key={app.scheme}
                onPress={() => handlePickEmailApp(app, true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name={app.icon} size={22} color={colors.text} />
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '500', flex: 1 }}>
                  {app.name}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </Pressable>
            ))
          )}

          <Pressable
            onPress={() => handlePickEmailApp(MAILTO_FALLBACK, false)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: 12,
              marginTop: 4,
            }}
          >
            <Ionicons name="mail-outline" size={22} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 15, flex: 1 }}>
              {MAILTO_FALLBACK.name}
            </Text>
          </Pressable>
        </View>
      </BottomSheet>
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
  resendReady: {
    backgroundColor: palette.G4,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  resendReadyText: {
    color: palette.N1,
    fontSize: 16,
    fontWeight: '600',
  },
  resendCooling: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    opacity: 0.6,
  },
  resendCoolingText: {
    color: palette.N1,
    fontSize: 16,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.5,
  },
});
