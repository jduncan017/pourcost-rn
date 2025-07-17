import React from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

interface PageTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  type?: 'fade' | 'slide' | 'scale' | 'spring';
  duration?: number;
  onTransitionComplete?: () => void;
  className?: string;
}

export default function PageTransition({
  children,
  isVisible,
  type = 'fade',
  duration = 300,
  onTransitionComplete,
  className = '',
}: PageTransitionProps) {
  const progress = useSharedValue(isVisible ? 1 : 0);

  React.useEffect(() => {
    if (type === 'spring') {
      progress.value = withSpring(
        isVisible ? 1 : 0,
        {
          damping: 20,
          stiffness: 300,
        },
        (finished) => {
          if (finished && onTransitionComplete) {
            runOnJS(onTransitionComplete)();
          }
        }
      );
    } else {
      progress.value = withTiming(
        isVisible ? 1 : 0,
        { duration },
        (finished) => {
          if (finished && onTransitionComplete) {
            runOnJS(onTransitionComplete)();
          }
        }
      );
    }
  }, [isVisible, type, duration, onTransitionComplete]);

  const animatedStyle = useAnimatedStyle(() => {
    switch (type) {
      case 'fade':
        return {
          opacity: progress.value,
        };
      
      case 'slide':
        return {
          opacity: progress.value,
          transform: [
            {
              translateX: interpolate(
                progress.value,
                [0, 1],
                [50, 0]
              ),
            },
          ],
        };
      
      case 'scale':
        return {
          opacity: progress.value,
          transform: [
            {
              scale: interpolate(
                progress.value,
                [0, 1],
                [0.9, 1]
              ),
            },
          ],
        };
      
      case 'spring':
        return {
          opacity: progress.value,
          transform: [
            {
              scale: interpolate(
                progress.value,
                [0, 1],
                [0.8, 1]
              ),
            },
            {
              translateY: interpolate(
                progress.value,
                [0, 1],
                [20, 0]
              ),
            },
          ],
        };
      
      default:
        return {
          opacity: progress.value,
        };
    }
  });

  if (!isVisible && progress.value === 0) {
    return null;
  }

  return (
    <Animated.View 
      style={animatedStyle}
      className={`flex-1 ${className}`}
    >
      {children}
    </Animated.View>
  );
}

// Convenience components for common transitions
export const FadeTransition = (props: Omit<PageTransitionProps, 'type'>) => (
  <PageTransition {...props} type="fade" />
);

export const SlideTransition = (props: Omit<PageTransitionProps, 'type'>) => (
  <PageTransition {...props} type="slide" />
);

export const ScaleTransition = (props: Omit<PageTransitionProps, 'type'>) => (
  <PageTransition {...props} type="scale" />
);

export const SpringTransition = (props: Omit<PageTransitionProps, 'type'>) => (
  <PageTransition {...props} type="spring" />
);