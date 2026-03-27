import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput as RNTextInput, ScrollView, Pressable, Image, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore, ThemeMode, IngredientOrderPref } from '@/src/stores/app-store';
import { useTheme, useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import SettingsCard from '@/src/components/ui/SettingsCard';
import GradientBackground from '@/src/components/ui/GradientBackground';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import SectionDivider from '@/src/components/ui/SectionDivider';
import { US_POUR_SIZES } from '@/src/constants/appConstants';
import { volumeLabel, Volume } from '@/src/types/models';

// Pour size options: common bartending pours (0.5oz - 3oz fractional only)
const POUR_SIZE_OPTIONS = US_POUR_SIZES.filter((v) => {
  if (v.kind !== 'fractionalOunces') return false;
  const oz = v.numerator / v.denominator;
  return oz >= 0.5 && oz <= 3;
});

const pourSizeDropdownOptions = POUR_SIZE_OPTIONS.map((v) => ({
  value: JSON.stringify(v),
  label: volumeLabel(v),
}));

// Pour cost goal options (10% - 50% in 1% steps)
const pourCostDropdownOptions = Array.from({ length: 41 }, (_, i) => {
  const val = 10 + i;
  return { value: val, label: `${val}%` };
});

// Ingredient order options
const orderDropdownOptions: { value: IngredientOrderPref; label: string }[] = [
  { value: 'most-to-least', label: 'Most → Least' },
  { value: 'least-to-most', label: 'Least → Most' },
  { value: 'cost-high-low', label: 'Cost High → Low' },
];


export default function SettingsScreen() {
  const {
    pourCostGoal,
    setPourCostGoal,
    defaultPourSize,
    setDefaultPourSize,
    defaultRetailPrice,
    setDefaultRetailPrice,
    ingredientOrderPref,
    setIngredientOrderPref,
    displayName,
    setDisplayName,
    saveProfile,
  } = useAppStore();

  const router = useRouter();
  const { isDarkMode, themeMode, setThemeMode } = useTheme();
  const colors = useThemeColors();
  const { user, signOut } = useAuth();

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => { saveProfile(); }, 1500);
  }, [saveProfile]);

  // Save on unmount to prevent lost edits from debounce
  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
        saveProfile();
      }
    };
  }, []);

  // Current display values
  const currentPourSizeLabel = volumeLabel(defaultPourSize);
  const currentOrderLabel = orderDropdownOptions.find((o) => o.value === ingredientOrderPref)?.label ?? 'Manual';
  const themeLabel = themeMode === 'dark' ? 'Dark' : themeMode === 'light' ? 'Light' : 'Auto';

  // Dropdown states
  const [showPourCostPicker, setShowPourCostPicker] = useState(false);
  const [showPourSizePicker, setShowPourSizePicker] = useState(false);
  const [showRetailPricePicker, setShowRetailPricePicker] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showNameEditor, setShowNameEditor] = useState(false);
  const [nameText, setNameText] = useState(displayName || user?.user_metadata?.full_name || '');

  // Retail price options
  const retailPriceOptions = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 25, 30].map((v) => ({
    value: v,
    label: `$${v.toFixed(2)}`,
  }));

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

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
            <Text className="text-g3 dark:text-g2 text-sm">
              Professional cocktail costing
            </Text>
          </View>

          {/* Divider */}
          <SectionDivider />

          {/* Calculations */}
          <View className="flex-col gap-3">
            <ScreenTitle variant="group" title="Calculations" />
            <SettingsCard
              title="Pour Cost Goal"
              description={`${pourCostGoal}%`}
              iconName="analytics-outline"
              iconColor={colors.text}
              onPress={() => setShowPourCostPicker(true)}
              showCaret
            />
            <SettingsCard
              title="Default Pour Size"
              description={currentPourSizeLabel}
              iconName="water-outline"
              iconColor={colors.text}
              onPress={() => setShowPourSizePicker(true)}
              showCaret
            />
            <SettingsCard
              title="Default Retail Price"
              description={`$${defaultRetailPrice.toFixed(2)}`}
              iconName="pricetag-outline"
              iconColor={colors.text}
              onPress={() => setShowRetailPricePicker(true)}
              showCaret
            />
            <SettingsCard
              title="Ingredient Order"
              description={currentOrderLabel}
              iconName="swap-vertical-outline"
              iconColor={colors.text}
              onPress={() => setShowOrderPicker(true)}
              showCaret
            />
            <SettingsCard
              title="Container Sizes"
              description="Choose visible bottle & keg sizes"
              iconName="resize-outline"
              iconColor={colors.text}
              onPress={() => router.push('/container-sizes' as any)}
              showCaret
            />
          </View>

          {/* Divider */}
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

          {/* Divider */}
          <SectionDivider />

          {/* Account */}
          <View className="flex-col gap-3">
            <ScreenTitle variant="group" title="Account" />
            {user ? (
              <>
                <SettingsCard
                  title="Your Name"
                  description={displayName || user?.user_metadata?.full_name || 'Not set'}
                  iconName="person-outline"
                  onPress={() => setShowNameEditor(true)}
                  showCaret
                />
                <SettingsCard
                  title="Sign Out"
                  description={user.email ?? 'Signed in'}
                  iconName="log-out-outline"
                  iconColor={colors.colors.R3}
                  onPress={handleSignOut}
                />
              </>
            ) : (
              <SettingsCard
                title="Sign In"
                description="Sync your data across devices"
                iconName="person-outline"
                iconColor={colors.text}
                onPress={() => {}}
              />
            )}
          </View>

          {/* Divider */}
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
              title="Terms & Privacy"
              description="Read our terms and privacy policy"
              iconName="document-text-outline"
              onPress={() => {}}
              showCaret
            />
            <SettingsCard
              title="Version"
              description="2.0.0"
              iconName="information-circle-outline"
            />
          </View>

          {/* Spacer */}
          <View className="h-8" />
        </View>
      </ScrollView>

      {/* Pour Cost Goal Picker */}
      {showPourCostPicker && (
        <PickerSheet
          title="Pour Cost Goal"
          options={pourCostDropdownOptions}
          value={pourCostGoal}
          onSelect={(val) => { setPourCostGoal(val); debouncedSave(); }}
          onClose={() => setShowPourCostPicker(false)}
        />
      )}

      {/* Pour Size Picker */}
      {showPourSizePicker && (
        <PickerSheet
          title="Default Pour Size"
          options={pourSizeDropdownOptions}
          value={JSON.stringify(defaultPourSize)}
          onSelect={(val) => { try { setDefaultPourSize(JSON.parse(val) as Volume); debouncedSave(); } catch {} }}
          onClose={() => setShowPourSizePicker(false)}
        />
      )}

      {/* Retail Price Picker */}
      {showRetailPricePicker && (
        <PickerSheet
          title="Default Retail Price"
          options={retailPriceOptions}
          value={defaultRetailPrice}
          onSelect={(val) => { setDefaultRetailPrice(val); debouncedSave(); }}
          onClose={() => setShowRetailPricePicker(false)}
        />
      )}

      {/* Order Picker */}
      {showOrderPicker && (
        <PickerSheet
          title="Ingredient Order"
          options={orderDropdownOptions}
          value={ingredientOrderPref}
          onSelect={(val) => { setIngredientOrderPref(val as IngredientOrderPref); debouncedSave(); }}
          onClose={() => setShowOrderPicker(false)}
        />
      )}

      {/* Theme Picker */}
      {showThemePicker && (
        <PickerSheet
          title="Theme"
          options={[
            { value: 'dark' as ThemeMode, label: 'Dark' },
            { value: 'light' as ThemeMode, label: 'Light' },
            { value: 'auto' as ThemeMode, label: 'Auto (System)' },
          ]}
          value={themeMode}
          onSelect={(val) => { setThemeMode(val as ThemeMode); debouncedSave(); }}
          onClose={() => setShowThemePicker(false)}
        />
      )}

      {/* Name Editor */}
      <BottomSheet
        visible={showNameEditor}
        onClose={() => setShowNameEditor(false)}
        title="Your Name"
      >
        <View className="px-4 pb-6 flex-col gap-4">
          <RNTextInput
            value={nameText}
            onChangeText={setNameText}
            placeholder="Enter your name"
            placeholderTextColor={colors.textMuted}
            autoFocus
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
    </GradientBackground>
  );
}

import BottomSheet from '@/src/components/ui/BottomSheet';
import PickerSheet from '@/src/components/ui/PickerSheet';
