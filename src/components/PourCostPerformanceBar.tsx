import { View, Text } from 'react-native';
import { useAppStore } from '@/src/stores/app-store';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { PERFORMANCE_DISTANCE_THRESHOLDS } from '@/src/constants/appConstants';
import Card from './ui/Card';

interface PourCostPerformanceBarProps {
  pourCostPercentage: number;
  showLabels?: boolean;
  noCard?: boolean;
  className?: string;
}

const COLORS = {
  onTarget: palette.G3,
  close: palette.Y3,
  drifting: palette.O4,
  bad: palette.R3,
};

export function getPerformance(ratio: number) {
  if (ratio <= 0) return { color: COLORS.onTarget, label: 'On Target' };
  const distance = Math.abs(ratio - 1);
  if (distance <= PERFORMANCE_DISTANCE_THRESHOLDS.ON_TARGET) return { color: COLORS.onTarget, label: 'On Target' };
  if (distance <= PERFORMANCE_DISTANCE_THRESHOLDS.CLOSE)
    return {
      color: COLORS.close,
      label: ratio < 1 ? 'Slight Under' : 'Slight Over',
    };
  if (distance <= PERFORMANCE_DISTANCE_THRESHOLDS.DRIFTING)
    return {
      color: COLORS.drifting,
      label: ratio < 1 ? 'Under' : 'Over',
    };
  return { color: COLORS.bad, label: ratio < 1 ? 'Way Under' : 'Way Over' };
}

function getFeedbackMessage(value: number, goal: number): string {
  if (value <= 0 || goal <= 0) return 'Add ingredients to see performance.';
  const ratio = value / goal;
  if (ratio < 0.6)
    return `At ${value.toFixed(1)}%, well below your ${goal}% target. Pricing may be too high — consider lowering prices.`;
  if (ratio < 0.85)
    return `At ${value.toFixed(1)}%, below your ${goal}% target. Strong margins, but you could be more competitive.`;
  if (ratio <= 1.15)
    return `At ${value.toFixed(1)}%, right around your ${goal}% target. Well balanced.`;
  if (ratio <= 1.35)
    return `At ${value.toFixed(1)}%, slightly above your ${goal}% target. Consider a small price increase.`;
  if (ratio <= 1.6)
    return `At ${value.toFixed(1)}%, above your ${goal}% target. Review pricing or ingredient costs.`;
  return `At ${value.toFixed(1)}%, significantly over your ${goal}% target. Raise the price or rework the recipe.`;
}

export default function PourCostPerformanceBar({
  pourCostPercentage,
  showLabels = true,
  noCard = false,
  className = '',
}: PourCostPerformanceBarProps) {
  const { pourCostGoal } = useAppStore();
  const colors = useThemeColors();

  const goal = pourCostGoal || 20;
  const ratio = pourCostPercentage > 0 ? pourCostPercentage / goal : 0;
  const perf = getPerformance(ratio);

  // Linear scale: 0 to 2x goal. Goal sits at 50%.
  const maxScale = goal * 2;
  const fillPercent = Math.min(
    Math.max((pourCostPercentage / maxScale) * 100, 0),
    100
  );
  const goalPercent = 50; // goal is always at the midpoint

  const content = (
    <View>
      {showLabels && (
        <View className="flex-row justify-between items-center mb-4">
          <Text
            className="text-base"
            style={{ color: colors.text, fontWeight: '500' }}
          >
            Pour Cost
          </Text>
          <Text
            className="text-base"
            style={{ color: perf.color, fontWeight: '500' }}
          >
            {pourCostPercentage.toFixed(1)}% — {perf.label}
          </Text>
        </View>
      )}

      {/* Bar */}
      <View className="relative">
        <View
          className="h-3 rounded-full overflow-hidden"
          style={{ backgroundColor: colors.inputBg }}
        >
          <View
            className="h-full rounded-full"
            style={{
              width: `${Math.max(fillPercent, 1)}%`,
              backgroundColor: perf.color,
            }}
          />
        </View>

        {/* Goal marker */}
        <View
          className="absolute"
          style={{
            left: `${goalPercent}%`,
            top: -2,
            bottom: -2,
            marginLeft: -1,
          }}
        >
          <View
            style={{
              width: 2,
              height: '100%',
              backgroundColor: colors.text,
              opacity: 0.35,
              borderRadius: 1,
            }}
          />
        </View>
      </View>

      {/* Scale */}
      <View className="relative mt-2" style={{ height: 16 }}>
        <Text
          className="absolute left-0 text-sm"
          style={{ color: colors.textTertiary }}
        >
          0%
        </Text>
        <View className="absolute items-center" style={{ left: 0, right: 0 }}>
          <Text
            className="text-sm font-medium"
            style={{ color: colors.textSecondary }}
          >
            {goal}%
          </Text>
        </View>
        <Text
          className="absolute right-0 text-sm"
          style={{ color: colors.textTertiary }}
        >
          {maxScale}%
        </Text>
      </View>

      {showLabels && (
        <Text
          className="mt-4 text-base leading-6"
          style={{ color: colors.text }}
        >
          {getFeedbackMessage(pourCostPercentage, goal)}
        </Text>
      )}
    </View>
  );

  if (noCard) return <View className={className}>{content}</View>;
  return (
    <Card displayClasses={className} padding="large">
      {content}
    </Card>
  );
}
