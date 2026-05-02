import { useState } from 'react';
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
  /**
   * When the parent's `onValueChange` fires.
   *  - `change` (default) — every drag tick. Use when downstream UI must
   *    update live (calculator preview, hero %, etc).
   *  - `release` — only on slide complete. Use on settings/onboarding screens
   *    where nothing reacts to the value during the drag — avoids a full
   *    parent re-render on every native tick, which is the lag source.
   */
  commitOn?: 'change' | 'release';
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
  commitOn = 'change',
}: CustomSliderProps) {
  const colors = useThemeColors();

  // Local drag state — keeps the displayed value glued to the thumb during a
  // drag, independent of how slow the parent re-render is. When dragValue is
  // non-null we're mid-drag and should display it instead of the prop value.
  const [dragValue, setDragValue] = useState<number | null>(null);

  const clampStep = (raw: number) => {
    const stepped = Math.round(raw / step) * step;
    return Math.max(minValue, Math.min(maxValue, stepped));
  };

  const handleValueChange = (rawValue: number) => {
    const clamped = clampStep(rawValue);
    setDragValue(clamped);
    if (commitOn === 'change') onValueChange(clamped);
  };

  const handleSlidingComplete = (rawValue: number) => {
    const clamped = clampStep(rawValue);
    if (commitOn === 'release') onValueChange(clamped);
    setDragValue(null);
  };

  const displayValue = dragValue ?? value;
  const formatted = formatValue
    ? formatValue(displayValue)
    : `${displayValue.toFixed(2)}${unit}`;

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
          <Text
            className="text-lg"
            style={{ color: colors.textSecondary, fontWeight: '500' }}
          >
            {label}
          </Text>
          <Text
            className="text-base"
            style={{ color: colors.text, fontWeight: '600' }}
          >
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
        onSlidingComplete={handleSlidingComplete}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.border}
        thumbTintColor="rgba(255,255,255,0.7)"
        style={{ height: 40 }}
      />
    </View>
  );
}
