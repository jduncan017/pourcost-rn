import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { useAppStore } from '@/src/stores/app-store';
import { useTheme, useThemeColors } from '@/src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import CustomSlider from '@/src/components/ui/CustomSlider';
import Modal from '@/src/components/ui/Modal';
import Card from '@/src/components/ui/Card';
import GradientBackground from '@/src/components/ui/GradientBackground';
import SettingsCard from '@/src/components/ui/SettingsCard';

/**
 * Settings screen
 * Manages app preferences, currency, measurements, account settings, and business logic
 */
export default function SettingsScreen() {
  const { measurementSystem, setMeasurementSystem, baseCurrency } =
    useAppStore();
  const { isDarkMode, toggleTheme } = useTheme();
  const colors = useThemeColors();

  // Local state for various settings
  const [globalPourCostGoal, setGlobalPourCostGoal] = useState(20); // Default 20%
  const [notifications, setNotifications] = useState(true);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(baseCurrency);

  // Currency options
  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  ];

  const toggleMeasurementSystem = () => {
    setMeasurementSystem(measurementSystem === 'US' ? 'Metric' : 'US');
  };

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    // In real app, would update the store
    Alert.alert('Currency Updated', `Base currency changed to ${currency}`);
    setShowCurrencyModal(false);
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Would export all ingredients and cocktails to JSON file'
    );
  };

  const handleImportData = () => {
    Alert.alert('Import Data', 'Would open file picker to import data');
  };

  const handleBackupData = () => {
    Alert.alert('Backup Data', 'Would backup data to cloud storage');
  };

  const handleRestoreData = () => {
    Alert.alert('Restore Data', 'Would restore data from cloud backup');
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset App Data',
      'This will delete all ingredients, cocktails, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Reset Complete', 'App data has been reset'),
        },
      ]
    );
  };

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-g4 dark:text-n1 mb-2">
              Settings
            </Text>
            <Text className="text-g3 dark:text-n1">
              Customize your PourCost experience
            </Text>
          </View>

          {/* Measurement System */}
          <Card className="mb-4">
            <Text className="text-lg font-semibold text-g4 dark:text-n1 mb-3">
              Measurement System
            </Text>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-medium text-g4 dark:text-n1">
                  Current: {measurementSystem}
                </Text>
                <Text className="text-sm text-g3 dark:text-n1">
                  {measurementSystem === 'US'
                    ? 'Fluid ounces, cups, etc.'
                    : 'Milliliters, liters, etc.'}
                </Text>
              </View>
              <Pressable
                onPress={toggleMeasurementSystem}
                className="bg-p2 px-4 py-2 rounded-lg active:bg-p3"
              >
                <Text className="text-white font-medium">
                  Switch to {measurementSystem === 'US' ? 'Metric' : 'US'}
                </Text>
              </Pressable>
            </View>
          </Card>

          {/* Business Settings */}
          <Card className="mb-4">
            <Text className="text-lg font-semibold text-g4 dark:text-n1 mb-4">
              Business Settings
            </Text>

            <View>
              <CustomSlider
                label="Global Pour Cost Goal"
                minValue={10}
                maxValue={40}
                value={globalPourCostGoal}
                onValueChange={setGlobalPourCostGoal}
                unit="%"
                step={0.5}
              />
              <Text className="text-xs text-g3 dark:text-n1 mt-2">
                Target pour cost percentage for suggested retail pricing
              </Text>
            </View>
          </Card>

          {/* Currency */}
          <Card className="mb-4">
            <Text className="text-lg font-semibold text-g4 dark:text-n1 mb-3">
              Currency
            </Text>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-medium text-g4 dark:text-n1">
                  Base Currency: {selectedCurrency}
                </Text>
                <Text className="text-sm text-g3 dark:text-n1">
                  All prices will be displayed in this currency
                </Text>
              </View>
              <Pressable
                onPress={() => setShowCurrencyModal(true)}
                className="bg-p1 px-4 py-2 rounded-lg active:bg-p2 flex-row items-center gap-2"
              >
                <Ionicons name="globe" size={16} color="white" />
                <Text className="text-white font-medium">Change</Text>
              </Pressable>
            </View>
          </Card>

          {/* App Preferences */}
          <Card className="mb-4">
            <Text className="text-lg font-semibold text-g4 dark:text-n1 mb-4">
              App Preferences
            </Text>

            <View className="PreferencesContainer gap-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-medium text-g4 dark:text-n1">
                    Push Notifications
                  </Text>
                  <Text className="text-sm text-g3 dark:text-n1">
                    Receive updates and reminders
                  </Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                  thumbColor={notifications ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-medium text-g4 dark:text-n1">
                    Dark Mode
                  </Text>
                  <Text className="text-sm text-g3 dark:text-n1">
                    Use dark theme throughout the app
                  </Text>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                  thumbColor={isDarkMode ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
            </View>
          </Card>

          {/* Data Management */}
          <Card className="mb-4">
            <Text className="text-lg font-semibold text-g4 dark:text-n1 mb-4">
              Data Management
            </Text>

            <View className="flex flex-col gap-3">
              <SettingsCard
                title="Export Data"
                description="Save your ingredients and cocktails to file"
                iconName="download"
                iconColor="#3B82F6"
                onPress={handleExportData}
              />

              <SettingsCard
                title="Import Data"
                description="Load data from backup file"
                iconName="cloud-upload"
                iconColor="#10B981"
                onPress={handleImportData}
              />

              <SettingsCard
                title="Cloud Backup"
                description="Backup data to cloud storage"
                iconName="cloud"
                iconColor="#8B5CF6"
                onPress={handleBackupData}
              />

              <SettingsCard
                title="Restore from Cloud"
                description="Restore data from cloud backup"
                iconName="refresh"
                iconColor="#F59E0B"
                onPress={handleRestoreData}
              />
            </View>
          </Card>


          {/* Danger Zone */}
          <Card className="mb-4">
            <Text className="text-lg font-semibold text-e1 mb-3">
              Danger Zone
            </Text>
            <SettingsCard
              title="Reset App Data"
              description="Delete all ingredients, cocktails, and settings"
              iconName="warning"
              iconColor="#DC2626"
              onPress={handleResetApp}
              variant="danger"
            />
          </Card>


          {/* Currency Selection Modal */}
          <Modal
            visible={showCurrencyModal}
            onClose={() => setShowCurrencyModal(false)}
            title="Select Currency"
            size="medium"
          >
            <View className="flex flex-col gap-3">
              {currencies.map((currency) => (
                <Pressable
                  key={currency.code}
                  onPress={() => handleCurrencyChange(currency.code)}
                  className="CurrencyOption p-4 rounded-xl border"
                  style={{
                    backgroundColor: selectedCurrency === currency.code 
                      ? colors.accent + '20' 
                      : colors.surface,
                    borderColor: selectedCurrency === currency.code 
                      ? colors.accent 
                      : colors.border,
                  }}
                >
                  <View className="CurrencyContent flex-row items-center justify-between">
                    <View className="CurrencyInfo flex-row items-center gap-4">
                      <View 
                        className="CurrencySymbolBadge w-12 h-12 rounded-full items-center justify-center"
                        style={{ backgroundColor: colors.accent + '20' }}
                      >
                        <Text className="CurrencySymbol text-xl font-semibold text-p1 dark:text-s11">
                          {currency.symbol}
                        </Text>
                      </View>
                      <View className="CurrencyDetails">
                        <Text className="CurrencyName font-semibold text-base text-g4 dark:text-n1">
                          {currency.name}
                        </Text>
                        <Text className="CurrencyCode text-sm text-g3 dark:text-n1">
                          {currency.code}
                        </Text>
                      </View>
                    </View>
                    {selectedCurrency === currency.code && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={colors.accent}
                      />
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </Modal>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
