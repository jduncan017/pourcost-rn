import { useRouter } from 'expo-router';
import { useMemo } from 'react';

/**
 * Global short lock to swallow rapid double-taps on navigation actions.
 * Without this, two quick taps on a SettingsCard or ResultRow can push the
 * same screen twice (or crash mid-transition on iOS).
 *
 * The lock is global because users tap one button at a time — a single shared
 * window is enough, and avoids per-component bookkeeping.
 */
const LOCK_MS = 500;
let lockedUntil = 0;

function tryLock(): boolean {
  const now = Date.now();
  if (now < lockedUntil) return false;
  lockedUntil = now + LOCK_MS;
  return true;
}

type Router = ReturnType<typeof useRouter>;

/** Drop-in replacement for `useRouter()` that guards push/replace/back/navigate
 *  with the shared lock. Other router methods (canGoBack, dismissTo, etc.)
 *  pass through unchanged. */
export function useGuardedRouter(): Router {
  const router = useRouter();
  return useMemo(() => {
    const guarded: Router = Object.create(router);
    guarded.push = ((href: any, options?: any) => {
      if (tryLock()) (router.push as any)(href, options);
    }) as Router['push'];
    guarded.replace = ((href: any, options?: any) => {
      if (tryLock()) (router.replace as any)(href, options);
    }) as Router['replace'];
    guarded.navigate = ((href: any, options?: any) => {
      if (tryLock()) (router.navigate as any)(href, options);
    }) as Router['navigate'];
    guarded.back = () => {
      if (tryLock()) router.back();
    };
    return guarded;
  }, [router]);
}
