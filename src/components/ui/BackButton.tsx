import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface BackButtonProps {
  onPress?: () => void;
  className?: string;
}

/**
 * Reusable back button component with consistent styling
 * Features p1 background with white arrow icon
 */
export default function BackButton({ onPress, className = '' }: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className={`p-2 bg-p1 rounded-lg ${className}`}
    >
      <Ionicons name="arrow-back" size={20} color="#ffffff" />
    </Pressable>
  );
}