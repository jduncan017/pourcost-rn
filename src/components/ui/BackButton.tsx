import React from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface BackButtonProps {
  onPress?: () => void;
  className?: string;
  variant?: 'default' | 'save';
  showSaveText?: boolean;
}

/**
 * Reusable back button component with consistent styling
 * Features p1 background with white arrow icon or save variant
 */
export default function BackButton({ 
  onPress, 
  className = '', 
  variant = 'default',
  showSaveText = false 
}: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  const getButtonStyle = () => {
    if (variant === 'save') {
      return 'bg-s22 rounded-full p-2';
    }
    return 'bg-p1 rounded-lg p-2';
  };

  const getIconColor = () => {
    return '#ffffff';
  };

  return (
    <Pressable
      onPress={handlePress}
      className={`${getButtonStyle()} ${showSaveText ? 'flex-row items-center gap-2 px-3' : ''} ${className}`}
    >
      {showSaveText ? (
        <>
          <Text className="text-white font-medium">Save</Text>
        </>
      ) : (
        <Ionicons name="arrow-back" size={20} color={getIconColor()} />
      )}
    </Pressable>
  );
}