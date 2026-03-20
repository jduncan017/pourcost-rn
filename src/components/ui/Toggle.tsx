import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  description?: string;
  className?: string;
}

export default function Toggle({
  value,
  onValueChange,
  label,
  description,
  className = '',
}: ToggleProps) {
  const colors = useThemeColors();
  const translateX = useSharedValue(value ? 20 : 0);

  useEffect(() => {
    translateX.value = withTiming(value ? 20 : 0, { duration: 200 });
  }, [value]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      className={`flex-row items-center gap-3 ${className}`}
    >
      {/* Track */}
      <View
        className="w-[48px] h-7 rounded-full justify-center px-0.5"
        style={{
          backgroundColor: value ? palette.s21 : colors.inputBg,
          borderWidth: 1,
          borderColor: value ? palette.s21 : colors.border,
        }}
      >
        <Animated.View
          style={[thumbStyle]}
          className="w-6 h-6 rounded-full bg-white"
        />
      </View>

      {/* Label */}
      {(label || description) && (
        <View className="flex-1">
          {label && (
            <Text style={{ color: colors.text, fontWeight: '500' }} className="text-base">
              {label}
            </Text>
          )}
          {description && (
            <Text style={{ color: colors.textTertiary }} className="text-xs mt-0.5">
              {description}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}
