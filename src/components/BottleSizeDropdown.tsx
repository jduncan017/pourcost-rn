import React from 'react';
import Dropdown, { DropdownOption } from './ui/Dropdown';
import { BOTTLE_SIZES, getCommonBottleSizes, getDefaultBottleSize } from '@/src/constants/bottleSizes';

interface BottleSizeDropdownProps {
  value: number; // Current value in ml
  onValueChange: (ml: number) => void;
  label: string;
  showKegs?: boolean; // Whether to include keg sizes
}

export default function BottleSizeDropdown({
  value,
  onValueChange,
  label,
  showKegs = false,
}: BottleSizeDropdownProps) {
  // Get appropriate bottle sizes based on showKegs preference
  const bottleSizes = showKegs ? BOTTLE_SIZES : getCommonBottleSizes();
  
  // Convert bottle sizes to dropdown options
  const options: DropdownOption<number>[] = bottleSizes.map(size => ({
    value: size.ml,
    label: size.label,
  }));

  // Ensure we have a valid value
  const selectedSize = bottleSizes.find(size => size.ml === value);
  const currentValue = selectedSize ? value : getDefaultBottleSize().ml;

  return (
    <Dropdown
      value={currentValue}
      onValueChange={onValueChange}
      options={options}
      label={label}
      placeholder="Select bottle size"
    />
  );
}