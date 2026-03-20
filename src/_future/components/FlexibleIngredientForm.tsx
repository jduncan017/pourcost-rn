/**
 * Base flexible ingredient form component
 * Provides shared logic for all ingredient types with configuration-driven behavior
 */

import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  FlexibleIngredientType,
  CreateFlexibleIngredientData,
  CreateRetailConfigData,
  FlexibleIngredient,
} from '@/src/types/flexible-models';
import {
  getConfigForType,
  validateIngredientForType,
  getDefaultContainerForType,
  getDefaultPourForType,
} from '@/src/config/ingredient-type-configs';
import {
  FlexibleMeasurement,
  convertToMl,
} from '@/src/utils/measurement-utils';

import Card from '@/src/components/ui/Card';
import TextInput from '@/src/components/ui/TextInput';
import Button from '@/src/components/ui/Button';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import BackButton from '@/src/components/ui/BackButton';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { useThemeColors } from '@/src/contexts/ThemeContext';

// Props for the flexible ingredient form
export interface FlexibleIngredientFormProps {
  ingredientType: FlexibleIngredientType;
  existingIngredient?: FlexibleIngredient;
  onSave: (data: CreateFlexibleIngredientData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

// Container size selector component
interface ContainerSizeSelectorProps {
  ingredientType: FlexibleIngredientType;
  value: FlexibleMeasurement;
  onValueChange: (measurement: FlexibleMeasurement) => void;
}

function ContainerSizeSelector({
  ingredientType,
  value,
  onValueChange,
}: ContainerSizeSelectorProps) {
  const config = getConfigForType(ingredientType);
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [customUnit, setCustomUnit] = useState(config.primaryUnit);

  return (
    <View className="ContainerSelector">
      <Text
        className="text-sm text-g4 dark:text-n1 mb-2"
        style={{ fontWeight: '500' }}
      >
        Container Size *
      </Text>

      {/* Quick size options - horizontally scrollable */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        <View className="flex-row gap-2">
          {config.containerOptions
            .filter((opt) => opt.commonSizes)
            .map((option, index) => (
              <Pressable
                key={index}
                onPress={() =>
                  onValueChange({
                    value: option.value,
                    unit: option.unit,
                    displayName: option.displayName,
                  })
                }
                className={`px-3 py-2 rounded-lg border ${
                  Math.abs(
                    convertToMl(value.value, value.unit) - option.value
                  ) < 1
                    ? 'bg-p1 border-p1'
                    : 'bg-n1/80 dark:bg-p3/80 border-g2/50 dark:border-p2/50'
                }`}
              >
                <Text
                  className={`text-sm whitespace-nowrap ${
                    Math.abs(
                      convertToMl(value.value, value.unit) - option.value
                    ) < 1
                      ? 'text-white'
                      : 'text-g4 dark:text-n1'
                  }`}
                  style={{ fontWeight: '500' }}
                >
                  {option.displayName}
                </Text>
              </Pressable>
            ))}

          {config.allowsCustomUnits && (
            <Pressable
              onPress={() => setShowCustom(!showCustom)}
              className={`px-3 py-2 rounded-lg border ${
                showCustom
                  ? 'bg-p1 border-p1'
                  : 'bg-n1/80 dark:bg-p3/80 border-g2/50 dark:border-p2/50'
              }`}
            >
              <Text
                className={`text-sm whitespace-nowrap ${
                  showCustom ? 'text-white' : 'text-g4 dark:text-n1'
                }`}
                style={{ fontWeight: '500' }}
              >
                Custom
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Custom input */}
      {showCustom && (
        <View className="flex-row gap-2">
          <View className="flex-1">
            <TextInput
              label="Size"
              value={customValue}
              onChangeText={setCustomValue}
              placeholder="Enter size"
              keyboardType="decimal-pad"
            />
          </View>
          <View className="w-20">
            <TextInput
              label="Unit"
              value={customUnit}
              onChangeText={(text) => setCustomUnit(text as any)}
            />
          </View>
        </View>
      )}
    </View>
  );
}

// Retail configuration manager component
interface RetailConfigManagerProps {
  ingredientType: FlexibleIngredientType;
  containerSize: FlexibleMeasurement;
  containerCost: number;
  configs: CreateRetailConfigData[];
  onConfigsChange: (configs: CreateRetailConfigData[]) => void;
}

function RetailConfigManager({
  ingredientType,
  containerSize,
  containerCost,
  configs,
  onConfigsChange,
}: RetailConfigManagerProps) {
  const config = getConfigForType(ingredientType);
  const themeColors = useThemeColors();

  const addDefaultConfig = () => {
    const defaultPour = getDefaultPourForType(ingredientType);
    const newConfig: CreateRetailConfigData = {
      pourSize: {
        value: defaultPour.value,
        unit: defaultPour.unit,
        displayName: defaultPour.displayName,
      },
      retailPrice: 8.0,
      displayName: 'New Pour Size',
      isDefault: configs.length === 0,
    };
    onConfigsChange([...configs, newConfig]);
  };

  const updateConfig = (
    index: number,
    updates: Partial<CreateRetailConfigData>
  ) => {
    const newConfigs = [...configs];
    newConfigs[index] = { ...newConfigs[index], ...updates };
    onConfigsChange(newConfigs);
  };

  const removeConfig = (index: number) => {
    if (configs.length <= 1) {
      Alert.alert(
        'Cannot Remove',
        'At least one retail configuration is required.'
      );
      return;
    }
    const newConfigs = configs.filter((_, i) => i !== index);
    // If we removed the default, make the first one default
    if (configs[index].isDefault && newConfigs.length > 0) {
      newConfigs[0].isDefault = true;
    }
    onConfigsChange(newConfigs);
  };

  const calculateCostMetrics = (
    pourSize: FlexibleMeasurement,
    retailPrice: number
  ) => {
    const containerMl = convertToMl(containerSize.value, containerSize.unit);
    const pourMl = convertToMl(pourSize.value, pourSize.unit);
    const costPerPour = (containerCost / containerMl) * pourMl;
    const pourCostPercentage = (costPerPour / retailPrice) * 100;
    const profitMargin = retailPrice - costPerPour;

    return { costPerPour, pourCostPercentage, profitMargin };
  };

  return (
    <View className="RetailConfigManager">
      <View className="flex-row items-center justify-between mb-4">
        <ScreenTitle title="Retail Configurations" variant="section" />
        <Button
          onPress={addDefaultConfig}
          variant="ghost"
          size="small"
          icon="add"
        >
          Add Pour Size
        </Button>
      </View>

      {configs.map((configData, index) => {
        const metrics = calculateCostMetrics(
          configData.pourSize,
          configData.retailPrice
        );

        return (
          <Card key={index} displayClasses="flex-col gap-3" className="mb-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-medium text-g4 dark:text-n1">
                Configuration {index + 1}
                {configData.isDefault && (
                  <Text className="text-sm text-p1 dark:text-p2">
                    {' '}
                    (Default)
                  </Text>
                )}
              </Text>

              {configs.length > 1 && (
                <Pressable onPress={() => removeConfig(index)} className="p-1">
                  <Ionicons name="trash" size={16} color={themeColors.error} />
                </Pressable>
              )}
            </View>

            <TextInput
              label="Display Name"
              value={configData.displayName}
              onChangeText={(text) =>
                updateConfig(index, { displayName: text })
              }
              placeholder="e.g., Standard Pour, Pint, Glass"
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextInput
                  label="Pour Size"
                  value={configData.pourSize.value.toString()}
                  onChangeText={(text) => {
                    const value = parseFloat(text) || 0;
                    updateConfig(index, {
                      pourSize: {
                        ...configData.pourSize,
                        value,
                      },
                    });
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="w-16 justify-end">
                <Text className="text-g4 dark:text-n1 text-center py-3">
                  {configData.pourSize.unit}
                </Text>
              </View>
            </View>

            <TextInput
              label="Retail Price"
              value={configData.retailPrice.toString()}
              onChangeText={(text) => {
                const price = parseFloat(text) || 0;
                updateConfig(index, { retailPrice: price });
              }}
              keyboardType="decimal-pad"
            />

            {/* Calculated metrics */}
            <View className="bg-g1/50 dark:bg-p4/50 rounded-lg p-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-sm text-g3 dark:text-n1">
                  Cost per pour:
                </Text>
                <Text className="text-sm font-medium text-g4 dark:text-n1">
                  ${metrics.costPerPour.toFixed(3)}
                </Text>
              </View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-sm text-g3 dark:text-n1">
                  Pour cost %:
                </Text>
                <Text
                  className={`text-sm font-medium ${
                    metrics.pourCostPercentage <= 20
                      ? 'text-s22 dark:text-s21'
                      : metrics.pourCostPercentage <= 25
                        ? 'text-w2 dark:text-w1'
                        : 'text-e2 dark:text-e1'
                  }`}
                >
                  {metrics.pourCostPercentage.toFixed(1)}%
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-g3 dark:text-n1">
                  Profit margin:
                </Text>
                <Text className="text-sm font-medium text-s22 dark:text-s21">
                  ${metrics.profitMargin.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Default toggle */}
            <Pressable
              onPress={() => {
                const newConfigs = configs.map((c, i) => ({
                  ...c,
                  isDefault: i === index,
                }));
                onConfigsChange(newConfigs);
              }}
              className="flex-row items-center gap-2"
            >
              <View
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  configData.isDefault
                    ? 'bg-p1 border-p1'
                    : 'border-g3 dark:border-g2'
                }`}
              >
                {configData.isDefault && (
                  <Ionicons name="checkmark" size={12} color="white" />
                )}
              </View>
              <Text className="text-sm text-g4 dark:text-n1">
                Use as default configuration
              </Text>
            </Pressable>
          </Card>
        );
      })}

      <Text className="text-xs text-g3 dark:text-n2 mt-2">
        {config.helpText.costingHelp}
      </Text>
    </View>
  );
}

// Main flexible ingredient form component
export default function FlexibleIngredientForm({
  ingredientType,
  existingIngredient,
  onSave,
  onDelete,
}: FlexibleIngredientFormProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const config = getConfigForType(ingredientType);

  const isEditing = Boolean(existingIngredient);

  // Form state
  const [name, setName] = useState(existingIngredient?.name || '');
  const [description, setDescription] = useState(
    existingIngredient?.description || ''
  );
  const [containerSize, setContainerSize] = useState<FlexibleMeasurement>(
    existingIngredient?.containerSize || {
      value: getDefaultContainerForType(ingredientType).value,
      unit: getDefaultContainerForType(ingredientType).unit,
      displayName: getDefaultContainerForType(ingredientType).displayName,
    }
  );
  const [containerCost, setContainerCost] = useState(
    existingIngredient?.containerCost || 25.0
  );
  const [containerDisplayName, setContainerDisplayName] = useState(
    existingIngredient?.containerDisplayName || ''
  );
  const [notForSale, setNotForSale] = useState(
    existingIngredient?.notForSale || false
  );
  const [retailConfigs, setRetailConfigs] = useState<CreateRetailConfigData[]>(
    existingIngredient?.retailConfigurations.map((rc) => ({
      pourSize: rc.pourSize,
      retailPrice: rc.retailPrice,
      displayName: rc.displayName,
      description: rc.description,
      isDefault: rc.isDefault,
    })) || config.defaultRetailConfigs
  );

  // Validation
  const validation = validateIngredientForType(ingredientType, {
    name,
    containerSize,
    containerCost,
    retailConfigs,
  });

  const handleSave = async () => {
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    const data: CreateFlexibleIngredientData = {
      name: name.trim(),
      type: ingredientType,
      description: description.trim() || undefined,
      containerSize,
      containerCost,
      containerDisplayName: containerDisplayName.trim() || undefined,
      retailConfigurations: retailConfigs,
      notForSale,
    };

    try {
      await onSave(data);
      Alert.alert(
        isEditing ? 'Ingredient Updated' : 'Ingredient Created',
        `"${name}" has been ${isEditing ? 'updated' : 'saved'} successfully.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save ingredient. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !existingIngredient || !onDelete) return;

    Alert.alert(
      'Delete Ingredient',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(existingIngredient.id);
              Alert.alert('Deleted', `"${name}" has been deleted.`);
              router.back();
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to delete ingredient. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <GradientBackground>
      <ScrollView
        className="flex-1"
        style={{ paddingTop: insets.top }}
        showsVerticalScrollIndicator={false}
      >
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-3">
              <BackButton />
              <View>
                <ScreenTitle
                  title={`${isEditing ? 'Edit' : 'Add'} ${config.displayName}`}
                  variant="main"
                />
                <Text className="text-g3 dark:text-n1">
                  {config.description}
                </Text>
              </View>
            </View>
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: config.colors.primary + '20' }}
            >
              <Ionicons
                name={config.icon as any}
                size={24}
                color={config.colors.primary}
              />
            </View>
          </View>

          {/* Basic Information */}
          <Card displayClasses="flex-col gap-4" className="mb-4">
            <ScreenTitle title="Basic Information" variant="section" />
            <TextInput
              label="Name *"
              value={name}
              onChangeText={setName}
              placeholder={
                config.helpText.examples[0]?.split(' →')[0] ||
                `Enter ${config.displayName.toLowerCase()} name`
              }
            />

            <ContainerSizeSelector
              ingredientType={ingredientType}
              value={containerSize}
              onValueChange={setContainerSize}
            />

            <TextInput
              label="Container Cost *"
              value={containerCost.toString()}
              onChangeText={(text) => {
                const cost = parseFloat(text) || 0;
                setContainerCost(cost);
              }}
              placeholder="25.00"
              keyboardType="decimal-pad"
            />

            <TextInput
              label="Container Display Name"
              value={containerDisplayName}
              onChangeText={setContainerDisplayName}
              placeholder="e.g., 750ml bottle, 6-pack, Half barrel"
            />

            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder={`Brief description of this ${config.displayName.toLowerCase()}...`}
              multiline
            />

            {/* Not for sale toggle */}
            <Pressable
              onPress={() => setNotForSale(!notForSale)}
              className="flex-row items-center gap-3"
            >
              <View
                className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                  notForSale
                    ? 'bg-p1 border-p1'
                    : 'bg-transparent border-g3 dark:border-g2'
                }`}
              >
                {notForSale && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
              <View className="flex-1">
                <Text
                  className="text-g4 dark:text-n1"
                  style={{ fontWeight: '500' }}
                >
                  Not for individual sale
                </Text>
                <Text className="text-g3 dark:text-n2 text-sm mt-1">
                  Check this for cost-tracking only items
                </Text>
              </View>
            </Pressable>
          </Card>

          {/* Retail Configurations */}
          {!notForSale && (
            <Card className="mb-6">
              <RetailConfigManager
                ingredientType={ingredientType}
                containerSize={containerSize}
                containerCost={containerCost}
                configs={retailConfigs}
                onConfigsChange={setRetailConfigs}
              />
            </Card>
          )}

          {/* Action Buttons */}
          <View className="flex-col gap-3">
            <Button
              onPress={handleSave}
              variant={validation.isValid ? 'primary' : 'secondary'}
              disabled={!validation.isValid}
              size="large"
              icon="checkmark"
            >
              {isEditing ? 'Update' : 'Save'} {config.displayName}
            </Button>

            {isEditing && onDelete && (
              <Button
                onPress={handleDelete}
                variant="danger"
                size="large"
                icon="trash"
              >
                Delete {config.displayName}
              </Button>
            )}
          </View>

          {/* Validation Errors */}
          {!validation.isValid && (
            <Card className="mt-4 border-e2 dark:border-e1">
              <Text className="text-e2 dark:text-e1 font-medium mb-2">
                Please fix the following issues:
              </Text>
              {validation.errors.map((error, index) => (
                <Text key={index} className="text-e2 dark:text-e1 text-sm">
                  • {error}
                </Text>
              ))}
            </Card>
          )}

          {/* Help Text */}
          <Card displayClasses="flex-col gap-2" className="mt-4">
            <Text className="text-g4 dark:text-n1 font-medium">
              💡 {config.displayName} Tips
            </Text>
            {config.helpText.examples.map((example, index) => (
              <Text key={index} className="text-g3 dark:text-n2 text-sm">
                • {example}
              </Text>
            ))}
          </Card>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
