import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/contexts/ThemeContext';
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
}

export default function ActionSheet({
  visible,
  onClose,
  title,
  actions,
}: ActionSheetProps) {
  const colors = useThemeColors();

  const handlePress = (action: ActionSheetAction) => {
    onClose();
    action.onPress();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View className="ActionSheet flex-col px-4 pb-4">
        {actions.map((action, index) => (
          <View key={action.label}>
            <Pressable
              onPress={() => handlePress(action)}
              className="ActionSheetRow flex-row items-center gap-4 py-4"
            >
              {action.icon && (
                <Ionicons
                  name={action.icon}
                  size={22}
                  color={action.destructive ? colors.colors.R3 : colors.text}
                />
              )}
              <Text
                className="ActionSheetLabel text-lg font-medium"
                style={{
                  color: action.destructive ? colors.colors.R3 : colors.text,
                }}
              >
                {action.label}
              </Text>
            </Pressable>
            {index < actions.length - 1 && (
              <View
                className="ActionSheetDivider h-px"
                style={{ backgroundColor: colors.border }}
              />
            )}
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}
