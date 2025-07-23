import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SettingsCardProps {
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress?: () => void;
  variant?: 'default' | 'danger' | 'accent';
  disabled?: boolean;
  className?: string;
}

/**
 * Reusable settings card component for interactive buttons
 * Used for things like Sign In, Export Data, Reset App, etc.
 */
export default function SettingsCard({
  title,
  description,
  iconName,
  iconColor = '#6B7280',
  onPress,
  variant = 'default',
  disabled = false,
  className = '',
}: SettingsCardProps) {
  const getCardStyle = () => {
    if (variant === 'danger') {
      return 'bg-e1/40 dark:bg-e2/40 border border-e1/50 dark:border-e3/40';
    }
    if (variant === 'accent') {
      return 'bg-s11/20 dark:bg-s12/20 border border-s11/40 dark:border-s12/40';
    }
    return 'bg-n1/90 dark:bg-p3/80 border border-g2/30 dark:border-p2/50';
  };

  const getTextStyle = () => {
    if (variant === 'danger') {
      return 'text-e3 dark:text-n1';
    }
    if (variant === 'accent') {
      return 'text-g4 dark:text-n1';
    }
    return 'text-g4 dark:text-n1';
  };

  const getDescriptionStyle = () => {
    if (variant === 'danger') {
      return 'text-e3 dark:text-n1';
    }
    if (variant === 'accent') {
      return 'text-g3 dark:text-n1';
    }
    return 'text-g3 dark:text-n1';
  };

  if (!onPress) {
    // Non-interactive card (like version info)
    return (
      <View className={`p-4 rounded-lg flex-row items-center gap-3 ${getCardStyle()} ${className}`}>
        <Ionicons name={iconName} size={20} color={iconColor} />
        <View className="flex-1">
          <Text
            className={`font-medium ${getTextStyle()}`}
            style={{ fontWeight: '500' }}
          >
            {title}
          </Text>
          <Text
            className={`text-sm ${getDescriptionStyle()}`}
            style={{}}
          >
            {description}
          </Text>
        </View>
      </View>
    );
  }

  // Interactive card
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      className={`p-4 rounded-lg flex-row items-center gap-3 ${getCardStyle()} ${
        disabled ? 'opacity-50' : 'active:opacity-80'
      } ${className}`}
    >
      <Ionicons name={iconName} size={20} color={iconColor} />
      <View className="flex-1">
        <Text
          className={`font-medium ${getTextStyle()}`}
          style={{ fontWeight: '500' }}
        >
          {title}
        </Text>
        <Text
          className={`text-sm ${getDescriptionStyle()}`}
          style={{}}
        >
          {description}
        </Text>
      </View>
    </Pressable>
  );
}