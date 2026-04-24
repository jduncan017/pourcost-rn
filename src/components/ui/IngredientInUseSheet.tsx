import { View, Text, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet from './BottomSheet';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { Cocktail } from '@/src/types/models';
import { cocktailIcon } from '@/src/lib/type-icons';

interface IngredientInUseSheetProps {
  visible: boolean;
  onClose: () => void;
  ingredientName: string;
  cocktails: Cocktail[];
  onOpenCocktail: (cocktailId: string) => void;
}

/**
 * Blocker sheet shown when a user tries to delete an ingredient referenced by
 * one or more cocktails. Lists those cocktails with tap-to-open so the user
 * can edit them manually. Deletion only proceeds once all references are
 * cleared from those recipes.
 *
 * Post-MVP: replace with a reassign-via-search flow that swaps in a
 * replacement ingredient across all affected cocktails in one step.
 */
export default function IngredientInUseSheet({
  visible,
  onClose,
  ingredientName,
  cocktails,
  onOpenCocktail,
}: IngredientInUseSheetProps) {
  const colors = useThemeColors();
  const count = cocktails.length;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Ingredient In Use">
      <View className="px-4 pb-6 flex-col gap-4">
        <View className="flex-row items-start gap-2">
          <Ionicons name="warning-outline" size={22} color={colors.gold} />
          <Text className="flex-1" style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>
            <Text style={{ fontWeight: '700' }}>"{ingredientName}"</Text> is used in{' '}
            {count} {count === 1 ? 'cocktail' : 'cocktails'}. Remove it from{' '}
            {count === 1 ? 'that recipe' : 'those recipes'} before deleting.
          </Text>
        </View>

        <Text
          className="text-[11px] tracking-widest uppercase"
          style={{ color: colors.textTertiary, fontWeight: '600' }}
        >
          Affected Cocktails
        </Text>

        <View className="flex-col gap-2">
          {cocktails.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => onOpenCocktail(c.id)}
              className="flex-row items-center gap-3 py-3 px-4 rounded-xl"
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              })}
            >
              <MaterialCommunityIcons
                name={cocktailIcon.name}
                size={20}
                color={cocktailIcon.color}
              />
              <View className="flex-1">
                <Text
                  className="text-base"
                  style={{ color: colors.text, fontWeight: '600' }}
                  numberOfLines={1}
                >
                  {c.name}
                </Text>
                <Text
                  className="text-sm mt-0.5"
                  style={{ color: colors.textTertiary }}
                >
                  {c.ingredients.length}{' '}
                  {c.ingredients.length === 1 ? 'ingredient' : 'ingredients'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={onClose}
          className="rounded-lg py-3 items-center mt-2"
          style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.borderSubtle }}
        >
          <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>
            Got It
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
