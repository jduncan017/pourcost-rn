/**
 * CocktailListItem Component for PourCost-RN
 * Displays cocktail information in a list format with swipe actions
 */

import { View, Text } from 'react-native';
import SwipeableCard from './SwipeableCard';
import { Cocktail } from '@/src/types/models';
import { calculateCocktailMetrics, formatCurrency, formatPercentage } from '@/src/services/calculation-service';

interface CocktailListItemProps {
  cocktail: Cocktail;
  sortBy?: 'cost' | 'profitMargin' | 'costPercent' | 'name' | 'created';
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export default function CocktailListItem({
  cocktail,
  sortBy = 'name',
  onPress,
  onEdit,
  onDelete,
  className = '',
}: CocktailListItemProps) {
  if (!cocktail) return null;

  const metrics = calculateCocktailMetrics(cocktail.ingredients || []);

  // Highlight data — only for cost/costPercent/profitMargin
  const getHighlight = (): { label: string; value: string; color: string } | null => {
    switch (sortBy) {
      case 'cost':
        return { label: 'Cost', value: formatCurrency(metrics.totalCost || 0), color: 'text-n1' };
      case 'costPercent':
        return {
          label: 'Cost %',
          value: formatPercentage(metrics.pourCostPercentage || 0),
          color: (metrics.pourCostPercentage || 0) <= 20
            ? 'text-s21'
            : (metrics.pourCostPercentage || 0) <= 25
              ? 'text-s12'
              : 'text-e1',
        };
      case 'profitMargin':
        return { label: 'Margin', value: formatCurrency(metrics.profitMargin || 0), color: 'text-n1' };
      default:
        return null;
    }
  };

  const highlight = getHighlight();

  return (
    <SwipeableCard
      onPress={onPress}
      onSwipeLeft={onEdit}
      onSwipeRight={onDelete}
      className={className}
      variant="gradient"
      padding="medium"
    >
      <View className="flex-row items-center gap-3">
        {/* Left - Name & ingredients */}
        <View className="flex-1">
          <Text
            className="text-n1 text-base tracking-wide font-semibold"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {cocktail.name || 'Unknown Cocktail'}
          </Text>
          <Text className="text-n1/70 text-sm mt-0.5" numberOfLines={1}>
            {cocktail.ingredients
              ?.map((ing) => ing?.name)
              .filter(Boolean)
              .join(', ') || 'No ingredients'}
          </Text>
        </View>

        {/* Right - Metric with left border accent */}
        {highlight && (
          <View className="border-l border-g2/20 pl-3.5 items-center">
            <Text className="text-n1/80 text-sm">{highlight.label}</Text>
            <Text
              className={`text-base ${highlight.color}`}
              style={{ fontWeight: '700' }}
            >
              {highlight.value}
            </Text>
          </View>
        )}
      </View>
    </SwipeableCard>
  );
}
