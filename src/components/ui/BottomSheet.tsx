import { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/contexts/ThemeContext';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: number;
}

export default function BottomSheet({
  visible,
  onClose,
  title,
  children,
  maxHeight,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const screenHeight = Dimensions.get('window').height;
  const sheetMaxHeight = maxHeight ?? screenHeight * 0.6;

  const translateY = useSharedValue(sheetMaxHeight);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      translateY.value = sheetMaxHeight;
    }
  }, [visible, sheetMaxHeight]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1">
        {/* Backdrop — absolute, covers entire screen */}
        <Pressable
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onPress={onClose}
        />

        {/* Sheet — pinned to bottom */}
        <View className="flex-1 justify-end">
          <Animated.View
            className="rounded-t-2xl overflow-hidden"
            style={[
              {
                backgroundColor: colors.surface,
                maxHeight: sheetMaxHeight,
                paddingBottom: insets.bottom,
              },
              sheetStyle,
            ]}
          >
            {/* Handle + Header */}
            <View className="items-center pt-3 pb-2">
              <View
                className="w-10 h-1 rounded-full mb-3"
                style={{ backgroundColor: colors.border }}
              />
              {title && (
                <View
                  className="flex-row items-center justify-between w-full px-4 pb-3 border-b"
                  style={{ borderBottomColor: colors.border }}
                >
                  <Text className="text-lg font-semibold text-g4 dark:text-n1">
                    {title}
                  </Text>
                  <Pressable onPress={onClose} className="p-1">
                    <Ionicons name="close" size={22} color={colors.textSecondary} />
                  </Pressable>
                </View>
              )}
            </View>

            {/* Content */}
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
