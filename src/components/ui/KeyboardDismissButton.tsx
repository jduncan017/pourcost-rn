import { useEffect, useState } from 'react';
import { Pressable, Keyboard } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/src/contexts/ThemeContext';

/**
 * Floating chevron-down button that hovers just above the on-screen keyboard
 * and dismisses it when tapped. Self-hides when the keyboard is closed.
 *
 * Mounted globally inside GradientBackground so every screen gets a
 * consistent keyboard-dismiss affordance without each screen re-implementing
 * the listener and positioning logic.
 *
 * Animation: fades in 150ms after the keyboard finishes appearing (so it
 * doesn't slide up with the keyboard, it pops in once everything settles),
 * and fades out as soon as the keyboard begins to dismiss (uses
 * keyboardWillHide on iOS; falls back to keyboardDidHide on Android).
 */

const SHOW_DELAY_MS = 150;
const FADE_IN_MS = 200;
const FADE_OUT_MS = 100;

export default function KeyboardDismissButton() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [rendered, setRendered] = useState(false);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const onShow = (event: { endCoordinates: { height: number } }) => {
      setKeyboardHeight(event.endCoordinates.height);
      setRendered(true);
      opacity.value = withDelay(SHOW_DELAY_MS, withTiming(1, { duration: FADE_IN_MS }));
    };

    const onHide = () => {
      opacity.value = withTiming(0, { duration: FADE_OUT_MS }, (finished) => {
        if (finished) {
          runOnJS(setRendered)(false);
          runOnJS(setKeyboardHeight)(0);
        }
      });
    };

    const didShow = Keyboard.addListener('keyboardDidShow', onShow);
    // iOS gets the will-hide event so we can fade out before the keyboard
    // finishes sliding away. Android only fires didHide; the button there
    // will fade after the keyboard is already gone (acceptable fallback).
    const willHide = Keyboard.addListener('keyboardWillHide', onHide);
    const didHide = Keyboard.addListener('keyboardDidHide', onHide);

    return () => {
      didShow.remove();
      willHide.remove();
      didHide.remove();
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!rendered) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          right: 16,
          bottom: keyboardHeight + 20,
          zIndex: 1000,
        },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={() => Keyboard.dismiss()}
        hitSlop={8}
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: palette.B4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Ionicons name="chevron-down" size={24} color={palette.N1} />
      </Pressable>
    </Animated.View>
  );
}
