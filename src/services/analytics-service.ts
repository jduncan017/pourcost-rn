/**
 * PostHog wrapper. Singleton instance shared between the React provider
 * (which drives autocapture + navigation tracking) and the imperative
 * `capture()` API used from stores and event handlers.
 *
 * Configure via env:
 *   EXPO_PUBLIC_POSTHOG_KEY   (required to enable; missing key = silent no-op)
 *   EXPO_PUBLIC_POSTHOG_HOST  (optional, defaults to https://us.i.posthog.com)
 *
 * The SDK handles offline buffering, batching, and session grouping. Failures
 * are swallowed by the SDK — telemetry must never break the UI.
 */
import PostHog from 'posthog-react-native';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST?.replace(/\/+$/, '') ?? 'https://us.i.posthog.com';

let client: PostHog | null = null;

export function getPostHog(): PostHog | null {
  if (!POSTHOG_KEY) return null;
  if (client) return client;
  client = new PostHog(POSTHOG_KEY, {
    host: POSTHOG_HOST,
    // Auto-capture screen views, lifecycle events, and basic device props.
    captureAppLifecycleEvents: true,
    // Keep a generous flush interval — bartenders may drop offline mid-shift,
    // SDK queues + flushes when reconnected.
    flushInterval: 30,
    flushAt: 20,
  });
  return client;
}

export function setAnalyticsUser(userId: string | null) {
  const ph = getPostHog();
  if (!ph) return;
  if (userId) {
    ph.identify(userId);
  } else {
    ph.reset();
  }
}

export interface CaptureProps {
  [key: string]: string | number | boolean | null | undefined;
}

export function capture(event: string, properties: CaptureProps = {}) {
  const ph = getPostHog();
  if (!ph) return;
  // PostHog's JsonType doesn't accept `undefined` values. Strip them so call
  // sites can pass conditional props without type gymnastics at each site.
  const cleaned: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(properties)) {
    if (v !== undefined) cleaned[k] = v;
  }
  ph.capture(event, cleaned);
}
