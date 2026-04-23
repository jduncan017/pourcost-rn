import { useState, useLayoutEffect, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import TextInput from '@/src/components/ui/TextInput';
import { palette } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { PASSWORD_RULES } from '@/src/lib/password-rules';
import { FeedbackService } from '@/src/services/feedback-service';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user, updatePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Change Password' });
  }, [navigation]);

  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(newPassword) })),
    [newPassword]
  );
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const allRulesPassed = ruleResults.every((r) => r.passed);
  const showRules = newPassword.length > 0 || confirmPassword.length > 0;
  const canSubmit =
    currentPassword.length > 0 &&
    allRulesPassed &&
    passwordsMatch &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (!user?.email) {
      setError("Can't verify your current password without an email on your account.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // Verify current password by re-authenticating. signInWithPassword silently
      // refreshes the session if credentials are correct; no user-visible side effect.
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (verifyErr) {
        setError('Current password is incorrect.');
        return;
      }

      const { error: updateErr } = await updatePassword(newPassword);
      if (updateErr) {
        setError(updateErr);
        return;
      }

      FeedbackService.showSuccess('Password Updated', 'Your password has been changed.');
      router.back();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
          <View className="flex-1 justify-center">
            <Text
              className="text-base text-center mb-6"
              style={{ color: palette.N3, lineHeight: 22 }}
            >
              Enter your current password, then set a new one.
            </Text>

            <View className="flex-col gap-4">
              <TextInput
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Current password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="next"
                autoFocus
              />
              <TextInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
              />
              <TextInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter the new password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
              />

              {showRules && (
                <View className="flex-row flex-wrap gap-x-3 gap-y-1 mt-1">
                  {ruleResults.map((rule, i) => (
                    <View key={i} className="flex-row items-center gap-1">
                      <Ionicons
                        name={rule.passed ? 'checkmark-circle' : 'ellipse-outline'}
                        size={13}
                        color={rule.passed ? palette.G3 : palette.N4}
                      />
                      <Text style={{ fontSize: 12, color: rule.passed ? palette.G3 : palette.N4 }}>
                        {rule.label}
                      </Text>
                    </View>
                  ))}
                  <View className="flex-row items-center gap-1">
                    <Ionicons
                      name={passwordsMatch ? 'checkmark-circle' : 'ellipse-outline'}
                      size={13}
                      color={passwordsMatch ? palette.G3 : palette.N4}
                    />
                    <Text style={{ fontSize: 12, color: passwordsMatch ? palette.G3 : palette.N4 }}>
                      Passwords match
                    </Text>
                  </View>
                </View>
              )}

              {error && (
                <Text className="text-sm text-center mt-2" style={{ color: palette.R3 }}>
                  {error}
                </Text>
              )}
            </View>
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[styles.primaryButton, !canSubmit && styles.disabled]}
          >
            <View className="flex-row items-center gap-3">
              {submitting && <ActivityIndicator size="small" color={palette.N1} />}
              <Text style={styles.primaryButtonText}>
                {submitting ? 'Updating…' : 'Update Password'}
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
    marginTop: 16,
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
