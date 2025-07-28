import { View, Alert, Image } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useTheme } from '@/src/contexts/ThemeContext';
import SettingsCard from '@/src/components/ui/SettingsCard';

export default function CustomDrawerContent(
  props: DrawerContentComponentProps
) {
  const colors = useThemeColors();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const handleSignIn = () => {
    Alert.alert('Sign In', 'Sign in functionality would be implemented here');
  };

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

      {/* Standard drawer items */}
      <DrawerContentScrollView
        {...props}
        className="DrawerScroll"
        contentContainerStyle={{ paddingTop: 16 }}
      >
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Sign In/Sign Up button at bottom */}
      <View
        className="SignInSection p-4 pb-16 border-t"
        style={{
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <SettingsCard
          title="Sign In / Sign Up"
          description="Sync your data across devices"
          iconName="person"
          iconColor={colors.accent}
          onPress={handleSignIn}
          variant="accent"
        />
      </View>
    </View>
  );
}
