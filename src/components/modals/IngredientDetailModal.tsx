import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Modal from '../ui/Modal';
import PourCostPerformanceBar from '../PourCostPerformanceBar';

interface Ingredient {
  id: string;
  name: string;
  bottleSize: number; // ml
  type: 'Beer' | 'Wine' | 'Spirit' | 'Liquor' | 'Prepared' | 'Garnish';
  price: number; // bottle price
  costPerOz: number;
  retailPrice: number; // price for 1.5oz serving
  pourCost: number; // percentage
  suggestedRetail: number;
  pourCostMargin: number; // profit margin
  createdAt: string;
  updatedAt: string;
}

interface IngredientDetailModalProps {
  visible: boolean;
  ingredient: Ingredient | null;
  onClose: () => void;
  onEdit: (ingredient: Ingredient) => void;
  onDelete: (ingredient: Ingredient) => void;
  baseCurrency: string;
}

export default function IngredientDetailModal({
  visible,
  ingredient,
  onClose,
  onEdit,
  onDelete,
  baseCurrency
}: IngredientDetailModalProps) {
  if (!ingredient) return null;

  // Get pour cost color
  const getPourCostColor = (pourCost: number) => {
    if (pourCost <= 15) return 'text-green-600';
    if (pourCost <= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleEdit = () => {
    onClose();
    onEdit(ingredient);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Ingredient',
      `Are you sure you want to delete "${ingredient.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onClose();
            onDelete(ingredient);
          },
        },
      ]
    );
  };
  
  // Get currency symbol
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'CAD': return 'C$';
      case 'AUD': return 'A$';
      case 'JPY': return '¥';
      default: return '$';
    }
  };
  
  const currencySymbol = getCurrencySymbol(baseCurrency);

  return (
    <Modal visible={visible} onClose={onClose} title="Ingredient Details" size="large">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-1">
            {ingredient.name}
          </Text>
          <Text className="text-gray-600">
            {ingredient.type} • {ingredient.bottleSize}ml • Created {new Date(ingredient.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Basic Information */}
        <View className="bg-gray-50 p-4 rounded-lg mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-3">
            Basic Information
          </Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Type:</Text>
              <Text className="font-medium text-gray-800">{ingredient.type}</Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Bottle Size:</Text>
              <Text className="font-medium text-gray-800">{ingredient.bottleSize}ml</Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Bottle Price:</Text>
              <Text className="font-medium text-gray-800">
                {currencySymbol}{ingredient.price.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Cost Analysis */}
        <View className="bg-gray-50 p-4 rounded-lg mb-4">
          <Text className="text-lg font-semibold text-gray-700 mb-3">
            Cost Analysis
          </Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Cost per Oz:</Text>
              <Text className="font-medium text-gray-800">
                {currencySymbol}{ingredient.costPerOz.toFixed(3)}
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Retail Price (1.5oz):</Text>
              <Text className="font-medium text-gray-800">
                {currencySymbol}{ingredient.retailPrice.toFixed(2)}
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Pour Cost:</Text>
              <Text className={`font-medium ${getPourCostColor(ingredient.pourCost)}`}>
                {ingredient.pourCost.toFixed(1)}%
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Suggested Retail (20% target):</Text>
              <Text className="font-medium text-blue-600">
                {currencySymbol}{ingredient.suggestedRetail.toFixed(2)}
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Profit Margin:</Text>
              <Text className="font-medium text-green-600">
                {currencySymbol}{ingredient.pourCostMargin.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Performance */}
        <View className="bg-gray-50 p-4 rounded-lg mb-6">
          <Text className="text-lg font-semibold text-gray-700 mb-3">
            Performance
          </Text>
          
          <PourCostPerformanceBar pourCostPercentage={ingredient.pourCost} />
          
          <Text className="text-xs text-gray-600 mt-3">
            Current retail price of {currencySymbol}{ingredient.retailPrice.toFixed(2)} generates a margin of {currencySymbol}{ingredient.pourCostMargin.toFixed(2)} per 1.5oz serve.
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3">
          <Pressable
            onPress={handleEdit}
            className="flex-1 bg-blue-500 rounded-lg p-4 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="pencil" size={18} color="white" />
            <Text className="text-white font-semibold">Edit</Text>
          </Pressable>
          
          <Pressable
            onPress={handleDelete}
            className="flex-1 bg-red-500 rounded-lg p-4 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="trash" size={18} color="white" />
            <Text className="text-white font-semibold">Delete</Text>
          </Pressable>
        </View>
        
        <Text className="text-center text-gray-500 text-xs mt-4">
          Last updated: {new Date(ingredient.updatedAt).toLocaleString()}
        </Text>
      </View>
    </Modal>
  );
}