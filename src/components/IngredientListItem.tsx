/**
 * IngredientListItem Component for PourCost-RN
 * Displays ingredient information in a list format with swipe actions
 */

import React from 'react';
import { View, Text } from 'react-native';
import SwipeableCard from './SwipeableCard';
import HighlightBox from './ui/HighlightBox';

export interface IngredientListItemData {
  name: string;
  bottleSize: number;
  bottlePrice: number;
  pourSize: number;
  costPerPour: number;
  costPerOz: number;
  pourCostMargin: number;
  pourCostPercentage: number;
  currency: string;
  type?: string;
}

interface IngredientListItemProps {
  ingredient: IngredientListItemData;
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
  // Return null if ingredient is not defined or invalid
  if (!ingredient || ingredient === null || ingredient === undefined) {
    return null;
  }

  // Get highlight box props based on sort order
  const getHighlightProps = () => {
    switch (sortBy) {
      case 'cost':
        return {
          label: 'Cost/Oz',
          value: `$${(ingredient.costPerOz || 0).toFixed(2)}`,
          color: 'neutral' as const,
        };
      case 'pourCost':
        return {
          label: 'Pour Cost',
          value: `${(ingredient.pourCostPercentage || 0).toFixed(1)}%`,
          color:
            (ingredient.pourCostPercentage || 0) <= 20
              ? ('success' as const)
              : (ingredient.pourCostPercentage || 0) <= 25
                ? ('warning' as const)
                : ('danger' as const),
        };
      case 'margin':
        return {
          label: 'Margin',
          value: `$${(ingredient.pourCostMargin || 0).toFixed(2)}`,
          color: 'success' as const,
        };
      case 'name':
      default:
        return {
          label: 'Pour Size',
          value: `${ingredient.pourSize || 0}oz`,
          color: 'neutral' as const,
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
              {ingredient.name || 'Unknown Ingredient'}
            </Text>

            {/* Subtitle/Description - Type, Size, Price */}
            <Text className="text-n1/70 dark:text-n1/70 text-sm" numberOfLines={2}>
              {ingredient.type || 'Unknown'} • {ingredient.bottleSize || 0}ml • $
              {(ingredient.bottlePrice || 0).toFixed(2)}
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