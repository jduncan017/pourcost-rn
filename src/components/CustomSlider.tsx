import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

interface CustomSliderProps {
  minValue: number;
  maxValue: number;
  value: number;
  onValueChange: (value: number) => void;
  label: string;
  unit?: string;
  step?: number;
  dynamicStep?: (value: number) => number;
  logarithmic?: boolean; // For non-linear price sliders like original PourCost
  pourCostScale?: boolean; // Special scale for pour cost % (10-25% gets most space)
}

export default function CustomSlider({
  minValue,
  maxValue,
  value,
  onValueChange,
  label,
  unit = '',
  step = 0.1,
  dynamicStep,
  logarithmic = false,
  pourCostScale = false,
}: CustomSliderProps) {
  const [isActive, setIsActive] = useState(false);
  const sliderWidth = 280;
  const thumbWidth = 32; // Larger thumb
  const maxTranslateX = sliderWidth - thumbWidth;

  // Calculate position based on value
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  // Conversion functions for non-linear sliders
  const valueToPosition = (val: number): number => {
    if (pourCostScale) {
      // Custom scale that heavily favors 10-25% range
      if (val <= 5) {
        // 0.25% to 5% gets first 15% of slider
        return (val - minValue) / (5 - minValue) * 0.15;
      } else if (val <= 10) {
        // 5% to 10% gets next 15% of slider (15% to 30%)
        return 0.15 + (val - 5) / (10 - 5) * 0.15;
      } else if (val <= 25) {
        // 10% to 25% gets 50% of slider space (30% to 80%)
        return 0.30 + (val - 10) / (25 - 10) * 0.50;
      } else if (val <= 50) {
        // 25% to 50% gets next 15% of slider (80% to 95%)
        return 0.80 + (val - 25) / (50 - 25) * 0.15;
      } else {
        // 50% to 100% gets final 5% of slider (95% to 100%)
        return 0.95 + (val - 50) / (maxValue - 50) * 0.05;
      }
    }
    
    if (!logarithmic) {
      return (val - minValue) / (maxValue - minValue);
    }
    
    // Logarithmic scale: compress higher values
    const logMin = Math.log10(Math.max(minValue, 1));
    const logMax = Math.log10(maxValue);
    const logVal = Math.log10(Math.max(val, 1));
    
    return (logVal - logMin) / (logMax - logMin);
  };

  const positionToValue = (position: number): number => {
    if (pourCostScale) {
      // Convert back from custom pour cost scale
      if (position <= 0.15) {
        // First 15% of slider: 0.25% to 5%
        return minValue + (position / 0.15) * (5 - minValue);
      } else if (position <= 0.30) {
        // Next 15% of slider: 5% to 10%
        return 5 + ((position - 0.15) / 0.15) * (10 - 5);
      } else if (position <= 0.80) {
        // Middle 50% of slider: 10% to 25%
        return 10 + ((position - 0.30) / 0.50) * (25 - 10);
      } else if (position <= 0.95) {
        // Next 15% of slider: 25% to 50%
        return 25 + ((position - 0.80) / 0.15) * (50 - 25);
      } else {
        // Final 5% of slider: 50% to 100%
        return 50 + ((position - 0.95) / 0.05) * (maxValue - 50);
      }
    }
    
    if (!logarithmic) {
      return minValue + position * (maxValue - minValue);
    }
    
    // Convert back from logarithmic scale
    const logMin = Math.log10(Math.max(minValue, 1));
    const logMax = Math.log10(maxValue);
    const logVal = logMin + position * (logMax - logMin);
    
    return Math.pow(10, logVal);
  };

  React.useEffect(() => {
    const position = valueToPosition(value);
    translateX.value = position * maxTranslateX;
  }, [value, minValue, maxValue, maxTranslateX, logarithmic]);

  const updateValue = (newTranslateX: number) => {
    const clampedX = Math.max(0, Math.min(maxTranslateX, newTranslateX));
    const position = clampedX / maxTranslateX;
    const rawValue = positionToValue(position);
    
    const currentStep = dynamicStep ? dynamicStep(rawValue) : step;
    const steppedValue = Math.round(rawValue / currentStep) * currentStep;
    onValueChange(Math.max(minValue, Math.min(maxValue, steppedValue)));
  };

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: (event) => {
      // Jump thumb to finger position immediately on press
      const fingerX = event.x - thumbWidth / 2;
      const clampedX = Math.max(0, Math.min(maxTranslateX, fingerX));
      translateX.value = clampedX;
      
      // Update value immediately - use runOnJS to call updateValue
      runOnJS(updateValue)(clampedX);
      runOnJS(setIsActive)(true);
    },
    onActive: (event) => {
      // Continue using absolute position, not relative translation
      const fingerX = event.x - thumbWidth / 2;
      const clampedX = Math.max(0, Math.min(maxTranslateX, fingerX));
      translateX.value = clampedX;
      
      runOnJS(updateValue)(clampedX);
    },
    onEnd: () => {
      runOnJS(setIsActive)(false);
    },
  });

  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const activeTrackStyle = useAnimatedStyle(() => {
    return {
      width: translateX.value + thumbWidth / 2,
    };
  });

  return (
    <View className="py-4">
      {/* Label and Value */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base font-medium text-gray-700">
          {label}
        </Text>
        <Text className="text-base font-semibold text-primary-600">
          {value.toFixed(2)}{unit}
        </Text>
      </View>

      {/* Slider Container */}
      <View className="items-center">
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View 
            className="relative" 
            style={{ width: sliderWidth, height: 50 }}
          >
            {/* Track */}
            <View 
              className="absolute top-6 bg-gray-300 rounded-full"
              style={{ width: sliderWidth, height: 4 }}
            />
            
            {/* Active Track */}
            <Animated.View 
              className="absolute top-6 bg-primary-600 rounded-full"
              style={[{ height: 4 }, activeTrackStyle]}
            />

            {/* Thumb */}
            <Animated.View
              className={`absolute top-2 w-8 h-8 rounded-full border-2 border-white ${
                isActive ? 'bg-primary-700' : 'bg-primary-600'
              }`}
              style={[
                thumbStyle,
                Platform.OS === 'web' ? { boxShadow: '0 2px 4px rgba(0,0,0,0.2)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }
              ]}
            />

          </Animated.View>
        </PanGestureHandler>
      </View>
    </View>
  );
}