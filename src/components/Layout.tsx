import React from 'react';
import { View, ScrollView, SafeAreaView, Platform } from 'react-native';

interface LayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padding?: boolean;
  backgroundColor?: string;
}

export default function Layout({
  children,
  scrollable = true,
  padding = true,
  backgroundColor = 'bg-gray-50',
}: LayoutProps) {
  const Container = scrollable ? ScrollView : View;
  const containerProps = scrollable 
    ? { className: `flex-1 ${backgroundColor}`, showsVerticalScrollIndicator: false }
    : { className: `flex-1 ${backgroundColor}` };

  const content = (
    <Container {...containerProps}>
      <View className={padding ? 'p-4' : ''}>
        {children}
      </View>
    </Container>
  );

  // Use SafeAreaView for mobile, regular View for web
  if (Platform.OS === 'web') {
    return content;
  }

  return (
    <SafeAreaView className="flex-1">
      {content}
    </SafeAreaView>
  );
}