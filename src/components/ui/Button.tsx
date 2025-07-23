/**
 * Unified Button Component for PourCost-RN
 * Consolidates all button patterns across the app with consistent styling
 * Supports multiple variants, sizes, and states
 */

import React from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ButtonProps {
  /** Button text or content */
  children: React.ReactNode;
  
  /** Button variant for different use cases */
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
  
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  
  /** Optional icon (Ionicons name) */
  icon?: keyof typeof Ionicons.glyphMap;
  
  /** Icon position */
  iconPosition?: 'left' | 'right';
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Loading state */
  loading?: boolean;
  
  /** Full width button */
  fullWidth?: boolean;
  
  /** Press handler */
  onPress: () => void;
  
  /** Additional styles */
  className?: string;
  
  /** Test ID for testing */
  testID?: string;
}

/**
 * Unified Button component with consistent styling
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  onPress,
  className = '',
  testID,
}: ButtonProps) {
  
  // Base button styles
  const getBaseStyles = () => {
    const base = 'rounded-lg flex-row items-center justify-center';
    const width = fullWidth ? 'w-full' : '';
    return `${base} ${width}`;
  };

  // Variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return disabled 
          ? 'bg-g2 dark:bg-g3' 
          : 'bg-p1 dark:bg-p2';
      
      case 'secondary':
        return disabled
          ? 'bg-g1 dark:bg-g3 border border-g2 dark:border-g4'
          : 'bg-g1 dark:bg-n1/10 border border-g2 dark:border-n1/20';
      
      case 'success':
        return disabled
          ? 'bg-g2 dark:bg-g3'
          : 'bg-s21 dark:bg-s22';
      
      case 'danger':
        return disabled
          ? 'bg-g2 dark:bg-g3'
          : 'bg-e2 dark:bg-e3';
      
      case 'ghost':
        return disabled
          ? 'bg-transparent'
          : 'bg-transparent';
      
      case 'outline':
        return disabled
          ? 'bg-transparent border border-g2 dark:border-g3'
          : 'bg-transparent border border-p1 dark:border-p2';
      
      default:
        return 'bg-p1 dark:bg-p2';
    }
  };

  // Size-specific styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-2';
      case 'medium':
        return 'px-4 py-3';
      case 'large':
        return 'px-6 py-4';
      default:
        return 'px-4 py-3';
    }
  };

  // Text color based on variant and state
  const getTextColor = () => {
    if (disabled) {
      return 'text-g3 dark:text-g2';
    }

    switch (variant) {
      case 'primary':
      case 'success':
      case 'danger':
        return 'text-white';
      
      case 'secondary':
        return 'text-g4 dark:text-n1';
      
      case 'ghost':
        return 'text-p1 dark:text-p2';
      
      case 'outline':
        return 'text-p1 dark:text-p2';
      
      default:
        return 'text-white';
    }
  };

  // Icon color (matches text color)
  const getIconColor = () => {
    if (disabled) {
      return '#9CA3AF'; // g3 color
    }

    switch (variant) {
      case 'primary':
      case 'success':
      case 'danger':
        return '#FFFFFF';
      
      case 'secondary':
        return '#374151'; // g4 color, would need dynamic for dark mode
      
      case 'ghost':
      case 'outline':
        return '#3B82F6'; // p1 color
      
      default:
        return '#FFFFFF';
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

  // Text size based on button size
  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'medium':
        return 'text-base';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  // Font weight
  const getFontWeight = () => {
    switch (variant) {
      case 'ghost':
        return 'font-normal';
      default:
        return 'font-medium';
    }
  };

  // Combine all styles
  const buttonStyles = `${getBaseStyles()} ${getVariantStyles()} ${getSizeStyles()} ${className}`;
  const textStyles = `${getTextColor()} ${getTextSize()} ${getFontWeight()}`;

  // Handle press with disabled/loading states
  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  // Render icon
  const renderIcon = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          size="small" 
          color={getIconColor()} 
          style={{ marginRight: iconPosition === 'left' ? 8 : 0, marginLeft: iconPosition === 'right' ? 8 : 0 }}
        />
      );
    }

    if (icon) {
      return (
        <Ionicons
          name={icon}
          size={getIconSize()}
          color={getIconColor()}
          style={{ 
            marginRight: iconPosition === 'left' ? 8 : 0, 
            marginLeft: iconPosition === 'right' ? 8 : 0 
          }}
        />
      );
    }

    return null;
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      className={buttonStyles}
      testID={testID}
      style={({ pressed }) => ({
        opacity: pressed && !disabled && !loading ? 0.8 : 1,
      })}
    >
      {iconPosition === 'left' && renderIcon()}
      
      {typeof children === 'string' ? (
        <Text className={textStyles}>
          {loading ? 'Loading...' : children}
        </Text>
      ) : (
        children
      )}
      
      {iconPosition === 'right' && renderIcon()}
    </Pressable>
  );
}

// Convenience components for common button types
export const PrimaryButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="primary" />
);

export const SecondaryButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="secondary" />
);

export const SuccessButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="success" />
);

export const DangerButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="danger" />
);

export const GhostButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="ghost" />
);

export const OutlineButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="outline" />
);