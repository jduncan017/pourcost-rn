/**
 * IconButton Component for PourCost-RN
 * Simplified button component for icon-only actions
 * Optimized for back buttons, action buttons, and toolbar icons
 */

import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface IconButtonProps {
  /** Ionicons icon name */
  icon: keyof typeof Ionicons.glyphMap;
  
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  
  /** Button variant for different contexts */
  variant?: 'default' | 'primary' | 'ghost' | 'outline';
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Press handler */
  onPress: () => void;
  
  /** Additional styles */
  className?: string;
  
  /** Test ID for testing */
  testID?: string;
  
  /** Custom icon color (overrides variant color) */
  iconColor?: string;
}

/**
 * Icon-only button component
 */
export default function IconButton({
  icon,
  size = 'medium',
  variant = 'default',
  disabled = false,
  onPress,
  className = '',
  testID,
  iconColor,
}: IconButtonProps) {
  
  // Base button styles
  const getBaseStyles = () => {
    return 'rounded-lg flex items-center justify-center';
  };

  // Variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return disabled 
          ? 'bg-g2 dark:bg-g3' 
          : 'bg-p1 dark:bg-p2';
      
      case 'ghost':
        return 'bg-transparent';
      
      case 'outline':
        return disabled
          ? 'bg-transparent border border-g2 dark:border-g3'
          : 'bg-transparent border border-g2 dark:border-n1/20';
      
      case 'default':
      default:
        return disabled
          ? 'bg-g1 dark:bg-g3'
          : 'bg-n1/80 dark:bg-n1/10';
    }
  };

  // Size-specific styles (creates square button)
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'w-8 h-8';
      case 'medium':
        return 'w-10 h-10';
      case 'large':
        return 'w-12 h-12';
      default:
        return 'w-10 h-10';
    }
  };

  // Icon size based on button size
  const getIconSize = (): number => {
    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 20;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  // Icon color based on variant and state
  const getIconColor = (): string => {
    // Custom color overrides everything
    if (iconColor) return iconColor;
    
    if (disabled) {
      return '#9CA3AF'; // g3 color
    }

    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      
      case 'ghost':
        return '#6B7280'; // g3 color for subtle ghost buttons
      
      case 'outline':
        return '#374151'; // g4 color
      
      case 'default':
      default:
        return '#374151'; // g4 color
    }
  };

  // Combine all styles
  const buttonStyles = `${getBaseStyles()} ${getVariantStyles()} ${getSizeStyles()} ${className}`;

  // Handle press with disabled state
  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      className={buttonStyles}
      testID={testID}
      style={({ pressed }) => ({
        opacity: pressed && !disabled ? 0.6 : 1,
      })}
    >
      <Ionicons
        name={icon}
        size={getIconSize()}
        color={getIconColor()}
      />
    </Pressable>
  );
}

// Convenience components for common icon button types
export const BackButton = (props: Omit<IconButtonProps, 'icon' | 'variant'>) => (
  <IconButton {...props} icon="chevron-back" variant="ghost" />
);

export const CloseButton = (props: Omit<IconButtonProps, 'icon' | 'variant'>) => (
  <IconButton {...props} icon="close" variant="ghost" />
);

export const EditButton = (props: Omit<IconButtonProps, 'icon' | 'variant'>) => (
  <IconButton {...props} icon="pencil" variant="default" />
);

export const DeleteButton = (props: Omit<IconButtonProps, 'icon' | 'variant'>) => (
  <IconButton {...props} icon="trash" variant="outline" iconColor="#EF4444" />
);

export const AddButton = (props: Omit<IconButtonProps, 'icon' | 'variant'>) => (
  <IconButton {...props} icon="add" variant="primary" />
);

export const SearchButton = (props: Omit<IconButtonProps, 'icon' | 'variant'>) => (
  <IconButton {...props} icon="search" variant="ghost" />
);

export const MoreButton = (props: Omit<IconButtonProps, 'icon' | 'variant'>) => (
  <IconButton {...props} icon="ellipsis-horizontal" variant="ghost" />
);