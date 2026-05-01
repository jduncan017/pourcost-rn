import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import BottomSheet from './BottomSheet';

export interface ActionSheetAction {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions: ActionSheetAction[];
  /** Cancel button label, shown as a separated bottom row. Defaults to "Cancel"
   *  — set to false to hide. iOS-native action sheets always have one. */
  cancelLabel?: string | false;
}

export default function ActionSheet({
  visible,
  onClose,
  title,
  actions,
  cancelLabel = 'Cancel',
}: ActionSheetProps) {
  const colors = useThemeColors();

  const handlePress = (action: ActionSheetAction) => {
    onClose();
    action.onPress();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View className="flex-col px-4 pt-1 pb-4 gap-3">
        {/* Action rows grouped in a single rounded card — feels like one unit
            instead of stacked dividers. */}
        <View
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          }}
        >
          {actions.map((action, index) => (
            <View key={action.label}>
              <Pressable
                onPress={() => handlePress(action)}
                className="flex-row items-center gap-3 px-4 py-4 active:opacity-70"
              >
                {action.icon && (
                  <Ionicons
                    name={action.icon}
                    size={22}
                    color={action.destructive ? palette.R3 : colors.text}
                  />
                )}
                <Text
                  className="text-base"
                  style={{
                    color: action.destructive ? palette.R3 : colors.text,
                    fontWeight: '500',
                  }}
                >
                  {action.label}
                </Text>
              </Pressable>
              {index < actions.length - 1 && (
                <View
                  style={{ height: 1, marginLeft: 50, backgroundColor: colors.borderSubtle }}
                />
              )}
            </View>
          ))}
        </View>

        {/* Cancel — separate card so it reads as the "out" rather than another action. */}
        {cancelLabel !== false && (
          <Pressable
            onPress={onClose}
            className="rounded-xl items-center py-4 active:opacity-70"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text className="text-base" style={{ color: colors.text, fontWeight: '600' }}>
              {cancelLabel}
            </Text>
          </Pressable>
        )}
      </View>
    </BottomSheet>
  );
}
