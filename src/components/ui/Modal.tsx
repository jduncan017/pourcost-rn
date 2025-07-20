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
    <View className={`bg-n1/80 rounded-lg overflow-hidden ${className}`} style={sizeStyles}>
      {/* Header */}
      {(title || showCloseButton) && (
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-g1/50 bg-n1">
          <Text className="text-lg font-semibold text-g4 flex-1">
            {title || ''}
          </Text>
          {showCloseButton && (
            <Pressable
              onPress={onClose}
              className="p-1 rounded-full bg-g1/80 active:bg-g2"
            >
              <Ionicons name="close" size={20} color="#374151" />
            </Pressable>
          )}
        </View>
      )}

      {/* Content */}
      {scrollable ? (
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1">
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
      <View className="flex-1 bg-black/50 justify-center items-center">
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
}) => (
  <Modal
    visible={visible}
    onClose={onClose}
    title={title}
    size="small"
    scrollable={false}
  >
    <View className="p-6">
      <Text className="text-g4 text-base leading-relaxed mb-6">
        {message}
      </Text>
      
      <View className="flex-row space-x-3">
        <Pressable
          onPress={onClose}
          className="flex-1 py-3 bg-g1/80 rounded-lg active:bg-g2"
        >
          <Text className="text-center text-g4 font-semibold">
            {cancelText}
          </Text>
        </Pressable>
        
        <Pressable
          onPress={onConfirm}
          className={`flex-1 py-3 rounded-lg ${
            destructive 
              ? 'bg-red-600 active:bg-e3' 
              : 'bg-p2 active:bg-p3'
          }`}
        >
          <Text className="text-center text-white font-semibold">
            {confirmText}
          </Text>
        </Pressable>
      </View>
    </View>
  </Modal>
);

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
}) => (
  <Modal
    visible={visible}
    onClose={onClose}
    title={title}
    size="small"
    scrollable={false}
  >
    <View className="p-6">
      <Text className="text-g4 text-base leading-relaxed mb-6">
        {message}
      </Text>
      
      <Pressable
        onPress={onClose}
        className="py-3 bg-p2 rounded-lg active:bg-p3"
      >
        <Text className="text-center text-white font-semibold">
          {buttonText}
        </Text>
      </Pressable>
    </View>
  </Modal>
);