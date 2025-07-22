import React from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import GradientBackground from '@/src/components/ui/GradientBackground';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import InfoCard from '@/src/components/ui/InfoCard';
import SettingsCard from '@/src/components/ui/SettingsCard';

/**
 * About screen
 * Information about PourCost, help, and support
 */
export default function AboutScreen() {
  const handleHelpSupport = () => {
    Alert.alert('Help & Support', 'Help system would be implemented here');
  };

  const handleRateApp = () => {
    Alert.alert('Rate PourCost', 'App Store rating would be opened here');
  };

  const handleTermsPrivacy = () => {
    Alert.alert('Terms & Privacy', 'Terms and privacy policy would be displayed here');
  };

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Header */}
          <View className="mb-6">
            <ScreenTitle
              title="About PourCost"
              variant="main"
              className="mb-2"
            />
            <Text
              className="text-g3 dark:text-n1"
              style={{ fontFamily: 'Geist' }}
            >
              Your professional cocktail cost calculator
            </Text>
          </View>

          {/* App Info */}
          <InfoCard
            icon={require('@/assets/images/PC-Icon-Gold.png')}
            title="PourCost"
            subtitle="Version 2.0.0"
            description="PourCost helps bartenders, bar owners, and cocktail enthusiasts calculate accurate drink costs and set profitable pricing. Built with precision and ease of use in mind."
            centered={true}
            className="mb-6"
          />

          {/* Features */}
          <InfoCard
            title="Features"
            features={[
              'Calculate cost per pour for any ingredient',
              'Create and save complex cocktail recipes',
              'Set profit margins and suggested pricing',
              'Support for US and Metric measurements',
              'Multi-currency support',
              'Cloud sync across devices'
            ]}
            className="mb-6"
          />

          {/* Getting Started */}
          <InfoCard
            title="Getting Started"
            steps={[
              {
                title: '1. Add Your Ingredients',
                description: 'Start by adding the ingredients you use most often'
              },
              {
                title: '2. Calculate Costs',
                description: 'Use the calculator to determine cost per pour'
              },
              {
                title: '3. Create Cocktails',
                description: 'Combine ingredients to create profitable cocktail recipes'
              }
            ]}
            className="mb-6"
          />

          {/* Support */}
          <InfoCard
            title="Support"
            description="Need help? Have suggestions? We'd love to hear from you! Contact us for support and feedback."
            className="mb-6"
          />

          {/* App Info & Actions */}
          <InfoCard title="App Information & Actions" className="mb-6">
            <View className="flex flex-col gap-3">
              <SettingsCard
                title="Version"
                description="2.0.0 (React Native)"
                iconName="information-circle"
                iconColor="#6B7280"
              />
              
              <SettingsCard
                title="Help & Support"
                description="Get help using PourCost"
                iconName="help-circle"
                iconColor="#6B7280"
                onPress={handleHelpSupport}
              />
              
              <SettingsCard
                title="Rate PourCost"
                description="Share your feedback on the App Store"
                iconName="star"
                iconColor="#6B7280"
                onPress={handleRateApp}
              />
              
              <SettingsCard
                title="Terms & Privacy"
                description="Read our terms of service and privacy policy"
                iconName="document-text"
                iconColor="#6B7280"
                onPress={handleTermsPrivacy}
              />
            </View>
          </InfoCard>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
