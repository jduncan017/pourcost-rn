import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from 'expo-router';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import SearchBar from '@/src/components/ui/SearchBar';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { ingredientTypeIcon } from '@/src/lib/type-icons';
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track keyboard height so we can extend the ScrollView's content past it.
  // The keyboard does not auto-push content (no KeyboardAvoidingView here);
  // instead we add bottom padding equal to the keyboard height so the user
  // can scroll up to see results that would otherwise be hidden behind it.
  const keyboardHeight = useKeyboardHeight();

  // Header right Create button mirrors the ingredient-selector pattern so
  // the two "add an ingredient" entry points feel like the same screen.
  // Ref stays current with searchQuery without re-setting nav options on
  // every keystroke.
  const createRef = useRef<() => void>(() => {});
  createRef.current = () => goToFormEmpty();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Add Ingredient',
      headerRight: () => (
        <Pressable
          onPress={() => createRef.current()}
          className="flex-row items-center gap-1 px-3 py-1.5"
          hitSlop={6}
        >
          <Ionicons name="add" size={16} color={colors.text} />
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>
            Create
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, colors]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const found = await searchCanonicalProducts(query);
      setResults(found);
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
        <View className="px-6 pt-4 pb-8 flex-col gap-6">
          {/* Helper — points the user at the header Create button when their
              ingredient isn't in the Spirit Database. Mirrors the wording on
              ingredient-selector for consistency. */}
          <Text
            className="text-sm leading-5"
            style={{ color: colors.textSecondary }}
          >
            Search the Spirit Database or create a new one above.
          </Text>

          <SearchBar
            placeholder="e.g., Tito's, Cointreau, lime juice"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />

          {loading && (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color={colors.textSecondary} />
              <Text className="text-sm" style={{ color: colors.textTertiary }}>
                Searching Spirit Database…
              </Text>
            </View>
          )}

          {results.length > 0 && (
            <View className="flex-col">
              <ScreenTitle
                title={`Spirit Database (${results.length})`}
                variant="muted"
                className="mb-1"
              />
              {results.map((product) => {
                const { ingredientType } = mapCanonicalToType(product);
                const icon = ingredientTypeIcon(ingredientType);
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
                    className="flex-row items-center py-3"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <MaterialCommunityIcons
                      name={icon.name}
                      size={22}
                      color={icon.color}
                      style={{ marginRight: 12 }}
                    />
                    <View className="flex-1">
                      <Text
                        className="text-base"
                        style={{ color: colors.text, fontWeight: '500' }}
                        numberOfLines={1}
                      >
                        {product.name}
                      </Text>
                      {subtitle ? (
                        <Text
                          className="text-sm mt-0.5"
                          style={{ color: colors.textTertiary }}
                          numberOfLines={1}
                        >
                          {subtitle}
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons name="add-circle" size={26} color={colors.success} />
                  </Pressable>
                );
              })}
            </View>
          )}

          {!loading && results.length === 0 && query.length > 0 && (
            <Text
              className="text-sm py-2"
              style={{ color: colors.textTertiary }}
            >
              {query.trim().length < 2
                ? 'Type at least 2 characters to search the Spirit Database.'
                : 'No matches in the Spirit Database.'}
            </Text>
          )}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
