import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { palette } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppStore } from '@/src/stores/app-store';

export default function OnboardingComplete() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clearNewSignUp } = useAuth();
  const saveProfile = useAppStore((s) => s.saveProfile);

  const handleFinish = async (goToIngredientForm = false) => {
    await saveProfile();
    clearNewSignUp();
    if (goToIngredientForm) {
      router.replace('/(drawer)/ingredients' as any);
      setTimeout(() => router.push('/ingredient-form' as any), 100);
    } else {
      router.replace('/(drawer)/cocktails' as any);
    }
  };

  return (
    <GradientBackground>
      <View
        className="flex-1 justify-center px-6"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 28 }}
      >
        <View className="items-center flex-1 justify-center">
          {/* Success Icon */}
          <View
            style={{
              backgroundColor: palette.Y4 + '15',
              borderRadius: 40,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <Ionicons name="checkmark-circle" size={56} color={palette.Y4} />
          </View>

          <Text
            className="text-2xl text-center"
            style={{ color: palette.Y4, fontWeight: '700' }}
          >
            You're All Set!
          </Text>
          <Text
            className="text-lg text-center mt-3 leading-7 px-4"
            style={{ color: palette.N3 }}
          >
            Start by adding your first ingredient — that's the foundation for building accurate cocktail costs.
          </Text>
        </View>

        <View className="flex-col gap-4">
          <Pressable
            onPress={() => handleFinish(true)}
            style={styles.primaryButton}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="add-circle-outline" size={20} color={palette.N1} />
              <Text style={styles.primaryButtonText}>Add First Ingredient</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => handleFinish(false)}
            style={styles.outlineButton}
          >
            <Text style={styles.outlineButtonText}>I'll explore on my own</Text>
          </Pressable>
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: palette.B5,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: palette.N1,
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: palette.N1,
    fontSize: 16,
    fontWeight: '500',
  },
});
