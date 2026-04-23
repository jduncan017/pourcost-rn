import React from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { useThemeColors } from '@/src/contexts/ThemeContext';

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
  /**
   * `default` — side-by-side label + value above the slider.
   * `stat` — uppercase tracked label + big number, slider below (matches StatCard).
   */
  variant?: 'default' | 'stat';
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
  variant = 'default',
}: CustomSliderProps) {
  const colors = useThemeColors();

  const handleValueChange = (rawValue: number) => {
    const steppedValue = Math.round(rawValue / step) * step;
    onValueChange(Math.max(minValue, Math.min(maxValue, steppedValue)));
  };

  const formatted = formatValue ? formatValue(value) : `${value.toFixed(2)}${unit}`;

  return (
    <View>
      {variant === 'stat' ? (
        <View className="flex-row justify-between items-center mb-1">
          <Text
            className="text-[11px] tracking-widest uppercase"
            style={{ color: colors.textTertiary, fontWeight: '600' }}
          >
            {label}
          </Text>
          <Text
            className="text-2xl"
            style={{ color: colors.text, fontWeight: '700' }}
          >
            {formatted}
          </Text>
        </View>
      ) : (
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-lg" style={{ color: colors.textSecondary, fontWeight: '500' }}>
            {label}
          </Text>
          <Text className="text-base" style={{ color: colors.text, fontWeight: '600' }}>
            {formatted}
          </Text>
        </View>
      )}

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
