import { View, Image, ScrollView, Linking } from 'react-native';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { useTheme, useThemeColors } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/contexts/AuthContext';
import SettingsCard from '@/src/components/ui/SettingsCard';
import GradientBackground from '@/src/components/ui/GradientBackground';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import SectionDivider from '@/src/components/ui/SectionDivider';
import { FeedbackService } from '@/src/services/feedback-service';

export default function SettingsScreen() {
  const router = useGuardedRouter();
  const { isDarkMode } = useTheme();
  const colors = useThemeColors();
  const { user, isEmailVerified } = useAuth();

  // MVP: theme picker hidden — re-enable by restoring commented Appearance section + picker sheet.
  // const [showThemePicker, setShowThemePicker] = useState(false);
  // const themeLabel = themeMode === 'dark' ? 'Dark' : themeMode === 'light' ? 'Light' : 'Auto';

  const accountNeedsAttention = !!user && !isEmailVerified;

  // Safe URL open — simulator / devices without a mail app throw otherwise.
  const openURL = (url: string) => {
    Linking.openURL(url).catch(() => {
      FeedbackService.showError(
        'Unavailable',
        'No app configured to open this link.'
      );
    });
  };
  const accountSubtitle = user
    ? (isEmailVerified
        ? (user.email ?? 'Manage sign-in & profile')
        : 'Email not verified. Tap to review')
    : 'Sign in to sync across devices';

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="px-6 pt-4 pb-6 flex-col gap-6">
          {/* App Identity */}
          <View className="items-center py-4">
            <Image
              source={
                isDarkMode
                  ? require('@/assets/images/PC-Logo-Gold.png')
                  : require('@/assets/images/PC-Logo-Dark-Gradient.png')
              }
              className="w-[160px] h-[40px] mb-2"
              resizeMode="contain"
            />
          </View>

          {/* Section hubs */}
          <View className="flex-col gap-3">
            <ScreenTitle variant="group" title="Settings" />
            <SettingsCard
              tone={accountNeedsAttention ? 'gold' : 'default'}
              title="Account"
              description={accountSubtitle}
              iconName={accountNeedsAttention ? 'alert-circle-outline' : 'person-circle-outline'}
              onPress={() => router.push('/settings-account' as any)}
              showCaret
            />
            <SettingsCard
              title="Calculations"
              description="Pour cost, pour size, defaults"
              iconName="calculator-outline"
              onPress={() => router.push('/settings-calculations' as any)}
              showCaret
            />
            <SettingsCard
              title="Manage Wells"
              description="Pick or update your standard house-pour brands"
              iconName="beer-outline"
              onPress={() => router.push('/wells-setup' as any)}
              showCaret
            />
          </View>

          <SectionDivider />

          {/* Appearance — hidden for MVP (dark-only). Re-enable by uncommenting. */}
          {/*
          <View className="flex-col gap-3">
            <ScreenTitle variant="group" title="Appearance" />
            <SettingsCard
              title="Theme"
              description={themeLabel}
              iconName={themeMode === 'dark' ? 'moon-outline' : themeMode === 'light' ? 'sunny-outline' : 'phone-portrait-outline'}
              iconColor={colors.text}
              onPress={() => setShowThemePicker(true)}
              showCaret
            />
          </View>

          <SectionDivider />
          */}

          {/* Support */}
          <View className="flex-col gap-3">
            <ScreenTitle variant="group" title="Support" />
            <SettingsCard
              title="Help & Feedback"
              description="Email us with bugs, questions, or feature ideas"
              iconName="chatbubble-ellipses-outline"
              onPress={() => openURL('mailto:support@pourcost.com')}
              showCaret
            />
            <SettingsCard
              title="Terms of Service"
              description="Read our terms of service"
              iconName="document-text-outline"
              onPress={() => openURL('https://www.pourcost.app/terms')}
              showCaret
            />
            <SettingsCard
              title="Privacy Policy"
              description="Read our privacy policy"
              iconName="shield-checkmark-outline"
              onPress={() => openURL('https://www.pourcost.app/privacy')}
              showCaret
            />
            <SettingsCard
              title="Version"
              description="2.0.0"
              iconName="information-circle-outline"
            />
          </View>

          <View className="h-8" />
        </View>
      </ScrollView>

      {/* MVP: theme picker hidden.
      {showThemePicker && (
        <PickerSheet
          title="Theme"
          options={[
            { value: 'dark' as ThemeMode, label: 'Dark' },
            { value: 'light' as ThemeMode, label: 'Light' },
            { value: 'auto' as ThemeMode, label: 'Auto (System)' },
          ]}
          value={themeMode}
          onSelect={(val) => { setThemeMode(val as ThemeMode); saveProfile(); }}
          onClose={() => setShowThemePicker(false)}
        />
      )}
      */}
    </GradientBackground>
  );
}
