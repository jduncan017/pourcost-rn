import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SwipeableCard from './SwipeableCard';
import CurrencyDisplay from './ui/CurrencyDisplay';
import HighlightBox from './ui/HighlightBox';

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
      <Pressable onPress={onPress} className="">
        {/* Main Content */}
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-lg font-semibold text-g4 dark:text-n1 mb-1">
              {name}
            </Text>
            <View className="flex-row items-center mb-1">
              <Text className="text-sm text-g3 dark:text-n1">
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
          {sortBy === 'cost' ? (
            <HighlightBox
              label="Cost/Oz"
              value={costPerOz}
              currency={currency}
              type="currency"
            />
          ) : sortBy === 'pourCost' ? (
            <HighlightBox
              label="Pour Cost"
              value={pourCostPercentage}
              type="percentage"
            />
          ) : sortBy === 'margin' ? (
            <HighlightBox
              label="Margin"
              value={pourCostMargin}
              currency={currency}
              type="currency"
            />
          ) : (
            <HighlightBox
              label="Cost/Pour"
              value={costPerPour}
              currency={currency}
              type="currency"
            />
          )}
        </View>
      </Pressable>
    </SwipeableCard>
  );
}
