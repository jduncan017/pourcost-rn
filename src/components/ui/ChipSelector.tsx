/**
 * ChipSelector Component for PourCost-RN
 * Unified chip selection with two visual variants:
 *   - "filter" (default): rounded pills for page-level filters/sort
 *   - "compact": rounded-lg chips for inline form selections on dark backgrounds
 */

import { View, Text, Pressable, ScrollView } from 'react-native';
import { COCKTAIL_CATEGORIES } from '@/src/constants/appConstants';

export interface ChipSelectorProps {
  options: readonly string[];
  selectedOption: string;
  onSelectionChange: (option: string) => void;

  label?: string;
  showLabel?: boolean;

  multiple?: boolean;
  selectedOptions?: string[];
  onMultipleSelectionChange?: (options: string[]) => void;

  size?: 'small' | 'medium' | 'large';
  variant?: 'filter' | 'compact';
  direction?: 'horizontal' | 'vertical';
  className?: string;

  /** Extra chip appended after the options (e.g. "Other" button) */
  trailingChip?: React.ReactNode;
}

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
  variant = 'filter',
  direction = 'horizontal',
  className = '',
  trailingChip,
}: ChipSelectorProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'px-2.5 py-1.5';
      case 'medium':
        return 'px-3 py-2';
      case 'large':
        return 'px-3.5 py-2';
      default:
        return 'px-3 py-2';
    }
  };

  const isSelected = (option: string) => {
    if (multiple) return selectedOptions.includes(option);
    return selectedOption === option;
  };

  const handleSelection = (option: string) => {
    if (multiple && onMultipleSelectionChange) {
      const newSelection = isSelected(option)
        ? selectedOptions.filter((item) => item !== option)
        : [...selectedOptions, option];
      onMultipleSelectionChange(newSelection);
    } else {
      onSelectionChange(option);
    }
  };

  const getChipStyles = (selected: boolean) => {
    const padding = getSizeStyles();
    if (variant === 'compact') {
      const shape = 'rounded-lg border';
      if (selected) return `${shape} ${padding} bg-p1 border-p1`;
      return `${shape} ${padding} bg-p4/40 border-p2/50`;
    }
    // filter variant
    const shape = 'rounded-full border';
    if (selected) return `${shape} ${padding} bg-p1 border-p1`;
    return `${shape} ${padding} bg-n1/80 dark:bg-n1/10 border-g1/50 dark:border-n1/20`;
  };

  const getTextStyles = (selected: boolean) => {
    const textSize = size === 'large' ? 'text-base' : 'text-sm';
    if (variant === 'compact') {
      if (selected) return `${textSize} font-bold text-white`;
      return `${textSize} font-medium text-n1/80`;
    }
    // filter variant
    if (selected) return `${textSize} font-medium text-white`;
    return `${textSize} font-medium text-g4 dark:text-n1`;
  };

  const chips = options.map((option) => {
    const selected = isSelected(option);
    return (
      <Pressable
        key={option}
        onPress={() => handleSelection(option)}
        className={getChipStyles(selected)}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Text className={getTextStyles(selected)}>{option}</Text>
      </Pressable>
    );
  });

  const allChips = trailingChip ? [...chips, trailingChip] : chips;

  const renderChips = () => {
    if (direction === 'horizontal') {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {allChips}
        </ScrollView>
      );
    }
    return (
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {allChips}
      </View>
    );
  };

  return (
    <View className={className}>
      {showLabel && label && (
        <Text className="font-medium text-g4 dark:text-n1 mb-3">{label}</Text>
      )}
      {renderChips()}
      {multiple && selectedOptions.length > 0 && (
        <Text className="text-xs text-g3 dark:text-g2 mt-2">
          {selectedOptions.length} selected
        </Text>
      )}
    </View>
  );
}

// Convenience components

export const IngredientTypeSelector = ({
  selectedType,
  onTypeChange,
  ...props
}: {
  selectedType: string;
  onTypeChange: (type: string) => void;
} & Partial<ChipSelectorProps>) => (
  <ChipSelector
    {...props}
    options={['All', 'Spirit', 'Beer', 'Wine', 'Prepped', 'Garnish', 'Other']}
    selectedOption={selectedType}
    onSelectionChange={onTypeChange}
    label="Type"
  />
);

export const CocktailCategorySelector = ({
  selectedCategory,
  onCategoryChange,
  ...props
}: {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
} & Partial<ChipSelectorProps>) => (
  <ChipSelector
    {...props}
    options={COCKTAIL_CATEGORIES}
    selectedOption={selectedCategory}
    onSelectionChange={onCategoryChange}
    label="Category"
  />
);

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
  const selectedLabel = sortOptions.find((o) => o.key === selectedSort)?.label ?? '';
  return (
    <ChipSelector
      {...props}
      options={sortOptions.map((option) => option.label)}
      selectedOption={selectedLabel}
      onSelectionChange={(label) => {
        const option = sortOptions.find((o) => o.label === label);
        if (option) onSortChange(option.key);
      }}
    />
  );
};
