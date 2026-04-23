import { useState, useCallback, useLayoutEffect, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Platform, TextInput as RNTextInput } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import SettingsCard from '@/src/components/ui/SettingsCard';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import SectionDivider from '@/src/components/ui/SectionDivider';
import BottomSheet from '@/src/components/ui/BottomSheet';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppStore } from '@/src/stores/app-store';
import { FeedbackService } from '@/src/services/feedback-service';

export default function SettingsAccountScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const {
    user,
    signOut,
    deleteAccount,
    linkedProviders,
    isEmailVerified,
    hasPasswordIdentity,
    linkWithApple,
    linkWithGoogle,
    unlinkProvider,
    resendVerificationEmail,
  } = useAuth();
  const { displayName, setDisplayName, saveProfile } = useAppStore();

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedSave = useCallback(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => { saveProfile(); }, 1000);
  }, [saveProfile]);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
        saveProfile();
      }
    };
  }, [saveProfile]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Account' });
  }, [navigation]);

  const [showNameEditor, setShowNameEditor] = useState(false);
  const [nameText, setNameText] = useState(displayName || user?.user_metadata?.full_name || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTypedText, setDeleteTypedText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [resendingVerify, setResendingVerify] = useState(false);

  const hasApple = linkedProviders.includes('apple');
  const hasGoogle = linkedProviders.includes('google');
  const identityCount = linkedProviders.length;

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleResendVerification = async () => {
    if (resendingVerify) return;
    setResendingVerify(true);
    const { error } = await resendVerificationEmail();
    setResendingVerify(false);
    if (error) FeedbackService.showError('Could Not Send', error);
    else FeedbackService.showSuccess('Email Sent', `Verification link sent to ${user?.email ?? 'your email'}.`);
  };

  const handleLink = (provider: 'apple' | 'google') => {
    const name = provider === 'apple' ? 'Apple ID' : 'Google account';
    Alert.alert(
      `Link ${name}`,
      `You'll be asked to sign in with the ${name} you want to link to this account. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            const fn = provider === 'apple' ? linkWithApple : linkWithGoogle;
            const { error, canceled } = await fn();
            if (canceled) return;
            if (error) FeedbackService.showError('Link Failed', error);
            else FeedbackService.showSuccess(`${provider === 'apple' ? 'Apple' : 'Google'} Linked`, `You can now sign in with ${name}.`);
          },
        },
      ]
    );
  };

  const handleUnlink = (provider: 'apple' | 'google') => {
    if (identityCount <= 1) {
      FeedbackService.showError(
        'Cannot Unlink',
        'This is your only sign-in method. Link another before removing this one.'
      );
      return;
    }
    const name = provider === 'apple' ? 'Apple ID' : 'Google account';
    Alert.alert(
      `Unlink ${name}?`,
      `You won't be able to sign in with ${name} anymore. You'll still have ${identityCount - 1} other way${identityCount - 1 === 1 ? '' : 's'} to sign in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            const { error } = await unlinkProvider(provider);
            if (error) FeedbackService.showError('Unlink Failed', error);
            else FeedbackService.showSuccess('Unlinked', `${name} is no longer linked.`);
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    if (deleteTypedText.trim().toUpperCase() !== 'DELETE') return;
    setDeleting(true);
    const { error } = await deleteAccount();
    setDeleting(false);
    setShowDeleteConfirm(false);
    setDeleteTypedText('');
    if (error) FeedbackService.showError('Delete Failed', error);
    else FeedbackService.showSuccess('Account Deleted', 'Your account and all data have been removed.');
  };

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="p-4 pt-6 flex-col gap-6">
          {/* Profile */}
          <View className="flex-col gap-3">
            <ScreenTitle variant="group" title="Profile" />
            <SettingsCard
              title="Name"
              description={displayName || user?.user_metadata?.full_name || 'Not set'}
              iconName="person-outline"
              onPress={() => setShowNameEditor(true)}
              showCaret
            />
            <SettingsCard
              title="Email"
              description={user?.email ?? 'No email'}
              iconName="mail-outline"
            />
            {user?.email && !isEmailVerified && (
              <SettingsCard
                tone="gold"
                title={resendingVerify ? 'Sending…' : 'Verify Email'}
                description="Your email isn't verified yet. Tap to send a verification link."
                iconName="alert-circle-outline"
                onPress={handleResendVerification}
                disabled={resendingVerify}
              />
            )}
          </View>

          <SectionDivider />

          {/* Sign-in Methods */}
          <View className="flex-col gap-3">
            <ScreenTitle variant="group" title="Sign-in Methods" />
            {hasPasswordIdentity && (
              <SettingsCard
                title="Password"
                description="Change your account password"
                iconName="key-outline"
                onPress={() => router.push('/change-password' as any)}
                showCaret
              />
            )}
            {Platform.OS === 'ios' && (
              <SettingsCard
                title="Apple Sign-In"
                description={hasApple ? 'Linked — tap to unlink' : 'Not linked — tap to link'}
                iconName={hasApple ? 'checkmark-circle-outline' : 'add-circle-outline'}
                iconColor={hasApple ? colors.colors.G3 : colors.text}
                onPress={() => (hasApple ? handleUnlink('apple') : handleLink('apple'))}
              />
            )}
            <SettingsCard
              title="Google Sign-In"
              description={hasGoogle ? 'Linked — tap to unlink' : 'Not linked — tap to link'}
              iconName={hasGoogle ? 'checkmark-circle-outline' : 'add-circle-outline'}
              iconColor={hasGoogle ? colors.colors.G3 : colors.text}
              onPress={() => (hasGoogle ? handleUnlink('google') : handleLink('google'))}
            />
          </View>

          <SectionDivider />

          {/* Danger zone */}
          <View className="flex-col gap-3">
            <ScreenTitle variant="group" title="Account Actions" />
            <SettingsCard
              title="Sign Out"
              description={user?.email ?? 'Signed in'}
              iconName="log-out-outline"
              onPress={handleSignOut}
            />
            <SettingsCard
              tone="danger"
              title="Delete Account"
              description="Permanently remove your account and data"
              iconName="trash-outline"
              onPress={() => setShowDeleteConfirm(true)}
            />
          </View>

          <View className="h-8" />
        </View>
      </ScrollView>

      {/* Name Editor */}
      <BottomSheet visible={showNameEditor} onClose={() => setShowNameEditor(false)} title="Your Name">
        <View className="px-4 pb-6 flex-col gap-4">
          <RNTextInput
            value={nameText}
            onChangeText={setNameText}
            placeholder="Enter your name"
            placeholderTextColor={colors.textMuted}
            autoFocus
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            className="rounded-lg p-4"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.text,
              fontSize: 16,
            }}
          />
          <Pressable
            onPress={() => {
              setDisplayName(nameText.trim());
              debouncedSave();
              setShowNameEditor(false);
            }}
            className="rounded-lg py-3 items-center"
            style={{ backgroundColor: colors.go }}
          >
            <Text style={{ color: palette.N1, fontWeight: '600', fontSize: 16 }}>Save</Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* Delete Confirm */}
      <BottomSheet visible={showDeleteConfirm} onClose={() => { if (!deleting) { setShowDeleteConfirm(false); setDeleteTypedText(''); } }} title="Delete Account">
        <View className="px-4 pb-6 flex-col gap-3">
          <View className="flex-row items-start gap-2">
            <Ionicons name="warning-outline" size={22} color={colors.colors.R3} />
            <Text className="flex-1" style={{ color: colors.text, fontSize: 14 }}>
              This permanently deletes your account, ingredients, cocktails, invoices, and all saved data. This cannot be undone.
            </Text>
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 13 }}>
            Type <Text style={{ fontWeight: '700', color: colors.text }}>DELETE</Text> to confirm:
          </Text>
          <RNTextInput
            value={deleteTypedText}
            onChangeText={setDeleteTypedText}
            placeholder="DELETE"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            className="rounded-lg p-4"
            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, color: colors.text, fontSize: 16 }}
          />
          <Pressable
            onPress={handleDelete}
            disabled={deleting || deleteTypedText.trim().toUpperCase() !== 'DELETE'}
            className="rounded-lg py-3 items-center"
            style={{
              backgroundColor: colors.colors.R3,
              opacity: (deleting || deleteTypedText.trim().toUpperCase() !== 'DELETE') ? 0.4 : 1,
            }}
          >
            <Text style={{ color: palette.N1, fontWeight: '700', fontSize: 16 }}>
              {deleting ? 'Deleting…' : 'Delete Forever'}
            </Text>
          </Pressable>
        </View>
      </BottomSheet>
    </GradientBackground>
  );
}
