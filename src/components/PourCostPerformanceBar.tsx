import { View, Text } from 'react-native';
import { useAppStore } from '@/src/stores/app-store';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import Card from './ui/Card';

interface PourCostPerformanceBarProps {
  pourCostPercentage: number;
  showLabels?: boolean;
  className?: string;
}

const COLORS = {
  onTarget: palette.G3,
  close: palette.Y3,
  drifting: palette.O4,
  bad: palette.R3,
};

function getPerformance(ratio: number) {
  if (ratio <= 0) return { color: COLORS.onTarget, label: 'On Target' };
  const distance = Math.abs(ratio - 1);
  if (distance <= 0.15) return { color: COLORS.onTarget, label: 'On Target' };
  if (distance <= 0.35) return { color: COLORS.close, label: ratio < 1 ? 'Under Target' : 'Over Target' };
  if (distance <= 0.6) return { color: COLORS.drifting, label: ratio < 1 ? 'Well Under' : 'Well Over' };
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
  className = '',
}: PourCostPerformanceBarProps) {
  const { pourCostGoal } = useAppStore();
  const colors = useThemeColors();

  const goal = pourCostGoal || 20;
  const ratio = pourCostPercentage > 0 ? pourCostPercentage / goal : 0;
  const perf = getPerformance(ratio);

  // Linear scale: 0 to 2x goal. Goal sits at 50%.
  const maxScale = goal * 2;
  const fillPercent = Math.min(Math.max((pourCostPercentage / maxScale) * 100, 0), 100);
  const goalPercent = 50; // goal is always at the midpoint

  return (
    <Card className={className} padding="large">
      <View>
        {showLabels && (
          <View className="flex-row justify-between items-center mb-3">
            <Text className="font-bold text-base" style={{ color: colors.text }}>
              Pour Cost
            </Text>
            <Text className="font-semibold text-base" style={{ color: perf.color }}>
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
            <View style={{ width: 2, height: '100%', backgroundColor: colors.text, opacity: 0.35, borderRadius: 1 }} />
          </View>
        </View>

        {/* Scale */}
        <View className="relative mt-1.5" style={{ height: 16 }}>
          <Text className="absolute left-0 text-xs" style={{ color: colors.textTertiary }}>0%</Text>
          <View className="absolute items-center" style={{ left: 0, right: 0 }}>
            <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>{goal}%</Text>
          </View>
          <Text className="absolute right-0 text-xs" style={{ color: colors.textTertiary }}>{maxScale}%</Text>
        </View>

        {showLabels && (
          <Text className="mt-3 text-base leading-8" style={{ color: colors.text }}>
            {getFeedbackMessage(pourCostPercentage, goal)}
          </Text>
        )}
      </View>
    </Card>
  );
}
