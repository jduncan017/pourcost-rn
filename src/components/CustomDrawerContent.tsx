import { View, Text, Pressable, Alert, Image } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, useTheme } from '@/src/contexts/ThemeContext';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
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
              ? require('../../assets/images/PC-Logo-Silver.png')
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
        contentContainerStyle={{ paddingTop: 0 }}
      >
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Sign In/Sign Up button at bottom */}
      <View 
        className="SignInSection p-4 border-t"
        style={{ borderTopColor: colors.border }}
      >
        <Pressable
          onPress={handleSignIn}
          className="SignInButton flex-row items-center p-3 rounded-lg border"
          style={{
            backgroundColor: colors.accent + '20',
            borderColor: colors.accent + '40',
          }}
        >
          <Ionicons name="person" size={20} color={colors.accent} className="mr-3" />
          <View className="SignInTextContainer flex-1">
            <Text className="SignInTitle text-base font-medium text-g4 dark:text-n1">
              Sign In / Sign Up
            </Text>
            <Text className="SignInSubtitle text-xs text-g3 dark:text-n1">
              Sync your data across devices
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}