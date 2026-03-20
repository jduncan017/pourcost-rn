import { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { HARDCODED_BASE_CURRENCY } from '@/src/stores/app-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { Ionicons } from '@expo/vector-icons';
import Dropdown from '@/src/components/ui/Dropdown';
import TextInput from '@/src/components/ui/TextInput';
import ChipSelector from '@/src/components/ui/ChipSelector';
import PourCostPerformanceBar from '@/src/components/PourCostPerformanceBar';
import ActionSheet from '@/src/components/ui/ActionSheet';
import GradientBackground from '@/src/components/ui/GradientBackground';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { INGREDIENT_TYPES, PRODUCT_SIZES, INITIAL_PRODUCT_SIZE, type IngredientType } from '@/src/constants/appConstants';
import { Volume, volumeLabel, volumeToOunces } from '@/src/types/models';
import { calculateCostPerOz, calculateCostPerPour, calculateSuggestedPrice } from '@/src/services/calculation-service';

/**
 * Ingredient creation and editing form
 * Handles both creating new ingredients and editing existing ones
 */
export default function IngredientFormScreen() {
  const baseCurrency = HARDCODED_BASE_CURRENCY;
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const colors = useThemeColors();
  const [showActions, setShowActions] = useState(false);

  // Check if we're editing an existing ingredient
  const isEditing = Boolean(params.id);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Ingredient' : 'Create Ingredient',
      headerRight: isEditing
        ? () => (
            <Pressable onPress={() => setShowActions(true)} className="p-2">
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
            </Pressable>
          )
        : undefined,
    });
  }, [isEditing, navigation, colors.text]);
  const ingredientId = params.id as string;

  // Form state
  const [name, setName] = useState((params.name as string) || '');
  const [type, setType] = useState<IngredientType>(
    (params.type as IngredientType) || 'Spirit'
  );
  const [productSize, setProductSize] = useState<Volume>(() => {
    if (params.productSize) {
      try {
        return JSON.parse(params.productSize as string) as Volume;
      } catch {
        return INITIAL_PRODUCT_SIZE;
      }
    }
    return INITIAL_PRODUCT_SIZE;
  });
  const [productCost, setProductCost] = useState(
    Number(params.productCost) || 25.0
  );
  const [productCostText, setProductCostText] = useState(
    (params.productCost as string) || '25.00'
  );
  const [retailPrice, setRetailPrice] = useState(
    Number(params.retailPrice) || 8.0
  );
  const [notForSale, setNotForSale] = useState(
    params.notForSale === 'true' || false
  );
  const [description, setDescription] = useState(
    (params.description as string) || ''
  );

  // Update container size when ingredient type changes (only if not editing)
  useEffect(() => {
    if (!isEditing) {
      // Set specific defaults for each type
      let defaultSize: Volume;
      switch (type) {
        case 'Spirit':
        case 'Wine':
        case 'Prepped':
          defaultSize = { kind: 'milliliters', ml: 750 };
          break;
        case 'Beer':
          defaultSize = { kind: 'namedOunces', name: 'Half Barrel', ounces: 1984 };
          break;
        case 'Garnish':
          defaultSize = { kind: 'milliliters', ml: 100 };
          break;
        case 'Other':
          defaultSize = { kind: 'milliliters', ml: 500 };
          break;
        default:
          defaultSize = INITIAL_PRODUCT_SIZE;
      }
      setProductSize(defaultSize);
    }
  }, [type, isEditing]);

  // Calculated values using the new calculation service
  const defaultPourSize: Volume = { kind: 'decimalOunces', ounces: 1.5 };
  const costPerOz = calculateCostPerOz(productSize, productCost);
  const costFor15oz = calculateCostPerPour(productSize, productCost, defaultPourSize);
  const pourCostPercentage = retailPrice > 0 ? (costFor15oz / retailPrice) * 100 : 0;
  const suggestedRetail = calculateSuggestedPrice(costFor15oz, 0.2); // 20% pour cost target
  const pourCostMargin = retailPrice - costFor15oz;

  // Validation
  const isValid =
    name.trim().length > 0 &&
    productCost > 0 &&
    volumeToOunces(productSize) > 0 &&
    (notForSale || retailPrice > 0); // Only require retail price if item is for sale


  // Handle product size selection from PRODUCT_SIZES list
  const handleProductSizeChange = (selectedSize: Volume) => {
    setProductSize(selectedSize);
  };

  const { addIngredient, updateIngredient, deleteIngredient } = useIngredientsStore();
  const [isSaving, setIsSaving] = useState(false);

  // Handle save
  const handleSave = async () => {
    if (!isValid) {
      Alert.alert('Invalid Data', 'Please fill in all required fields with valid values.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        await updateIngredient(ingredientId, {
          name: name.trim(),
          productSize,
          productCost,
          type,
          notForSale,
          description: description.trim() || undefined,
        });
      } else {
        await addIngredient({
          name: name.trim(),
          productSize,
          productCost,
          type,
          notForSale,
          description: description.trim() || undefined,
        });
      }
      router.back();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save ingredient');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = () => {
    Alert.alert(
      'Delete Ingredient',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteIngredient(ingredientId);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete ingredient');
            }
          },
        },
      ]
    );
  };

  return (
    <GradientBackground>
      <ScrollView className="FormScroll flex-1">
        <View className="p-4 pt-6 flex-col gap-6">
          {/* Ingredient Name */}
          <TextInput
            label="Ingredient Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g., Vodka (Premium), Simple Syrup"
            size="large"
          />

          {/* Type */}
          <ChipSelector
            label="Type *"
            options={[...INGREDIENT_TYPES]}
            selectedOption={type}
            onSelectionChange={(val) => setType(val as IngredientType)}
            variant="filter"
          />

          {/* Divider */}
          <View className="h-px bg-g2/30 dark:bg-p2/50" />

          {/* Container & Cost */}
          <View className="flex-col gap-4">
            <Dropdown
              value={JSON.stringify(productSize)}
              onValueChange={(val) => {
                try {
                  handleProductSizeChange(JSON.parse(val) as Volume);
                } catch {}
              }}
              options={PRODUCT_SIZES.map((size) => ({
                value: JSON.stringify(size),
                label: volumeLabel(size),
              }))}
              placeholder="Select container size"
              label="Container Size *"
            />

            <TextInput
              label="Product Cost *"
              value={productCostText}
              onChangeText={(text) => {
                if (text === '' || /^\d*\.?\d*$/.test(text)) {
                  setProductCostText(text);
                  const price = text === '' ? 0 : parseFloat(text) || 0;
                  setProductCost(price);
                }
              }}
              placeholder="25.00"
              keyboardType="decimal-pad"
            />

            {/* Not for sale checkbox */}
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => setNotForSale(!notForSale)}
                className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                  notForSale
                    ? 'bg-p1 border-p1'
                    : 'bg-transparent border-g3 dark:border-g2'
                }`}
              >
                {notForSale && (
                  <Ionicons name="checkmark" size={16} color={colors.colors.n1} />
                )}
              </Pressable>
              <View className="flex-1">
                <Text className="text-g4 dark:text-n1" style={{ fontWeight: '500' }}>
                  Not for sale
                </Text>
                <Text className="text-g3 dark:text-g2 text-xs mt-0.5">
                  House-made items, garnishes, etc.
                </Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View className="h-px bg-g2/30 dark:bg-p2/50" />

          {/* Cost Analysis */}
          <View className="flex-col gap-3">
            <ScreenTitle title="Cost Analysis" variant="section" />

            <View className="flex-row justify-between">
              <Text className="text-g3 dark:text-n1">Cost per Oz:</Text>
              <Text className="text-g4 dark:text-n1" style={{ fontWeight: '500' }}>
                ${costPerOz.toFixed(3)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-g3 dark:text-n1">Cost for 1.5oz:</Text>
              <Text className="text-g4 dark:text-n1" style={{ fontWeight: '500' }}>
                ${costFor15oz.toFixed(2)}
              </Text>
            </View>

            {!notForSale && (
              <>
                <View className="flex-row justify-between">
                  <Text className="text-g3 dark:text-n1">Suggested Retail:</Text>
                  <Text className="text-g4 dark:text-n1" style={{ fontWeight: '500' }}>
                    ${suggestedRetail.toFixed(2)}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-g3 dark:text-n1">Margin:</Text>
                  <Text className="text-g4 dark:text-n1" style={{ fontWeight: '500' }}>
                    ${pourCostMargin.toFixed(2)}
                  </Text>
                </View>

                <View className="pt-3 border-t border-g2/40 dark:border-p2/50">
                  <PourCostPerformanceBar pourCostPercentage={pourCostPercentage} />
                </View>
              </>
            )}
          </View>

          {/* Divider */}
          <View className="h-px bg-g2/30 dark:bg-p2/50" />

          {/* Description */}
          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description of the ingredient..."
            multiline
          />

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={!isValid || isSaving}
            className={`rounded-lg p-4 flex-row items-center justify-center gap-2 ${
              isValid && !isSaving ? 'bg-s21 dark:bg-s22' : 'bg-g2 dark:bg-g3'
            }`}
          >
            <Text className="text-white text-base" style={{ fontWeight: '600' }}>
              {isSaving ? 'Saving...' : isEditing ? 'Update Ingredient' : 'Save Ingredient'}
            </Text>
          </Pressable>

          <Text className="text-center text-g3 dark:text-n1 text-xs mb-4">
            * Required fields
          </Text>

          {/* Action Sheet for delete (edit mode) */}
          <ActionSheet
            visible={showActions}
            onClose={() => setShowActions(false)}
            actions={[
              { label: 'Delete Ingredient', icon: 'trash-outline', onPress: handleDelete, destructive: true },
            ]}
          />
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
