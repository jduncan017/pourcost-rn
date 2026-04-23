import { useState, useEffect, useCallback } from 'react';
import { View, Image, ScrollView, Linking, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAppStore, ThemeMode } from '@/src/stores/app-store';
import { useTheme, useThemeColors } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import SettingsCard from '@/src/components/ui/SettingsCard';
import GradientBackground from '@/src/components/ui/GradientBackground';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import SectionDivider from '@/src/components/ui/SectionDivider';
import PickerSheet from '@/src/components/ui/PickerSheet';
import { clearSampleData, hasSampleData } from '@/src/lib/seed-sample-bar';
import { FeedbackService } from '@/src/services/feedback-service';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDarkMode, themeMode, setThemeMode } = useTheme();
  const colors = useThemeColors();
  const { user, isEmailVerified } = useAuth();
  const { saveProfile } = useAppStore();

  const [showThemePicker, setShowThemePicker] = useState(false);
  const [sampleDataPresent, setSampleDataPresent] = useState(false);
  const [clearingSample, setClearingSample] = useState(false);
  const themeLabel = themeMode === 'dark' ? 'Dark' : themeMode === 'light' ? 'Light' : 'Auto';

  // Re-check sample-data status on mount + each time the screen regains focus.
  // Once cleared, `hasSampleData` returns false and the card disappears permanently.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      hasSampleData()
        .then((has) => { if (!cancelled) setSampleDataPresent(has); })
        .catch(() => {});
      return () => { cancelled = true; };
    }, [])
  );

  const handleClearSample = () => {
    Alert.alert(
      'Clear Sample Bar?',
      'Removes the 14 sample ingredients and 5 classic cocktails. Your own additions stay. This option will disappear after you clear.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setClearingSample(true);
            try {
              await clearSampleData();
              await Promise.all([
                useIngredientsStore.getState().loadIngredients(true),
                useCocktailsStore.getState().loadCocktails(true),
              ]);
              setSampleDataPresent(false);
              FeedbackService.showSuccess('Sample Bar Cleared', 'Your bar is now yours alone.');
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Could not clear sample data';
              FeedbackService.showError('Clear Failed', msg);
            } finally {
              setClearingSample(false);
            }
          },
        },
      ]
    );
  };

  const accountSubtitle = user
    ? (isEmailVerified
        ? (user.email ?? 'Manage sign-in & profile')
        : 'Email not verified — tap to review')
    : 'Sign in to sync across devices';

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="p-4 pt-6 flex-col gap-6">
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

          <SectionDivider />

          {/* Sample Data — only shown while the starter bar is still loaded.
              Disappears permanently once the user clears it. */}
          {sampleDataPresent && (
            <>
              <View className="flex-col gap-3">
                <ScreenTitle variant="group" title="Getting Started" />
                <SettingsCard
                  tone="gold"
                  title={clearingSample ? 'Clearing…' : 'Clear Sample Bar'}
                  description="Remove the starter ingredients and cocktails we pre-loaded"
                  iconName="sparkles-outline"
                  onPress={handleClearSample}
                  disabled={clearingSample}
                />
              </View>
              <SectionDivider />
            </>
          )}

          {/* Section hubs */}
          <View className="flex-col gap-3">
            <ScreenTitle variant="group" title="Settings" />
            <SettingsCard
              tone="gold"
              title="Account"
              description={accountSubtitle}
              iconName={user && !isEmailVerified ? 'alert-circle-outline' : 'person-circle-outline'}
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
          </View>

          <SectionDivider />

          {/* Appearance */}
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

          {/* Support */}
          <View className="flex-col gap-3">
            <ScreenTitle variant="group" title="Support" />
            <SettingsCard
              title="Help & Support"
              description="Get help using PourCost"
              iconName="help-circle-outline"
              onPress={() => Linking.openURL('mailto:support@pourcost.com')}
              showCaret
            />
            <SettingsCard
              title="Suggest a Feature"
              description="Tell us what you'd like to see"
              iconName="bulb-outline"
              onPress={() => Linking.openURL('mailto:feedback@pourcost.com?subject=Feature%20Suggestion')}
              showCaret
            />
            <SettingsCard
              title="Terms of Service"
              description="Read our terms of service"
              iconName="document-text-outline"
              onPress={() => Linking.openURL('https://www.pourcost.app/terms')}
              showCaret
            />
            <SettingsCard
              title="Privacy Policy"
              description="Read our privacy policy"
              iconName="shield-checkmark-outline"
              onPress={() => Linking.openURL('https://www.pourcost.app/privacy')}
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
    </GradientBackground>
  );
}
