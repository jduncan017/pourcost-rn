import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/src/stores/app-store';
import { Ionicons } from '@expo/vector-icons';
import CustomSlider from '@/src/components/ui/CustomSlider';
import BottleSizeDropdown from '@/src/components/BottleSizeDropdown';
import TextInput from '@/src/components/ui/TextInput';
import Card from '@/src/components/ui/Card';

// Ingredient type options
const INGREDIENT_TYPES = ['Beer', 'Wine', 'Liquor', 'Mixer', 'Syrup', 'Juice', 'Other'] as const;
type IngredientType = typeof INGREDIENT_TYPES[number];

interface Ingredient {
  id: string;
  name: string;
  bottleSize: number; // ml
  type: IngredientType;
  price: number; // bottle price
  costPerOz: number;
  retailPrice: number; // price for 1.5oz serving
  pourCost: number; // percentage
  suggestedRetail: number;
  pourCostMargin: number; // profit margin
  createdAt: string;
  updatedAt: string;
}

/**
 * Ingredient detail and edit screen
 * Shows comprehensive ingredient data and allows editing
 */
export default function IngredientDetailScreen() {
  const insets = useSafeAreaInsets();
  const { baseCurrency } = useAppStore();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Parse ingredient data from params (in real app, would fetch by ID)
  const [isEditing, setIsEditing] = useState(false);
  
  // Mock ingredient data (would be fetched by ID in real app)
  const [ingredient, setIngredient] = useState<Ingredient>({
    id: params.id as string || '1',
    name: 'Vodka (Premium)',
    bottleSize: 750,
    type: 'Liquor',
    price: 24.99,
    costPerOz: 0.98,
    retailPrice: 8.00,
    pourCost: 18.3,
    suggestedRetail: 7.35,
    pourCostMargin: 6.53,
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-15T10:30:00Z',
  });
  
  // Global pour cost goal (would come from settings store)
  const globalPourCostGoal = 20; // 20%
  
  // Calculate derived values when core values change
  const calculateDerivedValues = (updatedIngredient: Partial<Ingredient>) => {
    const updated = { ...ingredient, ...updatedIngredient };
    
    // Calculate cost per oz from bottle price and size
    const bottleSizeOz = updated.bottleSize / 29.5735;
    const costPerOz = updated.price / bottleSizeOz;
    
    // Calculate pour cost percentage (cost for 1.5oz / retail price)
    const costFor15oz = costPerOz * 1.5;
    const pourCost = (costFor15oz / updated.retailPrice) * 100;
    
    // Calculate suggested retail based on global pour cost goal
    const suggestedRetail = costFor15oz / (globalPourCostGoal / 100);
    
    // Calculate pour cost margin
    const pourCostMargin = updated.retailPrice - costFor15oz;
    
    return {
      ...updated,
      costPerOz,
      pourCost,
      suggestedRetail,
      pourCostMargin,
      updatedAt: new Date().toISOString(),
    };
  };
  
  // Handle ingredient updates
  const handleUpdate = (field: keyof Ingredient, value: any) => {
    const updatedIngredient = calculateDerivedValues({ [field]: value });
    setIngredient(updatedIngredient);
  };
  
  // Handle save
  const handleSave = () => {
    Alert.alert(
      'Ingredient Saved',
      `\"${ingredient.name}\" has been updated successfully.`,
      [
        {
          text: 'OK',
          onPress: () => setIsEditing(false),
        },
      ]
    );
  };
  
  // Handle delete
  const handleDelete = () => {
    Alert.alert(
      'Delete Ingredient',
      `Are you sure you want to delete \"${ingredient.name}\"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Deleted', `\"${ingredient.name}\" has been deleted.`);
            router.back();
          },
        },
      ]
    );
  };
  
  // Get pour cost color
  const getPourCostColor = (pourCost: number) => {
    if (pourCost <= 15) return 'text-s22';
    if (pourCost <= 25) return 'text-s12';
    return 'text-e3';
  };
  
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

  return (
    <ScrollView className="flex-1 bg-n1" style={{ paddingTop: insets.top }}>
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
              <Text className="text-2xl text-g4" style={{fontFamily: 'Geist', fontWeight: '700'}}>
                {isEditing ? 'Edit Ingredient' : 'Ingredient Details'}
              </Text>
              <Text className="text-g3" style={{fontFamily: 'Geist'}}>
                {ingredient.type} • Created {new Date(ingredient.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          <View className="flex-row gap-2">
            {!isEditing ? (
              <>
                <Pressable
                  onPress={() => setIsEditing(true)}
                  className="bg-p2 rounded-lg p-3 flex-row items-center gap-2"
                >
                  <Ionicons name="pencil" size={16} color="white" />
                  <Text className="text-white" style={{fontFamily: 'Geist', fontWeight: '500'}}>Edit</Text>
                </Pressable>
                
                <Pressable
                  onPress={handleDelete}
                  className="bg-e2 rounded-lg p-3"
                >
                  <Ionicons name="trash" size={16} color="white" />
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  onPress={() => setIsEditing(false)}
                  className="bg-g3 rounded-lg p-3"
                >
                  <Text className="text-white" style={{fontFamily: 'Geist', fontWeight: '500'}}>Cancel</Text>
                </Pressable>
                
                <Pressable
                  onPress={handleSave}
                  className="bg-s22 rounded-lg p-3 flex-row items-center gap-2"
                >
                  <Ionicons name="checkmark" size={16} color="white" />
                  <Text className="text-white" style={{fontFamily: 'Geist', fontWeight: '500'}}>Save</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
        
        {/* Basic Information */}
        <Card className="mb-4">
          <Text className="text-lg text-g4 mb-4" style={{fontFamily: 'Geist', fontWeight: '600'}}>
            Basic Information
          </Text>
          
          {isEditing ? (
            <View className="space-y-4">
              <TextInput
                label="Name"
                value={ingredient.name}
                onChangeText={(value) => handleUpdate('name', value)}
                placeholder="Enter ingredient name"
              />
              
              <View>
                <Text className="text-sm text-g4 mb-2" style={{fontFamily: 'Geist', fontWeight: '500'}}>Type</Text>
                <View className="flex-row flex-wrap gap-2">
                  {INGREDIENT_TYPES.map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => handleUpdate('type', type)}
                      className={`px-3 py-2 rounded-lg border ${
                        ingredient.type === type
                          ? 'bg-p1 border-p1'
                          : 'bg-n1/80 border-g2/50'
                      }`}
                    >
                      <Text className={`text-sm ${
                        ingredient.type === type ? 'text-white' : 'text-g4'
                      }`} style={{fontFamily: 'Geist', fontWeight: '500'}}>
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              
              <BottleSizeDropdown
                label="Bottle Size"
                value={ingredient.bottleSize}
                onValueChange={(value) => handleUpdate('bottleSize', value)}
              />
            </View>
          ) : (
            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-g3" style={{fontFamily: 'Geist'}}>Name:</Text>
                <Text className="text-g4" style={{fontFamily: 'Geist', fontWeight: '500'}}>{ingredient.name}</Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-g3" style={{fontFamily: 'Geist'}}>Type:</Text>
                <Text className="text-g4" style={{fontFamily: 'Geist', fontWeight: '500'}}>{ingredient.type}</Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-g3" style={{fontFamily: 'Geist'}}>Bottle Size:</Text>
                <Text className="text-g4" style={{fontFamily: 'Geist', fontWeight: '500'}}>{ingredient.bottleSize}ml</Text>
              </View>
            </View>
          )}
        </Card>
        
        {/* Pricing Information */}
        <Card className="mb-4">
          <Text className="text-lg text-g4 mb-4" style={{fontFamily: 'Geist', fontWeight: '600'}}>
            Pricing & Costs
          </Text>
          
          {isEditing ? (
            <View className="space-y-4">
              <CustomSlider
                label="Bottle Price"
                minValue={1}
                maxValue={500}
                value={ingredient.price}
                onValueChange={(value) => handleUpdate('price', value)}
                unit={` ${baseCurrency} `}
                dynamicStep={getPriceStep}
                logarithmic={true}
              />
              
              <CustomSlider
                label="Retail Price (1.5oz)"
                minValue={0.5}
                maxValue={50}
                value={ingredient.retailPrice}
                onValueChange={(value) => handleUpdate('retailPrice', value)}
                unit={` ${baseCurrency} `}
                step={0.25}
              />
            </View>
          ) : (
            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-g3" style={{fontFamily: 'Geist'}}>Bottle Price:</Text>
                <Text className="text-g4" style={{fontFamily: 'Geist', fontWeight: '500'}}>
                  ${ingredient.price.toFixed(2)}
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-g3" style={{fontFamily: 'Geist'}}>Retail Price (1.5oz):</Text>
                <Text className="text-g4" style={{fontFamily: 'Geist', fontWeight: '500'}}>
                  ${ingredient.retailPrice.toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        </Card>
        
        {/* Calculated Values */}
        <Card className="mb-4">
          <Text className="text-lg text-g4 mb-4" style={{fontFamily: 'Geist', fontWeight: '600'}}>
            Calculated Values
          </Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-g3" style={{fontFamily: 'Geist'}}>Cost per Oz:</Text>
              <Text className="text-g4" style={{fontFamily: 'Geist', fontWeight: '500'}}>
                ${ingredient.costPerOz.toFixed(3)}
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-g3" style={{fontFamily: 'Geist'}}>Pour Cost:</Text>
              <Text className={`font-geist ${getPourCostColor(ingredient.pourCost)}`} style={{fontFamily: 'Geist', fontWeight: '500'}}>
                {ingredient.pourCost.toFixed(1)}%
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-g3" style={{fontFamily: 'Geist'}}>Suggested Retail ({globalPourCostGoal}% target):</Text>
              <Text className="text-p2" style={{fontFamily: 'Geist', fontWeight: '500'}}>
                ${ingredient.suggestedRetail.toFixed(2)}
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-g3" style={{fontFamily: 'Geist'}}>Pour Cost Margin:</Text>
              <Text className="text-s22" style={{fontFamily: 'Geist', fontWeight: '500'}}>
                ${ingredient.pourCostMargin.toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>
        
        {/* Performance Metrics */}
        <Card className="mb-4">
          <Text className="text-lg text-g4 mb-4" style={{fontFamily: 'Geist', fontWeight: '600'}}>
            Performance Metrics
          </Text>
          
          <View className="space-y-4">
            {/* Pour Cost Indicator */}
            <View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-g3" style={{fontFamily: 'Geist'}}>Pour Cost Performance</Text>
                <Text className={`text-sm ${getPourCostColor(ingredient.pourCost)}`} style={{fontFamily: 'Geist', fontWeight: '500'}}>
                  {ingredient.pourCost.toFixed(1)}% of {globalPourCostGoal}% target
                </Text>
              </View>
              <View className="h-3 bg-g1/80 rounded-full overflow-hidden">
                <View 
                  className={`h-full rounded-full ${
                    ingredient.pourCost <= 15 ? 'bg-s22' :
                    ingredient.pourCost <= 25 ? 'bg-s12' : 'bg-e2'
                  }`}
                  style={{ width: `${Math.min((ingredient.pourCost / globalPourCostGoal) * 100, 100)}%` }}
                />
              </View>
            </View>
            
            {/* Profit Analysis */}
            <View className="bg-n1 p-3 rounded-lg">
              <Text className="text-sm text-g4 mb-2" style={{fontFamily: 'Geist', fontWeight: '500'}}>Profit Analysis</Text>
              <Text className="text-xs text-g3" style={{fontFamily: 'Geist'}}>
                Current retail price of ${ingredient.retailPrice.toFixed(2)} generates a margin of ${ingredient.pourCostMargin.toFixed(2)} per 1.5oz serve.
                {ingredient.pourCost > globalPourCostGoal ? 
                  ` Consider raising price to $${ingredient.suggestedRetail.toFixed(2)} to meet ${globalPourCostGoal}% target.` :
                  ` You're ${(globalPourCostGoal - ingredient.pourCost).toFixed(1)}% below target - good performance!`
                }
              </Text>
            </View>
          </View>
        </Card>
        
        {/* Last Updated */}
        <Card>
          <Text className="text-sm text-g3 text-center" style={{fontFamily: 'Geist'}}>
            Last updated: {new Date(ingredient.updatedAt).toLocaleString()}
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
}