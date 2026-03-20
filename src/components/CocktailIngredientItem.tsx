import { useState } from 'react';
import { View, Text, Pressable, TextInput as RNTextInput } from 'react-native';
import SwipeableCard from './SwipeableCard';
import BottomSheet from './ui/BottomSheet';
import ChipSelector from './ui/ChipSelector';
import { CocktailIngredient, Volume, volumeToOunces, volumeLabel, fraction } from '@/src/types/models';
import { calculateCostPerOz } from '@/src/services/calculation-service';
import { useThemeColors } from '@/src/contexts/ThemeContext';

// Primary quick pours: standard fractional ounces
const QUICK_POUR_SIZES: { label: string; volume: Volume }[] = [
  { label: '¼', volume: fraction(1, 4) },
  { label: '½', volume: fraction(1, 2) },
  { label: '¾', volume: fraction(3, 4) },
  { label: '1', volume: fraction(1, 1) },
  { label: '1¼', volume: fraction(5, 4) },
  { label: '1½', volume: fraction(3, 2) },
  { label: '2', volume: fraction(2, 1) },
  { label: '2½', volume: fraction(5, 2) },
];

// "Other" pours shown in bottom sheet
const OTHER_POUR_SIZES: { label: string; volume: Volume }[] = [
  { label: 'dash', volume: { kind: 'namedOunces', name: 'dash', ounces: 0.01691 } },
  { label: 'bspn', volume: { kind: 'namedOunces', name: 'bspn', ounces: 0.16907 } },
  { label: '3 oz', volume: fraction(3, 1) },
  { label: '4 oz', volume: fraction(4, 1) },
  { label: '5 oz', volume: fraction(5, 1) },
  { label: '6 oz', volume: fraction(6, 1) },
];

interface CocktailIngredientItemProps {
  ingredient: CocktailIngredient;
  onRemove: (ingredientId: string) => void;
  onUpdateAmount: (ingredientId: string, amount: number) => void;
}

export default function CocktailIngredientItem({
  ingredient,
  onRemove,
  onUpdateAmount,
}: CocktailIngredientItemProps) {
  const colors = useThemeColors();
  const costPerOz = calculateCostPerOz(ingredient.productSize, ingredient.productCost);
  const pourOz = volumeToOunces(ingredient.pourSize);
  const [showOtherSheet, setShowOtherSheet] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState(pourOz.toString());

  // Check if current pour matches a quick pour or other pour
  const allPours = [...QUICK_POUR_SIZES, ...OTHER_POUR_SIZES];
  const selectedPour = allPours.find(
    (qp) => Math.abs(volumeToOunces(qp.volume) - pourOz) < 0.001
  );
  const isQuickPour = QUICK_POUR_SIZES.some(
    (qp) => Math.abs(volumeToOunces(qp.volume) - pourOz) < 0.001
  );

  const handleQuickPourSelect = (volume: Volume) => {
    setShowCustomInput(false);
    onUpdateAmount(ingredient.ingredientId, volumeToOunces(volume));
  };

  const handleOtherSelect = (volume: Volume) => {
    setShowOtherSheet(false);
    setShowCustomInput(false);
    onUpdateAmount(ingredient.ingredientId, volumeToOunces(volume));
  };

  const handleCustomSubmit = () => {
    const value = parseFloat(customText);
    if (!isNaN(value) && value > 0) {
      onUpdateAmount(ingredient.ingredientId, value);
    }
    setShowCustomInput(false);
    setShowOtherSheet(false);
  };

  // Label for "Other" chip when a non-quick pour is selected
  const otherLabel = !isQuickPour && selectedPour ? selectedPour.label : 'Other';

  return (
    <SwipeableCard
      onSwipeRight={() => onRemove(ingredient.ingredientId)}
      disableRightSwipe={true}
      rightAction={{
        icon: 'trash',
        label: 'Delete',
        color: colors.colors.n1,
        backgroundColor: colors.error,
      }}
    >
      <View className="CocktailIngredientItem">
        {/* Header row: name + cost */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-4">
            <Text
              className="text-n1 text-lg"
              style={{ fontWeight: '600' }}
              numberOfLines={1}
            >
              {ingredient.name}
            </Text>
            <Text className="text-n1/60 text-sm mt-1">
              ${costPerOz.toFixed(2)}/oz
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-n1/60 text-xs">Pour Cost</Text>
            <Text
              className="text-s11 text-lg"
              style={{ fontWeight: '700' }}
            >
              ${ingredient.cost.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Pour size quick-select chips */}
        <ChipSelector
          options={QUICK_POUR_SIZES.map((qp) => qp.label)}
          selectedOption={isQuickPour && selectedPour ? selectedPour.label : ''}
          onSelectionChange={(label) => {
            const qp = QUICK_POUR_SIZES.find((q) => q.label === label);
            if (qp) handleQuickPourSelect(qp.volume);
          }}
          variant="compact"
          size="large"
          showLabel={false}
          trailingChip={
            <Pressable
              key="other"
              onPress={() => setShowOtherSheet(true)}
              className={`px-3.5 py-2 rounded-lg border ${
                !isQuickPour && !showCustomInput
                  ? 'bg-s33 border-s32'
                  : 'bg-p4/40 border-p2/50'
              }`}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Text
                className={`text-base ${
                  !isQuickPour && !showCustomInput ? 'text-white font-bold' : 'text-n1/80 font-medium'
                }`}
              >
                {otherLabel}
              </Text>
            </Pressable>
          }
        />
      </View>

      {/* Other pours bottom sheet */}
      <BottomSheet
        visible={showOtherSheet}
        onClose={() => setShowOtherSheet(false)}
        title="Other Pour Sizes"
      >
        <View className="pb-4">
          {OTHER_POUR_SIZES.map((op) => {
            const isSelected = selectedPour?.label === op.label;
            return (
              <Pressable
                key={op.label}
                onPress={() => handleOtherSelect(op.volume)}
                className="px-4 py-3 flex-row justify-between items-center"
                style={isSelected ? { backgroundColor: colors.accent + '15' } : undefined}
              >
                <Text
                  className={`text-base font-medium ${
                    isSelected ? 'text-p1 dark:text-s11' : 'text-g4 dark:text-n1'
                  }`}
                >
                  {op.label}
                </Text>
                {isSelected && (
                  <Text className="text-sm text-p1 dark:text-s11">
                    {volumeToOunces(op.volume).toFixed(4)} oz
                  </Text>
                )}
              </Pressable>
            );
          })}

          {/* Custom entry */}
          <View className="px-4 pt-3 border-t" style={{ borderTopColor: colors.border }}>
            <Text className="text-sm font-medium text-g4 dark:text-n1 mb-2">Custom amount</Text>
            <View className="flex-row items-center gap-2">
              <RNTextInput
                value={customText}
                onChangeText={setCustomText}
                placeholder="0.00"
                keyboardType="decimal-pad"
                onSubmitEditing={handleCustomSubmit}
                className="flex-1 rounded-lg px-3 py-2 text-center border"
                style={{
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                }}
                placeholderTextColor={colors.textSecondary}
              />
              <Text className="text-g3 dark:text-g1">oz</Text>
              <Pressable
                onPress={handleCustomSubmit}
                className="bg-p1 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-medium">Set</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </BottomSheet>
    </SwipeableCard>
  );
}
