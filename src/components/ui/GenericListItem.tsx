/**
 * GenericListItem Component for PourCost-RN
 * Consolidates IngredientListItem and CocktailListItem patterns
 * Provides a unified interface for displaying list items with consistent styling
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import SwipeableCard from '../SwipeableCard';
import HighlightBox, { HighlightBoxProps } from './HighlightBox';

export interface GenericListItemProps<T> {
  /** The data item to display */
  item: T;
  
  /** How the list is currently sorted (affects highlight display) */
  sortBy?: string;
  
  /** Function to render the main title */
  renderTitle: (item: T) => string;
  
  /** Function to render subtitle/description (optional) */
  renderSubtitle?: (item: T) => React.ReactNode;
  
  /** Function to render the highlight box content */
  renderHighlight: (item: T, sortBy?: string) => HighlightBoxProps;
  
  /** Press handler for the main item */
  onPress?: () => void;
  
  /** Edit action handler */
  onEdit?: () => void;
  
  /** Delete action handler */
  onDelete?: () => void;
  
  /** Additional styles */
  className?: string;
}

/**
 * Generic list item component that can handle any data type
 */
export default function GenericListItem<T>({
  item,
  sortBy,
  renderTitle,
  renderSubtitle,
  renderHighlight,
  onPress,
  onEdit,
  onDelete,
  className = '',
}: GenericListItemProps<T>) {
  
  // Get highlight box props from render function
  const highlightProps = renderHighlight(item, sortBy);
  
  return (
    <SwipeableCard
      onSwipeLeft={onEdit}
      onSwipeRight={onDelete}
      className={className}
    >
      <Pressable
        onPress={onPress}
        className="flex-1"
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <View className="flex-row items-center">
          {/* Left Column - Title & Description */}
          <View className="flex-1 mr-3">
            {/* Title */}
            <Text 
              className="text-g4 dark:text-n1 text-base font-medium mb-1"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {renderTitle(item)}
            </Text>
            
            {/* Subtitle/Description */}
            {renderSubtitle && (
              <View className="mb-1">
                {renderSubtitle(item)}
              </View>
            )}
          </View>
          
          {/* Right Column - Highlight Box */}
          <View className="flex-shrink-0">
            <HighlightBox {...highlightProps} />
          </View>
        </View>
      </Pressable>
    </SwipeableCard>
  );
}

// Convenience wrapper components for common patterns

/**
 * Ingredient-specific list item using GenericListItem
 */
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

export const IngredientListItem = ({
  ingredient,
  sortBy = 'name',
  onPress,
  onEdit,
  onDelete,
}: {
  ingredient: IngredientListItemData;
  sortBy?: 'cost' | 'pourCost' | 'margin' | 'name' | 'created';
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) => {
  return (
    <GenericListItem
      item={ingredient}
      sortBy={sortBy}
      renderTitle={(item) => item.name}
      renderSubtitle={(item) => (
        <Text className="text-sm text-g3 dark:text-g2">
          {item.type} • {item.bottleSize}ml • ${item.bottlePrice.toFixed(2)}
        </Text>
      )}
      renderHighlight={(item, currentSortBy) => {
        switch (currentSortBy) {
          case 'cost':
            return {
              label: 'Cost/Oz',
              value: `$${item.costPerOz.toFixed(2)}`,
              color: 'neutral',
            };
          case 'pourCost':
            return {
              label: 'Pour Cost',
              value: `${item.pourCostPercentage.toFixed(1)}%`,
              color: item.pourCostPercentage <= 20 ? 'success' : 
                     item.pourCostPercentage <= 25 ? 'warning' : 'danger',
            };
          case 'margin':
            return {
              label: 'Margin',
              value: `$${item.pourCostMargin.toFixed(2)}`,
              color: 'success',
            };
          case 'name':
          default:
            return {
              label: 'Pour Size',
              value: `${item.pourSize}oz`,
              color: 'neutral',
            };
        }
      }}
      onPress={onPress}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
};

/**
 * Cocktail-specific list item using GenericListItem
 */
export interface CocktailListItemData {
  name: string;
  ingredients: Array<{ name: string; amount: number; cost: number }>;
  totalCost: number;
  suggestedPrice: number;
  profitMargin: number;
  pourCostPercentage: number; // Add cost percentage
  currency?: string;
}

export const CocktailListItem = ({
  cocktail,
  sortBy = 'created',
  onPress,
  onEdit,
  onDelete,
}: {
  cocktail: CocktailListItemData;
  sortBy?: 'cost' | 'profitMargin' | 'costPercent' | 'name' | 'created';
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) => {
  return (
    <GenericListItem
      item={cocktail}
      sortBy={sortBy}
      renderTitle={(item) => item.name}
      renderSubtitle={(item) => (
        <Text className="text-sm text-g3 dark:text-g2" numberOfLines={1}>
          {item.ingredients.map(ing => ing.name).join(', ')}
        </Text>
      )}
      renderHighlight={(item, currentSortBy) => {
        switch (currentSortBy) {
          case 'cost':
            return {
              label: 'Total Cost',
              value: `$${item.totalCost.toFixed(2)}`,
              color: 'neutral',
            };
          case 'profitMargin':
            return {
              label: 'Profit',
              value: `$${item.profitMargin.toFixed(2)}`,
              color: 'success',
            };
          case 'costPercent':
            return {
              label: 'Cost %',
              value: `${item.pourCostPercentage.toFixed(1)}%`,
              color: item.pourCostPercentage <= 20 ? 'success' : 
                     item.pourCostPercentage <= 25 ? 'warning' : 'danger',
            };
          case 'name':
          case 'created':
          default:
            // Default to Cost % instead of ingredients
            return {
              label: 'Cost %',
              value: `${item.pourCostPercentage.toFixed(1)}%`,
              color: item.pourCostPercentage <= 20 ? 'success' : 
                     item.pourCostPercentage <= 25 ? 'warning' : 'danger',
            };
        }
      }}
      onPress={onPress}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
};