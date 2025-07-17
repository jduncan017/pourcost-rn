import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SwipeableCard from './SwipeableCard';
import CurrencyDisplay from './CurrencyDisplay';

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
            <Text className="text-sm text-gray-600">
              {ingredients.length} ingredients • {profitMargin.toFixed(0)}% margin
            </Text>
          </View>

          {/* Cost Summary */}
          <View className="items-end">
            <Text className="text-xs text-gray-500 mb-1">Total Cost</Text>
            <CurrencyDisplay 
              amount={totalCost} 
              currency={currency} 
              size="large" 
              weight="bold"
            />
          </View>
        </View>

        {/* Pricing Info */}
        <View className="bg-primary-50 p-3 rounded-lg mb-3 border border-primary-200">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-xs text-primary-600 font-medium">Suggested Price</Text>
              <CurrencyDisplay 
                amount={suggestedPrice} 
                currency={currency} 
                size="xl" 
                color="primary" 
                weight="bold"
              />
            </View>
            <View className="items-end">
              <Text className="text-xs text-primary-600">Profit</Text>
              <CurrencyDisplay 
                amount={suggestedPrice - totalCost} 
                currency={currency} 
                size="large" 
                color="primary" 
                weight="semibold"
              />
            </View>
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