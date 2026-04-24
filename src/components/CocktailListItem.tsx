/**
 * CocktailListItem Component for PourCost-RN
 * Displays cocktail information in a list format with swipe actions.
 * In selection mode, swipe is replaced with a checkbox + tap-to-toggle.
 */

import { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SwipeableCard from './SwipeableCard';
import Card from './ui/Card';
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
  selectionMode?: boolean;
  selected?: boolean;
  onSelectionToggle?: () => void;
}

export default function CocktailListItem({
  cocktail,
  sortBy = 'name',
  onPress,
  onEdit,
  onDelete,
  className = '',
  selectionMode = false,
  selected = false,
  onSelectionToggle,
}: CocktailListItemProps) {
  if (!cocktail) return null;

  const colors = useThemeColors();
  const metrics = useMemo(
    () => calculateCocktailMetrics(cocktail.ingredients || [], undefined, cocktail.retailPrice),
    [cocktail.ingredients, cocktail.retailPrice]
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

  const body = (
    <View className="flex-row items-center gap-3">
      {selectionMode && (
        <View
          className="w-6 h-6 rounded-full items-center justify-center"
          style={{
            backgroundColor: selected ? colors.accent : 'transparent',
            borderWidth: 2,
            borderColor: selected ? colors.accent : colors.border,
          }}
        >
          {selected && (
            <Ionicons name="checkmark" size={14} color={colors.colors.N1} />
          )}
        </View>
      )}

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

      {/* Right - Metric or chevron. Hidden in selection mode. */}
      {!selectionMode &&
        (highlight ? (
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
        ))}
    </View>
  );

  if (selectionMode) {
    return (
      <Pressable
        onPress={onSelectionToggle}
        className={className}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Card padding="medium">
          {body}
        </Card>
      </Pressable>
    );
  }

  return (
    <SwipeableCard
      onPress={onPress}
      onSwipeLeft={onEdit}
      onSwipeRight={onDelete}
      className={className}
      variant="gradient"
      padding="medium"
    >
      {body}
    </SwipeableCard>
  );
}
