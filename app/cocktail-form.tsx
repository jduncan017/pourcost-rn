import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/src/stores/app-store';
import { Ionicons } from '@expo/vector-icons';
import TextInput from '@/src/components/ui/TextInput';
import IngredientListItem from '@/src/components/IngredientListItem';
import EmptyState from '@/src/components/EmptyState';
import Modal from '@/src/components/ui/Modal';
import CustomSlider from '@/src/components/ui/CustomSlider';
import BottleSizeDropdown from '@/src/components/BottleSizeDropdown';
import PourCostPerformanceBar from '@/src/components/PourCostPerformanceBar';
import Card from '@/src/components/ui/Card';

// Cocktail category options
const COCKTAIL_CATEGORIES = ['Classic', 'Modern', 'Tropical', 'Whiskey', 'Vodka', 'Rum', 'Gin', 'Tequila', 'Other'] as const;
type CocktailCategory = typeof COCKTAIL_CATEGORIES[number];

// Difficulty options
const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'] as const;
type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];

// Ingredient types
const INGREDIENT_TYPES = ['Beer', 'Wine', 'Spirit', 'Liquor', 'Prepared', 'Garnish'] as const;
type IngredientType = typeof INGREDIENT_TYPES[number];

interface CocktailIngredient {
  id: string;
  name: string;
  amount: number; // oz
  bottleSize: number; // ml
  bottlePrice: number;
  type: IngredientType;
  costPerOz: number;
  cost: number; // cost for this amount
}

/**
 * Cocktail creation and editing form
 * Handles both creating new cocktails and editing existing ones
 */
