import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from 'expo-router';

interface GuardOptions {
  title?: string;
  message?: string;
  discardLabel?: string;
}

/**
 * Block back-navigation when the form has unsaved edits. Catches the system
 * back button, swipe-back gesture, header Cancel, and any router.back().
 *
 * Call `bypass()` immediately before navigating away on a successful save so
 * the user isn't prompted to discard work they just persisted.
 */
export function useUnsavedChangesGuard(isDirty: boolean, options?: GuardOptions) {
  const navigation = useNavigation();
  const bypassRef = useRef(false);

  useEffect(() => {
    if (!isDirty) return;

    const sub = navigation.addListener('beforeRemove', (e: any) => {
      if (bypassRef.current) return;
      e.preventDefault();
      Alert.alert(
        options?.title ?? 'Discard changes?',
        options?.message ?? "You have unsaved changes. Leaving now will lose them.",
        [
          { text: 'Keep Editing', style: 'cancel', onPress: () => {} },
          {
            text: options?.discardLabel ?? 'Discard',
            style: 'destructive',
            onPress: () => {
              // Mark bypass before dispatching so the re-fired beforeRemove
              // (triggered by the dispatched action) skips the alert and
              // doesn't loop.
              bypassRef.current = true;
              navigation.dispatch(e.data.action);
            },
          },
        ],
      );
    });

    return sub;
  }, [navigation, isDirty, options]);

  return {
    bypass: () => {
      bypassRef.current = true;
    },
  };
}
