import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';

interface SelectionActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  /** Label shown on the delete button. Count always appended as ` (N)`. */
  deleteLabel?: string;
}

/**
 * Floating full-width pill at the bottom of a selection screen.
 * Single primary action (Delete). Cancel lives in the list header.
 *
 * All styling sits on a plain View wrapper so Android + iOS both paint the
 * red pill reliably. TouchableOpacity handles the press state; Pressable's
 * functional-style prop was inconsistent here.
 */
export default function SelectionActionBar({
  selectedCount,
  onDelete,
  deleteLabel = 'Delete',
}: SelectionActionBarProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const canDelete = selectedCount > 0;

  return (
    <View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: insets.bottom + 12,
        zIndex: 100,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={canDelete ? onDelete : undefined}
        disabled={!canDelete}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 16,
            paddingHorizontal: 20,
            borderRadius: 999,
            backgroundColor: colors.error,
            opacity: canDelete ? 1 : 0.45,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Ionicons name="trash-outline" size={20} color={palette.N1} />
          <Text
            style={{
              color: palette.N1,
              fontWeight: '700',
              fontSize: 16,
              marginLeft: 8,
            }}
          >
            {deleteLabel}
            {selectedCount > 0 ? ` (${selectedCount})` : ''}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
