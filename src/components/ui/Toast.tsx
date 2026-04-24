/**
 * Toast Component for PourCost-RN
 * Displays non-intrusive feedback messages with animations
 * Integrates with FeedbackService for centralized notifications
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { FeedbackMessage, FeedbackService, FeedbackType } from '@/src/services/feedback-service';

interface ToastProps {
  message: FeedbackMessage;
  onDismiss: (id: string) => void;
}

interface ToastContainerProps {
  children?: React.ReactNode;
}

const { width: screenWidth } = Dimensions.get('window');

/**
 * Individual Toast component
 */
const Toast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Handle dismiss with animation
  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(message.id);
    });
  };

  // Map feedback type → which icon + tint color to show. The toast background
  // is always the same opaque neutral (`colors.elevated`) so toasts read as a
  // single calm system voice; the tiny colored icon is the only accent hint.
  const getToastAccent = (type: FeedbackType) => {
    switch (type) {
      case 'success':
        return { icon: palette.G3, iconName: 'checkmark-circle' as const };
      case 'error':
        return { icon: palette.R3, iconName: 'close-circle' as const };
      case 'warning':
        return { icon: palette.O4, iconName: 'warning' as const };
      case 'info':
      default:
        return { icon: palette.B5, iconName: 'information-circle' as const };
    }
  };

  const accent = getToastAccent(message.type);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        position: 'absolute',
        top: insets.top + 10,
        left: 16,
        right: 16,
        zIndex: 1000,
      }}
    >
      <View
        className="rounded-xl p-4 flex-row items-start gap-3"
        style={{
          backgroundColor: colors.elevated,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {/* Icon — the only colored hint of the message type. */}
        <View className="mt-0.5">
          <Ionicons
            name={accent.iconName}
            size={20}
            color={accent.icon}
          />
        </View>

        {/* Content */}
        <View className="flex-1">
          {message.title && (
            <Text
              className="text-base mb-1"
              style={{ color: colors.text, fontWeight: '600' }}
            >
              {message.title}
            </Text>
          )}
          {message.message && (
            <Text
              className="text-sm leading-relaxed"
              style={{ color: colors.textSecondary }}
            >
              {message.message}
            </Text>
          )}

          {/* Action Button */}
          {message.action && (
            <Pressable
              onPress={() => {
                message.action?.onPress();
                handleDismiss();
              }}
              className="mt-2 self-start"
            >
              <Text
                className="text-sm underline"
                style={{ color: colors.accent, fontWeight: '600' }}
              >
                {message.action.label}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Dismiss Button */}
        <Pressable
          onPress={handleDismiss}
          className="mt-0.5 p-1"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="close"
            size={18}
            color={colors.textTertiary}
          />
        </Pressable>
      </View>
    </Animated.View>
  );
};

/**
 * Toast Container component
 * Manages multiple toasts and integrates with FeedbackService
 */
export const ToastContainer: React.FC<ToastContainerProps> = () => {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);

  useEffect(() => {
    // Subscribe to feedback service
    const unsubscribe = FeedbackService.subscribeFeedback((feedbackMessages) => {
      // Only show toast-worthy messages (not permanent loading states)
      const toastMessages = feedbackMessages.filter(msg => 
        msg.duration !== 'permanent' && 
        ['success', 'error', 'warning', 'info'].includes(msg.type)
      );
      setMessages(toastMessages);
    });

    return unsubscribe;
  }, []);

  const handleDismiss = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  if (messages.length === 0) {
    return null;
  }

  // Show only the most recent toast to avoid clutter
  const latestMessage = messages[messages.length - 1];

  return (
    <Toast
      key={latestMessage.id}
      message={latestMessage}
      onDismiss={handleDismiss}
    />
  );
};

/**
 * Hook to use toast notifications
 */
export const useToast = () => {
  return {
    showSuccess: (title: string, message: string, action?: { label: string; onPress: () => void }) => {
      FeedbackService.showSuccess(title, message, action);
    },
    
    showError: (title: string, message: string) => {
      FeedbackService.showError(title, message);
    },
    
    showWarning: (title: string, message: string, action?: { label: string; onPress: () => void }) => {
      FeedbackService.showWarning(title, message, action);
    },
    
    showInfo: (title: string, message: string) => {
      FeedbackService.showInfo(title, message);
    },
    
    handleError: (error: Error | string, context?: any) => {
      FeedbackService.handleError(error, context);
    },
    
    showOperationSuccess: (operation: string, itemName?: string) => {
      FeedbackService.showOperationSuccess(operation, itemName);
    },
    
    showValidationErrors: (errors: string[]) => {
      FeedbackService.showValidationErrors(errors);
    },
  };
};

export default Toast;