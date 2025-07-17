import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
          <Text className="text-lg font-bold text-gray-800">
            {currency}{totalCost.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Pricing Info */}
      <View className="bg-primary-50 p-3 rounded-lg mb-3 border border-primary-200">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xs text-primary-600 font-medium">Suggested Price</Text>
            <Text className="text-xl font-bold text-primary-800">
              {currency}{suggestedPrice.toFixed(2)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-xs text-primary-600">Profit</Text>
            <Text className="text-lg font-semibold text-primary-700">
              {currency}{(suggestedPrice - totalCost).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Ingredients List */}
      <View className="mb-3">
        <Text className="text-xs text-gray-500 font-medium mb-2">INGREDIENTS</Text>
        <Text className="text-sm text-gray-600 leading-relaxed">
          {ingredients.map(ing => ing.name).join(', ')}
        </Text>
      </View>

      {/* Action Buttons */}
      {(onEdit || onDelete) && (
        <View className="flex-row justify-end space-x-3 pt-3 border-t border-gray-100">
          {onEdit && (
            <Pressable
              onPress={onEdit}
              className="flex-row items-center px-3 py-2 bg-gray-100 rounded-lg active:bg-gray-200"
            >
              <Ionicons name="pencil" size={16} color="#6B7280" />
              <Text className="text-gray-600 text-sm font-medium ml-1">Edit</Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              onPress={onDelete}
              className="flex-row items-center px-3 py-2 bg-red-50 rounded-lg active:bg-red-100"
            >
              <Ionicons name="trash" size={16} color="#DC2626" />
              <Text className="text-red-600 text-sm font-medium ml-1">Delete</Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}