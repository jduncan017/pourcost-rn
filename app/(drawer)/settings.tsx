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
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Settings
          </Text>
          <Text className="text-gray-600">
            Customize your PourCost experience
          </Text>
        </View>

        {/* Measurement System */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-3">
            Measurement System
          </Text>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-medium text-gray-800">
                Current: {measurementSystem}
              </Text>
              <Text className="text-sm text-gray-600">
                {measurementSystem === 'US' ? 'Fluid ounces, cups, etc.' : 'Milliliters, liters, etc.'}
              </Text>
            </View>
            <Pressable
              onPress={toggleMeasurementSystem}
              className="bg-primary-600 px-4 py-2 rounded-lg active:bg-primary-700"
            >
              <Text className="text-white font-medium">
                Switch to {measurementSystem === 'US' ? 'Metric' : 'US'}
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* Business Settings */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-4">
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
            <Text className="text-xs text-gray-500 mt-2">
              Target pour cost percentage for suggested retail pricing
            </Text>
          </View>
        </Card>
        
        {/* Currency */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-3">
            Currency
          </Text>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-medium text-gray-800">
                Base Currency: {selectedCurrency}
              </Text>
              <Text className="text-sm text-gray-600">
                All prices will be displayed in this currency
              </Text>
            </View>
            <Pressable 
              onPress={() => setShowCurrencyModal(true)}
              className="bg-primary-500 px-4 py-2 rounded-lg active:bg-primary-600 flex-row items-center gap-2"
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
          <Text className="text-lg font-semibold text-gray-700 mb-4">
            App Preferences
          </Text>
          
          <View style={{gap: 16}}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-medium text-gray-800">Push Notifications</Text>
                <Text className="text-sm text-gray-600">Receive updates and reminders</Text>
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
                <Text className="font-medium text-gray-800">Dark Mode</Text>
                <Text className="text-sm text-gray-600">Use dark theme throughout the app</Text>
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
          <Text className="text-lg font-semibold text-gray-700 mb-4">
            Data Management
          </Text>
          
          <View style={{gap: 12}}>
            <Pressable 
              onPress={handleExportData}
              className="bg-blue-50 p-4 rounded-lg active:bg-blue-100 flex-row items-center gap-3"
            >
              <Ionicons name="download" size={20} color="#3B82F6" />
              <View className="flex-1">
                <Text className="font-medium text-blue-800">Export Data</Text>
                <Text className="text-sm text-blue-600">Save your ingredients and cocktails to file</Text>
              </View>
            </Pressable>
            
            <Pressable 
              onPress={handleImportData}
              className="bg-green-50 p-4 rounded-lg active:bg-green-100 flex-row items-center gap-3"
            >
              <Ionicons name="cloud-upload" size={20} color="#10B981" />
              <View className="flex-1">
                <Text className="font-medium text-green-800">Import Data</Text>
                <Text className="text-sm text-green-600">Load data from backup file</Text>
              </View>
            </Pressable>
            
            <Pressable 
              onPress={handleBackupData}
              className="bg-purple-50 p-4 rounded-lg active:bg-purple-100 flex-row items-center gap-3"
            >
              <Ionicons name="cloud" size={20} color="#8B5CF6" />
              <View className="flex-1">
                <Text className="font-medium text-purple-800">Cloud Backup</Text>
                <Text className="text-sm text-purple-600">Backup data to cloud storage</Text>
              </View>
            </Pressable>
            
            <Pressable 
              onPress={handleRestoreData}
              className="bg-orange-50 p-4 rounded-lg active:bg-orange-100 flex-row items-center gap-3"
            >
              <Ionicons name="refresh" size={20} color="#F59E0B" />
              <View className="flex-1">
                <Text className="font-medium text-orange-800">Restore from Cloud</Text>
                <Text className="text-sm text-orange-600">Restore data from cloud backup</Text>
              </View>
            </Pressable>
          </View>
        </Card>
        
        {/* Account */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-3">
            Account
          </Text>
          <View style={{gap: 12}}>
            <Pressable className="bg-gray-50 p-4 rounded-lg active:bg-gray-100 flex-row items-center gap-3">
              <Ionicons name="person" size={20} color="#6B7280" />
              <View className="flex-1">
                <Text className="font-medium text-gray-800">Sign In / Sign Up</Text>
                <Text className="text-sm text-gray-600">Sync your data across devices</Text>
              </View>
            </Pressable>
            
            <Pressable className="bg-gray-50 p-4 rounded-lg active:bg-gray-100 flex-row items-center gap-3">
              <Ionicons name="shield-checkmark" size={20} color="#6B7280" />
              <View className="flex-1">
                <Text className="font-medium text-gray-800">Privacy & Security</Text>
                <Text className="text-sm text-gray-600">Manage your privacy settings</Text>
              </View>
            </Pressable>
          </View>
        </Card>

        {/* Danger Zone */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-red-700 mb-3">
            Danger Zone
          </Text>
          <Pressable 
            onPress={handleResetApp}
            className="bg-red-50 p-4 rounded-lg active:bg-red-100 border border-red-200 flex-row items-center gap-3"
          >
            <Ionicons name="warning" size={20} color="#DC2626" />
            <View className="flex-1">
              <Text className="font-medium text-red-800">Reset App Data</Text>
              <Text className="text-sm text-red-600">Delete all ingredients, cocktails, and settings</Text>
            </View>
          </Pressable>
        </Card>
        
        {/* About */}
        <Card>
          <Text className="text-lg font-semibold text-gray-700 mb-3">
            About
          </Text>
          <View style={{gap: 12}}>
            <View className="bg-gray-50 p-4 rounded-lg flex-row items-center gap-3">
              <Ionicons name="information-circle" size={20} color="#6B7280" />
              <View className="flex-1">
                <Text className="font-medium text-gray-800 mb-1">Version</Text>
                <Text className="text-sm text-gray-600">1.0.0 (React Native)</Text>
              </View>
            </View>
            
            <Pressable className="bg-gray-50 p-4 rounded-lg active:bg-gray-100 flex-row items-center gap-3">
              <Ionicons name="help-circle" size={20} color="#6B7280" />
              <View className="flex-1">
                <Text className="font-medium text-gray-800">Help & Support</Text>
                <Text className="text-sm text-gray-600">Get help using PourCost</Text>
              </View>
            </Pressable>
            
            <Pressable className="bg-gray-50 p-4 rounded-lg active:bg-gray-100 flex-row items-center gap-3">
              <Ionicons name="star" size={20} color="#6B7280" />
              <View className="flex-1">
                <Text className="font-medium text-gray-800">Rate PourCost</Text>
                <Text className="text-sm text-gray-600">Share your feedback on the App Store</Text>
              </View>
            </Pressable>
            
            <Pressable className="bg-gray-50 p-4 rounded-lg active:bg-gray-100 flex-row items-center gap-3">
              <Ionicons name="document-text" size={20} color="#6B7280" />
              <View className="flex-1">
                <Text className="font-medium text-gray-800">Terms & Privacy</Text>
                <Text className="text-sm text-gray-600">Read our terms of service and privacy policy</Text>
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
                    ? 'bg-primary-50 border-primary-500'
                    : 'bg-white border-gray-200'
                } active:bg-gray-50`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">{currency.symbol}</Text>
                    <View>
                      <Text className="font-medium text-gray-800">{currency.name}</Text>
                      <Text className="text-sm text-gray-600">{currency.code}</Text>
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