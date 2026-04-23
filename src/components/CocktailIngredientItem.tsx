import { View, Text } from 'react-native';
import Card from './ui/Card';
import PourSizePicker from './ui/PourSizePicker';
import { CocktailIngredient, Volume } from '@/src/types/models';
import { calculateCostPerOz, formatCurrency } from '@/src/services/calculation-service';
import { useThemeColors } from '@/src/contexts/ThemeContext';

interface CocktailIngredientItemProps {
  ingredient: CocktailIngredient;
  /** Removal happens through the Edit flow (ingredient selector), not inline —
   *  kept in the prop list for backwards compat with callers still passing it. */
  onRemove: (ingredientId: string) => void;
  /** Called with the full Volume so unit info (dash, bspn, unit) survives. */
  onUpdateAmount: (ingredientId: string, volume: Volume) => void;
}

export default function CocktailIngredientItem({
  ingredient,
  onUpdateAmount,
}: CocktailIngredientItemProps) {
  const colors = useThemeColors();
  const costPerOz = calculateCostPerOz(
    ingredient.productSize,
    ingredient.productCost
  );

  return (
    <Card padding="medium">
      <View className="CocktailIngredientItem">
        {/* Header row: name + cost */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-4">
            <Text
              className="text-lg"
              style={{ fontWeight: '600', color: colors.text }}
              numberOfLines={1}
            >
              {ingredient.name}
            </Text>
            <Text
              className="text-sm mt-1"
              style={{ color: colors.textTertiary }}
            >
              {formatCurrency(costPerOz)}/oz
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-xs" style={{ color: colors.textTertiary }}>
              Pour Cost
            </Text>
            <Text
              className="text-lg"
              style={{ fontWeight: '700', color: colors.gold }}
            >
              {formatCurrency(ingredient.cost)}
            </Text>
          </View>
        </View>

        {/* Pour size picker — shared component, dashes/bspns/units supported */}
        <PourSizePicker
          value={ingredient.pourSize}
          onChange={(v) => onUpdateAmount(ingredient.ingredientId, v)}
        />
      </View>
    </Card>
  );
}
