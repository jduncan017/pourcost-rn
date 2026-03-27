import React from 'react';
import { View, Text, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';

interface CustomSliderProps {
  minValue: number;
  maxValue: number;
  value: number;
  onValueChange: (value: number) => void;
  label: string;
  unit?: string;
  step?: number;
  dynamicStep?: (value: number) => number;
  logarithmic?: boolean;
  pourCostScale?: boolean;
  formatValue?: (value: number) => string;
}

export default function CustomSlider({
  minValue,
  maxValue,
  value,
  onValueChange,
  label,
  unit = '',
  step = 0.1,
  formatValue,
}: CustomSliderProps) {
  const colors = useThemeColors();

  const handleValueChange = (rawValue: number) => {
    const steppedValue = Math.round(rawValue / step) * step;
    onValueChange(Math.max(minValue, Math.min(maxValue, steppedValue)));
  };

  return (
    <View>
      {/* Label and Value */}
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-lg" style={{ color: colors.textSecondary, fontWeight: '500' }}>
          {label}
        </Text>
        <Text className="text-base" style={{ color: colors.text, fontWeight: '600' }}>
          {formatValue ? formatValue(value) : `${value.toFixed(2)}${unit}`}
        </Text>
      </View>

      {/* Native Slider */}
      <Slider
        value={value}
        minimumValue={minValue}
        maximumValue={maxValue}
        step={step}
        onValueChange={handleValueChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.accent}
        style={{ height: 40 }}
      />
    </View>
  );
}
