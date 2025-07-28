import { View, Text, Pressable, TextInput as RNTextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SwipeableCard from './SwipeableCard';

// Temporary local interface - will be replaced with canonical types in Phase 3.2
interface LocalCocktailIngredient {
  id: string;
  name: string;
  amount: number;
  unit: 'oz' | 'ml' | 'drops' | 'splash';
  bottleSize: number;
  bottlePrice: number;
  type: string;
  costPerOz: number;
  cost: number;
}

interface CocktailIngredientItemProps {
  ingredient: LocalCocktailIngredient;
  onRemove: (id: string) => void;
  onUpdateAmount: (id: string, amount: number) => void;
  onUpdateUnit: (id: string, unit: 'oz' | 'ml' | 'drops' | 'splash') => void;
}

/**
 * Individual cocktail ingredient item with swipe actions
 * Displays ingredient info with editable amount and unit dropdown
 */
export default function CocktailIngredientItem({
  ingredient,
  onRemove,
  onUpdateAmount,
  onUpdateUnit,
}: CocktailIngredientItemProps) {
  const availableUnits: ('oz' | 'ml' | 'drops' | 'splash')[] = [
    'oz',
    'ml',
    'drops',
    'splash',
  ];

  return (
    <SwipeableCard
      onSwipeRight={() => onRemove(ingredient.id)}
      disableRightSwipe={true}
      rightAction={{
        icon: 'trash',
        label: 'Delete',
        color: '#FFFFFF',
        backgroundColor: '#DC2626',
      }}
    >
      <View className="CocktailIngredientItem">
        {/* Two Column Layout */}
        <View className="ItemLayout flex-row justify-between items-start">
          {/* Left Column - Name and Amount Controls */}
          <View className="LeftColumn flex-1 mr-6">
            {/* Ingredient Name */}
            <Text
              className="IngredientName text-n1 text-lg mb-2"
              style={{ fontWeight: '600' }}
            >
              {ingredient.name}
            </Text>

            {/* Amount Controls Row */}
            <View className="AmountControls flex-row items-center gap-2">
              <RNTextInput
                value={ingredient.amount.toString()}
                onChangeText={(value) => {
                  const newAmount = parseFloat(value) || 0;
                  onUpdateAmount(ingredient.id, newAmount);
                }}
                placeholder="1.5"
                keyboardType="decimal-pad"
                className="AmountInput w-16 text-center text-n1 bg-g2/50 border border-p2/50 rounded px-4 py-3"
              />

              {/* Unit Dropdown */}
              <View className="UnitDropdown relative">
                <Pressable
                  onPress={() => {
                    // Cycle through units: oz -> ml -> drops -> splash -> oz
                    const currentIndex = availableUnits.indexOf(
                      ingredient.unit
                    );
                    const nextUnit =
                      availableUnits[
                        (currentIndex + 1) % availableUnits.length
                      ];
                    onUpdateUnit(ingredient.id, nextUnit);
                  }}
                  className="UnitButton bg-p2/30 px-3 py-1 rounded flex-row items-center gap-1"
                >
                  <Text className="UnitText text-n1 text-sm">
                    {ingredient.unit}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Right Column - Cost Information */}
          <View className="RightColumn items-end">
            {/* Cost per Oz */}
            <View className="CostPerOz mb-2">
              <Text className="CostPerOzLabel text-n1/70 text-xs mb-1">
                Cost per oz:
              </Text>
              <Text
                className="CostPerOzValue text-n1 text-sm"
                style={{ fontWeight: '500' }}
              >
                ${ingredient.costPerOz.toFixed(2)}
              </Text>
            </View>

            {/* Total Cost */}
            <View className="TotalCost">
              <Text className="TotalCostLabel text-n1/70 text-xs mb-1">
                Total Cost:
              </Text>
              <Text
                className="TotalCostValue text-s12 dark:text-s11"
                style={{ fontWeight: '700' }}
              >
                ${ingredient.cost.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SwipeableCard>
  );
}
