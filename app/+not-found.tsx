import { Link, Stack } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { useThemeColors } from '@/src/contexts/ThemeContext';

export default function NotFoundScreen() {
  const colors = useThemeColors();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <GradientBackground>
        <View className="flex-1 items-center justify-center p-5">
          <Ionicons 
            name="alert-circle-outline" 
            size={64} 
            color={colors.textSecondary} 
            className="mb-4"
          />
          
          <Text 
            className="text-xl font-bold text-g4 dark:text-n1 text-center mb-2"
          >
            This screen doesn't exist.
          </Text>
          
          <Text 
            className="text-g3 dark:text-n1 text-center mb-8"
          >
            The page you're looking for couldn't be found.
          </Text>

          <Link href="/(drawer)/calculator" asChild>
            <Pressable className="bg-p1/80 dark:bg-s11/80 px-6 py-3 rounded-lg">
              <Text className="text-n1 dark:text-p4 font-medium">
                Go to Calculator
              </Text>
            </Pressable>
          </Link>
        </View>
      </GradientBackground>
    </>
  );
}
