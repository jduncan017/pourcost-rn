import { useState } from 'react';
import { View, Image, ScrollView, Linking } from 'react-native';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { useTheme, useThemeColors } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/contexts/AuthContext';
import SettingsCard from '@/src/components/ui/SettingsCard';
import GradientBackground from '@/src/components/ui/GradientBackground';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import SectionDivider from '@/src/components/ui/SectionDivider';
import PickerSheet from '@/src/components/ui/PickerSheet';
import { FeedbackService } from '@/src/services/feedback-service';
import { useAppStore, DefaultLandingScreen } from '@/src/stores/app-store';

const LANDING_SCREEN_OPTIONS: { value: DefaultLandingScreen; label: string }[] = [
  { value: 'cocktails', label: 'Cocktails' },
  { value: 'ingredients', label: 'Bar Inventory' },
  { value: 'calculator', label: 'Quick Calculator' },
];

export default function SettingsScreen() {
  const router = useGuardedRouter();
  const { isDarkMode } = useTheme();
  const colors = useThemeColors();
  const { user, isEmailVerified } = useAuth();
  const defaultLandingScreen = useAppStore((s) => s.defaultLandingScreen);
  const setDefaultLandingScreen = useAppStore((s) => s.setDefaultLandingScreen);
  const saveProfile = useAppStore((s) => s.saveProfile);
  const [showLandingPicker, setShowLandingPicker] = useState(false);

  const landingLabel = LANDING_SCREEN_OPTIONS.find((o) => o.value === defaultLandingScreen)?.label ?? 'Cocktails';

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

          {/* Email verification banner — sits ABOVE the section hubs so it's
              the first thing the user sees when something needs attention.
              Account card stays neutral so we don't double-emphasize. */}
          {accountNeedsAttention && (
            <SettingsCard
              tone="gold"
              title="Verify Your Email"
              description="Tap to confirm your email so your bar syncs across devices"
              iconName="alert-circle-outline"
              onPress={() => router.push('/settings-account' as any)}
              showCaret
            />
          )}

          {/* Section hubs */}
          <View className="flex-col gap-3">
            <ScreenTitle variant="group" title="Settings" />
            <SettingsCard
              title="Account"
              description={accountSubtitle}
              iconName="person-circle-outline"
              onPress={() => router.push('/settings-account' as any)}
              showCaret
            />
            <SettingsCard
              title="Calculations"
              description="Pour cost targets, defaults, floors"
              iconName="calculator-outline"
              onPress={() => router.push('/settings-calculations' as any)}
              showCaret
            />
            <SettingsCard
              title="Manage Wells"
              description="Pick or update your standard house-pour brands"
              iconName="bottle-wine-outline"
              iconFamily="mci"
              onPress={() => router.push('/wells-setup' as any)}
              showCaret
            />
            <SettingsCard
              title="Default Screen"
              description={landingLabel}
              iconName="phone-portrait-outline"
              onPress={() => setShowLandingPicker(true)}
              showCaret
            />
            {/* CSV import — hidden until Gemini-driven normalization pipeline ships.
                Current raw-CSV path produces messy names, duplicates, and missing
                subcategories. Re-enable by uncommenting once the cleanup pass is live.
            <SettingsCard
              title="Import Ingredients"
              description="Upload a CSV to bulk-add your inventory"
              iconName="document-attach-outline"
              onPress={() => router.push('/ingredient-import' as any)}
              showCaret
            />
            */}
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

      {showLandingPicker && (
        <PickerSheet
          title="Default Screen"
          subtitle="Where you land after opening the app. Pick whichever you use most."
          options={LANDING_SCREEN_OPTIONS}
          value={defaultLandingScreen}
          onSelect={(val) => { setDefaultLandingScreen(val as DefaultLandingScreen); saveProfile(); }}
          onClose={() => setShowLandingPicker(false)}
        />
      )}

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
