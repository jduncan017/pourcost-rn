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
    <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top }}>
      {/* Logo Section */}
      <View style={{ 
        alignItems: 'center', 
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border 
      }}>
        <Image
          source={
            isDarkMode
              ? require('../../assets/images/PC-Logo-Silver.png')
              : require('../../assets/images/PC-Logo-Dark-Gradient.png')
          }
          style={{ width: 140, height: 35 }}
          resizeMode="contain"
        />
      </View>

      {/* Standard drawer items */}
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Sign In/Sign Up button at bottom */}
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Pressable
          onPress={handleSignIn}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            backgroundColor: colors.accent + '20',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.accent + '40',
          }}
        >
          <Ionicons name="person" size={20} color={colors.accent} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Geist',
                fontWeight: '500',
                color: colors.text,
                fontSize: 16,
              }}
            >
              Sign In / Sign Up
            </Text>
            <Text
              style={{
                fontFamily: 'Geist',
                color: colors.textSecondary,
                fontSize: 12,
              }}
            >
              Sync your data across devices
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}