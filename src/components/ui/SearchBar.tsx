import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/contexts/ThemeContext';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  autoFocus?: boolean;
}

export default function SearchBar({
  placeholder = 'Search...',
  value,
  onChangeText,
  onClear,
  autoFocus = false,
}: SearchBarProps) {
  const colors = useThemeColors();

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View
      className="flex-row items-center rounded-lg p-4"
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Ionicons name="search" size={20} color={colors.textTertiary} />

      <TextInput
        className="flex-1 ml-3"
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        clearButtonMode="never"
        style={{ color: colors.text, fontSize: 16, padding: 0, margin: 0 }}
      />

      {value.length > 0 && (
        <Pressable
          onPress={handleClear}
          className="ml-2 p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
        </Pressable>
      )}
    </View>
  );
}
