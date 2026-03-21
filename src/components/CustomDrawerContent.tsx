import { View, Image, Pressable, Text } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, useTheme } from '@/src/contexts/ThemeContext';

export default function CustomDrawerContent(
  props: DrawerContentComponentProps
) {
  const colors = useThemeColors();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      className="DrawerContainer flex-1"
      style={{ backgroundColor: colors.surface, paddingTop: insets.top }}
    >
      {/* Logo Section */}
      <View
        className="LogoSection items-center py-5 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        <Image
          source={
            isDarkMode
              ? require('../../assets/images/PC-Logo-Gold.png')
              : require('../../assets/images/PC-Logo-Dark-Gradient.png')
          }
          className="DrawerLogo w-[140px] h-[35px]"
          resizeMode="contain"
        />
      </View>

      {/* Standard drawer items (excludes settings — rendered below) */}
      <DrawerContentScrollView
        {...props}
        className="DrawerScroll"
        contentContainerStyle={{ paddingTop: 16 }}
      >
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Settings pinned at bottom */}
      {(() => {
        const currentRoute = props.state.routes[props.state.index]?.name;
        const isActive = currentRoute === 'settings';
        return (
          <View
            className="border-t px-4 pb-6 pt-3"
            style={{
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 8,
            }}
          >
            <Pressable
              onPress={() => {
                router.push('/(drawer)/settings');
                props.navigation.closeDrawer();
              }}
              className="flex-row items-center gap-3 px-3 py-3 rounded-lg active:opacity-70"
            >
              <Ionicons name="settings-outline" size={22} color={isActive ? colors.gold : colors.textTertiary} />
              <Text
                className="text-base"
                style={{ fontWeight: isActive ? '600' : '500', color: isActive ? colors.gold : colors.textTertiary }}
              >
                Settings
              </Text>
            </Pressable>
          </View>
        );
      })()}
    </View>
  );
}
