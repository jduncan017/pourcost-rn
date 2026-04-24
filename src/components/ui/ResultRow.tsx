import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { TypeIcon } from '@/src/lib/type-icons';

interface ResultRowProps {
  /** Shared type icon from lib/type-icons (cocktailIcon or ingredientTypeIcon(type)). */
  icon: TypeIcon;
  title: string;
  subtitle: string;
  onPress: () => void;
  /** Element rendered at the right edge (defaults to chevron-forward). */
  trailing?: React.ReactNode;
}

/**
 * Shared row for search results, ingredient selector, and batch cocktail picker.
 * Typed icon + title + subtitle + trailing element.
 */
export default function ResultRow({
  icon,
  title,
  subtitle,
  onPress,
  trailing,
}: ResultRowProps) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-3"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <MaterialCommunityIcons
        name={icon.name}
        size={22}
        color={icon.color}
        style={{ marginRight: 12 }}
      />
      <View className="flex-1">
        <Text
          className="text-base"
          style={{ color: colors.text, fontWeight: '500' }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          className="text-sm mt-0.5"
          style={{ color: colors.textTertiary }}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
      {trailing ?? (
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      )}
    </Pressable>
  );
}
