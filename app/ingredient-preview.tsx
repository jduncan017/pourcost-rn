import { useLayoutEffect, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import EducationPanel from '@/src/components/EducationPanel';
import { ingredientTypeIcon } from '@/src/lib/type-icons';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import {
  getCanonicalProductDetail,
  mapCanonicalToType,
  type CanonicalProductDetail,
} from '@/src/lib/canonical-products';

/**
 * Read-only preview of a Spirit Database canonical product. Reached when the
 * user taps a database result anywhere (ingredient-selector, global search,
 * ingredient-create). Shows the canonical's identity + education info as it
 * would appear on a real ingredient-detail in simple mode — the user gets a
 * full sense of the product before committing.
 *
 * Header right "+ Save" routes to /ingredient-form with prefill (router.replace
 * so the preview drops out of the stack — saving the form pops the user back
 * to wherever they tapped from).
 */
export default function IngredientPreviewScreen() {
  const router = useGuardedRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ canonicalId?: string }>();
  const canonicalId = params.canonicalId;

  const [detail, setDetail] = useState<CanonicalProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canonicalId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getCanonicalProductDetail(canonicalId).then((d) => {
      if (cancelled) return;
      setDetail(d);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [canonicalId]);

  const handleSave = () => {
    if (!detail) return;
    const { ingredientType, subType } = mapCanonicalToType(detail);
    const firstSize = detail.defaultSizes[0];
    router.replace({
      pathname: '/ingredient-form',
      params: {
        canonicalProductId: detail.id,
        name: detail.name,
        description: detail.description ?? undefined,
        abv: detail.abv != null ? String(detail.abv) : undefined,
        type: ingredientType,
        subType: subType || undefined,
        productSize: firstSize ? JSON.stringify(firstSize) : undefined,
      },
    });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '',
      headerRight: () => (
        <Pressable
          onPress={handleSave}
          disabled={!detail}
          className="flex-row items-center gap-1 px-3 py-1.5"
          hitSlop={6}
          style={{ opacity: detail ? 1 : 0.4 }}
        >
          <Ionicons name="add" size={16} color={colors.go} />
          <Text style={{ color: colors.go, fontSize: 15, fontWeight: '700' }}>
            Save
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, colors, detail]);

  if (loading) {
    return (
      <GradientBackground>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color={colors.textSecondary} />
        </View>
      </GradientBackground>
    );
  }

  if (!detail) {
    return (
      <GradientBackground>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center" style={{ color: colors.text }}>
            Product not found.
          </Text>
        </View>
      </GradientBackground>
    );
  }

  const { ingredientType } = mapCanonicalToType(detail);
  const icon = ingredientTypeIcon(ingredientType);
  const subInfo = [
    ingredientType,
    detail.subcategory,
    detail.abv != null ? `${detail.abv}% ABV` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <GradientBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
      >
        <View className="pt-4 flex-col gap-6">
          {/* Hero — same layout as ingredient-detail but with canonical data. */}
          <View className="px-6 flex-col gap-4">
            <View className="flex-row gap-4 items-start">
              <View
                className="w-20 h-20 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: colors.surface + '99',
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <MaterialCommunityIcons
                  name={icon.name}
                  size={48}
                  color={icon.color}
                />
              </View>
              <View className="flex-1 flex-col justify-center gap-1">
                <Text
                  className="text-xs"
                  style={{
                    color: palette.P3,
                    letterSpacing: 1.5,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                  }}
                >
                  Spirit Database
                </Text>
                <Text
                  className="text-2xl"
                  style={{ color: colors.text, fontWeight: '700' }}
                  numberOfLines={2}
                >
                  {detail.name}
                </Text>
                {subInfo ? (
                  <Text className="text-base" style={{ color: colors.textSecondary }}>
                    {subInfo}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Education panel reads canonical directly. No pricing rows shown
              since this is preview-only — pricing is a per-user concept that
              gets entered when they tap Save and land on the form. */}
          <EducationPanel canonicalProductId={detail.id} />
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
