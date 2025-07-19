import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/src/stores/app-store';
import { Ionicons } from '@expo/vector-icons';
import CustomSlider from '@/src/components/ui/CustomSlider';
import BottleSizeDropdown from '@/src/components/BottleSizeDropdown';
import TextInput from '@/src/components/ui/TextInput';
import PourCostPerformanceBar from '@/src/components/PourCostPerformanceBar';
import Card from '@/src/components/ui/Card';

// Ingredient type options
const INGREDIENT_TYPES = ['Beer', 'Wine', 'Liquor', 'Mixer', 'Syrup', 'Juice', 'Other'] as const;
type IngredientType = typeof INGREDIENT_TYPES[number];

/**
 * Ingredient creation and editing form
 * Handles both creating new ingredients and editing existing ones
 */
export default function IngredientFormScreen() {
  const { baseCurrency } = useAppStore();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Check if we're editing an existing ingredient
  const isEditing = Boolean(params.id);
  const ingredientId = params.id as string;
  
  // Form state
  const [name, setName] = useState(params.name as string || '');
  const [type, setType] = useState<IngredientType>((params.type as IngredientType) || 'Liquor');
  const [bottleSize, setBottleSize] = useState(Number(params.bottleSize) || 750);
  const [bottlePrice, setBottlePrice] = useState(Number(params.bottlePrice) || 25.0);
  const [retailPrice, setRetailPrice] = useState(Number(params.retailPrice) || 8.0);
  
  // Calculated values
  const bottleSizeOz = bottleSize / 29.5735;
  const costPerOz = bottlePrice / bottleSizeOz;
  const costFor15oz = costPerOz * 1.5;
  const pourCostPercentage = (costFor15oz / retailPrice) * 100;
  const suggestedRetail = costFor15oz / 0.20; // 20% pour cost target
  const pourCostMargin = retailPrice - costFor15oz;
  
  // Validation
  const isValid = name.trim().length > 0 && bottlePrice > 0 && retailPrice > 0 && bottleSize > 0;
  
  // Dynamic step functions
  const getPriceStep = (value: number): number => {
    if (value < 30) return 0.25;
    if (value < 50) return 0.5;
    if (value < 100) return 1;
    if (value < 150) return 2;
    if (value < 200) return 5;
    if (value < 300) return 10;
    if (value < 1000) return 25;
    return 50;
  };
  
  // Get pour cost color
  const getPourCostColor = (pourCost: number) => {
    if (pourCost <= 20) return 'text-green-600';
    if (pourCost <= 25) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Handle save
  const handleSave = () => {
    if (!isValid) {
      Alert.alert('Invalid Data', 'Please fill in all required fields with valid values.');
      return;
    }
    
    const ingredientData = {
      id: isEditing ? ingredientId : Date.now().toString(),
      name: name.trim(),
      type,
      bottleSize,
      price: bottlePrice,
      costPerOz,
      retailPrice,
      pourCost: pourCostPercentage,
      suggestedRetail,
      pourCostMargin,
      createdAt: isEditing ? params.createdAt as string : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    Alert.alert(
      isEditing ? 'Ingredient Updated' : 'Ingredient Created',
      `\"${name}\" has been ${isEditing ? 'updated' : 'saved'} successfully.\\n\\nCost/Oz: $${costPerOz.toFixed(3)}\\nPour Cost: ${pourCostPercentage.toFixed(1)}%`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };
  
  // Handle delete (only for editing)
  const handleDelete = () => {
    Alert.alert(
      'Delete Ingredient',
      `Are you sure you want to delete \"${name}\"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Deleted', `\"${name}\" has been deleted.`);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              className="p-2 bg-gray-200 rounded-lg"
            >
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </Pressable>
            <View>
              <Text className="text-2xl font-bold text-gray-800">
                {isEditing ? 'Edit Ingredient' : 'Create Ingredient'}
              </Text>
              <Text className="text-gray-600">
                {isEditing ? 'Update ingredient details' : 'Add a new ingredient to your library'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Basic Information */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-4">
            Basic Information
          </Text>
          
          <View className="space-y-4">
            <TextInput
              label="Ingredient Name *"
              value={name}
              onChangeText={setName}
              placeholder="e.g., Vodka (Premium), Simple Syrup"
            />
            
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Type *</Text>
              <View className="flex-row flex-wrap gap-2">
                {INGREDIENT_TYPES.map((ingredientType) => (
                  <Pressable
                    key={ingredientType}
                    onPress={() => setType(ingredientType)}
                    className={`px-3 py-2 rounded-lg border ${
                      type === ingredientType
                        ? 'bg-primary-500 border-primary-500'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${
                      type === ingredientType ? 'text-white' : 'text-gray-700'
                    }`}>
                      {ingredientType}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            
            <BottleSizeDropdown
              label="Bottle Size *"
              value={bottleSize}
              onValueChange={setBottleSize}
            />
          </View>
        </Card>
        
        {/* Pricing Information */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-4">
            Pricing Information
          </Text>
          
          <View className="space-y-4">
            <CustomSlider
              label="Bottle Price *"
              minValue={1}
              maxValue={500}
              value={bottlePrice}
              onValueChange={setBottlePrice}
              unit={` ${baseCurrency} `}
              dynamicStep={getPriceStep}
              logarithmic={true}
            />
            
            <CustomSlider
              label="Retail Price (1.5oz) *"
              minValue={0.5}
              maxValue={50}
              value={retailPrice}
              onValueChange={setRetailPrice}
              unit={` ${baseCurrency} `}
              step={0.25}
            />
          </View>
        </Card>
        
        {/* Calculated Values */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-4">
            Calculated Values
          </Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Cost per Oz:</Text>
              <Text className="font-medium text-gray-800">
                ${costPerOz.toFixed(3)}
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Cost for 1.5oz:</Text>
              <Text className="font-medium text-gray-800">
                ${costFor15oz.toFixed(2)}
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Pour Cost:</Text>
              <Text className={`font-medium ${getPourCostColor(pourCostPercentage)}`}>
                {pourCostPercentage.toFixed(1)}%
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Suggested Retail (20% target):</Text>
              <Text className="font-medium text-blue-600">
                ${suggestedRetail.toFixed(2)}
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Profit Margin:</Text>
              <Text className="font-medium text-green-600">
                ${pourCostMargin.toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>
        
        {/* Performance Indicator */}
        <Card className="mb-6">
          <Text className="text-lg font-semibold text-gray-700 mb-4">
            Performance Preview
          </Text>
          
          <PourCostPerformanceBar pourCostPercentage={pourCostPercentage} />
        </Card>
        
        {/* Action Buttons */}
        <View className="space-y-3">
          <Pressable
            onPress={handleSave}
            disabled={!isValid}
            className={`rounded-lg p-4 flex-row items-center justify-center gap-2 ${
              isValid ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <Ionicons name="checkmark" size={20} color="white" />
            <Text className="text-white font-semibold text-lg">
              {isEditing ? 'Update Ingredient' : 'Save Ingredient'}
            </Text>
          </Pressable>
          
          {isEditing && (
            <Pressable
              onPress={handleDelete}
              className="bg-red-500 rounded-lg p-4 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="trash" size={20} color="white" />
              <Text className="text-white font-semibold text-lg">Delete Ingredient</Text>
            </Pressable>
          )}
          
          <Pressable
            onPress={() => router.back()}
            className="bg-gray-400 rounded-lg p-4 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="close" size={20} color="white" />
            <Text className="text-white font-semibold text-lg">Cancel</Text>
          </Pressable>
        </View>
        
        <Text className="text-center text-gray-500 text-xs mt-4">
          * Required fields
        </Text>
      </View>
    </ScrollView>
  );
}