/**
 * IngredientListItem Component for PourCost-RN
 * Displays ingredient information in a list format with swipe actions
 */

import { View, Text } from 'react-native';
import SwipeableCard from './SwipeableCard';
import { SavedIngredient, volumeLabel } from '@/src/types/models';
import {
  calculateCostPerOz,
  calculateCostPerPour,
  calculateSuggestedPrice,
  calculatePourCostPercentage,
} from '@/src/services/calculation-service';
import { useAppStore } from '@/src/stores/app-store';

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

  // Compute metrics on-demand
  const costPerOz = calculateCostPerOz(ingredient.productSize, ingredient.productCost);
  const isNotForSale = ingredient.notForSale === true;
  const costPerPour = isNotForSale ? 0 : calculateCostPerPour(ingredient.productSize, ingredient.productCost, defaultPourSize);
  const pourCostPercentage = defaultRetailPrice > 0 && !isNotForSale
    ? calculatePourCostPercentage(costPerPour, defaultRetailPrice)
    : 0;
  const pourCostMargin = isNotForSale ? 0 : defaultRetailPrice - costPerPour;

  // Highlight data based on sort — only for cost/pourCost/margin
  const getHighlight = (): { label: string; value: string; color: string } | null => {
    if (isNotForSale && sortBy !== 'cost') return null;

    switch (sortBy) {
      case 'cost':
        return { label: 'Cost/Oz', value: `$${(costPerOz || 0).toFixed(2)}`, color: 'text-n1' };
      case 'pourCost':
        return {
          label: 'Pour Cost',
          value: `${(pourCostPercentage || 0).toFixed(1)}%`,
          color: (pourCostPercentage || 0) <= 20
            ? 'text-s21'
            : (pourCostPercentage || 0) <= 25
              ? 'text-s12'
              : 'text-e1',
        };
      case 'margin':
        return { label: 'Margin', value: `$${(pourCostMargin || 0).toFixed(2)}`, color: 'text-n1' };
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
            className="text-n1 text-base tracking-wide font-semibold"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {ingredient.name || 'Unknown Ingredient'}
          </Text>
          <Text className="text-n1/70 text-sm mt-0.5" numberOfLines={1}>
            {ingredient.type || 'Unknown'} • {volumeLabel(ingredient.productSize)} • ${(ingredient.productCost || 0).toFixed(2)}
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
