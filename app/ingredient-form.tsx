import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/src/stores/app-store';
import { Ionicons } from '@expo/vector-icons';
import CustomSlider from '@/src/components/ui/CustomSlider';
import ContainerSizeSelector from '@/src/components/ContainerSizeSelector';
import TextInput from '@/src/components/ui/TextInput';
import PourCostPerformanceBar from '@/src/components/PourCostPerformanceBar';
import Card from '@/src/components/ui/Card';
import GradientBackground from '@/src/components/ui/GradientBackground';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import BackButton from '@/src/components/ui/BackButton';
import { INGREDIENT_TYPES, CONTAINER_SIZES_BY_TYPE, type IngredientType } from '@/src/constants/appConstants';

/**
 * Ingredient creation and editing form
 * Handles both creating new ingredients and editing existing ones
 */
export default function IngredientFormScreen() {
  const insets = useSafeAreaInsets();
  const { baseCurrency } = useAppStore();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Check if we're editing an existing ingredient
  const isEditing = Boolean(params.id);
  const ingredientId = params.id as string;

  // Form state
  const [name, setName] = useState((params.name as string) || '');
  const [type, setType] = useState<IngredientType>(
    (params.type as IngredientType) || 'Spirit'
  );
  const [bottleSize, setBottleSize] = useState(
    Number(params.bottleSize) || 750
  );
  const [bottlePrice, setBottlePrice] = useState(
    Number(params.bottlePrice) || 25.0
  );
  const [bottlePriceText, setBottlePriceText] = useState(
    (params.bottlePrice as string) || '25.00'
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
    if (!isEditing && type && CONTAINER_SIZES_BY_TYPE[type] && CONTAINER_SIZES_BY_TYPE[type].length > 0) {
      // Set specific defaults for each type
      let defaultSize: number;
      switch (type) {
        case 'Spirit':
          defaultSize = 750; // 750ml standard bottle
          break;
        case 'Beer':
          defaultSize = 19550; // 1/2 Keg (15.5 gal)
          break;
        case 'Wine':
          defaultSize = 750; // 750ml standard bottle
          break;
        case 'Prepped':
          defaultSize = 750; // 750ml bottle
          break;
        case 'Garnish':
          defaultSize = 100; // 100g
          break;
        case 'Other':
          defaultSize = 500; // 500ml default
          break;
        default:
          defaultSize = 750; // fallback default
      }
      setBottleSize(defaultSize);
    }
  }, [type, isEditing]);

  // Calculated values
  const bottleSizeOz = bottleSize / 29.5735;
  const costPerOz = bottlePrice / bottleSizeOz;
  const costFor15oz = costPerOz * 1.5;
  const pourCostPercentage = (costFor15oz / retailPrice) * 100;
  const suggestedRetail = costFor15oz / 0.2; // 20% pour cost target
  const pourCostMargin = retailPrice - costFor15oz;

  // Validation
  const isValid =
    name.trim().length > 0 &&
    bottlePrice > 0 &&
    bottleSize > 0 &&
    (notForSale || retailPrice > 0); // Only require retail price if item is for sale


  // Handle save
  const handleSave = () => {
    if (!isValid) {
      Alert.alert(
        'Invalid Data',
        'Please fill in all required fields with valid values.'
      );
      return;
    }


    Alert.alert(
      isEditing ? 'Ingredient Updated' : 'Ingredient Created',
      `\"${name}\" has been ${isEditing ? 'updated' : 'saved'} successfully.\\n\\nCost/Oz: $${costPerOz.toFixed(3)}${
        notForSale ? '\\nNot for individual sale' : `\\nPour Cost: ${pourCostPercentage.toFixed(1)}%`
      }`,
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
    <GradientBackground>
      <ScrollView
        className="FormScroll flex-1"
        style={{ paddingTop: insets.top }}
      >
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-3">
              <BackButton />
              <View>
                <ScreenTitle
                  title={isEditing ? 'Edit Ingredient' : 'Create Ingredient'}
                  variant="main"
                />
                <Text className="text-g3 dark:text-n1" style={{}}>
                  {isEditing
                    ? 'Update ingredient details'
                    : 'Add a new ingredient to your library'}
                </Text>
              </View>
            </View>
          </View>

          {/* Basic Information */}
          <Card className="mb-4">
            <ScreenTitle
              title="Basic Information"
              variant="section"
              className="mb-4"
            />

            <View className="flex flex-col gap-4">
              <TextInput
                label="Ingredient Name *"
                value={name}
                onChangeText={setName}
                placeholder="e.g., Vodka (Premium), Simple Syrup"
              />

              <View>
                <Text
                  className="text-sm text-g4 dark:text-n1 mb-2"
                  style={{ fontWeight: '500' }}
                >
                  Type *
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {INGREDIENT_TYPES.map((ingredientType) => (
                    <Pressable
                      key={ingredientType}
                      onPress={() => setType(ingredientType)}
                      className={`px-3 py-2 rounded-lg border ${
                        type === ingredientType
                          ? 'bg-p1 border-p1'
                          : 'bg-n1/80 dark:bg-p3/80 border-g2/50 dark:border-p2/50'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          type === ingredientType
                            ? 'text-white'
                            : 'text-g4 dark:text-n1'
                        }`}
                        style={{ fontWeight: '500' }}
                      >
                        {ingredientType}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <ContainerSizeSelector
                label="Container Size"
                ingredientType={type}
                value={bottleSize}
                onValueChange={setBottleSize}
              />

              <TextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Brief description of the ingredient..."
                multiline
              />

              {/* Not for sale checkbox */}
              <View className="NotForSaleCheckbox flex-row items-center gap-3">
                <Pressable
                  onPress={() => setNotForSale(!notForSale)}
                  className={`CheckboxButton w-6 h-6 rounded border-2 flex items-center justify-center ${
                    notForSale
                      ? 'bg-p1 border-p1'
                      : 'bg-transparent border-g3 dark:border-g2'
                  }`}
                >
                  {notForSale && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </Pressable>
                <View className="CheckboxLabel flex-1">
                  <Text
                    className="text-g4 dark:text-n1"
                    style={{ fontWeight: '500' }}
                  >
                    Not for sale
                  </Text>
                  <Text className="text-g3 dark:text-n2 text-sm mt-1">
                    Check this for house-made items like simple syrup or garnishes that aren't sold individually
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Pricing Information */}
          <Card className="mb-4">
            <ScreenTitle
              title="Pricing & Costs"
              variant="section"
              className="mb-4"
            />

            <View className="PricingFields flex flex-col gap-4">
              <TextInput
                label="Bottle Price *"
                value={bottlePriceText}
                onChangeText={(text) => {
                  // Allow empty string and valid decimal numbers
                  if (text === '' || /^\d*\.?\d*$/.test(text)) {
                    setBottlePriceText(text);
                    const price = text === '' ? 0 : parseFloat(text) || 0;
                    setBottlePrice(price);
                  }
                }}
                placeholder="25.00"
                keyboardType="decimal-pad"
              />

              {!notForSale && (
                <CustomSlider
                  label="Retail Price (1.5oz) *"
                  minValue={0.5}
                  maxValue={50}
                  value={retailPrice}
                  onValueChange={setRetailPrice}
                  unit={` ${baseCurrency} `}
                  step={0.25}
                />
              )}
            </View>
          </Card>

          {/* Calculated Values */}
          <Card className="mb-4">
            <ScreenTitle
              title="Calculated Values"
              variant="section"
              className="mb-4"
            />

            <View className="CalculatedValues space-y-3">
              <View className="CostPerOz flex-row justify-between items-center">
                <Text className="text-g3 dark:text-n1" style={{}}>
                  Cost per Oz:
                </Text>
                <Text
                  className="text-g4 dark:text-n1"
                  style={{ fontWeight: '500' }}
                >
                  ${costPerOz.toFixed(3)}
                </Text>
              </View>

              <View className="CostForPour flex-row justify-between items-center">
                <Text className="text-g3 dark:text-n1" style={{}}>
                  Cost for 1.5oz:
                </Text>
                <Text
                  className="text-g4 dark:text-n1"
                  style={{ fontWeight: '500' }}
                >
                  ${costFor15oz.toFixed(2)}
                </Text>
              </View>

              {/* Only show retail-dependent calculations if item is for sale */}
              {!notForSale && (
                <>
                  <View className="SuggestedRetail flex-row justify-between items-center">
                    <Text className="text-g3 dark:text-n1" style={{}}>
                      Suggested Retail (20% target):
                    </Text>
                    <Text
                      className="text-p2 dark:text-p1"
                      style={{ fontWeight: '500' }}
                    >
                      ${suggestedRetail.toFixed(2)}
                    </Text>
                  </View>

                  <View className="ProfitMargin flex-row justify-between items-center">
                    <Text className="text-g3 dark:text-n1" style={{}}>
                      Profit Margin:
                    </Text>
                    <Text
                      className="text-s22 dark:text-s21"
                      style={{ fontWeight: '500' }}
                    >
                      ${pourCostMargin.toFixed(2)}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </Card>

          {/* Performance Indicator - Only show if item is for sale */}
          {!notForSale && (
            <Card className="PerformanceCard mb-6">
              <ScreenTitle
                title="Performance Preview"
                variant="section"
                className="mb-4"
              />

              <PourCostPerformanceBar pourCostPercentage={pourCostPercentage} />
            </Card>
          )}

          {/* Action Buttons */}
          <View className="space-y-3">
            <Pressable
              onPress={handleSave}
              disabled={!isValid}
              className={`rounded-lg p-4 flex-row items-center justify-center gap-2 ${
                isValid ? 'bg-s21 dark:bg-s22' : 'bg-g2 dark:bg-g3'
              }`}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text className="text-white" style={{ fontWeight: '600' }}>
                {isEditing ? 'Update Ingredient' : 'Save Ingredient'}
              </Text>
            </Pressable>

            {isEditing && (
              <Pressable
                onPress={handleDelete}
                className="bg-e2 dark:bg-e3 rounded-lg p-4 flex-row items-center justify-center gap-2"
              >
                <Ionicons name="trash" size={20} color="white" />
                <Text className="text-white" style={{ fontWeight: '600' }}>
                  Delete Ingredient
                </Text>
              </Pressable>
            )}
          </View>

          <Text
            className="text-center text-g3 dark:text-n1 text-xs my-4"
            style={{}}
          >
            * Required fields
          </Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
