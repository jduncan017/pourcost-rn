import { View, Text, Pressable } from 'react-native';
import { HapticService } from '@/src/services/haptic-service';
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
  // Track 52x30, thumb 26x26 → between the previous custom toggle (48x28)
  // and iOS native Switch (51x31). Translation = inner range minus thumb.
  const translateX = useSharedValue(value ? 22 : 0);

  useEffect(() => {
    translateX.value = withTiming(value ? 22 : 0, { duration: 200 });
  }, [value]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Pressable
      onPress={() => { HapticService.toggle(); onValueChange(!value); }}
      className={`flex-row items-center gap-3 ${className}`}
    >
      {/* Track */}
      <View
        className="w-[52px] h-[30px] rounded-full justify-center px-0.5"
        style={{
          backgroundColor: value ? palette.G3 : colors.inputBg,
          borderWidth: 1,
          borderColor: value ? palette.G3 : colors.border,
        }}
      >
        <Animated.View
          style={[thumbStyle]}
          className="w-[26px] h-[26px] rounded-full bg-white"
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
