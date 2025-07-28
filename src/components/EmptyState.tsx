import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/contexts/ThemeContext';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  const { colors } = useThemeColors();
  return (
    <View className={`items-center justify-center py-12 px-6 ${className}`}>
      {/* Icon */}
      <View className="w-20 h-20 bg-g1/6 dark:bg-n1/90 rounded-full items-center justify-center mb-4">
        <Ionicons name={icon} size={40} color={colors.g2} />
      </View>

      {/* Title */}
      <Text className="text-xl font-semibold text-g4 dark:text-g1 mb-2 text-center">
        {title}
      </Text>

      {/* Description */}
      <Text className="text-g3 dark:text-g2 text-center mb-6 leading-relaxed">
        {description}
      </Text>

      {/* Action Button */}
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="bg-p2 px-6 py-3 rounded-lg active:bg-p3"
        >
          <Text className="text-white font-semibold text-base">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// Pre-configured empty states for common scenarios
export const EmptyIngredients = ({ onAdd }: { onAdd?: () => void }) => (
  <EmptyState
    icon="wine-outline"
    title="No Ingredients Yet"
    description="Start by adding your first ingredient to calculate cocktail costs and build your inventory."
    actionLabel="Add Ingredient"
    onAction={onAdd}
  />
);

export const EmptyCocktails = ({ onAdd }: { onAdd?: () => void }) => (
  <EmptyState
    icon="wine"
    title="No Cocktails Yet"
    description="Create your first cocktail recipe to calculate costs and pricing with your ingredients."
    actionLabel="Create Cocktail"
    onAction={onAdd}
  />
);

export const EmptySearch = ({ searchTerm }: { searchTerm: string }) => (
  <EmptyState
    icon="search-outline"
    title="No Results Found"
    description={`No items match "${searchTerm}". Try adjusting your search or adding new items.`}
  />
);

export const EmptyCalculations = () => (
  <EmptyState
    icon="calculator-outline"
    title="No Calculations Yet"
    description="Use the calculator to estimate ingredient costs and cocktail pricing."
  />
);
