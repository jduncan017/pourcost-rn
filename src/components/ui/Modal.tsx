import React from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  Modal as RNModal, 
  ScrollView,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/contexts/ThemeContext';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  showCloseButton?: boolean;
  scrollable?: boolean;
  className?: string;
}

export default function Modal({
  visible,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  scrollable = true,
  className = '',
}: ModalProps) {
  const colors = useThemeColors();
  const screenHeight = Dimensions.get('window').height;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { maxHeight: screenHeight * 0.4, margin: 20 };
      case 'medium':
        return { maxHeight: screenHeight * 0.7, margin: 20 };
      case 'large':
        return { maxHeight: screenHeight * 0.9, margin: 10 };
      case 'fullscreen':
        return { height: screenHeight, margin: 0 };
      default:
        return { maxHeight: screenHeight * 0.7, margin: 20 };
    }
  };

  const sizeStyles = getSizeStyles();

  const ModalContent = () => (
    <View 
      className={`ModalContent rounded-xl overflow-hidden border ${className}`} 
      style={{
        ...sizeStyles,
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
    >
      {/* Header */}
      {(title || showCloseButton) && (
        <View 
          className="ModalHeader flex-row items-center justify-between px-4 py-3 border-b"
          style={{
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Text className="ModalTitle text-lg font-semibold flex-1 text-g4 dark:text-n1">
            {title || ''}
          </Text>
          {showCloseButton && (
            <Pressable
              onPress={onClose}
              className="CloseButton p-2 rounded-lg"
              style={{ backgroundColor: colors.accent + '20' }}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      )}

      {/* Content */}
      {scrollable ? (
        <ScrollView 
          className="ModalScroll flex-1"
          showsVerticalScrollIndicator={false}
          bounces={false}
          style={{ backgroundColor: colors.surface }}
        >
          <View className="ModalScrollContent p-4">
            {children}
          </View>
        </ScrollView>
      ) : (
        <View 
          className="ModalFixedContent flex-1 p-4" 
          style={{ backgroundColor: colors.surface }}
        >
          {children}
        </View>
      )}
    </View>
  );

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center px-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
        <Pressable 
          className="absolute inset-0" 
          onPress={onClose}
        />
        <ModalContent />
      </View>
    </RNModal>
  );
}

// Convenience components for common modal types
export const ConfirmModal = ({
  visible,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}) => {
  const colors = useThemeColors();
  
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      size="small"
      scrollable={false}
    >
      <View>
        <Text 
          className="text-base leading-relaxed mb-6"
          style={{ 
            color: colors.text,
          }}
        >
          {message}
        </Text>
        
        <View className="flex-row gap-3">
          <Pressable
            onPress={onClose}
            className="flex-1 py-3 rounded-lg"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text 
              className="text-center font-semibold"
              style={{ 
                color: colors.text,
              }}
            >
              {cancelText}
            </Text>
          </Pressable>
          
          <Pressable
            onPress={onConfirm}
            className="flex-1 py-3 rounded-lg"
            style={{
              backgroundColor: destructive ? '#DC2626' : colors.accent,
            }}
          >
            <Text className="text-center font-semibold text-white">
              {confirmText}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export const InfoModal = ({
  visible,
  onClose,
  title,
  message,
  buttonText = 'OK',
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
}) => {
  const colors = useThemeColors();
  
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      size="small"
      scrollable={false}
    >
      <View>
        <Text 
          className="text-base leading-relaxed mb-6"
          style={{ 
            color: colors.text,
          }}
        >
          {message}
        </Text>
        
        <Pressable
          onPress={onClose}
          className="py-3 rounded-lg"
          style={{
            backgroundColor: colors.accent,
          }}
        >
          <Text className="text-center font-semibold text-white">
            {buttonText}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
};