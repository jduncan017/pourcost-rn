import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from 'expo-router';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import SearchBar from '@/src/components/ui/SearchBar';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { useKeyboardHeight } from '@/src/lib/useKeyboardHeight';
import {
  searchCanonicalProducts,
  mapCanonicalToType,
  type CanonicalProductSummary,
} from '@/src/lib/canonical-products';

const DEBOUNCE_MS = 250;

/**
 * Ingredient creation entry screen. Users land here from any "Add Ingredient"
 * action. They can either:
 *   1. Search the canonical catalog and pick a product (form opens prefilled
 *      with name, type, subtype, ABV, description, default size, and the
 *      canonical_product_id link).
 *   2. Tap "Create from scratch" if their product isn't in the catalog (form
 *      opens empty).
 *
 * This screen replaced the previous "form with autocomplete at the top"
 * pattern because new users weren't recognizing the inline search as a
 * gateway to the catalog. Making the catalog the entry point teaches the
 * inventory-vs-catalog distinction in the moment users need it.
 */
export default function IngredientCreateScreen() {
  const navigation = useNavigation();
  const router = useGuardedRouter();
  const colors = useThemeColors();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CanonicalProductSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track keyboard height so we can extend the ScrollView's content past it.
  // The keyboard does not auto-push content (no KeyboardAvoidingView here);
  // instead we add bottom padding equal to the keyboard height so the user
  // can scroll up to see results that would otherwise be hidden behind it.
  const keyboardHeight = useKeyboardHeight();

  useEffect(() => {
    navigation.setOptions({ title: 'Add Ingredient' });
  }, [navigation]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const found = await searchCanonicalProducts(query);
      setResults(found);
      setSearched(true);
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // router.replace removes this picker screen from the stack, so when the
  // form's save handler calls router.back() it returns to the screen that
  // launched the picker (drawer or cocktail-selector), not back here.
  const goToFormWithCanonical = (product: CanonicalProductSummary) => {
    const { ingredientType, subType } = mapCanonicalToType(product);
    const firstSize = product.defaultSizes[0];

    router.replace({
      pathname: '/ingredient-form',
      params: {
        canonicalProductId: product.id,
        name: product.name,
        description: product.description ?? undefined,
        abv: product.abv != null ? String(product.abv) : undefined,
        type: ingredientType,
        subType: subType || undefined,
        productSize: firstSize ? JSON.stringify(firstSize) : undefined,
      },
    });
  };

  const goToFormEmpty = () => {
    router.replace('/ingredient-form');
  };

  return (
    <GradientBackground>
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: keyboardHeight }}
      >
        <View className="px-6 pt-4 pb-8 flex-col gap-5">
          {/* Helper copy — frames the database as the recommended path */}
          <Text
            className="text-sm leading-5"
            style={{ color: colors.textSecondary }}
          >
            Search the Spirit Database for the product you want to add. Picking
            a result fills in the details for you and saves it to My Inventory.
            If you don't find it, you can create one from scratch.
          </Text>

          <SearchBar
            placeholder="e.g., Tito's, Cointreau, lime juice"
            value={query}
            onChangeText={setQuery}
          />

          {loading && (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color={colors.textSecondary} />
              <Text className="text-sm" style={{ color: colors.textTertiary }}>
                Searching Spirit Database...
              </Text>
            </View>
          )}

          {results.length > 0 && (
            <View className="flex-col gap-2">
              <ScreenTitle
                title={`Spirit Database (${results.length})`}
                variant="muted"
              />
              <View
                className="ResultsList rounded-lg overflow-hidden"
                style={{
                  backgroundColor: colors.elevated,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                {results.map((product, index) => {
                  const subtitle = [
                    product.brand,
                    product.subcategory ?? product.category,
                  ]
                    .filter((s) => s && s !== product.name)
                    .join(' · ');
                  return (
                    <Pressable
                      key={product.id}
                      onPress={() => goToFormWithCanonical(product)}
                      className="ResultRow flex-row items-center justify-between px-4 py-3"
                      style={
                        index < results.length - 1
                          ? {
                              borderBottomWidth: 1,
                              borderBottomColor: colors.borderSubtle,
                            }
                          : undefined
                      }
                    >
                      <View className="flex-1 flex-col gap-0.5 pr-3">
                        <Text
                          className="text-base"
                          style={{ color: colors.text, fontWeight: '600' }}
                          numberOfLines={1}
                        >
                          {product.name}
                        </Text>
                        {subtitle ? (
                          <Text
                            className="text-xs"
                            style={{ color: colors.textTertiary }}
                            numberOfLines={1}
                          >
                            {subtitle}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {searched && !loading && results.length === 0 && (
            <View
              className="rounded-lg px-4 py-6 items-center flex-col gap-2"
              style={{
                backgroundColor: colors.elevated,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Ionicons name="search" size={28} color={colors.textTertiary} />
              <Text
                className="text-center"
                style={{ color: colors.text, fontWeight: '500' }}
              >
                Not in the Spirit Database yet
              </Text>
              <Text
                className="text-sm text-center"
                style={{ color: colors.textTertiary }}
              >
                Try a different search term, or create one from scratch below.
              </Text>
            </View>
          )}

          {/* Always-available "Create from scratch" CTA */}
          <View className="flex-col gap-2 pt-2">
            <Text
              className="text-xs uppercase"
              style={{ color: colors.textTertiary, letterSpacing: 1 }}
            >
              Don't see it?
            </Text>
            <Pressable
              onPress={goToFormEmpty}
              className="flex-row items-center justify-center gap-2 py-3.5 rounded-xl"
              style={{
                backgroundColor: colors.elevated,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={palette.N2}
              />
              <Text
                style={{
                  color: palette.N2,
                  fontWeight: '600',
                  fontSize: 16,
                }}
              >
                Create From Scratch
              </Text>
            </Pressable>
            <Text
              className="text-xs"
              style={{ color: colors.textTertiary }}
            >
              For house-made syrups, prepped ingredients, and items not yet in
              the Spirit Database.
            </Text>
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
