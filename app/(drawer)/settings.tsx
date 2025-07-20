import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { useAppStore } from '@/src/stores/app-store';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import CustomSlider from '@/src/components/ui/CustomSlider';
import Modal from '@/src/components/ui/Modal';
import Card from '@/src/components/ui/Card';

/**
 * Settings screen
 * Manages app preferences, currency, measurements, account settings, and business logic
 */
export default function SettingsScreen() {
  const { measurementSystem, setMeasurementSystem, baseCurrency } = useAppStore();
  const { isDarkMode, toggleTheme } = useTheme();
  
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
    Alert.alert('Export Data', 'Would export all ingredients and cocktails to JSON file');
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
          onPress: () => Alert.alert('Reset Complete', 'App data has been reset')
        }
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-n1">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-g4 mb-2">
            Settings
          </Text>
          <Text className="text-g3">
            Customize your PourCost experience
          </Text>
        </View>

        {/* Measurement System */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-g4 mb-3">
            Measurement System
          </Text>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-medium text-g4">
                Current: {measurementSystem}
              </Text>
              <Text className="text-sm text-g3">
                {measurementSystem === 'US' ? 'Fluid ounces, cups, etc.' : 'Milliliters, liters, etc.'}
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
          <Text className="text-lg font-semibold text-g4 mb-4">
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
            <Text className="text-xs text-g3 mt-2">
              Target pour cost percentage for suggested retail pricing
            </Text>
          </View>
        </Card>
        
        {/* Currency */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-g4 mb-3">
            Currency
          </Text>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-medium text-g4">
                Base Currency: {selectedCurrency}
              </Text>
              <Text className="text-sm text-g3">
                All prices will be displayed in this currency
              </Text>
            </View>
            <Pressable 
              onPress={() => setShowCurrencyModal(true)}
              className="bg-p1 px-4 py-2 rounded-lg active:bg-p2 flex-row items-center gap-2"
            >
              <Ionicons name="globe" size={16} color="white" />
              <Text className="text-white font-medium">
                Change
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* App Preferences */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-g4 mb-4">
            App Preferences
          </Text>
          
          <View style={{gap: 16}}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-medium text-g4">Push Notifications</Text>
                <Text className="text-sm text-g3">Receive updates and reminders</Text>
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
                <Text className="font-medium text-g4">Dark Mode</Text>
                <Text className="text-sm text-g3">Use dark theme throughout the app</Text>
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
          <Text className="text-lg font-semibold text-g4 mb-4">
            Data Management
          </Text>
          
          <View style={{gap: 12}}>
            <Pressable 
              onPress={handleExportData}
              className="bg-p1/20 p-4 rounded-lg active:bg-p1/30 flex-row items-center gap-3"
            >
              <Ionicons name="download" size={20} color="#3B82F6" />
              <View className="flex-1">
                <Text className="font-medium text-p4">Export Data</Text>
                <Text className="text-sm text-p3">Save your ingredients and cocktails to file</Text>
              </View>
            </Pressable>
            
            <Pressable 
              onPress={handleImportData}
              className="bg-s21/20 p-4 rounded-lg active:bg-s21/30 flex-row items-center gap-3"
            >
              <Ionicons name="cloud-upload" size={20} color="#10B981" />
              <View className="flex-1">
                <Text className="font-medium text-s24">Import Data</Text>
                <Text className="text-sm text-s23">Load data from backup file</Text>
              </View>
            </Pressable>
            
            <Pressable 
              onPress={handleBackupData}
              className="bg-s31/20 p-4 rounded-lg active:bg-s31/30 flex-row items-center gap-3"
            >
              <Ionicons name="cloud" size={20} color="#8B5CF6" />
              <View className="flex-1">
                <Text className="font-medium text-s34">Cloud Backup</Text>
                <Text className="text-sm text-s33">Backup data to cloud storage</Text>
              </View>
            </Pressable>
            
            <Pressable 
              onPress={handleRestoreData}
              className="bg-n3/40 p-4 rounded-lg active:bg-n3/60 flex-row items-center gap-3"
            >
              <Ionicons name="refresh" size={20} color="#F59E0B" />
              <View className="flex-1">
                <Text className="font-medium text-n4">Restore from Cloud</Text>
                <Text className="text-sm text-n4">Restore data from cloud backup</Text>
              </View>
            </Pressable>
          </View>
        </Card>
        
        {/* Account */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-g4 mb-3">
            Account
          </Text>
          <View style={{gap: 12}}>
            <Pressable className="bg-n1 p-4 rounded-lg active:bg-g1/60 flex-row items-center gap-3">
              <Ionicons name="person" size={20} color="#6B7280" />
              <View className="flex-1">
                <Text className="font-medium text-g4">Sign In / Sign Up</Text>
                <Text className="text-sm text-g3">Sync your data across devices</Text>
              </View>
            </Pressable>
            
            <Pressable className="bg-n1 p-4 rounded-lg active:bg-g1/60 flex-row items-center gap-3">
              <Ionicons name="shield-checkmark" size={20} color="#6B7280" />
              <View className="flex-1">
                <Text className="font-medium text-g4">Privacy & Security</Text>
                <Text className="text-sm text-g3">Manage your privacy settings</Text>
              </View>
            </Pressable>
          </View>
        </Card>

        {/* Danger Zone */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-e4 mb-3">
            Danger Zone
          </Text>
          <Pressable 
            onPress={handleResetApp}
            className="bg-e1/20 p-4 rounded-lg active:bg-e1/30 border border-e2/50 flex-row items-center gap-3"
          >
            <Ionicons name="warning" size={20} color="#DC2626" />
            <View className="flex-1">
              <Text className="font-medium text-e4">Reset App Data</Text>
              <Text className="text-sm text-e3">Delete all ingredients, cocktails, and settings</Text>
            </View>
          </Pressable>
        </Card>
        
        {/* About */}
        <Card>
          <Text className="text-lg font-semibold text-g4 mb-3">
            About
          </Text>
          <View style={{gap: 12}}>
            <View className="bg-n1 p-4 rounded-lg flex-row items-center gap-3">
              <Ionicons name="information-circle" size={20} color="#6B7280" />
              <View className="flex-1">
                <Text className="font-medium text-g4 mb-1">Version</Text>
                <Text className="text-sm text-g3">1.0.0 (React Native)</Text>
              </View>
            </View>
            
            <Pressable className="bg-n1 p-4 rounded-lg active:bg-g1/60 flex-row items-center gap-3">
              <Ionicons name="help-circle" size={20} color="#6B7280" />
              <View className="flex-1">
                <Text className="font-medium text-g4">Help & Support</Text>
                <Text className="text-sm text-g3">Get help using PourCost</Text>
              </View>
            </Pressable>
            
            <Pressable className="bg-n1 p-4 rounded-lg active:bg-g1/60 flex-row items-center gap-3">
              <Ionicons name="star" size={20} color="#6B7280" />
              <View className="flex-1">
                <Text className="font-medium text-g4">Rate PourCost</Text>
                <Text className="text-sm text-g3">Share your feedback on the App Store</Text>
              </View>
            </Pressable>
            
            <Pressable className="bg-n1 p-4 rounded-lg active:bg-g1/60 flex-row items-center gap-3">
              <Ionicons name="document-text" size={20} color="#6B7280" />
              <View className="flex-1">
                <Text className="font-medium text-g4">Terms & Privacy</Text>
                <Text className="text-sm text-g3">Read our terms of service and privacy policy</Text>
              </View>
            </Pressable>
          </View>
        </Card>
        
        {/* Currency Selection Modal */}
        <Modal
          visible={showCurrencyModal}
          onClose={() => setShowCurrencyModal(false)}
          title="Select Currency"
        >
          <View style={{gap: 8}}>
            {currencies.map((currency) => (
              <Pressable
                key={currency.code}
                onPress={() => handleCurrencyChange(currency.code)}
                className={`p-4 rounded-lg border ${
                  selectedCurrency === currency.code
                    ? 'bg-p1/20 border-p1'
                    : 'bg-n1 border-g2/40'
                } active:bg-n1/80`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">{currency.symbol}</Text>
                    <View>
                      <Text className="font-medium text-g4">{currency.name}</Text>
                      <Text className="text-sm text-g3">{currency.code}</Text>
                    </View>
                  </View>
                  {selectedCurrency === currency.code && (
                    <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}