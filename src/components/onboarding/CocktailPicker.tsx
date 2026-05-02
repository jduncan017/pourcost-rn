import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GradientBackground from '@/src/components/ui/GradientBackground';
import SearchBar from '@/src/components/ui/SearchBar';
import { palette } from '@/src/contexts/ThemeContext';
import {
  fetchLibraryRecipes,
  groupByCategory,
  LibraryRecipe,
} from '@/src/lib/library-recipes';
import { HapticService } from '@/src/services/haptic-service';
import { capture } from '@/src/services/analytics-service';

const FOOTER_BG = '#0B1120';

// Order in which we render category sections — most-used first.
const CATEGORY_ORDER = ['Whiskey', 'Gin', 'Vodka', 'Rum', 'Tequila', 'Other'] as const;

export interface CocktailPickerProps {
  /** Called with the recipes the user picked. Empty array = skip. */
  onContinue: (recipes: LibraryRecipe[]) => void;
  /** Show the onboarding "STEP 4 OF 5" indicator + add safe-area top padding.
   *  False when the screen is wrapped in a navigation header (post-onboarding
   *  browse mode) — the header provides safe area and a back button on its own. */
  showBack?: boolean;
  /** Lowercase recipe names to filter out (e.g. cocktails the user already
   *  has in their inventory, so they can't double-adopt). */
  excludeNames?: Set<string>;
}

