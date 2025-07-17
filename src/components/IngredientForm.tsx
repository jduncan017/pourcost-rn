import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TextInput from './TextInput';
import NumberInput from './NumberInput';
import BottleSizeDropdown from './BottleSizeDropdown';
import CurrencyDisplay from './CurrencyDisplay';
import { SavedIngredient, Volume } from '../types/models';

interface IngredientFormProps {
  ingredient?: SavedIngredient;
  onSave: (ingredient: Omit<SavedIngredient, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  currency: string;
  measurementSystem: 'US' | 'Metric';
}

interface FormData {
  name: string;
  productSize: Volume;
  productCost: number;
}

interface FormErrors {
  name?: string;
  productCost?: string;
}

export default function IngredientForm({
  ingredient,
  onSave,
  onCancel,
  currency,
  measurementSystem,
}: IngredientFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: ingredient?.name || '',
    productSize: ingredient?.productSize || { value: 750, unit: 'ml' },
    productCost: ingredient?.productCost || 0,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Ingredient name is required';
    }

    if (formData.productCost <= 0) {
      newErrors.productCost = 'Product cost must be greater than 0';
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
        productSize: formData.productSize,
        productCost: formData.productCost,
        userId: ingredient?.userId,
      });
    } catch (error) {
      console.error('Error saving ingredient:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatVolumeDisplay = (volume: Volume): string => {
    if (measurementSystem === 'US') {
      if (volume.unit === 'ml') {
        return `${(volume.value / 29.5735).toFixed(1)} fl oz`;
      }
      return `${volume.value} ${volume.unit}`;
    }
    if (volume.unit === 'oz') {
      return `${(volume.value * 29.5735).toFixed(0)}ml`;
    }
    return `${volume.value}${volume.unit}`;
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-gray-800">
            {ingredient ? 'Edit Ingredient' : 'New Ingredient'}
          </Text>
          <Pressable
            onPress={onCancel}
            className="p-2 rounded-full bg-gray-200 active:bg-gray-300"
          >
            <Ionicons name="close" size={24} color="#374151" />
          </Pressable>
        </View>

        {/* Form */}
        <View className="bg-white rounded-lg p-4 mb-4">
          <TextInput
            label="Ingredient Name"
            value={formData.name}
            onChangeText={(name) => setFormData({ ...formData, name })}
            placeholder="e.g., Vodka, Simple Syrup, Lime Juice"
            error={errors.name}
            icon="wine"
            required
          />

          {/* Product Size */}
          <View className="mb-4">
            <Text className="text-base font-medium text-gray-700 mb-2">
              Bottle/Package Size <Text className="text-red-500">*</Text>
            </Text>
            <BottleSizeDropdown
              value={formData.productSize}
              onValueChange={(productSize) => setFormData({ ...formData, productSize })}
              measurementSystem={measurementSystem}
            />
          </View>

          <NumberInput
            label="Product Cost"
            value={formData.productCost}
            onValueChange={(productCost) => setFormData({ ...formData, productCost })}
            placeholder="0.00"
            error={errors.productCost}
            icon="pricetag"
            prefix={currency}
            min={0}
            step={0.01}
            decimalPlaces={2}
            required
          />

          {/* Cost Per Pour Preview */}
          {formData.productCost > 0 && (
            <View className="bg-primary-50 p-4 rounded-lg border border-primary-200 mb-4">
              <Text className="text-sm font-medium text-primary-800 mb-2">
                Cost Preview (1 oz / 30ml pour)
              </Text>
              <View className="flex-row justify-between items-center">
                <Text className="text-primary-600">
                  {formatVolumeDisplay(formData.productSize)} bottle
                </Text>
                <CurrencyDisplay 
                  amount={formData.productCost} 
                  currency={currency} 
                  color="primary"
                />
              </View>
              <View className="flex-row justify-between items-center mt-1">
                <Text className="text-primary-600">Cost per pour:</Text>
                <CurrencyDisplay 
                  amount={formData.productCost / (formData.productSize.value / 30)} 
                  currency={currency} 
                  size="large" 
                  color="primary" 
                  weight="bold"
                />
              </View>
            </View>
          )}
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
                : ingredient 
                  ? 'Update Ingredient' 
                  : 'Save Ingredient'
              }
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}