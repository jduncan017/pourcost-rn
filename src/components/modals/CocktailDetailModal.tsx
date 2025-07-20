import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Modal from '../ui/Modal';
import PourCostPerformanceBar from '../PourCostPerformanceBar';

interface CocktailIngredient {
  id: string;
  name: string;
  amount: number; // oz
  cost: number; // cost for this amount
  type: 'Beer' | 'Wine' | 'Spirit' | 'Liquor' | 'Prepared' | 'Garnish';
}

interface Cocktail {
  id: string;
  name: string;
  description?: string;
  category:
    | 'Classic'
    | 'Modern'
    | 'Tropical'
    | 'Whiskey'
    | 'Vodka'
    | 'Rum'
    | 'Gin'
    | 'Tequila'
    | 'Other';
  ingredients: CocktailIngredient[];
  totalCost: number;
  suggestedPrice: number;
  pourCostPercentage: number;
  profitMargin: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime: number; // minutes
  notes?: string;
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
}

interface CocktailDetailModalProps {
  visible: boolean;
  cocktail: Cocktail | null;
  onClose: () => void;
  onEdit: (cocktail: Cocktail) => void;
  onDelete: (cocktail: Cocktail) => void;
  onToggleFavorite: (cocktail: Cocktail) => void;
  baseCurrency: string;
}

export default function CocktailDetailModal({
  visible,
  cocktail,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  baseCurrency,
}: CocktailDetailModalProps) {
  if (!cocktail) return null;

  // Get pour cost color
  const getPourCostColor = (pourCost: number) => {
    if (pourCost <= 20) return 'text-s22';
    if (pourCost <= 25) return 'text-s12';
    return 'text-e3';
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-s22';
      case 'Medium':
        return 'text-s12';
      case 'Hard':
        return 'text-e3';
      default:
        return 'text-g3';
    }
  };

  const handleEdit = () => {
    onClose();
    onEdit(cocktail);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Cocktail',
      `Are you sure you want to delete "${cocktail.name}"? This action cannot be undone.`,
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
            onDelete(cocktail);
          },
        },
      ]
    );
  };

  const handleToggleFavorite = () => {
    onToggleFavorite(cocktail);
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
    <Modal visible={visible} onClose={onClose} title="Cocktail Details" size="large">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center gap-2 mb-2">
            <Text className="text-xl font-bold text-g4">
              {cocktail.name}
            </Text>
            {cocktail.favorited && (
              <Ionicons name="heart" size={20} color="#EF4444" />
            )}
          </View>
          <Text className="text-g3 mb-2">{cocktail.description}</Text>
          <View className="flex-row items-center gap-4">
            <Text className="text-sm text-g3">
              {cocktail.category} • {cocktail.ingredients.length} ingredients
            </Text>
            <Text
              className={`text-sm font-medium ${getDifficultyColor(cocktail.difficulty)}`}
            >
              {cocktail.difficulty}
            </Text>
            <Text className="text-sm text-g3">
              {cocktail.prepTime} min prep
            </Text>
          </View>
        </View>

        {/* Ingredients */}
        <View className="bg-n1 p-4 rounded-lg mb-4">
          <Text className="text-lg font-semibold text-g4 mb-3">
            Ingredients
          </Text>

          <View className="space-y-3">
            {cocktail.ingredients.map((ingredient) => (
              <View
                key={ingredient.id}
                className="flex-row justify-between items-center"
              >
                <View className="flex-1">
                  <Text className="font-medium text-g4">
                    {ingredient.name}
                  </Text>
                  <Text className="text-sm text-g3">
                    {ingredient.type}
                  </Text>
                </View>
                <View className="text-right">
                  <Text className="font-medium text-g4">
                    {ingredient.amount}oz
                  </Text>
                  <Text className="text-sm text-g3">
                    {currencySymbol}{ingredient.cost.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Cost Breakdown */}
        <View className="bg-n1 p-4 rounded-lg mb-4">
          <Text className="text-lg font-semibold text-g4 mb-3">
            Cost Analysis
          </Text>

          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-g3">Total Cost:</Text>
              <Text className="font-medium text-g4">
                {currencySymbol}{cocktail.totalCost.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-g3">Suggested Price:</Text>
              <Text className="font-medium text-g4">
                {currencySymbol}{cocktail.suggestedPrice.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-g3">Pour Cost:</Text>
              <Text
                className={`font-medium ${getPourCostColor(cocktail.pourCostPercentage)}`}
              >
                {cocktail.pourCostPercentage.toFixed(1)}%
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-g3">Profit Margin:</Text>
              <Text className="font-medium text-s22">
                {currencySymbol}{cocktail.profitMargin.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Performance */}
        <View className="bg-n1 p-4 rounded-lg mb-4">
          <Text className="text-lg font-semibold text-g4 mb-3">
            Performance
          </Text>

          <PourCostPerformanceBar pourCostPercentage={cocktail.pourCostPercentage} />

          <Text className="text-xs text-g3 mt-3">
            This cocktail generates a profit of {currencySymbol}
            {cocktail.profitMargin.toFixed(2)} at the suggested price of {currencySymbol}
            {cocktail.suggestedPrice.toFixed(2)}.
          </Text>
        </View>

        {/* Notes */}
        {cocktail.notes && (
          <View className="bg-n1 p-4 rounded-lg mb-6">
            <Text className="text-lg font-semibold text-g4 mb-2">
              Notes
            </Text>
            <Text className="text-g4">{cocktail.notes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row gap-2 mb-4">
          <Pressable
            onPress={handleToggleFavorite}
            className={`flex-1 rounded-lg p-3 flex-row items-center justify-center gap-2 ${
              cocktail.favorited ? 'bg-e2' : 'bg-n10'
            }`}
          >
            <Ionicons
              name={cocktail.favorited ? 'heart' : 'heart-outline'}
              size={16}
              color="white"
            />
            <Text className="text-white font-medium text-sm">
              {cocktail.favorited ? 'Favorited' : 'Favorite'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleEdit}
            className="flex-1 bg-p2 rounded-lg p-3 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="pencil" size={16} color="white" />
            <Text className="text-white font-medium text-sm">Edit</Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            className="flex-1 bg-e2 rounded-lg p-3 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="trash" size={16} color="white" />
            <Text className="text-white font-medium text-sm">Delete</Text>
          </Pressable>
        </View>

        <Text className="text-center text-g3 text-xs">
          Created: {new Date(cocktail.createdAt).toLocaleDateString()} • Last
          updated: {new Date(cocktail.updatedAt).toLocaleDateString()}
        </Text>
      </View>
    </Modal>
  );
}
