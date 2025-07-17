import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  overlay?: boolean;
  className?: string;
}

export default function LoadingSpinner({
  size = 'large',
  color = '#2563EB', // primary-600
  message,
  overlay = false,
  className = '',
}: LoadingSpinnerProps) {
  const content = (
    <View className={`items-center justify-center ${className}`}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text className="text-gray-600 text-base mt-3 text-center">
          {message}
        </Text>
      )}
    </View>
  );

  if (overlay) {
    return (
      <View className="absolute inset-0 bg-white/80 items-center justify-center z-50">
        {content}
      </View>
    );
  }

  return content;
}

// Convenience components for common use cases
export const FullScreenLoader = ({ message = 'Loading...' }: { message?: string }) => (
  <View className="flex-1 items-center justify-center bg-gray-50">
    <LoadingSpinner message={message} />
  </View>
);

export const InlineLoader = ({ message }: { message?: string }) => (
  <LoadingSpinner size="small" message={message} className="py-4" />
);

export const OverlayLoader = ({ message = 'Loading...' }: { message?: string }) => (
  <LoadingSpinner message={message} overlay />
);