import { useState } from 'react';
import { View, Text, TextInput as RNTextInput } from 'react-native';
import ChipSelector from './ui/ChipSelector';
import Dropdown from './ui/Dropdown';
import {
  CONTAINER_SIZES_BY_TYPE,
  ALL_CONTAINER_SIZES,
  type IngredientType,
} from '@/src/constants/appConstants';

interface ContainerSizeSelectorProps {
  label?: string;
  ingredientType?: IngredientType;
  value: number;
  onValueChange: (value: number) => void;
}

/**
 * Smart container size selector that shows common sizes based on ingredient type
 * Uses ChipSelector for common sizes, falls back to dropdown for "Other"
 */
export default function ContainerSizeSelector({
  label = 'Container Size',
  ingredientType,
  value,
  onValueChange,
}: ContainerSizeSelectorProps) {
  const [showOtherDropdown, setShowOtherDropdown] = useState(false);

  // State for garnish custom input
  const [garnishAmount, setGarnishAmount] = useState('');
  const [garnishUnit, setGarnishUnit] = useState('g');

  // Fallback to Spirit if no type selected (shouldn't happen in normal flow)
  const selectedType = ingredientType || 'Spirit';

  // Special handling for "Other" ingredient type - only show dropdown
  if (selectedType === 'Other') {
    return (
      <View className="ContainerSizeSelector">
        <Text
          className="SizeSelectorLabel text-sm text-g4 dark:text-n1 mb-2"
          style={{ fontWeight: '500' }}
        >
          {label} *
        </Text>

        <Dropdown
          value={value}
          onValueChange={onValueChange}
          options={ALL_CONTAINER_SIZES.map((size) => ({
            value: size.value,
            label: size.label,
          }))}
          placeholder="Select container size"
          label="Container Size"
        />
      </View>
    );
  }

  // Special handling for Garnish type
  if (selectedType === 'Garnish') {
    // Common units for garnishes (using existing measurement units + unit)
    const garnishUnits = ['unit', 'g', 'oz', 'ml', 'cup', 'tbsp', 'tsp'];

    return (
      <View className="ContainerSizeSelector">
        <Text
          className="GarnishSelectorLabel text-sm text-g4 dark:text-n1 mb-2"
          style={{ fontWeight: '500' }}
        >
          {label} *
        </Text>

        <View className="GarnishInputs flex-row gap-2">
          <View className="AmountInput flex-2">
            <RNTextInput
              value={garnishAmount}
              onChangeText={(text) => {
                if (text === '' || /^\d*\.?\d*$/.test(text)) {
                  setGarnishAmount(text);
                  // Convert to ml equivalent for storage (rough conversion)
                  const amount = parseFloat(text) || 0;
                  let mlEquivalent = amount;

                  // Simple conversion factors (approximations)
                  switch (garnishUnit) {
                    case 'unit':
                      mlEquivalent = amount;
                      break; // 1 unit = 1ml equivalent
                    case 'g':
                      mlEquivalent = amount;
                      break; // 1g ≈ 1ml for liquids
                    case 'oz':
                      mlEquivalent = amount * 29.5735;
                      break;
                    case 'cup':
                      mlEquivalent = amount * 236.588;
                      break;
                    case 'tbsp':
                      mlEquivalent = amount * 14.7868;
                      break;
                    case 'tsp':
                      mlEquivalent = amount * 4.92892;
                      break;
                    default:
                      mlEquivalent = amount; // ml stays the same
                  }

                  onValueChange(mlEquivalent);
                }
              }}
              placeholder="1.0"
              keyboardType="decimal-pad"
              className="GarnishAmountInput w-24 bg-n1/80 dark:bg-p3/80 border border-g2/50 dark:border-p2/50 rounded-lg px-3 py-2 text-g4 dark:text-n1"
            />
          </View>

          <View className="UnitSelector flex-1">
            <Dropdown
              value={garnishUnit}
              onValueChange={(newUnit) => {
                setGarnishUnit(newUnit);
                // Recalculate ml equivalent with new unit
                const amount = parseFloat(garnishAmount) || 0;
                let mlEquivalent = amount;

                switch (newUnit) {
                  case 'unit':
                    mlEquivalent = amount;
                    break;
                  case 'g':
                    mlEquivalent = amount;
                    break;
                  case 'oz':
                    mlEquivalent = amount * 29.5735;
                    break;
                  case 'cup':
                    mlEquivalent = amount * 236.588;
                    break;
                  case 'tbsp':
                    mlEquivalent = amount * 14.7868;
                    break;
                  case 'tsp':
                    mlEquivalent = amount * 4.92892;
                    break;
                  default:
                    mlEquivalent = amount;
                }

                onValueChange(mlEquivalent);
              }}
              options={garnishUnits.map((unit) => ({
                value: unit,
                label: unit,
              }))}
              placeholder="Unit"
              label="Unit"
            />
          </View>
        </View>

        <Text className="GarnishHelpText text-xs text-g3 dark:text-n2 mt-2">
          Enter amount and select unit (e.g., "1 unit" for single orange, "2 oz"
          for mint leaves)
        </Text>
      </View>
    );
  }

  const commonSizes = CONTAINER_SIZES_BY_TYPE[selectedType];

  // Add "Other" option to common sizes
  const sizeOptions = [...commonSizes.map((size) => size.label), 'Other'];

  // Get current selection - if value matches a common size, show that, otherwise show "Other"
  const currentCommonSize = commonSizes.find((size) => size.value === value);
  const currentSelection =
    currentCommonSize && !showOtherDropdown ? currentCommonSize.label : 'Other';

  // Show dropdown when "Other" is selected OR when current value doesn't match any common size
  const shouldShowDropdown =
    showOtherDropdown || (!currentCommonSize && currentSelection === 'Other');

  const handleSizeSelection = (selectedLabel: string) => {
    if (selectedLabel === 'Other') {
      setShowOtherDropdown(true);
      // Don't change the actual value yet, wait for dropdown selection
    } else {
      setShowOtherDropdown(false);
      const selectedSize = commonSizes.find(
        (size) => size.label === selectedLabel
      );
      if (selectedSize) {
        onValueChange(selectedSize.value);
      }
    }
  };

  const handleOtherSizeChange = (newValue: number) => {
    onValueChange(newValue);
    // Check if the selected value matches a common size - if so, hide dropdown
    const matchesCommonSize = commonSizes.some(
      (size) => size.value === newValue
    );
    if (matchesCommonSize) {
      setShowOtherDropdown(false);
    }
  };

  return (
    <View className="ContainerSizeSelector">
      <Text
        className="SizeSelectorLabel text-sm text-g4 dark:text-n1 mb-2"
        style={{ fontWeight: '500' }}
      >
        {label} *
      </Text>

      {/* Common sizes with ChipSelector - always show */}
      <View className="CommonSizes mb-3">
        <ChipSelector
          options={sizeOptions}
          selectedOption={currentSelection}
          onSelectionChange={handleSizeSelection}
          showLabel={false}
        />
      </View>

      {/* Other sizes dropdown - shown when "Other" is selected and no common match */}
      {shouldShowDropdown && (
        <View className="OtherSizesDropdown">
          <Text
            className="OtherSizesLabel text-sm text-g4 dark:text-n1 mb-2"
            style={{ fontWeight: '500' }}
          >
            Select from all sizes:
          </Text>
          <Dropdown
            value={value}
            onValueChange={handleOtherSizeChange}
            options={ALL_CONTAINER_SIZES.map((size) => ({
              value: size.value,
              label: size.label,
            }))}
            placeholder="Select container size"
            label="All Container Sizes"
          />
        </View>
      )}
    </View>
  );
}
