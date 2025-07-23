/**
 * ChipSelector Component for PourCost-RN
 * Unified component for category/type selection across forms and filters
 * Replaces duplicate chip selection patterns throughout the app
 */

import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

export interface ChipSelectorProps {
  /** Available options to select from */
  options: string[];
  
  /** Currently selected option */
  selectedOption: string;
  
  /** Selection change handler */
  onSelectionChange: (option: string) => void;
  
  /** Label to display above the chips */
  label?: string;
  
  /** Show label above the chips */
  showLabel?: boolean;
  
  /** Multiple selection mode */
  multiple?: boolean;
  
  /** Selected options (for multiple mode) */
  selectedOptions?: string[];
  
  /** Multiple selection change handler */
  onMultipleSelectionChange?: (options: string[]) => void;
  
  /** Chip size */
  size?: 'small' | 'medium' | 'large';
  
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  
  /** Additional styles */
  className?: string;
  
  /** Test ID for testing */
  testID?: string;
}

/**
 * Chip selector component for category and filter selection
 */
export default function ChipSelector({
  options,
  selectedOption,
  onSelectionChange,
  label,
  showLabel = true,
  multiple = false,
  selectedOptions = [],
  onMultipleSelectionChange,
  size = 'medium',
  direction = 'horizontal',
  className = '',
  testID,
}: ChipSelectorProps) {
  
  // Get chip size styles
  const getChipSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'px-2 py-1';
      case 'medium':
        return 'px-3 py-2';
      case 'large':
        return 'px-4 py-3';
      default:
        return 'px-3 py-2';
    }
  };

  // Get text size styles
  const getTextSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'text-xs';
      case 'medium':
        return 'text-sm';
      case 'large':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  // Check if option is selected
  const isSelected = (option: string) => {
    if (multiple) {
      return selectedOptions.includes(option);
    }
    return selectedOption === option;
  };

  // Handle option selection
  const handleSelection = (option: string) => {
    if (multiple && onMultipleSelectionChange) {
      const newSelection = isSelected(option)
        ? selectedOptions.filter(item => item !== option)
        : [...selectedOptions, option];
      onMultipleSelectionChange(newSelection);
    } else {
      onSelectionChange(option);
    }
  };

  // Get chip styles based on selection state
  const getChipStyles = (option: string) => {
    const baseStyles = `rounded-full border ${getChipSizeStyles()}`;
    const selected = isSelected(option);
    
    if (selected) {
      return `${baseStyles} bg-p1 border-p1`;
    } else {
      return `${baseStyles} bg-n1/80 dark:bg-n1/10 border-g1/50 dark:border-n1/20`;
    }
  };

  // Get text styles based on selection state
  const getTextStyles = (option: string) => {
    const baseStyles = `font-medium ${getTextSizeStyles()}`;
    const selected = isSelected(option);
    
    if (selected) {
      return `${baseStyles} text-white`;
    } else {
      return `${baseStyles} text-g4 dark:text-n1`;
    }
  };

  // Render chips container based on direction
  const renderChips = () => {
    const chips = options.map((option) => (
      <Pressable
        key={option}
        onPress={() => handleSelection(option)}
        className={getChipStyles(option)}
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text className={getTextStyles(option)}>
          {option}
        </Text>
      </Pressable>
    ));

    if (direction === 'horizontal') {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {chips}
        </ScrollView>
      );
    } else {
      return (
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {chips}
        </View>
      );
    }
  };

  return (
    <View className={className} testID={testID}>
      {/* Label */}
      {showLabel && label && (
        <Text className="text-sm font-medium text-g4 dark:text-n1 mb-3">
          {label}
        </Text>
      )}
      
      {/* Chips */}
      {renderChips()}
      
      {/* Multiple selection indicator */}
      {multiple && selectedOptions.length > 0 && (
        <Text className="text-xs text-g3 dark:text-g2 mt-2">
          {selectedOptions.length} selected
        </Text>
      )}
    </View>
  );
}

// Convenience components for common use cases

/**
 * Category selector for ingredients
 */
export const IngredientTypeSelector = ({
  selectedType,
  onTypeChange,
  ...props
}: {
  selectedType: string;
  onTypeChange: (type: string) => void;
} & Partial<ChipSelectorProps>) => {
  const ingredientTypes = [
    'All',
    'Beer',
    'Wine',
    'Spirit',
    'Liquor',
    'Prepared',
    'Garnish',
  ];

  return (
    <ChipSelector
      {...props}
      options={ingredientTypes}
      selectedOption={selectedType}
      onSelectionChange={onTypeChange}
      label="Type"
    />
  );
};

/**
 * Category selector for cocktails
 */
export const CocktailCategorySelector = ({
  selectedCategory,
  onCategoryChange,
  ...props
}: {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
} & Partial<ChipSelectorProps>) => {
  const cocktailCategories = [
    'All',
    'Classic',
    'Modern',
    'Tropical',
    'Whiskey',
    'Vodka',
    'Rum',
    'Gin',
    'Tequila',
    'Other',
  ];

  return (
    <ChipSelector
      {...props}
      options={cocktailCategories}
      selectedOption={selectedCategory}
      onSelectionChange={onCategoryChange}
      label="Category"
    />
  );
};

/**
 * Sort selector component
 */
export const SortSelector = ({
  sortOptions,
  selectedSort,
  onSortChange,
  ...props
}: {
  sortOptions: Array<{ key: string; label: string }>;
  selectedSort: string;
  onSortChange: (sortKey: string) => void;
} & Partial<ChipSelectorProps>) => {
  return (
    <ChipSelector
      {...props}
      options={sortOptions.map(option => option.key)}
      selectedOption={selectedSort}
      onSelectionChange={onSortChange}
      label="Sort by"
      size="small"
    />
  );
};