/**
 * CocktailListItem Component for PourCost-RN
 * Displays cocktail information in a list format with swipe actions
 */

import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SwipeableCard from './SwipeableCard';
import { Cocktail } from '@/src/types/models';
import { calculateCocktailMetrics, formatCurrency, formatPercentage } from '@/src/services/calculation-service';
import { useThemeColors } from '@/src/contexts/ThemeContext';

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

  const colors = useThemeColors();
  const metrics = useMemo(
    () => calculateCocktailMetrics(cocktail.ingredients || []),
    [cocktail.ingredients]
  );

  // Highlight data — only for cost/costPercent/profitMargin
  const getHighlight = (): { label: string; value: string; color: string } | null => {
    switch (sortBy) {
      case 'cost':
        return { label: 'Cost', value: formatCurrency(metrics.totalCost || 0), color: colors.text };
      case 'costPercent':
        return {
          label: 'Cost %',
          value: formatPercentage(metrics.pourCostPercentage || 0),
          color: (metrics.pourCostPercentage || 0) <= 20
            ? colors.success
            : (metrics.pourCostPercentage || 0) <= 28
              ? colors.warning
              : colors.error,
        };
      case 'profitMargin':
        return { label: 'Margin', value: formatCurrency(metrics.profitMargin || 0), color: colors.text };
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
            className="text-base tracking-wide"
            style={{ color: colors.text, fontWeight: '600' }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {cocktail.name || 'Unknown Cocktail'}
          </Text>
          <Text className="text-sm mt-0.5" style={{ color: colors.textTertiary }} numberOfLines={1}>
            {cocktail.ingredients
              ?.map((ing) => ing?.name)
              .filter(Boolean)
              .join(', ') || 'No ingredients'}
          </Text>
        </View>

        {/* Right - Metric or chevron */}
        {highlight ? (
          <View className="pl-3.5 items-center" style={{ borderLeftWidth: 1, borderLeftColor: colors.border }}>
            <Text className="text-sm" style={{ color: colors.textTertiary }}>{highlight.label}</Text>
            <Text
              className="text-base"
              style={{ fontWeight: '700', color: highlight.color }}
            >
              {highlight.value}
            </Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        )}
      </View>
    </SwipeableCard>
  );
}
