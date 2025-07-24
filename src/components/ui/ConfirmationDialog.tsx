/**
 * Confirmation Dialog Component for PourCost-RN
 * Provides consistent confirmation dialogs for destructive actions
 * Integrates with FeedbackService for centralized dialog management
 */

import React from 'react';
import { View, Text, Pressable, Modal, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import Button from './Button';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Confirmation Dialog Component
 */
const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  icon,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const colors = useThemeColors();

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Confirmation action failed:', error);
      // Error will be handled by the calling component
    }
  };

  const getIconColor = () => {
    if (destructive) return '#ef4444';
    return '#3b82f6';
  };

  const getDefaultIcon = () => {
    if (destructive) return 'trash' as const;
    return 'help-circle' as const;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      {/* Backdrop */}
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={onCancel}
      >
        {/* Dialog Container */}
        <Pressable
          style={{
            maxWidth: Math.min(screenWidth - 40, 400),
            width: '90%',
            maxHeight: screenHeight - 100,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Dialog Content */}
          <BlurView
            intensity={95}
            tint="dark"
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            <View className="p-6">
              {/* Icon */}
              {(icon || destructive) && (
                <View className="items-center mb-4">
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: destructive 
                        ? 'rgba(239, 68, 68, 0.1)' 
                        : 'rgba(59, 130, 246, 0.1)',
                    }}
                  >
                    <Ionicons
                      name={icon || getDefaultIcon()}
                      size={32}
                      color={getIconColor()}
                    />
                  </View>
                </View>
              )}

              {/* Title */}
              <Text
                className="text-xl font-bold text-center mb-3 text-g4 dark:text-n1"
                style={{ fontWeight: '700' }}
              >
                {title}
              </Text>

              {/* Message */}
              <Text
                className="text-base text-center mb-6 text-g3 dark:text-g1 leading-6"
                style={{ fontWeight: '400' }}
              >
                {message}
              </Text>

              {/* Action Buttons */}
              <View className="flex-row gap-3">
                {/* Cancel Button */}
                <View className="flex-1">
                  <Button
                    onPress={onCancel}
                    variant="secondary"
                    size="large"
                    disabled={loading}
                  >
                    {cancelText}
                  </Button>
                </View>

                {/* Confirm Button */}
                <View className="flex-1">
                  <Button
                    onPress={handleConfirm}
                    variant={destructive ? "danger" : "primary"}
                    size="large"
                    loading={loading}
                    disabled={loading}
                  >
                    {confirmText}
                  </Button>
                </View>
              </View>
            </View>
          </BlurView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ConfirmationDialog;