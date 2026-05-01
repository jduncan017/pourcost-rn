/**
 * Generic picker displayed in a BottomSheet.
 * Renders a list of options with selection indicator.
 */

import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import BottomSheet from './BottomSheet';

interface PickerSheetProps<T> {
  title: string;
  /** Optional explanation rendered under the sheet title — tells the user
   *  what this setting actually controls. */
  subtitle?: string;
  options: { value: T; label: string }[];
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}

export default function PickerSheet<T>({
  title,
  subtitle,
  options,
  value,
  onSelect,
  onClose,
}: PickerSheetProps<T>) {
  const colors = useThemeColors();
  return (
    <BottomSheet visible onClose={onClose} title={title}>
      {subtitle && (
        <Text
          className="px-4 pt-2 pb-3 text-sm leading-5"
          style={{ color: colors.textSecondary }}
        >
          {subtitle}
        </Text>
      )}
      <View className="pb-4">
        {options.map((option, index) => {
          const isSelected = option.value === value;
          return (
            <View key={`${option.label}-${index}`}>
              {index > 0 && (
                <View className="h-px mx-4" style={{ backgroundColor: colors.border + '40' }} />
              )}
              <Pressable
                onPress={() => { onSelect(option.value); onClose(); }}
                className={`px-4 py-3 flex-row justify-between items-center ${isSelected ? '' : 'active:opacity-80'}`}
                style={isSelected ? { backgroundColor: colors.accent + '15' } : undefined}
              >
                <Text
                  className="text-base"
                  style={{
                    color: isSelected ? colors.accent : colors.text,
                    fontWeight: isSelected ? '600' : '500',
                  }}
                >
                  {option.label}
                </Text>
                {isSelected && <Ionicons name="checkmark" size={20} color={colors.accent} />}
              </Pressable>
            </View>
          );
        })}
      </View>
    </BottomSheet>
  );
}
