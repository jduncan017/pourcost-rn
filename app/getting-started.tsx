/**
 * Getting Started carousel.
 *
 * A short orientation deck — what's where in the app, in under a minute.
 * Used in two contexts:
 *   1. As the FIRST step of new-account onboarding — auth flows route
 *      here with `?from=onboarding` and the "Get Started" button advances
 *      into `/(auth)/onboarding-profile` to begin actual setup.
 *   2. As an evergreen replay from Learn → Getting Started, where the
 *      same button just navigates back.
 *
 * NOT educational — these slides describe what each screen does, they
 * don't teach how to use specific features. Real per-feature tutorials
 * are tracked in feature-list.md as a post-MVP item; they'll get a
 * separate "Tutorials" entry in Learn.
 */
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { palette, useThemeColors } from '@/src/contexts/ThemeContext';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { useAppStore } from '@/src/stores/app-store';
import { capture } from '@/src/services/analytics-service';
import { HapticService } from '@/src/services/haptic-service';

interface Slide {
  id: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  body: string;
}

// Curated to four core screens + a welcome and a wrap-up. Order mirrors the
// natural setup flow: stock the bar, build cocktails, run quick math, find
// anything. Settings doesn't get its own slide — discovery via the menu is
// fine and keeps the deck short.
const SLIDES: Slide[] = [
  {
    id: 'welcome',
    iconName: 'sparkles',
    iconColor: palette.B5,
    title: 'Welcome to PourCost',
    body: "A quick overview of what's where, in under a minute. Swipe to flip through, or tap Next.",
  },
  {
    id: 'inventory',
    iconName: 'flask',
    iconColor: palette.G3,
    title: 'Bar Inventory',
    body: 'Every bottle you carry, with sizes and costs. Each one shows live pour cost so you know your margin per pour.',
  },
  {
    id: 'cocktails',
    iconName: 'wine',
    iconColor: palette.O2,
    title: 'Cocktails',
    body: 'Build recipes from your inventory. Cost and margin update as you tweak the build, so you can price with confidence.',
  },
  {
    id: 'calculator',
    iconName: 'calculator',
    iconColor: palette.Y4,
    title: 'Quick Calculator',
    body: 'Estimate pour cost on any bottle without saving anything. Useful when a rep is on the line and you need a number now.',
  },
  {
    id: 'search',
    iconName: 'search',
    iconColor: palette.P3,
    title: 'Search',
    body: 'Find any cocktail, ingredient, or brand from the catalog. The search icon lives in the top right of every drawer screen.',
  },
  {
    id: 'done',
    iconName: 'checkmark-circle',
    iconColor: palette.G3,
    title: "You're Ready",
    body: 'You can replay this anytime from Learn → Getting Started. Time to start pouring.',
  },
];

export default function GettingStartedScreen() {
  const router = useGuardedRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { width: screenW } = useWindowDimensions();
  const setGettingStartedSeen = useAppStore((s) => s.setGettingStartedSeen);

  // `from=onboarding` signals the auth flow brought the user here; finish
  // continues into onboarding-profile. Replays from Learn omit the param
  // and finish just navigates back.
  const params = useLocalSearchParams<{ from?: string }>();
  const isOnboardingFlow = params.from === 'onboarding';

  const flatListRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isLast = activeIndex === SLIDES.length - 1;

  const finish = useCallback(
    (reason: 'completed' | 'skipped') => {
      setGettingStartedSeen(true);
      capture(
        reason === 'completed'
          ? 'getting_started_completed'
          : 'getting_started_skipped',
        {
          atSlide: SLIDES[activeIndex]?.id ?? null,
          from: isOnboardingFlow ? 'onboarding' : 'learn',
        },
      );
      if (isOnboardingFlow) {
        // Continue setup. Replace so the back gesture doesn't drop the user
        // back into the carousel mid-onboarding.
        router.replace('/(auth)/onboarding-profile' as any);
      } else {
        // Replay context — return to Learn (or wherever they came from).
        router.back();
      }
    },
    [router, setGettingStartedSeen, activeIndex, isOnboardingFlow],
  );

  // Skip lives in the navigation header (top right). iOS 26 auto-wraps
  // interactive headerRight items in Liquid Glass; on older iOS it renders
  // as a plain pill. Hidden on the last slide where the only sensible
  // action is "Get Started".
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Getting Started',
      headerRight: () =>
        isLast ? null : (
          <Pressable
            onPress={() => finish('skipped')}
            hitSlop={10}
            style={{ paddingHorizontal: 12 }}
          >
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>
              Skip
            </Text>
          </Pressable>
        ),
    });
  }, [navigation, isLast, finish, colors.text]);

  const advance = useCallback(() => {
    if (isLast) {
      finish('completed');
      return;
    }
    HapticService.selection();
    flatListRef.current?.scrollToIndex({
      index: activeIndex + 1,
      animated: true,
    });
  }, [isLast, activeIndex, finish]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / screenW);
      if (idx !== activeIndex && idx >= 0 && idx < SLIDES.length) {
        setActiveIndex(idx);
      }
    },
    [screenW, activeIndex],
  );

  return (
    <GradientBackground>
      <View className="flex-1">
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(s) => s.id}
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <SlideCard slide={item} screenW={screenW} />
          )}
        />

        {/* Footer: page indicator dots + Next/Done button. */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 16,
            paddingTop: 8,
            alignItems: 'center',
            gap: 16,
          }}
        >
          <View className="flex-row items-center gap-2">
            {SLIDES.map((s, idx) => (
              <View
                key={s.id}
                style={{
                  width: idx === activeIndex ? 22 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor:
                    idx === activeIndex ? palette.B5 : palette.N4 + '50',
                }}
              />
            ))}
          </View>

          <Pressable
            onPress={advance}
            style={{
              backgroundColor: palette.B5,
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 999,
              alignSelf: 'stretch',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: palette.N1, fontSize: 16, fontWeight: '700' }}>
              {isLast ? (isOnboardingFlow ? 'Get Started' : 'Done') : 'Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    </GradientBackground>
  );
}

interface SlideCardProps {
  slide: Slide;
  screenW: number;
}

function SlideCard({ slide, screenW }: SlideCardProps) {
  return (
    <View
      style={{
        width: screenW,
        paddingHorizontal: 32,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          backgroundColor: slide.iconColor + '1A',
          padding: 28,
          borderRadius: 999,
          marginBottom: 28,
        }}
      >
        <Ionicons name={slide.iconName} size={56} color={slide.iconColor} />
      </View>

      <Text
        style={{
          color: palette.N1,
          fontSize: 26,
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: 14,
        }}
      >
        {slide.title}
      </Text>

      <Text
        style={{
          color: palette.N3,
          fontSize: 16,
          lineHeight: 24,
          textAlign: 'center',
          maxWidth: 360,
        }}
      >
        {slide.body}
      </Text>
    </View>
  );
}
