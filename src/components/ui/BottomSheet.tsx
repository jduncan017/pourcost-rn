import { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/contexts/ThemeContext';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  maxHeight?: number;
}

export default function BottomSheet({
  visible,
  onClose,
  title,
  headerRight,
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

  const dismissSheet = () => {
    translateY.value = withTiming(sheetMaxHeight, {
      duration: 200,
      easing: Easing.in(Easing.cubic),
    });
    // Delay onClose until animation finishes
    setTimeout(onClose, 200);
  };

  // Swipe down to close
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 80 || event.velocityY > 500) {
        translateY.value = withTiming(sheetMaxHeight, { duration: 200 });
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

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
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Backdrop */}
        <Pressable
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onPress={dismissSheet}
        />

        {/* Sheet */}
        <View className="flex-1 justify-end">
          <Animated.View
            className="rounded-t-2xl overflow-hidden"
            style={[
              {
                backgroundColor: colors.elevated,
                maxHeight: sheetMaxHeight,
                paddingBottom: insets.bottom,
              },
              sheetStyle,
            ]}
          >
            {/* Drag Handle + Header */}
            <GestureDetector gesture={panGesture}>
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
                    <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                      {title}
                    </Text>
                    {headerRight}
                  </View>
                )}
              </View>
            </GestureDetector>

            {/* Content */}
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
