/**
 * Ingredient Type Selection Screen
 * Allows users to choose which type of ingredient they want to create
 */

import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import GradientBackground from '@/src/components/ui/GradientBackground';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import BackButton from '@/src/components/ui/BackButton';
import Card from '@/src/components/ui/Card';
import { getIngredientTypeOptions } from '@/src/config/ingredient-type-configs';
import { HapticService } from '@/src/services/haptic-service';
import { useThemeColors } from '@/src/contexts/ThemeContext';

export default function IngredientTypeSelectionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const themeColors = useThemeColors();

  // Handle type selection
  const handleTypeSelection = (type: string) => {
    HapticService.selection();
    switch (type.toLowerCase()) {
      case 'spirit':
        router.push('/ingredients/spirit');
        break;
      case 'beer':
        router.push('/ingredients/beer');
        break;
      case 'wine':
        router.push('/ingredients/wine');
        break;
      case 'prepped':
        router.push('/ingredients/prepped');
        break;
      case 'other':
        router.push('/ingredients/other');
        break;
      default:
        router.push('/ingredient-form');
    }
  };

  const typeOptions = getIngredientTypeOptions();

  // Helper functions for ingredient type styling
  const getIngredientTypeColor = (type: string) => {
    switch (type) {
      case 'Spirit':
        return themeColors.colors.s31; // Purple
      case 'Beer':
        return themeColors.colors.s12; // Yellow/amber
      case 'Wine':
        return themeColors.colors.e1; // Red
      case 'Prepped':
        return themeColors.colors.s21; // Teal
      case 'Other':
        return themeColors.colors.g2; // Gray
      default:
        return themeColors.colors.g2;
    }
  };

  const getIngredientTypeDescription = (type: string) => {
    switch (type) {
      case 'Spirit':
        return 'Vodka, whiskey, rum, gin, and other distilled spirits';
      case 'Beer':
        return 'Cans, bottles, kegs, and beer packages';
      case 'Wine':
        return 'Wine bottles from splits to magnums';
      case 'Prepped':
        return 'Syrups, bitters, and other house-prepared ingredients';
      case 'Other':
        return 'Garnishes, specialty items, and flexible ingredients';
      default:
        return '';
    }
  };

  const getIngredientTypeFeatures = (type: string) => {
    switch (type) {
      case 'Spirit':
        return 'Fractional oz pours • 375ml-1.75L bottles';
      case 'Beer':
        return 'Serving sizes • Cans, kegs, drafts';
      case 'Wine':
        return 'Wine pours • 187ml-1.5L bottles';
      case 'Prepped':
        return 'Recipe amounts • Batch containers';
      case 'Other':
        return 'Custom units • Completely flexible';
      default:
        return '';
    }
  };

  return (
    <GradientBackground>
      <ScrollView
        className="flex-1"
        style={{ paddingTop: insets.top }}
        showsVerticalScrollIndicator={false}
      >
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-center gap-3 mb-6">
            <BackButton />
            <View>
              <ScreenTitle title="Add New Ingredient" variant="main" />
              <Text className="text-g3 dark:text-n1">
                Choose the type of ingredient you want to add
              </Text>
            </View>
          </View>

          {/* Type Selection Cards */}
          <View className="flex-col gap-4">
            {typeOptions.map((typeOption) => {
              const typeColor = getIngredientTypeColor(typeOption.value);
              const typeDescription = getIngredientTypeDescription(
                typeOption.value
              );
              const typeFeatures = getIngredientTypeFeatures(typeOption.value);

              return (
                <Pressable
                  key={typeOption.value}
                  onPress={() => handleTypeSelection(typeOption.value)}
                  className="active:scale-[0.98]"
                >
                  <Card displayClasses="flex-row items-center">
                    {/* Icon */}
                    <View
                      className="w-16 h-16 rounded-full items-center justify-center mr-4"
                      style={{ backgroundColor: typeColor + '20' }}
                    >
                      <Ionicons
                        name={typeOption.icon as any}
                        size={32}
                        color={typeColor}
                      />
                    </View>

                    {/* Content */}
                    <View className="flex-1">
                      <Text
                        className="text-lg mb-1"
                        style={{
                          fontWeight: '600',
                          color: themeColors.text,
                        }}
                      >
                        {typeOption.label}
                      </Text>
                      <Text
                        className="text-sm mb-2"
                        style={{
                          color: themeColors.textSecondary,
                          lineHeight: 20,
                        }}
                      >
                        {typeDescription}
                      </Text>
                      <Text
                        className="text-xs"
                        style={{
                          color: themeColors.textSecondary,
                          opacity: 0.8,
                        }}
                      >
                        {typeFeatures}
                      </Text>
                    </View>

                    {/* Arrow */}
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={themeColors.textSecondary}
                      style={{ marginLeft: 8 }}
                    />
                  </Card>
                </Pressable>
              );
            })}
          </View>

          {/* Help Text */}
          <Card displayClasses="flex-row items-start gap-3" className="mt-6">
            <Ionicons
              name="information-circle"
              size={20}
              color={themeColors.textSecondary}
            />
            <View className="flex-1">
              <Text
                className="mb-1"
                style={{
                  fontWeight: '500',
                  color: themeColors.text,
                }}
              >
                Choose the Right Type
              </Text>
              <Text
                className="text-sm"
                style={{
                  color: themeColors.textSecondary,
                  lineHeight: 20,
                }}
              >
                Each ingredient type is optimized with specific container
                sizes, pour options, and calculation methods. Choose the type
                that best matches your ingredient for the most accurate
                costing.
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