export default function CocktailFormScreen() {
  const { baseCurrency } = useAppStore();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Check if we're editing an existing cocktail
  const isEditing = Boolean(params.id);
  const cocktailId = params.id as string;
  
  // Form state
  const [name, setName] = useState(params.name as string || '');
  const [description, setDescription] = useState(params.description as string || '');
  const [category, setCategory] = useState<CocktailCategory>((params.category as CocktailCategory) || 'Classic');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>((params.difficulty as DifficultyLevel) || 'Easy');
  const [prepTime, setPrepTime] = useState(Number(params.prepTime) || 3);
  const [notes, setNotes] = useState(params.notes as string || '');
  const [ingredients, setIngredients] = useState<CocktailIngredient[]>([]);
  
  // Add ingredient modal state
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientType, setNewIngredientType] = useState<IngredientType>('Liquor');
  const [newIngredientAmount, setNewIngredientAmount] = useState(1.5);
  const [newIngredientBottleSize, setNewIngredientBottleSize] = useState(750);
  const [newIngredientBottlePrice, setNewIngredientBottlePrice] = useState(25.0);
  
  // Calculate totals
  const totalCost = ingredients.reduce((sum, ing) => sum + ing.cost, 0);
  const averagePourCostPercentage = 20; // Default target
  const suggestedPrice = totalCost / (averagePourCostPercentage / 100);
  const profitMargin = suggestedPrice - totalCost;
  const pourCostPercentage = totalCost > 0 ? (totalCost / suggestedPrice) * 100 : 0;
  
  // Validation
  const isValid = name.trim().length > 0 && ingredients.length > 0;
  
  // Add ingredient to cocktail
  const addIngredient = () => {
    if (!newIngredientName.trim()) {
      Alert.alert('Missing Name', 'Please enter an ingredient name.');
      return;
    }
    
    const bottleSizeOz = newIngredientBottleSize / 29.5735;
    const costPerOz = newIngredientBottlePrice / bottleSizeOz;
    const cost = costPerOz * newIngredientAmount;
    
    const newIngredient: CocktailIngredient = {
      id: Date.now().toString(),
      name: newIngredientName.trim(),
      amount: newIngredientAmount,
      bottleSize: newIngredientBottleSize,
      bottlePrice: newIngredientBottlePrice,
      type: newIngredientType,
      costPerOz,
      cost,
    };
    
    setIngredients([...ingredients, newIngredient]);
    
    // Reset form
    setNewIngredientName('');
    setNewIngredientType('Liquor');
    setNewIngredientAmount(1.5);
    setNewIngredientBottleSize(750);
    setNewIngredientBottlePrice(25.0);
    setShowAddIngredientModal(false);
  };
  
  // Remove ingredient
  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };
  
  // Edit ingredient
  const editIngredient = (id: string) => {
    const ingredient = ingredients.find(ing => ing.id === id);
    if (ingredient) {
      Alert.alert('Edit Ingredient', `Would open edit form for ${ingredient.name}`);
    }
  };
  
  // Handle save
  const handleSave = () => {
    if (!isValid) {
      Alert.alert('Invalid Data', 'Please enter a cocktail name and add at least one ingredient.');
      return;
    }
    
    const cocktailData = {
      id: isEditing ? cocktailId : Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      category,
      ingredients,
      totalCost,
      suggestedPrice,
      pourCostPercentage,
      profitMargin,
      difficulty,
      prepTime,
      notes: notes.trim(),
      createdAt: isEditing ? params.createdAt as string : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      favorited: Boolean(params.favorited),
    };
    
    Alert.alert(
      isEditing ? 'Cocktail Updated' : 'Cocktail Created',
      `\"${name}\" has been ${isEditing ? 'updated' : 'saved'} successfully.\\n\\nIngredients: ${ingredients.length}\\nTotal Cost: $${totalCost.toFixed(2)}\\nSuggested Price: $${suggestedPrice.toFixed(2)}`,
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
      'Delete Cocktail',
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
  
  // Get pour cost color
  const getPourCostColor = (pourCost: number) => {
    if (pourCost <= 20) return 'text-s22';
    if (pourCost <= 25) return 'text-s12';
    return 'bg-e3';
  };

  return (
    <ScrollView className="flex-1 bg-n1">
      <View className="p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              className="p-2 bg-g1/60 rounded-lg"
            >
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </Pressable>
            <View>
              <Text className="text-2xl font-bold text-g4">
                {isEditing ? 'Edit Cocktail' : 'Create Cocktail'}
              </Text>
              <Text className="text-g3">
                {isEditing ? 'Update cocktail recipe' : 'Build your cocktail recipe'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Basic Information */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-g4 mb-4">
            Basic Information
          </Text>
          
          <View className="space-y-4">
            <TextInput
              label="Cocktail Name *"
              value={name}
              onChangeText={setName}
              placeholder="e.g., Classic Margarita, Espresso Martini"
            />
            
            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of the cocktail"
              multiline
            />
            
            <View>
              <Text className="text-sm font-medium text-g4 mb-2">Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                {COCKTAIL_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={`px-3 py-2 rounded-lg border ${
                      category === cat
                        ? 'bg-p1 border-p1'
                        : 'bg-n1/80 border-g2/50'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${
                      category === cat ? 'text-white' : 'text-g4'
                    }`}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-g4 mb-2">Difficulty</Text>
                <View className="flex-row gap-2">
                  {DIFFICULTY_LEVELS.map((level) => (
                    <Pressable
                      key={level}
                      onPress={() => setDifficulty(level)}
                      className={`flex-1 px-3 py-2 rounded-lg border ${
                        difficulty === level
                          ? 'bg-p1 border-p1'
                          : 'bg-n1/80 border-g2/50'
                      }`}
                    >
                      <Text className={`text-sm font-medium text-center ${
                        difficulty === level ? 'text-white' : 'text-g4'
                      }`}>
                        {level}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              
              <View className="flex-1">
                <CustomSlider
                  label="Prep Time (min)"
                  minValue={1}
                  maxValue={10}
                  value={prepTime}
                  onValueChange={setPrepTime}
                  unit=" min"
                  step={0.5}
                />
              </View>
            </View>
          </View>
        </Card>
        
        {/* Ingredients */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-g4">
              Ingredients ({ingredients.length})
            </Text>
            <Pressable
              onPress={() => setShowAddIngredientModal(true)}
              className="bg-p1 rounded-lg p-2 flex-row items-center gap-1"
            >
              <Ionicons name="add" size={16} color="white" />
              <Text className="text-white text-sm font-medium">Add</Text>
            </Pressable>
          </View>
          
          {ingredients.length === 0 ? (
            <EmptyState
              icon="wine"
              title="No ingredients added"
              description="Add ingredients to build your cocktail"
              actionLabel="Add Ingredient"
              onAction={() => setShowAddIngredientModal(true)}
            />
          ) : (
            <View className="space-y-2">
              {ingredients.map((ingredient) => (
                <View key={ingredient.id} className="flex-row items-center gap-2">
                  <View className="flex-1">
                    <IngredientListItem
                      name={`${ingredient.name} (${ingredient.amount}oz)`}
                      bottleSize={ingredient.bottleSize}
                      bottlePrice={ingredient.bottlePrice}
                      pourSize={ingredient.amount}
                      costPerPour={ingredient.cost}
                      costPerOz={ingredient.bottlePrice / (ingredient.bottleSize / 29.5735)} // Calculate cost per oz
                      pourCostMargin={0} // Default value for cocktail form
                      pourCostPercentage={20} // Default pour cost percentage
                      currency={baseCurrency}
                      measurementSystem="US"
                      onPress={() => editIngredient(ingredient.id)}
                      onEdit={() => editIngredient(ingredient.id)}
                      onDelete={() => removeIngredient(ingredient.id)}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>
        
        {/* Cost Analysis */}
        {ingredients.length > 0 && (
          <Card className="mb-4">
            <Text className="text-lg font-semibold text-g4 mb-4">
              Cost Analysis
            </Text>
            
            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-g3">Total Cost:</Text>
                <Text className="font-medium text-g4">
                  ${totalCost.toFixed(2)}
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-g3">Suggested Price:</Text>
                <Text className="font-medium text-g4">
                  ${suggestedPrice.toFixed(2)}
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-g3">Pour Cost:</Text>
                <Text className={`font-medium ${getPourCostColor(pourCostPercentage)}`}>
                  {pourCostPercentage.toFixed(1)}%
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-g3">Profit Margin:</Text>
                <Text className="font-medium text-s22">
                  ${profitMargin.toFixed(2)}
                </Text>
              </View>
              
              {/* Performance Indicator */}
              <View className="mt-4 pt-3 border-t border-g2/40">
                <PourCostPerformanceBar pourCostPercentage={pourCostPercentage} />
              </View>
            </View>
          </Card>
        )}
        
        {/* Notes */}
        <Card className="mb-6">
          <Text className="text-lg font-semibold text-g4 mb-4">
            Notes & Instructions
          </Text>
          
          <TextInput
            label="Preparation Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g., Shake vigorously, serve in salt-rimmed glass"
            multiline
          />
        </Card>
        
        {/* Action Buttons */}
        <View className="space-y-3">
          <Pressable
            onPress={handleSave}
            disabled={!isValid}
            className={`rounded-lg p-4 flex-row items-center justify-center gap-2 ${
              isValid ? 'bg-s22' : 'bg-g2'
            }`}
          >
            <Ionicons name="checkmark" size={20} color="white" />
            <Text className="text-white font-semibold text-lg">
              {isEditing ? 'Update Cocktail' : 'Save Cocktail'}
            </Text>
          </Pressable>
          
          {isEditing && (
            <Pressable
              onPress={handleDelete}
              className="bg-e2 rounded-lg p-4 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="trash" size={20} color="white" />
              <Text className="text-white font-semibold text-lg">Delete Cocktail</Text>
            </Pressable>
          )}
          
          <Pressable
            onPress={() => router.back()}
            className="bg-g3 rounded-lg p-4 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="close" size={20} color="white" />
            <Text className="text-white font-semibold text-lg">Cancel</Text>
          </Pressable>
        </View>
        
        <Text className="text-center text-g3 text-xs mt-4">
          * Required fields
        </Text>
      </View>
      
      {/* Add Ingredient Modal */}
      <Modal
        visible={showAddIngredientModal}
        onClose={() => setShowAddIngredientModal(false)}
        title="Add Ingredient"
        size="large"
      >
        <View className="p-4 space-y-4">
          <TextInput
            label="Ingredient Name *"
            value={newIngredientName}
            onChangeText={setNewIngredientName}
            placeholder="e.g., Vodka, Lime Juice"
          />
          
          <View>
            <Text className="text-sm font-medium text-g4 mb-2">Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
              {INGREDIENT_TYPES.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setNewIngredientType(type)}
                  className={`px-3 py-2 rounded-lg border ${
                    newIngredientType === type
                      ? 'bg-p1 border-p1'
                      : 'bg-n1/80 border-g2/50'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    newIngredientType === type ? 'text-white' : 'text-g4'
                  }`}>
                    {type}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          
          <CustomSlider
            label="Amount (oz)"
            minValue={0.25}
            maxValue={4}
            value={newIngredientAmount}
            onValueChange={setNewIngredientAmount}
            unit=" oz"
            step={0.25}
          />
          
          <BottleSizeDropdown
            label="Bottle Size"
            value={newIngredientBottleSize}
            onValueChange={setNewIngredientBottleSize}
          />
          
          <CustomSlider
            label="Bottle Price"
            minValue={1}
            maxValue={200}
            value={newIngredientBottlePrice}
            onValueChange={setNewIngredientBottlePrice}
            unit={` ${baseCurrency} `}
            dynamicStep={(value) => value < 50 ? 0.5 : 1}
          />
          
          <View className="flex-row gap-3 mt-6">
            <Pressable
              onPress={() => setShowAddIngredientModal(false)}
              className="flex-1 bg-g3 rounded-lg p-3 flex-row items-center justify-center gap-2"
            >
              <Text className="text-white font-medium">Cancel</Text>
            </Pressable>
            
            <Pressable
              onPress={addIngredient}
              className="flex-1 bg-s22 rounded-lg p-3 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="add" size={16} color="white" />
              <Text className="text-white font-medium">Add Ingredient</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}