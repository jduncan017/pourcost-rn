import { View, Text } from 'react-native';
import { useAppStore } from '@/src/stores/app-store';

interface PourCostPerformanceBarProps {
  pourCostPercentage: number;
  showLabels?: boolean;
  className?: string;
}

/**
 * Feedback messages based on how far the pour cost % is from the user's goal.
 * Uses percentage of the goal as the scale, not absolute %, so it adapts
 * to whatever target the user has set (15%, 20%, 25%, etc.).
 */
function getFeedbackMessage(value: number, goal: number): string {
  if (value <= 0 || goal <= 0) return 'Add ingredients to see performance.';

  const ratio = value / goal; // 1.0 = exactly at goal

  // Way below goal (< 60% of target) — pricing is very high
  if (ratio < 0.6) {
    return `At ${value.toFixed(1)}%, your pour cost is well below your ${goal}% target. Your pricing may be too high — consider lowering prices to drive more sales.`;
  }

  // Below goal (60-80% of target) — room to optimize
  if (ratio < 0.8) {
    return `At ${value.toFixed(1)}%, you're below your ${goal}% target. Strong margins — you could lower pricing slightly to be more competitive.`;
  }

  // Slightly below goal (80-95% of target) — great range
  if (ratio < 0.95) {
    return `At ${value.toFixed(1)}%, you're just under your ${goal}% target. Great balance between margin and value.`;
  }

  // At goal (95-105% of target) — on target
  if (ratio <= 1.05) {
    return `At ${value.toFixed(1)}%, you're right on your ${goal}% target.`;
  }

  // Slightly above goal (105-120% of target) — watch it
  if (ratio <= 1.2) {
    return `At ${value.toFixed(1)}%, you're slightly above your ${goal}% target. Consider a small price increase or a less expensive substitute.`;
  }

  // Above goal (120-150% of target) — needs attention
  if (ratio <= 1.5) {
    return `At ${value.toFixed(1)}%, you're above your ${goal}% target. Review your pricing or ingredient costs to improve margins.`;
  }

  // Way above goal (>150% of target) — profitability concern
  return `At ${value.toFixed(1)}%, you're significantly over your ${goal}% target. This item is eating into profits — raise the price or rework the recipe.`;
}

export default function PourCostPerformanceBar({
  pourCostPercentage,
  showLabels = true,
  className = '',
}: PourCostPerformanceBarProps) {
  const { pourCostGoal } = useAppStore();

  const goal = pourCostGoal || 20;
  const minValue = Math.max(goal * 0.25, 2);
  const maxValue = goal * 2.5;

  const middleRangeStart = goal - 10;
  const middleRangeEnd = goal + 10;

  const getBarPosition = (value: number): number => {
    if (value <= middleRangeStart) {
      const ratio =
        Math.log(value / minValue) / Math.log(middleRangeStart / minValue);
      return ratio * 15;
    } else if (value <= middleRangeEnd) {
      const ratio =
        (value - middleRangeStart) / (middleRangeEnd - middleRangeStart);
      return 15 + ratio * 70;
    } else {
      const ratio =
        Math.log(value / middleRangeEnd) / Math.log(maxValue / middleRangeEnd);
      return 85 + ratio * 15;
    }
  };

  const barPosition = Math.min(
    Math.max(getBarPosition(pourCostPercentage), 0),
    100
  );

  // Color based on ratio to goal
  const ratio = pourCostPercentage / goal;
  const getPerformanceColor = () => {
    if (ratio <= 1.05) return 'bg-s22';  // At or below goal — green
    if (ratio <= 1.2) return 'bg-s12';   // Slightly above — yellow
    return 'bg-e1';                       // Over — red
  };

  const getPerformanceTextColor = () => {
    if (ratio <= 1.05) return 'text-s22';
    if (ratio <= 1.2) return 'text-s12';
    return 'text-e1';
  };

  return (
    <View className={className}>
      <View>
        {showLabels && (
          <View className="flex-row justify-between mb-3">
            <Text className="text-g3 dark:text-g1 font-bold">
              Pour Cost Performance
            </Text>
            <Text
              className={`font-medium ${getPerformanceTextColor()}`}
            >
              {pourCostPercentage.toFixed(1)}% / {goal}% Target
            </Text>
          </View>
        )}

        <View className="h-5 bg-g1/80 rounded-full">
          <View
            className={`PerformanceBar h-full rounded-full ${getPerformanceColor()}`}
            style={{ width: `${barPosition}%` }}
          />
        </View>

        {showLabels && (
          <Text className="text-g3 dark:text-g2 mt-4 text-sm">
            {getFeedbackMessage(pourCostPercentage, goal)}
          </Text>
        )}
      </View>
    </View>
  );
}
