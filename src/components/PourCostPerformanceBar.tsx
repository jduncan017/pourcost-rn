import React from 'react';
import { View, Text } from 'react-native';
import { useAppStore } from '@/src/stores/app-store';

interface PourCostPerformanceBarProps {
  pourCostPercentage: number;
  showLabels?: boolean;
  className?: string;
}

/**
 * Reusable pour cost performance bar with logarithmic scaling
 * Centers on the global pour cost goal with smart scaling:
 * - Middle 30% of bar: ±10% around goal (most common range)
 * - Outer 40% on each side: Logarithmically scaled for extreme values
 */
export default function PourCostPerformanceBar({ 
  pourCostPercentage, 
  showLabels = true, 
  className = "" 
}: PourCostPerformanceBarProps) {
  const { pourCostGoal } = useAppStore();
  
  // Calculate scale points around the goal
  const goal = pourCostGoal || 20;
  const minValue = Math.max(goal * 0.25, 2); // 25% of goal, minimum 2%
  const maxValue = goal * 2.5; // 250% of goal
  
  // Middle range (±10% around goal) gets 30% of bar space
  const middleRangeStart = goal - 10;
  const middleRangeEnd = goal + 10;
  
  // Calculate bar position with logarithmic scaling
  const getBarPosition = (value: number): number => {
    if (value <= middleRangeStart) {
      // Left side: logarithmic compression (0% to 15% of bar)
      const ratio = Math.log(value / minValue) / Math.log(middleRangeStart / minValue);
      return ratio * 15;
    } else if (value <= middleRangeEnd) {
      // Middle range: linear scaling (15% to 85% of bar)
      const ratio = (value - middleRangeStart) / (middleRangeEnd - middleRangeStart);
      return 15 + (ratio * 70);
    } else {
      // Right side: logarithmic compression (85% to 100% of bar)
      const ratio = Math.log(value / middleRangeEnd) / Math.log(maxValue / middleRangeEnd);
      return 85 + (ratio * 15);
    }
  };
  
  const barPosition = Math.min(Math.max(getBarPosition(pourCostPercentage), 0), 100);
  
  // Get color based on performance relative to goal
  const getPerformanceColor = (value: number) => {
    const deviation = Math.abs(value - goal);
    if (deviation <= 3) return 'bg-s22'; // Within 3% of goal
    if (deviation <= 7) return 'bg-s12'; // Within 7% of goal  
    return 'bg-e2'; // More than 7% away from goal
  };
  
  const getPerformanceTextColor = (value: number) => {
    const deviation = Math.abs(value - goal);
    if (deviation <= 3) return 'text-s22';
    if (deviation <= 7) return 'text-s12';
    return 'text-e3';
  };
  
  // Generate feedback message
  const getFeedbackMessage = (value: number) => {
    const deviation = value - goal;
    if (Math.abs(deviation) <= 2) {
      return `Perfect! Right at your ${goal}% goal.`;
    } else if (deviation < 0) {
      return `Excellent! ${Math.abs(deviation).toFixed(1)}% below your goal.`;
    } else if (deviation <= 5) {
      return `Above goal by ${deviation.toFixed(1)}%. Consider adjusting price.`;
    } else {
      return `Significantly above goal. Consider raising price for better profitability.`;
    }
  };
  
  return (
    <View className={className}>
      <View className="mb-3">
        {showLabels && (
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-g3">Pour Cost Performance</Text>
            <Text className={`text-sm font-medium ${getPerformanceTextColor(pourCostPercentage)}`}>
              {pourCostPercentage.toFixed(1)}% vs {goal}% goal
            </Text>
          </View>
        )}
        
        <View className="h-3 bg-g1/80 rounded-full overflow-hidden">
          <View 
            className={`h-full rounded-full ${getPerformanceColor(pourCostPercentage)}`}
            style={{ width: `${barPosition}%` }}
          />
        </View>
        
        {showLabels && (
          <>
            <View className="flex-row justify-between mt-1">
              <Text className="text-xs text-g3">{minValue.toFixed(0)}%</Text>
              <Text className="text-xs text-g3">{goal}% (goal)</Text>
              <Text className="text-xs text-g3">{maxValue.toFixed(0)}%</Text>
            </View>
            
            <Text className="text-xs text-g3 mt-2">
              {getFeedbackMessage(pourCostPercentage)}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}