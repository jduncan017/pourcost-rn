import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SwipeableCard from './SwipeableCard';
import CurrencyDisplay from './ui/CurrencyDisplay';
import HighlightBox from './ui/HighlightBox';

interface CocktailIngredient {
  name: string;
  amount: number;
  cost: number;
}

interface CocktailListItemProps {
  name: string;
  ingredients: CocktailIngredient[];
  totalCost: number;
  suggestedPrice: number;
  profitMargin: number;
  currency: string;
  sortBy?: 'cost' | 'profitMargin' | 'margin' | 'name' | 'created';
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function CocktailListItem({
  name,
  ingredients,
  totalCost,
  suggestedPrice,
  profitMargin,
  currency,
  sortBy = 'created',
  onPress,
  onEdit,
  onDelete,
}: CocktailListItemProps) {
  return (
    <SwipeableCard
      onSwipeLeft={onEdit}
      onSwipeRight={onDelete}
      className="mb-3"
    >
      <Pressable onPress={onPress} className="">
        {/* Header */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1 mr-3">
            <Text className="text-lg font-semibold text-g4 dark:text-n1 mb-1">
              {name}
            </Text>
          </View>

          {/* Dynamic Highlight Box */}
          {sortBy === 'profitMargin' || sortBy === 'margin' ? (
            <HighlightBox
              label="Profit"
              value={suggestedPrice - totalCost}
              currency={currency}
              type="currency"
            />
          ) : (
            <HighlightBox
              label="Total Cost"
              value={totalCost}
              currency={currency}
              type="currency"
            />
          )}
        </View>

        {/* Ingredients List */}
        <View>
          <Text className="text-xs text-g3 dark:text-n1 font-medium mb-2">
            INGREDIENTS
          </Text>
          <Text className="text-sm text-g3 dark:text-n1 leading-relaxed">
            {ingredients.map((ing) => ing.name).join(', ')}
          </Text>
        </View>
      </Pressable>
    </SwipeableCard>
  );
}
