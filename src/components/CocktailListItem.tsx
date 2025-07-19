import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SwipeableCard from './SwipeableCard';
import CurrencyDisplay from './ui/CurrencyDisplay';

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
      <Pressable
        onPress={onPress}
        className="bg-white p-4 rounded-lg border border-gray-200 active:bg-gray-50"
      >
        {/* Header */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1 mr-3">
            <Text className="text-lg font-semibold text-gray-800 mb-1">
              {name}
            </Text>
          </View>

          {/* Dynamic Highlight Box */}
          <View className="bg-primary-50 px-3 py-2 rounded-lg border border-primary-200">
            {sortBy === 'profitMargin' || sortBy === 'margin' ? (
              <>
                <Text className="text-xs text-primary-600 font-medium">Profit</Text>
                <CurrencyDisplay 
                  amount={suggestedPrice - totalCost} 
                  currency={currency} 
                  size="large" 
                  color="primary" 
                  weight="bold"
                />
              </>
            ) : (
              <>
                <Text className="text-xs text-primary-600 font-medium">Total Cost</Text>
                <CurrencyDisplay 
                  amount={totalCost} 
                  currency={currency} 
                  size="large" 
                  color="primary" 
                  weight="bold"
                />
              </>
            )}
          </View>
        </View>

        {/* Ingredients List */}
        <View>
          <Text className="text-xs text-gray-500 font-medium mb-2">INGREDIENTS</Text>
          <Text className="text-sm text-gray-600 leading-relaxed">
            {ingredients.map(ing => ing.name).join(', ')}
          </Text>
        </View>
      </Pressable>
    </SwipeableCard>
  );
}