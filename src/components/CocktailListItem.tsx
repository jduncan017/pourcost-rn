/**
 * CocktailListItem Component for PourCost-RN
 * Displays cocktail information in a list format with swipe actions
 */

import React from 'react';
import { View, Text } from 'react-native';
import SwipeableCard from './SwipeableCard';
import HighlightBox from './ui/HighlightBox';

export interface CocktailListItemData {
  name: string;
  ingredients: Array<{ name: string; amount: number; cost: number }>;
  totalCost: number;
  suggestedPrice: number;
  profitMargin: number;
  pourCostPercentage: number;
  currency?: string;
}

interface CocktailListItemProps {
  cocktail: CocktailListItemData;
  sortBy?: 'cost' | 'profitMargin' | 'costPercent' | 'name' | 'created';
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export default function CocktailListItem({
  cocktail,
  sortBy = 'created',
  onPress,
  onEdit,
  onDelete,
  className = '',
}: CocktailListItemProps) {
  // Return null if cocktail is not defined or invalid
  if (!cocktail || cocktail === null || cocktail === undefined) {
    return null;
  }

  // Get highlight box props based on sort order
  const getHighlightProps = () => {
    switch (sortBy) {
      case 'cost':
        return {
          label: 'Total Cost',
          value: `$${(cocktail.totalCost || 0).toFixed(2)}`,
          color: 'neutral' as const,
        };
      case 'profitMargin':
        return {
          label: 'Profit',
          value: `$${(cocktail.profitMargin || 0).toFixed(2)}`,
          color: 'success' as const,
        };
      case 'costPercent':
        return {
          label: 'Cost %',
          value: `${(cocktail.pourCostPercentage || 0).toFixed(1)}%`,
          color:
            (cocktail.pourCostPercentage || 0) <= 20
              ? ('success' as const)
              : (cocktail.pourCostPercentage || 0) <= 25
                ? ('warning' as const)
                : ('danger' as const),
        };
      case 'name':
      case 'created':
      default:
        // Default to Cost %
        return {
          label: 'Cost %',
          value: `${(cocktail.pourCostPercentage || 0).toFixed(1)}%`,
          color:
            (cocktail.pourCostPercentage || 0) <= 20
              ? ('success' as const)
              : (cocktail.pourCostPercentage || 0) <= 25
                ? ('warning' as const)
                : ('danger' as const),
        };
    }
  };

  const highlightProps = getHighlightProps();

  return (
    <SwipeableCard
      onPress={onPress}
      onSwipeLeft={onEdit}
      onSwipeRight={onDelete}
      className={className}
      variant="gradient"
    >
      <View style={{ minHeight: 60, justifyContent: 'center' }}>
        <View className="flex-row items-center gap-4">
          {/* Left Column - Title & Description */}
          <View className="flex-1 mr-3">
            {/* Title */}
            <Text
              className="text-n1 dark:text-n1 text-lg tracking-wide font-semibold mb-1"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {cocktail.name || 'Unknown Cocktail'}
            </Text>

            {/* Subtitle/Description - Ingredients */}
            <Text className="text-n1/70 dark:text-n1/70 text-sm" numberOfLines={2}>
              {cocktail.ingredients
                ?.map((ing) => ing?.name)
                .filter(Boolean)
                .join(', ') || 'No ingredients'}
            </Text>
          </View>

          {/* Right Column - Highlight Box */}
          <View className="flex-shrink-0">
            <HighlightBox {...highlightProps} />
          </View>
        </View>
      </View>
    </SwipeableCard>
  );
}