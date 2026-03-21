import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { Ionicons } from '@expo/vector-icons';
import Dropdown from '@/src/components/ui/Dropdown';
import Toggle from '@/src/components/ui/Toggle';
import TextInput from '@/src/components/ui/TextInput';
import ChipSelector from '@/src/components/ui/ChipSelector';
import Button from '@/src/components/ui/Button';
import MetricRow from '@/src/components/ui/MetricRow';
import SectionDivider from '@/src/components/ui/SectionDivider';
import PourCostPerformanceBar from '@/src/components/PourCostPerformanceBar';
import ActionSheet from '@/src/components/ui/ActionSheet';
import GradientBackground from '@/src/components/ui/GradientBackground';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import AiSuggestionRow from '@/src/components/ui/AiSuggestionRow';
import { INGREDIENT_TYPES, PRODUCT_SIZES, INITIAL_PRODUCT_SIZE, type IngredientType } from '@/src/constants/appConstants';
import { Volume, volumeLabel, volumeToOunces } from '@/src/types/models';
import { calculateCostPerOz, calculateCostPerPour, calculateSuggestedPrice, formatCurrency } from '@/src/services/calculation-service';
import { FeedbackService } from '@/src/services/feedback-service';

/**
 * Ingredient creation and editing form
 * Handles both creating new ingredients and editing existing ones
 */
export default function IngredientFormScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const colors = useThemeColors();
  const [showActions, setShowActions] = useState(false);

  // Check if we're editing an existing ingredient
  const isEditing = Boolean(params.id);

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
  const saveRef = useRef<() => void>(() => {});

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
    FeedbackService.showDeleteConfirmation(
      name,
      async () => {
        await deleteIngredient(ingredientId);
        router.back();
      },
      'ingredient'
    );
  };

  saveRef.current = handleSave;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Ingredient' : 'Create Ingredient',
      headerLeft: () => (
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 p-2">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Cancel</Text>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable
          onPress={() => saveRef.current()}
          disabled={!isValid || isSaving}
          className="px-4 py-1.5 rounded-lg"
          style={{ backgroundColor: isValid && !isSaving ? colors.go : colors.textMuted, opacity: isSaving ? 0.6 : 1 }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      ),
    });
  }, [isEditing, navigation, colors, isValid, isSaving]);

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
          <SectionDivider />

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
              placeholder="0.00"
              keyboardType="decimal-pad"
              prefix="$"
            />

            {/* Not for sale toggle */}
            <Toggle
              value={notForSale}
              onValueChange={setNotForSale}
              label="Not for sale"
              description="House-made items, garnishes, etc."
            />
          </View>

          {/* Divider */}
          <SectionDivider />

          {/* Cost Analysis */}
          <View className="flex-col gap-3">
            <ScreenTitle title="Cost Analysis" variant="group" />

            <MetricRow label="Cost per Oz:" value={`$${costPerOz.toFixed(3)}`} />
            <MetricRow label="Cost for 1.5oz:" value={formatCurrency(costFor15oz)} />

            {!notForSale && (
              <>
                <MetricRow label="Margin:" value={formatCurrency(pourCostMargin)} className='mb-4'/>

                <PourCostPerformanceBar pourCostPercentage={pourCostPercentage} className='mb-2'/>
                <AiSuggestionRow label="Suggested Retail" value={`$${suggestedRetail.toFixed(2)}`} />
              </>
            )}
          </View>

          {/* Divider */}
          <SectionDivider />

          {/* Description */}
          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description of the ingredient..."
            multiline
          />

          {/* Delete button at bottom (edit mode only) */}
          {isEditing && (
            <Pressable
              onPress={handleDelete}
              className="flex-row items-center justify-center gap-2 py-3"
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={{ color: colors.error, fontWeight: '500', fontSize: 16 }}>
                Delete Ingredient
              </Text>
            </Pressable>
          )}

          <View className="h-8" />
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
