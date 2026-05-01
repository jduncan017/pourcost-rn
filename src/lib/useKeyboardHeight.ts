import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

/**
 * Returns the current on-screen keyboard height in pixels, or 0 when the
 * keyboard is hidden. Self-cleans listeners on unmount.
 *
 * Used by:
 *   - KeyboardDismissButton to anchor a floating dismiss button just above
 *     the keyboard.
 *   - ScrollViews that need to extend their content past the keyboard so
 *     the user can scroll up to reveal hidden content.
 */
export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return keyboardHeight;
}
