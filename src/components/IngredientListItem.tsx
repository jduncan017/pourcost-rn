import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IngredientListItemProps {
  name: string;
  bottleSize: number;
  bottlePrice: number;
  pourSize: number;
  costPerPour: number;
  currency: string;
  measurementSystem: 'US' | 'Metric';
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function IngredientListItem({
  name,
  bottleSize,
  bottlePrice,
  pourSize,
  costPerPour,
  currency,
  measurementSystem,
  onPress,
  onEdit,
  onDelete,
}: IngredientListItemProps) {
  const formatVolume = (volume: number) => {
    if (measurementSystem === 'US') {
      return `${(volume / 29.5735).toFixed(1)} fl oz`;
    }
    return `${volume.toFixed(0)}ml`;
  };

  const formatPourSize = (size: number) => {
    if (measurementSystem === 'US') {
      return `${size.toFixed(1)} fl oz`;
    }
    return `${(size * 29.5735).toFixed(0)}ml`;
  };

  return (
    <Pressable
      onPress={onPress}
      className="bg-white p-4 rounded-lg border border-gray-200 active:bg-gray-50"
    >
      {/* Main Content */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-lg font-semibold text-gray-800 mb-1">
            {name}
          </Text>
          <Text className="text-sm text-gray-600 mb-1">
            {formatVolume(bottleSize)} bottle • {currency}{bottlePrice.toFixed(2)}
          </Text>
          <Text className="text-xs text-gray-500">
            {formatPourSize(pourSize)} pour = {currency}{costPerPour.toFixed(2)}
          </Text>
        </View>

        {/* Cost Per Pour Highlight */}
        <View className="bg-primary-50 px-3 py-2 rounded-lg border border-primary-200">
          <Text className="text-xs text-primary-600 font-medium">Cost/Pour</Text>
          <Text className="text-lg font-bold text-primary-800">
            {currency}{costPerPour.toFixed(2)}
          </Text>
        </View>
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