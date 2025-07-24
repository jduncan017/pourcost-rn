import React from 'react';
import { View, Text, Dimensions, Pressable } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/contexts/ThemeContext';

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
}

const defaultLeftAction = {
  icon: 'pencil' as const,
  label: 'Edit',
  color: '#374151',
  backgroundColor: '#F3F4F6',
};

const defaultRightAction = {
  icon: 'trash' as const,
  label: 'Delete',
  color: '#FFFFFF',
  backgroundColor: '#DC2626',
};

export default function SwipeableCard({
  children,
  onPress,
  onSwipeLeft,
  onSwipeRight,
  leftAction = defaultLeftAction,
  rightAction = defaultRightAction,
  className = '',
}: SwipeableCardProps) {
  const { isDarkMode } = useTheme();
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const hasTriggeredAction = useSharedValue(false);
  const screenWidth = Dimensions.get('window').width;
  const maxSwipe = 80; // Fixed width for action buttons (80px)
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
          translateX.value = Math.max(0, Math.min(newTranslateX, maxSwipe));
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
        if (translateX.value > 0) {
          runOnJS(triggerAction)('left');
        } else {
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
          if (translateX.value > 0) {
            runOnJS(triggerAction)('left');
          } else {
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

  // Get theme colors based on dark mode
  const cardBackgroundColor = isDarkMode
    ? 'rgba(29, 39, 60, 1)'
    : 'rgba(175, 175, 175, 1)';

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      zIndex: 1, // Ensure main content is above the action buttons
      position: 'relative',
      backgroundColor: cardBackgroundColor,
      borderRadius: 8,
      padding: 16,
    };
  });

  return (
    <View className={`relative overflow-hidden ${className}`}>
      {/* Left Action (Edit) - Static underneath */}
      {onSwipeLeft && (
        <View
          className="absolute left-0 top-0 bottom-0 flex-row items-center justify-center px-6 rounded-l-xl"
          style={{
            backgroundColor: leftAction.backgroundColor,
            width: maxSwipe,
            zIndex: 0, // Behind the main content
          }}
        >
          <View className="items-center">
            <Ionicons
              name={leftAction.icon}
              size={24}
              color={leftAction.color}
            />
            <Text
              className="text-sm font-medium mt-1"
              style={{ color: leftAction.color }}
            >
              {leftAction.label}
            </Text>
          </View>
        </View>
      )}

      {/* Right Action (Delete) - Static underneath */}
      {onSwipeRight && (
        <View
          className="absolute right-0 top-0 bottom-0 flex-row items-center justify-center px-6 rounded-r-xl"
          style={{
            backgroundColor: rightAction.backgroundColor,
            width: maxSwipe,
            zIndex: 0, // Behind the main content
          }}
        >
          <View className="items-center">
            <Ionicons
              name={rightAction.icon}
              size={24}
              color={rightAction.color}
            />
            <Text
              className="text-sm font-medium mt-1"
              style={{ color: rightAction.color }}
            >
              {rightAction.label}
            </Text>
          </View>
        </View>
      )}

      {/* Main Card Content - Slides over the actions */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={cardStyle}>
          <Pressable
            onPress={() => {
              // Only handle press if we haven't triggered a swipe action
              if (!hasTriggeredAction.value && Math.abs(translateX.value) < 5) {
                onPress?.();
              }
            }}
            style={{ flex: 1 }}
          >
            {children}
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
