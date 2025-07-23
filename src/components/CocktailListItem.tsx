import { View, Text, Pressable } from 'react-native';
import SwipeableCard from './SwipeableCard';
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
      <Pressable onPress={onPress} className="flex-row items-start gap-3">
        {/* Left Column - Title & Description */}
        <View className="flex-1">
          <Text className="text-lg font-semibold text-g4 dark:text-n1 mb-2">
            {name}
          </Text>

          {/* Ingredients List */}
          <View>
            <Text className="text-xs text-g3 dark:text-n1 font-medium mb-1">
              INGREDIENTS
            </Text>
            <Text className="text-sm text-g3 dark:text-g1 leading-relaxed">
              {ingredients.map((ing) => ing.name).join(', ')}
            </Text>
          </View>
        </View>

        {/* Right Column - Highlight Box */}
        <View className="w-20">
          {sortBy === 'profitMargin' || sortBy === 'margin' ? (
            <HighlightBox
              label="Profit"
              value={suggestedPrice - totalCost}
              currency={currency}
              type="currency"
              size="small"
            />
          ) : (
            <HighlightBox
              label="Total Cost"
              value={totalCost}
              currency={currency}
              type="currency"
              size="small"
            />
          )}
        </View>
      </Pressable>
    </SwipeableCard>
  );
}
