import React from 'react';
import { View, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeColors } from '@/src/contexts/ThemeContext';
import Card from './ui/Card';

interface SwipeableCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    color: string;
    backgroundColor: string;
  };
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    color: string;
    backgroundColor: string;
  };
  threshold?: number;
  className?: string;
  disableRightSwipe?: boolean; // New prop to disable right swipe
  variant?: 'gradient' | 'ghost' | 'custom'; // Card variant to use
}

// Default actions will use theme colors, defined inside component

export default function SwipeableCard({
  children,
  onPress,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className = '',
  disableRightSwipe = false,
  variant = 'gradient',
}: SwipeableCardProps) {
  const { isDarkMode } = useTheme();
  const { colors } = useThemeColors();

  // Default actions using theme colors
  const defaultLeftAction = {
    icon: 'pencil' as const,
    label: 'Edit',
    color: colors.g4,
    backgroundColor: colors.g1,
  };

  const defaultRightAction = {
    icon: 'trash' as const,
    label: 'Delete',
    color: colors.n1,
    backgroundColor: colors.e2,
  };

  const finalLeftAction = leftAction || defaultLeftAction;
  const finalRightAction = rightAction || defaultRightAction;
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const hasTriggeredAction = useSharedValue(false);
  const maxSwipe = 100; // Fixed width for action buttons (80px)
  const triggerThreshold = maxSwipe * 0.9; // 90% of action width to trigger

  const triggerAction = (direction: 'left' | 'right') => {
    // Prevent multiple triggers with stronger debouncing
    if (hasTriggeredAction.value) return;
    hasTriggeredAction.value = true;

    // Reset position immediately to prevent further triggers
    translateX.value = withSpring(0, {
      damping: 20,
      stiffness: 300,
    });

    // Trigger the action after a short delay to ensure position reset
    setTimeout(() => {
      if (direction === 'left' && onSwipeLeft) {
        onSwipeLeft();
      } else if (direction === 'right' && onSwipeRight) {
        onSwipeRight();
      }
    }, 100);

    // Reset trigger flag after a longer delay
    setTimeout(() => {
      hasTriggeredAction.value = false;
    }, 1000);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      hasTriggeredAction.value = false; // Reset trigger flag
    })
    .onUpdate((event) => {
      // Only activate horizontal swipe if the gesture is primarily horizontal
      const isHorizontalGesture =
        Math.abs(event.translationX) > Math.abs(event.translationY * 1.5);

      if (isHorizontalGesture) {
        const newTranslateX = startX.value + event.translationX;

        // Strictly limit swipe distance to action width
        if (newTranslateX > 0) {
          // Swiping right (revealing left action) - clamp to maxSwipe
          if (!disableRightSwipe) {
            translateX.value = Math.max(0, Math.min(newTranslateX, maxSwipe));
          }
        } else {
          // Swiping left (revealing right action) - clamp to -maxSwipe
          translateX.value = Math.min(0, Math.max(newTranslateX, -maxSwipe));
        }
      }
    })
    .onEnd(() => {
      // Use 90% of maxSwipe as trigger threshold
      const shouldTrigger = Math.abs(translateX.value) >= triggerThreshold;

      if (shouldTrigger && !hasTriggeredAction.value) {
        if (translateX.value > 0 && !disableRightSwipe) {
          runOnJS(triggerAction)('left');
        } else if (translateX.value < 0) {
          runOnJS(triggerAction)('right');
        }
      } else if (!hasTriggeredAction.value) {
        // Snap back to center if not triggered
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
          mass: 0.8,
        });
      }
    })
    .onFinalize(() => {
      // Handle cancelled gestures
      if (!hasTriggeredAction.value) {
        const shouldTrigger = Math.abs(translateX.value) >= triggerThreshold;

        if (shouldTrigger) {
          if (translateX.value > 0 && !disableRightSwipe) {
            runOnJS(triggerAction)('left');
          } else if (translateX.value < 0) {
            runOnJS(triggerAction)('right');
          }
        } else {
          translateX.value = withSpring(0, {
            damping: 20,
            stiffness: 300,
            mass: 0.8,
          });
        }
      }
    })
    .activeOffsetX([-15, 15]) // Larger threshold to prevent conflicts
    .failOffsetY([-20, 20]) // More vertical tolerance before failing
    .shouldCancelWhenOutside(true); // Cancel gesture when finger leaves area

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      zIndex: 1, // Ensure main content is above the action buttons
      position: 'relative',
    };
  });

  return (
    <View className={`relative overflow-hidden`}>
      {/* Left Action (Edit) - Static underneath */}
      {onSwipeLeft && !disableRightSwipe && (
        <View
          className="absolute left-0 top-0 bottom-0 flex-row items-center justify-start px-8 rounded-l-xl z-0"
          style={{
            backgroundColor: finalLeftAction.backgroundColor,
            width: maxSwipe + 20,
          }}
        >
          <View className="items-center">
            <Ionicons
              name={finalLeftAction.icon}
              size={24}
              color={finalLeftAction.color}
            />
            <Text
              className="text-sm font-medium mt-1"
              style={{ color: finalLeftAction.color }}
            >
              {finalLeftAction.label}
            </Text>
          </View>
        </View>
      )}

      {/* Right Action (Delete) - Static underneath */}
      {onSwipeRight && (
        <View
          className="absolute right-0 top-0 bottom-0 flex-row items-center justify-end px-8 rounded-r-xl z-0"
          style={{
            backgroundColor: finalRightAction.backgroundColor,
            width: maxSwipe + 20,
          }}
        >
          <View className="items-center">
            <Ionicons
              name={finalRightAction.icon}
              size={24}
              color={finalRightAction.color}
            />
            <Text
              className="text-sm font-medium mt-1"
              style={{ color: finalRightAction.color }}
            >
              {finalRightAction.label}
            </Text>
          </View>
        </View>
      )}

      {/* Main Card Content - Slides over the actions */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={cardStyle}>
          {/* Solid background layer for gradient cards */}
          {variant === 'gradient' && (
            <View className="absolute inset-0 rounded-lg bg-p3" />
          )}

          <Card
            onPress={() => {
              // Only handle press if we haven't triggered a swipe action
              if (!hasTriggeredAction.value && Math.abs(translateX.value) < 5) {
                onPress?.();
              }
            }}
            className={`${className} relative z-[1]`}
          >
            {children}
          </Card>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
