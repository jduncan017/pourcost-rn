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
import { useThemeColors } from '@/src/contexts/ThemeContext';
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
  disableRightSwipe?: boolean;
  variant?: 'gradient' | 'ghost' | 'custom';
  padding?: 'none' | 'small' | 'medium' | 'large';
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
  padding,
}: SwipeableCardProps) {
  const theme = useThemeColors();
  const { colors } = theme;

  // Default actions using theme colors
  const defaultLeftAction = {
    icon: 'pencil' as const,
    label: 'Edit',
    color: colors.N1,
    backgroundColor: theme.accent,
  };

  const defaultRightAction = {
    icon: 'trash' as const,
    label: 'Delete',
    color: colors.N1,
    backgroundColor: colors.R5,
  };

  const finalLeftAction = leftAction || defaultLeftAction;
  const finalRightAction = rightAction || defaultRightAction;
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const hasTriggeredAction = useSharedValue(false);
  const maxSwipe = 100; // Fixed width for action buttons (80px)
  const triggerThreshold = maxSwipe * 0.9; // 90% of action width to trigger

  const triggerAction = (direction: 'left' | 'right') => {
    // Reset position
    translateX.value = withSpring(0, { damping: 20, stiffness: 300 });

    // Fire the callback
    if (direction === 'left' && onSwipeLeft) {
      onSwipeLeft();
    } else if (direction === 'right' && onSwipeRight) {
      onSwipeRight();
    }
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
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
      const shouldTrigger = Math.abs(translateX.value) >= triggerThreshold;

      if (shouldTrigger) {
        // Set flag on the UI thread BEFORE runOnJS to prevent onFinalize re-trigger
        hasTriggeredAction.value = true;

        if (translateX.value > 0 && !disableRightSwipe) {
          runOnJS(triggerAction)('left');
        } else if (translateX.value < 0) {
          runOnJS(triggerAction)('right');
        }
      } else {
        // Snap back to center
        translateX.value = withSpring(0, { damping: 20, stiffness: 300, mass: 0.8 });
      }
    })
    .onFinalize(() => {
      // Only snap back if onEnd didn't already trigger an action
      if (!hasTriggeredAction.value) {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300, mass: 0.8 });
      }
      hasTriggeredAction.value = false;
    })
    .activeOffsetX([-15, 15])
    .failOffsetY([-20, 20])
    .shouldCancelWhenOutside(true);

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      zIndex: 1, // Ensure main content is above the action buttons
      position: 'relative',
    };
  });

  return (
    <View className="relative" style={{ overflow: 'hidden', borderRadius: 12 }}>
      {/* Left Action (Edit) - Static underneath */}
      {onSwipeLeft && !disableRightSwipe && (
        <View
          className="absolute flex-row items-center justify-start px-8 z-0"
          style={{
            backgroundColor: finalLeftAction.backgroundColor,
            width: maxSwipe + 20,
            left: 4,
            top: 0,
            bottom: 0,
            borderRadius: 12,
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
          className="absolute flex-row items-center justify-end px-8 z-0"
          style={{
            backgroundColor: finalRightAction.backgroundColor,
            width: maxSwipe + 20,
            right: 4,
            top: 0,
            bottom: 0,
            borderRadius: 12,
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
        <Animated.View style={[cardStyle]}>
          <Card
            onPress={() => {
              if (!hasTriggeredAction.value && Math.abs(translateX.value) < 5) {
                onPress?.();
              }
            }}
            className={`${className}`}
            padding={padding}
          >
            {children}
          </Card>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
