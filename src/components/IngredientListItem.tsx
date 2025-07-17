import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SwipeableCard from './SwipeableCard';
import CurrencyDisplay from './CurrencyDisplay';

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
    <SwipeableCard
      onSwipeLeft={onEdit}
      onSwipeRight={onDelete}
      className="mb-3"
    >
      <Pressable
        onPress={onPress}
        className="bg-white p-4 rounded-lg border border-gray-200 active:bg-gray-50"
      >
        {/* Main Content */}
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-lg font-semibold text-gray-800 mb-1">
              {name}
            </Text>
            <View className="flex-row items-center mb-1">
              <Text className="text-sm text-gray-600">
                {formatVolume(bottleSize)} bottle • 
              </Text>
              <CurrencyDisplay 
                amount={bottlePrice} 
                currency={currency} 
                size="small" 
                className="ml-1"
              />
            </View>
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-500">
                {formatPourSize(pourSize)} pour = 
              </Text>
              <CurrencyDisplay 
                amount={costPerPour} 
                currency={currency} 
                size="small" 
                className="ml-1"
              />
            </View>
          </View>

          {/* Cost Per Pour Highlight */}
          <View className="bg-primary-50 px-3 py-2 rounded-lg border border-primary-200">
            <Text className="text-xs text-primary-600 font-medium">Cost/Pour</Text>
            <CurrencyDisplay 
              amount={costPerPour} 
              currency={currency} 
              size="large" 
              color="primary" 
              weight="bold"
            />
          </View>
        </View>
      </Pressable>
    </SwipeableCard>
  );
}