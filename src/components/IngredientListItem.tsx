import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SwipeableCard from './SwipeableCard';
import CurrencyDisplay from './ui/CurrencyDisplay';

interface IngredientListItemProps {
  name: string;
  bottleSize: number;
  bottlePrice: number;
  pourSize: number;
  costPerPour: number;
  costPerOz: number;
  pourCostMargin: number;
  pourCostPercentage: number;
  currency: string;
  measurementSystem: 'US' | 'Metric';
  sortBy?: 'cost' | 'pourCost' | 'margin' | 'name' | 'created';
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
  costPerOz,
  pourCostMargin,
  pourCostPercentage,
  currency,
  measurementSystem,
  sortBy = 'name',
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
          </View>

          {/* Dynamic Highlight Box */}
          <View className="bg-primary-50 px-3 py-2 rounded-lg border border-primary-200">
            {sortBy === 'cost' ? (
              <>
                <Text className="text-xs text-primary-600 font-medium">Cost/Oz</Text>
                <CurrencyDisplay 
                  amount={costPerOz} 
                  currency={currency} 
                  size="large" 
                  color="primary" 
                  weight="bold"
                />
              </>
            ) : sortBy === 'pourCost' ? (
              <>
                <Text className="text-xs text-primary-600 font-medium">Pour Cost</Text>
                <Text className="text-lg font-bold text-primary-600">
                  {pourCostPercentage.toFixed(1)}%
                </Text>
              </>
            ) : sortBy === 'margin' ? (
              <>
                <Text className="text-xs text-primary-600 font-medium">Margin</Text>
                <CurrencyDisplay 
                  amount={pourCostMargin} 
                  currency={currency} 
                  size="large" 
                  color="primary" 
                  weight="bold"
                />
              </>
            ) : (
              <>
                <Text className="text-xs text-primary-600 font-medium">Cost/Pour</Text>
                <CurrencyDisplay 
                  amount={costPerPour} 
                  currency={currency} 
                  size="large" 
                  color="primary" 
                  weight="bold"
                />
              </>
            )}
          </View>
        </View>
      </Pressable>
    </SwipeableCard>
  );
}