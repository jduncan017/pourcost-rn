import React from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Card from './ui/Card';

interface SwipeableCardProps {
  children: React.ReactNode;
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
  onSwipeLeft,
  onSwipeRight,
  leftAction = defaultLeftAction,
  rightAction = defaultRightAction,
  threshold = 100,
  className = '',
}: SwipeableCardProps) {
  const translateX = useSharedValue(0);
  const screenWidth = Dimensions.get('window').width;
  const maxSwipe = screenWidth * 0.3; // Maximum swipe distance (30% of screen)

  const triggerAction = (direction: 'left' | 'right') => {
    if (direction === 'left' && onSwipeLeft) {
      onSwipeLeft();
    } else if (direction === 'right' && onSwipeRight) {
      onSwipeRight();
    }

    // Reset position
    translateX.value = withSpring(0);
  };

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number }
  >({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      // Only activate horizontal swipe if the gesture is primarily horizontal
      const isHorizontalGesture =
        Math.abs(event.translationX) > Math.abs(event.translationY * 1.5);

      if (isHorizontalGesture) {
        const newTranslateX = context.startX + event.translationX;

        // Limit swipe distance
        if (newTranslateX > 0) {
          // Swiping right (revealing left action)
          translateX.value = Math.min(newTranslateX, maxSwipe);
        } else {
          // Swiping left (revealing right action)
          translateX.value = Math.max(newTranslateX, -maxSwipe);
        }
      }
    },
    onEnd: (event) => {
      const shouldTrigger = Math.abs(translateX.value) > threshold;

      if (shouldTrigger) {
        if (translateX.value > 0) {
          runOnJS(triggerAction)('left');
        } else {
          runOnJS(triggerAction)('right');
        }
      } else {
        // Snap back to center
        translateX.value = withSpring(0);
      }
    },
  });

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const leftActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, threshold],
      [0, 1],
      'clamp'
    );

    return {
      opacity,
      transform: [
        {
          scale: interpolate(
            translateX.value,
            [0, threshold],
            [0.8, 1],
            'clamp'
          ),
        },
      ],
    };
  });

  const rightActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-threshold, 0],
      [1, 0],
      'clamp'
    );

    return {
      opacity,
      transform: [
        {
          scale: interpolate(
            translateX.value,
            [-threshold, 0],
            [1, 0.8],
            'clamp'
          ),
        },
      ],
    };
  });

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {/* Left Action (Edit) */}
      {onSwipeLeft && (
        <Animated.View
          className="absolute left-0 top-0 bottom-0 flex-row items-center justify-center px-6"
          style={[
            {
              backgroundColor: leftAction.backgroundColor,
              width: maxSwipe,
            },
            leftActionStyle,
          ]}
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
        </Animated.View>
      )}

      {/* Right Action (Delete) */}
      {onSwipeRight && (
        <Animated.View
          className="absolute right-0 top-0 bottom-0 flex-row items-center justify-center px-6"
          style={[
            {
              backgroundColor: rightAction.backgroundColor,
              width: maxSwipe,
            },
            rightActionStyle,
          ]}
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
        </Animated.View>
      )}

      {/* Main Card Content */}
      <PanGestureHandler
        onGestureEvent={gestureHandler}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-15, 15]}
        shouldCancelWhenOutside={true}
      >
        <Animated.View style={cardStyle}>{children}</Animated.View>
      </PanGestureHandler>
    </Card>
  );
}
