/**
 * IngredientListItem Component for PourCost-RN
 * Displays ingredient information in a list format with swipe actions
 */

import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SwipeableCard from './SwipeableCard';
import { SavedIngredient, volumeLabel } from '@/src/types/models';
import {
  calculateCostPerOz,
  calculateCostPerPour,
  calculatePourCostPercentage,
  formatCurrency,
  formatPercentage,
} from '@/src/services/calculation-service';
import { useAppStore } from '@/src/stores/app-store';
import { useThemeColors } from '@/src/contexts/ThemeContext';

interface IngredientListItemProps {
  ingredient: SavedIngredient;
  sortBy?: 'cost' | 'pourCost' | 'margin' | 'name' | 'created';
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export default function IngredientListItem({
  ingredient,
  sortBy = 'name',
  onPress,
  onEdit,
  onDelete,
  className = '',
}: IngredientListItemProps) {
  if (!ingredient) return null;

  const { defaultPourSize, defaultRetailPrice } = useAppStore();
  const colors = useThemeColors();

  // Use per-ingredient overrides, fall back to global defaults
  const effectivePourSize = ingredient.pourSize ?? defaultPourSize;
  const effectiveRetailPrice = ingredient.retailPrice ?? defaultRetailPrice;
  const isNotForSale = ingredient.notForSale === true;

  // Memoize calculations — only recompute when inputs change
  const { costPerOz, costPerPour, pourCostPercentage, pourCostMargin } = useMemo(() => {
    const cpo = calculateCostPerOz(ingredient.productSize, ingredient.productCost);
    const cpp = isNotForSale ? 0 : calculateCostPerPour(ingredient.productSize, ingredient.productCost, effectivePourSize);
    const pcp = effectiveRetailPrice > 0 && !isNotForSale ? calculatePourCostPercentage(cpp, effectiveRetailPrice) : 0;
    const pcm = isNotForSale ? 0 : effectiveRetailPrice - cpp;
    return { costPerOz: cpo, costPerPour: cpp, pourCostPercentage: pcp, pourCostMargin: pcm };
  }, [ingredient.productSize, ingredient.productCost, effectivePourSize, effectiveRetailPrice, isNotForSale]);

  // Highlight data based on sort — only for cost/pourCost/margin
  const getHighlight = (): {
    label: string;
    value: string;
    color: string;
  } | null => {
    if (isNotForSale && sortBy !== 'cost') return null;

    switch (sortBy) {
      case 'cost':
        return {
          label: 'Cost/Oz',
          value: formatCurrency(costPerOz || 0),
          color: colors.text,
        };
      case 'pourCost':
        return {
          label: 'Pour Cost',
          value: formatPercentage(pourCostPercentage || 0),
          color:
            (pourCostPercentage || 0) <= 20
              ? colors.success
              : (pourCostPercentage || 0) <= 28
                ? colors.warning
                : colors.error,
        };
      case 'margin':
        return {
          label: 'Margin',
          value: formatCurrency(pourCostMargin || 0),
          color: colors.text,
        };
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
        {/* Left - Name & details */}
        <View className="flex-1">
          <Text
            className="text-base tracking-wide"
            style={{ color: colors.text, fontWeight: '600' }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {ingredient.name || 'Unknown Ingredient'}
          </Text>
          <Text
            className="text-sm mt-0.5"
            style={{ color: colors.textTertiary }}
            numberOfLines={1}
          >
            {ingredient.type || 'Unknown'} •{' '}
            {volumeLabel(ingredient.productSize)} •{' '}
            {formatCurrency(ingredient.productCost || 0)}
          </Text>
        </View>

        {/* Right - Metric or chevron */}
        {highlight ? (
          <View
            className="pl-3.5 items-center"
            style={{ borderLeftWidth: 1, borderLeftColor: colors.border }}
          >
            <Text className="text-sm" style={{ color: colors.textTertiary }}>
              {highlight.label}
            </Text>
            <Text
              className="text-base"
              style={{ fontWeight: '700', color: highlight.color }}
            >
              {highlight.value}
            </Text>
          </View>
        ) : (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textTertiary}
          />
        )}
      </View>
    </SwipeableCard>
  );
}
