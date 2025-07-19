import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TextInput from '../ui/TextInput';
import NumberInput from '../ui/NumberInput';
import CustomSlider from '../ui/CustomSlider';
import CurrencyDisplay from '../ui/CurrencyDisplay';
import { Cocktail, CocktailIngredient, SavedIngredient, PourSize } from '../../types/models';

interface CocktailFormProps {
  cocktail?: Cocktail;
  availableIngredients: SavedIngredient[];
  onSave: (cocktail: Omit<Cocktail, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  currency: string;
  measurementSystem: 'US' | 'Metric';
}

interface FormData {
  name: string;
  ingredients: CocktailIngredient[];
  notes: string;
  profitMargin: number;
}

interface FormErrors {
  name?: string;
  ingredients?: string;
}

export default function CocktailForm({
  cocktail,
  availableIngredients,
  onSave,
  onCancel,
  currency,
  measurementSystem,
}: CocktailFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: cocktail?.name || '',
    ingredients: cocktail?.ingredients || [],
    notes: cocktail?.notes || '',
    profitMargin: cocktail?.profitMargin || 15,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Cocktail name is required';
    }

    if (formData.ingredients.length === 0) {
      newErrors.ingredients = 'At least one ingredient is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      await onSave({
        name: formData.name.trim(),
        ingredients: formData.ingredients,
        notes: formData.notes.trim(),
        profitMargin: formData.profitMargin,
        userId: cocktail?.userId,
      });
    } catch (error) {
      console.error('Error saving cocktail:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addIngredient = (ingredient: SavedIngredient) => {
    const cocktailIngredient: CocktailIngredient = {
      ...ingredient,
      pourSize: {
        volume: { value: measurementSystem === 'US' ? 1 : 30, unit: measurementSystem === 'US' ? 'oz' : 'ml' },
        type: 'volume',
      },
      order: formData.ingredients.length,
    };

    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, cocktailIngredient],
    });
    setShowIngredientPicker(false);
  };

  const removeIngredient = (index: number) => {
    const newIngredients = formData.ingredients.filter((_, i) => i !== index);
    // Update order values
    const reorderedIngredients = newIngredients.map((ing, i) => ({ ...ing, order: i }));
    setFormData({ ...formData, ingredients: reorderedIngredients });
  };

  const updateIngredientPourSize = (index: number, pourSize: PourSize) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], pourSize };
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const calculateTotalCost = (): number => {
    return formData.ingredients.reduce((total, ingredient) => {
      const pourSizeInMl = ingredient.pourSize.volume.unit === 'oz' 
        ? ingredient.pourSize.volume.value * 29.5735 
        : ingredient.pourSize.volume.value;
      const productSizeInMl = ingredient.productSize.unit === 'oz' 
        ? ingredient.productSize.value * 29.5735 
        : ingredient.productSize.value;
      
      const costPerPour = (ingredient.productCost / productSizeInMl) * pourSizeInMl;
      return total + costPerPour;
    }, 0);
  };

  const getSuggestedPrice = (): number => {
    const totalCost = calculateTotalCost();
    return totalCost / (1 - formData.profitMargin / 100);
  };

  const formatVolume = (volume: number, unit: string): string => {
    if (measurementSystem === 'US') {
      if (unit === 'ml') {
        return `${(volume / 29.5735).toFixed(1)} oz`;
      }
      return `${volume.toFixed(1)} ${unit}`;
    }
    if (unit === 'oz') {
      return `${(volume * 29.5735).toFixed(0)}ml`;
    }
    return `${volume.toFixed(0)}${unit}`;
  };

  const availableToAdd = availableIngredients.filter(
    ingredient => !formData.ingredients.some(existing => existing.id === ingredient.id)
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-gray-800">
            {cocktail ? 'Edit Cocktail' : 'New Cocktail'}
          </Text>
          <Pressable
            onPress={onCancel}
            className="p-2 rounded-full bg-gray-200 active:bg-gray-300"
          >
            <Ionicons name="close" size={24} color="#374151" />
          </Pressable>
        </View>

        {/* Basic Info */}
        <View className="bg-white rounded-lg p-4 mb-4">
          <TextInput
            label="Cocktail Name"
            value={formData.name}
            onChangeText={(name) => setFormData({ ...formData, name })}
            placeholder="e.g., Margarita, Old Fashioned"
            error={errors.name}
            icon="wine"
            required
          />

          <View className="mb-4">
            <Text className="text-base font-medium text-gray-700 mb-3">
              Profit Margin: {formData.profitMargin.toFixed(1)}%
            </Text>
            <CustomSlider
              label="Target Profit Margin"
              value={formData.profitMargin}
              onValueChange={(profitMargin) => setFormData({ ...formData, profitMargin })}
              minValue={0.25}
              maxValue={100}
              unit="%"
              step={0.25}
              pourCostScale={true}
            />
          </View>
        </View>

        {/* Ingredients Section */}
        <View className="bg-white rounded-lg p-4 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-800">
              Ingredients {errors.ingredients && <Text className="text-red-500 text-sm">*</Text>}
            </Text>
            <Pressable
              onPress={() => setShowIngredientPicker(true)}
              className="bg-primary-600 px-4 py-2 rounded-lg active:bg-primary-700"
              disabled={availableToAdd.length === 0}
            >
              <Text className="text-white font-medium">Add Ingredient</Text>
            </Pressable>
          </View>

          {errors.ingredients && (
            <Text className="text-red-600 text-sm mb-3">{errors.ingredients}</Text>
          )}

          {formData.ingredients.map((ingredient, index) => (
            <View key={ingredient.id} className="border border-gray-200 rounded-lg p-3 mb-3">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-medium text-gray-800 flex-1">
                  {ingredient.name}
                </Text>
                <Pressable
                  onPress={() => removeIngredient(index)}
                  className="p-1 rounded bg-red-50 active:bg-red-100"
                >
                  <Ionicons name="close" size={16} color="#DC2626" />
                </Pressable>
              </View>

              <NumberInput
                label="Pour Size"
                value={ingredient.pourSize.volume.value}
                onValueChange={(value) => updateIngredientPourSize(index, {
                  ...ingredient.pourSize,
                  volume: { ...ingredient.pourSize.volume, value }
                })}
                suffix={ingredient.pourSize.volume.unit}
                min={0.1}
                step={0.1}
                decimalPlaces={1}
                containerClassName="mb-0"
              />
            </View>
          ))}

          {formData.ingredients.length === 0 && (
            <View className="py-8 items-center">
              <Ionicons name="wine-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">No ingredients added yet</Text>
            </View>
          )}
        </View>

        {/* Cost Summary */}
        {formData.ingredients.length > 0 && (
          <View className="bg-white rounded-lg p-4 mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Cost Summary</Text>
            
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Total Cost:</Text>
                <CurrencyDisplay 
                  amount={calculateTotalCost()} 
                  currency={currency} 
                  weight="semibold"
                />
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Profit Margin:</Text>
                <Text className="font-semibold text-gray-800">
                  {formData.profitMargin.toFixed(1)}%
                </Text>
              </View>
              <View className="flex-row justify-between pt-2 border-t border-gray-200">
                <Text className="text-primary-600 font-semibold">Suggested Price:</Text>
                <CurrencyDisplay 
                  amount={getSuggestedPrice()} 
                  currency={currency} 
                  size="xl" 
                  color="primary" 
                  weight="bold"
                />
              </View>
            </View>
          </View>
        )}

        {/* Notes */}
        <View className="bg-white rounded-lg p-4 mb-4">
          <TextInput
            label="Notes (Optional)"
            value={formData.notes}
            onChangeText={(notes) => setFormData({ ...formData, notes })}
            placeholder="Preparation notes, variations, etc."
            multiline
            numberOfLines={3}
            icon="document-text"
          />
        </View>

        {/* Action Buttons */}
        <View className="flex-row space-x-3">
          <Pressable
            onPress={onCancel}
            className="flex-1 py-4 bg-gray-200 rounded-lg active:bg-gray-300"
          >
            <Text className="text-center text-gray-700 font-semibold">Cancel</Text>
          </Pressable>
          
          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            className={`flex-1 py-4 rounded-lg ${
              isSubmitting 
                ? 'bg-gray-400' 
                : 'bg-primary-600 active:bg-primary-700'
            }`}
          >
            <Text className="text-center text-white font-semibold">
              {isSubmitting 
                ? 'Saving...' 
                : cocktail 
                  ? 'Update Cocktail' 
                  : 'Save Cocktail'
              }
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Ingredient Picker Modal */}
      {showIngredientPicker && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center">
          <View className="bg-white m-4 rounded-lg max-h-96 w-full max-w-md">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold">Add Ingredient</Text>
              <Pressable
                onPress={() => setShowIngredientPicker(false)}
                className="p-1"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </Pressable>
            </View>
            
            <ScrollView className="max-h-64">
              {availableToAdd.map((ingredient) => (
                <Pressable
                  key={ingredient.id}
                  onPress={() => addIngredient(ingredient)}
                  className="p-4 border-b border-gray-100 active:bg-gray-50"
                >
                  <Text className="text-base font-medium text-gray-800">
                    {ingredient.name}
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="text-sm text-gray-600">
                      {formatVolume(ingredient.productSize.value, ingredient.productSize.unit)} • 
                    </Text>
                    <CurrencyDisplay 
                      amount={ingredient.productCost} 
                      currency={currency} 
                      size="small" 
                      className="ml-1"
                    />
                  </View>
                </Pressable>
              ))}
              
              {availableToAdd.length === 0 && (
                <View className="p-4 items-center">
                  <Text className="text-gray-500">No more ingredients available</Text>
                  <Text className="text-gray-400 text-sm mt-1">
                    Create ingredients first to add them to cocktails
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </ScrollView>
  );
}