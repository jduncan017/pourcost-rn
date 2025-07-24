/**
 * Toast Component for PourCost-RN
 * Displays non-intrusive feedback messages with animations
 * Integrates with FeedbackService for centralized notifications
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/contexts/ThemeContext';
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
  const [slideAnim] = useState(new Animated.Value(-screenWidth));

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
        toValue: -screenWidth,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(message.id);
    });
  };

  // Get colors based on message type
  const getToastColors = (type: FeedbackType) => {
    switch (type) {
      case 'success':
        return {
          background: 'bg-s22/90 dark:bg-s21/90',
          border: 'border-s22 dark:border-s21',
          icon: '#22c55e',
          iconName: 'checkmark-circle' as const,
        };
      case 'error':
        return {
          background: 'bg-e2/90 dark:bg-e3/90',
          border: 'border-e2 dark:border-e3',
          icon: '#ef4444',
          iconName: 'close-circle' as const,
        };
      case 'warning':
        return {
          background: 'bg-s12/90 dark:bg-s11/90',
          border: 'border-s12 dark:border-s11',
          icon: '#f59e0b',
          iconName: 'warning' as const,
        };
      case 'info':
      default:
        return {
          background: 'bg-p1/90 dark:bg-p2/90',
          border: 'border-p1 dark:border-p2',
          icon: '#3b82f6',
          iconName: 'information-circle' as const,
        };
    }
  };

  const toastColors = getToastColors(message.type);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
        position: 'absolute',
        top: insets.top + 10,
        left: 16,
        right: 16,
        zIndex: 1000,
      }}
    >
      <View
        className={`
          ${toastColors.background} ${toastColors.border}
          border rounded-xl p-4 shadow-lg
          flex-row items-start gap-3
        `}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {/* Icon */}
        <View className="mt-0.5">
          <Ionicons
            name={toastColors.iconName}
            size={20}
            color={toastColors.icon}
          />
        </View>

        {/* Content */}
        <View className="flex-1">
          {message.title && (
            <Text
              className="text-white font-medium text-base mb-1"
              style={{ fontWeight: '600' }}
            >
              {message.title}
            </Text>
          )}
          {message.message && (
            <Text className="text-white/90 text-sm leading-relaxed">
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
                className="text-white font-medium text-sm underline"
                style={{ fontWeight: '500' }}
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
            color="rgba(255, 255, 255, 0.8)"
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