export default function CocktailPicker({
  onContinue,
  showBack = true,
  excludeNames,
}: CocktailPickerProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<LibraryRecipe[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchLibraryRecipes()
      .then((r) => {
        if (cancelled) return;
        setRecipes(r);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not load library recipes');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Drop recipes whose names match items the user already has (so they
  // don't accidentally re-adopt and create duplicates), then filter by
  // the live search query. Match is case-insensitive on the trimmed name.
  const filteredRecipes = useMemo(() => {
    let list = recipes;
    if (excludeNames && excludeNames.size > 0) {
      list = list.filter((r) => !excludeNames.has(r.name.trim().toLowerCase()));
    }
    const q = searchQuery.trim().toLowerCase();
    if (q.length > 0) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [recipes, excludeNames, searchQuery]);

  const grouped = useMemo(() => groupByCategory(filteredRecipes), [filteredRecipes]);
  const orderedCategories = useMemo(() => {
    const known = CATEGORY_ORDER.filter((c) => grouped[c]?.length > 0);
    const extras = Object.keys(grouped)
      .filter((c) => !CATEGORY_ORDER.includes(c as (typeof CATEGORY_ORDER)[number]))
      .sort();
    return [...known, ...extras];
  }, [grouped]);

  const togglePick = (id: string) => {
    HapticService.selection();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleContinue = () => {
    const picks = filteredRecipes.filter((r) => selected.has(r.id));
    capture('cocktail_picker_complete', {
      picked_count: picks.length,
      skipped: picks.length === 0,
    });
    onContinue(picks);
  };

  return (
    <GradientBackground>
      <View
        className="flex-1"
        style={{
          // Onboarding (showBack=true): no nav header, so handle safe-area
          // top ourselves. Browse mode (showBack=false): nav header consumes
          // safe-area, so just a small breathing-room pad.
          paddingTop: showBack ? insets.top + 12 : 0,
          paddingBottom: 0,
        }}
      >
        {showBack && (
          <View className="px-5 py-2">
            <Text style={{ color: palette.N4, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 }}>
              STEP 4 OF 5
            </Text>
          </View>
        )}

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            // Reserve space for the footer when it's actually rendered.
            // Hidden footer (browse mode, nothing picked) → tight bottom pad
            // so the list isn't sitting above empty space.
            paddingBottom:
              showBack || selected.size > 0 ? 180 + insets.bottom : insets.bottom + 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mt-3 mb-4">
            <Text className="text-2xl" style={{ color: palette.N2, fontWeight: '700' }}>
              Pick Cocktails for Your Bar
            </Text>
            <Text className="text-base mt-2 leading-6" style={{ color: palette.N3 }}>
              Tap any cocktails you make. We'll add them with the right ingredients, using your wells where they fit. You can add more anytime.
            </Text>
          </View>

          <View className="mb-5">
            <SearchBar
              placeholder="Search classics…"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {loading && (
            <View className="items-center py-10">
              <ActivityIndicator color={palette.N3} />
              <Text className="mt-3" style={{ color: palette.N4, fontSize: 13 }}>
                Loading library…
              </Text>
            </View>
          )}

          {error && (
            <View
              className="rounded-xl p-4"
              style={{ backgroundColor: palette.R3 + '14', borderWidth: 1, borderColor: palette.R3 + '60' }}
            >
              <Text style={{ color: palette.R3, fontSize: 14 }}>{error}</Text>
            </View>
          )}

          {!loading && !error && orderedCategories.length === 0 && (
            <Text
              className="text-sm py-2"
              style={{ color: palette.N4 }}
            >
              {searchQuery.trim().length > 0
                ? 'No classics match your search.'
                : 'You already have every classic from the library.'}
            </Text>
          )}

          {!loading && !error && orderedCategories.map((cat) => (
            <View key={cat} className="flex-col gap-2 mb-6">
              <Text
                className="text-xs uppercase mb-1"
                style={{ color: palette.N4, letterSpacing: 1, fontWeight: '600' }}
              >
                {cat}
              </Text>
              <View className="flex-col gap-2">
                {grouped[cat].map((recipe) => (
                  <RecipeRow
                    key={recipe.id}
                    recipe={recipe}
                    selected={selected.has(recipe.id)}
                    onToggle={() => togglePick(recipe.id)}
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Footer with fade overlay. In onboarding the footer always shows
            (Skip is the way out). In browse mode it's hidden until the user
            picks at least one — no Skip button there since they can just
            navigate back via the header. */}
        {(showBack || selected.size > 0) && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
            }}
          >
            <LinearGradient
              colors={['rgba(11, 17, 32, 0)', FOOTER_BG]}
              style={{ height: 36 }}
              pointerEvents="none"
            />
            <View
              style={{
                backgroundColor: FOOTER_BG,
                paddingHorizontal: 24,
                paddingTop: 4,
                paddingBottom: insets.bottom + 16,
              }}
            >
              {selected.size > 0 && (
                <Text className="text-xs text-center mb-2" style={{ color: palette.N4 }}>
                  {selected.size} {selected.size === 1 ? 'cocktail' : 'cocktails'} picked
                </Text>
              )}
              <Pressable
                onPress={handleContinue}
                disabled={loading}
                style={[styles.primaryButton, loading && styles.disabled]}
              >
                <Text style={styles.primaryButtonText}>
                  {selected.size > 0
                    ? `Continue with ${selected.size}`
                    : 'Skip cocktail setup'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </GradientBackground>
  );
}

// ============================================================
// RecipeRow — one row per library recipe
// ============================================================

function RecipeRow({
  recipe,
  selected,
  onToggle,
}: {
  recipe: LibraryRecipe;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      className="rounded-2xl px-4 py-3.5 flex-row items-center"
      style={{
        backgroundColor: selected ? palette.B5 + '14' : 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: selected ? palette.B5 + '60' : 'rgba(255,255,255,0.12)',
      }}
    >
      <View className="flex-1 flex-col gap-0.5 pr-3">
        <Text
          style={{ color: palette.N1, fontSize: 16, fontWeight: '600' }}
          numberOfLines={1}
        >
          {recipe.name}
        </Text>
        {recipe.description && (
          <Text
            style={{ color: palette.N4, fontSize: 12, lineHeight: 16 }}
            numberOfLines={2}
          >
            {recipe.description}
          </Text>
        )}
      </View>
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          borderWidth: selected ? 0 : 1.5,
          borderColor: 'rgba(255,255,255,0.3)',
          backgroundColor: selected ? palette.B5 : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && <Ionicons name="checkmark" size={16} color={palette.N1} />}
      </View>
    </Pressable>
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
  disabled: {
    opacity: 0.5,
  },
});
