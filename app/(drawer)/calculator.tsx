import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useAppStore } from '@/src/stores/app-store';
import CustomSlider from '@/src/components/ui/CustomSlider';
import BottleSizeDropdown from '@/src/components/BottleSizeDropdown';
import IngredientListItem from '@/src/components/IngredientListItem';
import EmptyState from '@/src/components/EmptyState';
import TextInput from '@/src/components/ui/TextInput';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/src/components/ui/Card';

// Calculator ingredient interface
interface CalculatorIngredient {
  id: string;
  name: string;
  bottleSize: number;
  bottlePrice: number;
  pourSize: number;
  pourCostPercentage: number;
  costPerOz: number;
  costPerPour: number;
}

/**
 * Calculator screen - supports both quick single ingredient calculations and cocktail building
 * Automatically switches between single ingredient mode and cocktail mode
 */
export default function CalculatorScreen() {
  const { measurementSystem, baseCurrency } = useAppStore();
  
  // Mode state
  const [mode, setMode] = useState<'single' | 'cocktail'>('single');
  const [cocktailIngredients, setCocktailIngredients] = useState<CalculatorIngredient[]>([]);
  const [cocktailName, setCocktailName] = useState('');
  
  // Single ingredient state
  const [bottleSize, setBottleSize] = useState(750); // ml
  const [bottlePrice, setBottlePrice] = useState(25.0);
  const [pourSize, setPourSize] = useState(1.5); // oz
  const [pourCostPercentage, setPourCostPercentage] = useState(20); // 20%

  // Convert bottle size from ml to oz for calculation
  const bottleSizeOz = bottleSize / 29.5735;

  // Calculate cost per pour: product price / product size (oz) * pour size (oz)
  const costPerPour = (bottlePrice / bottleSizeOz) * pourSize;
  
  // Calculate cost per oz
  const costPerOz = bottlePrice / bottleSizeOz;

  // Calculate suggested charge: cost per pour / pour cost percentage
  const suggestedCharge = costPerPour / (pourCostPercentage / 100);
  
  // Calculate pour cost margin
  const pourCostMargin = suggestedCharge - costPerPour;
  
  // Calculate cocktail totals
  const totalCocktailCost = cocktailIngredients.reduce((sum, ing) => sum + ing.costPerPour, 0);
  const averagePourCostPercentage = cocktailIngredients.length > 0 
    ? cocktailIngredients.reduce((sum, ing) => sum + ing.pourCostPercentage, 0) / cocktailIngredients.length
    : 20;
  const totalSuggestedCharge = totalCocktailCost / (averagePourCostPercentage / 100);
  const totalMargin = totalSuggestedCharge - totalCocktailCost;
  
  
  // Remove ingredient from cocktail
  const removeFromCocktail = (id: string) => {
    const updated = cocktailIngredients.filter(ing => ing.id !== id);
    setCocktailIngredients(updated);
    
    // Switch back to single mode if no ingredients left
    if (updated.length === 0) {
      setMode('single');
      setCocktailName('');
    }
  };
  
  // Edit ingredient in cocktail
  const editCocktailIngredient = (id: string) => {
    const ingredient = cocktailIngredients.find(ing => ing.id === id);
    if (ingredient) {
      Alert.alert('Edit Ingredient', `Would open edit form for ${ingredient.name}`);
    }
  };
  
  // Save cocktail
  const saveCocktail = () => {
    if (cocktailIngredients.length === 0) {
      Alert.alert('No Ingredients', 'Add ingredients to your cocktail before saving.');
      return;
    }
    
    const name = cocktailName.trim() || 'Untitled Cocktail';
    Alert.alert(
      'Cocktail Saved',
      `"${name}" has been saved with ${cocktailIngredients.length} ingredients.\n\nTotal Cost: $${totalCocktailCost.toFixed(2)}\nSuggested Price: $${totalSuggestedCharge.toFixed(2)}`
    );
  };
  
  // Clear cocktail
  const clearCocktail = () => {
    Alert.alert(
      'Clear Cocktail',
      'Are you sure you want to clear all ingredients?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setCocktailIngredients([]);
            setCocktailName('');
            setMode('single');
          }
        }
      ]
    );
  };
  
  // Handle saving single ingredient
  const handleSaveIngredient = () => {
    Alert.prompt(
      'Save Ingredient',
      'Enter a name for this ingredient:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Save',
          onPress: (ingredientName) => {
            if (ingredientName && ingredientName.trim()) {
              // Mock save functionality - would save to ingredients store
              const ingredientData = {
                name: ingredientName.trim(),
                bottleSize,
                bottlePrice,
                pourSize,
                pourCostPercentage,
                costPerOz,
                retailPrice: suggestedCharge,
                costPerPour,
                pourCostMargin,
                type: 'Liquor', // Default type
                createdAt: new Date().toISOString()
              };
              
              Alert.alert(
                'Ingredient Saved',
                `"${ingredientName}" has been saved to your ingredients list.\n\nCost/Oz: $${costPerOz.toFixed(2)}\nSuggested Retail: $${suggestedCharge.toFixed(2)}`
              );
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // Dynamic step functions matching original PourCost
  const getPriceStep = (value: number): number => {
    if (value < 30) return 0.25;
    if (value < 50) return 0.5;
    if (value < 100) return 1;
    if (value < 150) return 2;
    if (value < 200) return 5;
    if (value < 300) return 10;
    if (value < 1000) return 25;
    if (value < 2000) return 50;
    return 100;
  };

  const getPourCostStep = (value: number): number => {
    if (value < 5) return 1;
    if (value < 10) return 0.5;
    if (value < 30) return 0.25;
    if (value < 50) return 2;
    if (value < 75) return 5;
    return 5;
  };

  return (
    <ScrollView className="flex-1 bg-n1">
      <View className="p-4">
        {/* Quick Calculator */}
        <Card className="mb-6 bg-n1/80 backdrop-blur-sm border border-g1/50">
          <Text className="text-lg font-semibold text-g4 mb-4">
            Quick Calculator
          </Text>

          <BottleSizeDropdown
            label="Bottle Size"
            value={bottleSize}
            onValueChange={setBottleSize}
          />

          <CustomSlider
            label="Product Cost"
            minValue={1}
            maxValue={5000}
            value={bottlePrice}
            onValueChange={setBottlePrice}
            unit={` ${baseCurrency} `}
            dynamicStep={getPriceStep}
            logarithmic={true}
          />

          <CustomSlider
            label="Pour Size"
            minValue={0.25}
            maxValue={8}
            value={pourSize}
            onValueChange={setPourSize}
            unit=" oz"
            step={0.25}
          />

          <CustomSlider
            label="Pour Cost %"
            minValue={1}
            maxValue={100}
            value={pourCostPercentage}
            onValueChange={setPourCostPercentage}
            unit="%"
            dynamicStep={getPourCostStep}
            pourCostScale={true}
          />

          {/* Cost Display */}
          <View className="mt-6 p-4 bg-g1/60 rounded-lg border border-g2/40">
            <Text className="text-center text-lg font-semibold text-g4 mb-2">
              Cost Per Pour
            </Text>
            <Text className="text-center text-3xl font-bold text-g4">
              {`${baseCurrency === 'USD' ? '$' : ''}${costPerPour.toFixed(2)}`}
            </Text>
          </View>

          {/* Charge Display */}
          <View className="mt-4 p-4 bg-p1/10 rounded-lg border-2 border-p1/30">
            <Text className="text-center text-lg font-semibold text-p3 mb-2">
              Suggested Charge
            </Text>
            <Text className="text-center text-3xl font-bold text-p4">
              {`${baseCurrency === 'USD' ? '$' : ''}${suggestedCharge.toFixed(2)}`}
            </Text>
            <Text className="text-center text-sm text-p2 mt-2">
              {pourCostPercentage}% pour cost • {pourSize.toFixed(2)}oz pour
            </Text>
          </View>
          
          {/* Additional Calculations */}
          <View className="mt-4" style={{gap: 8}}>
            <View className="flex-row justify-between items-center p-3 bg-n2/60 rounded-lg">
              <Text className="text-g3 font-medium">Cost per Oz:</Text>
              <Text className="text-g4 font-semibold">
                {`${baseCurrency === 'USD' ? '$' : ''}${costPerOz.toFixed(2)}`}
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center p-3 bg-n2/60 rounded-lg">
              <Text className="text-g3 font-medium">Pour Cost Margin:</Text>
              <Text className="text-s22 font-semibold">
                {`${baseCurrency === 'USD' ? '$' : ''}${pourCostMargin.toFixed(2)}`}
              </Text>
            </View>
          </View>
          
          {/* Save Button */}
          {/* Action Buttons */}
          <Pressable
            onPress={handleSaveIngredient}
            className="bg-s22 rounded-lg p-4 flex-row items-center justify-center gap-2 mt-6"
          >
            <Ionicons name="bookmark" size={20} color="white" />
            <Text className="text-white font-semibold">Save as Ingredient</Text>
          </Pressable>
          
          <Text className="text-center text-g3 text-sm mt-2">
            Save your calculated ingredient for use in cocktail recipes
          </Text>
        </Card>
        
        {/* Cocktail Mode */}
        {mode === 'cocktail' && (
          <Card className="mt-6 bg-n1/80 backdrop-blur-sm border border-g1/50">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-g4">
                Cocktail Builder
              </Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={clearCocktail}
                  className="bg-e2 rounded-lg p-2"
                >
                  <Ionicons name="trash" size={16} color="white" />
                </Pressable>
                <Pressable
                  onPress={() => setMode('single')}
                  className="bg-g3 rounded-lg p-2"
                >
                  <Ionicons name="calculator" size={16} color="white" />
                </Pressable>
              </View>
            </View>
            
            {/* Cocktail Name */}
            <TextInput
              label="Cocktail Name"
              value={cocktailName}
              onChangeText={setCocktailName}
              placeholder="Enter cocktail name"
            />
            
            {/* Ingredients List */}
            <View className="mt-4">
              <Text className="text-sm font-medium text-g4 mb-3">
                Ingredients ({cocktailIngredients.length})
              </Text>
              
              {cocktailIngredients.length === 0 ? (
                <EmptyState
                  icon="wine"
                  title="No ingredients added"
                  description="Add ingredients using the calculator above"
                  actionLabel="Add First Ingredient"
                  onAction={() => {
                    Alert.alert('Add Ingredient', 'Use the calculator above to add your first ingredient.');
                  }}
                />
              ) : (
                <View className="space-y-2">
                  {cocktailIngredients.map((ingredient) => (
                    <View key={ingredient.id} className="flex-row items-center gap-2">
                      <View className="flex-1">
                        <IngredientListItem
                          name={ingredient.name}
                          bottleSize={ingredient.bottleSize}
                          bottlePrice={ingredient.bottlePrice}
                          pourSize={ingredient.pourSize}
                          costPerPour={ingredient.costPerPour}
                          costPerOz={ingredient.costPerOz}
                          pourCostMargin={0} // Default value for calculator
                          pourCostPercentage={ingredient.pourCostPercentage}
                          currency={baseCurrency}
                          measurementSystem={measurementSystem}
                          onPress={() => editCocktailIngredient(ingredient.id)}
                          onEdit={() => editCocktailIngredient(ingredient.id)}
                          onDelete={() => removeFromCocktail(ingredient.id)}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
            
            {/* Cocktail Totals */}
            {cocktailIngredients.length > 0 && (
              <View className="mt-6" style={{gap: 16}}>
                {/* Total Cost */}
                <View className="p-4 bg-g1/60 rounded-lg border border-g2/40">
                  <Text className="text-center text-lg font-semibold text-g4 mb-2">
                    Total Cost
                  </Text>
                  <Text className="text-center text-3xl font-bold text-g4">
                    {`${baseCurrency === 'USD' ? '$' : ''}${totalCocktailCost.toFixed(2)}`}
                  </Text>
                </View>

                {/* Suggested Price */}
                <View className="p-4 bg-p1/10 rounded-lg border-2 border-p1/30">
                  <Text className="text-center text-lg font-semibold text-p3 mb-2">
                    Suggested Price
                  </Text>
                  <Text className="text-center text-3xl font-bold text-p4">
                    {`${baseCurrency === 'USD' ? '$' : ''}${totalSuggestedCharge.toFixed(2)}`}
                  </Text>
                  <Text className="text-center text-sm text-p2 mt-2">
                    {averagePourCostPercentage.toFixed(1)}% avg pour cost • ${totalMargin.toFixed(2)} profit
                  </Text>
                </View>
                
                {/* Save Cocktail Button */}
                <Pressable
                  onPress={saveCocktail}
                  className="bg-s22 rounded-lg p-4 flex-row items-center justify-center gap-2"
                >
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text className="text-white font-semibold text-lg">Save Cocktail</Text>
                </Pressable>
              </View>
            )}
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
