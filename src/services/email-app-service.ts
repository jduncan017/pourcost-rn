/**
 * Email-app detection and preferred-app persistence.
 *
 * iOS has no public API to open the user's default mail app inbox (the Default
 * Mail App setting only affects `mailto:` compose). So we detect installed
 * third-party mail apps via `Linking.canOpenURL`, let the user pick one on
 * first tap, persist the choice, and open that app directly on subsequent taps.
 *
 * For schemes to resolve via canOpenURL, each scheme must be in the iOS
 * Info.plist under `LSApplicationQueriesSchemes`. Keep this list in sync.
 */

import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EmailApp {
  /** URL scheme used to both probe install and launch the app */
  scheme: string;
  /** Display name shown in the picker */
  name: string;
  /** Ionicons name for a visual cue */
  icon: 'mail-outline' | 'mail-open-outline' | 'paper-plane-outline';
}

const KNOWN_APPS: EmailApp[] = [
  { scheme: 'readdle-spark://', name: 'Spark',      icon: 'paper-plane-outline' },
  { scheme: 'googlegmail://',   name: 'Gmail',      icon: 'mail-outline' },
  { scheme: 'ms-outlook://',    name: 'Outlook',    icon: 'mail-outline' },
  { scheme: 'ymail://',         name: 'Yahoo Mail', icon: 'mail-outline' },
  { scheme: 'airmail://',       name: 'Airmail',    icon: 'mail-outline' },
  { scheme: 'message://',       name: 'Apple Mail', icon: 'mail-open-outline' },
];

/** Fallback that always "succeeds" — opens the default mail app in compose mode. */
export const MAILTO_FALLBACK: EmailApp = {
  scheme: 'mailto:',
  name: 'Default mail app (new message)',
  icon: 'mail-outline',
};

const PREFERRED_KEY = '@pourcost/preferred-email-app';

/** Returns the subset of KNOWN_APPS that can be launched from this device. */
export async function detectInstalledEmailApps(): Promise<EmailApp[]> {
  const checks = await Promise.all(
    KNOWN_APPS.map(async (app) => {
      try {
        return (await Linking.canOpenURL(app.scheme)) ? app : null;
      } catch {
        return null;
      }
    })
  );
  return checks.filter((a): a is EmailApp => a !== null);
}

export async function getPreferredEmailApp(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PREFERRED_KEY);
  } catch {
    return null;
  }
}

export async function setPreferredEmailApp(scheme: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFERRED_KEY, scheme);
  } catch {
    // non-fatal — user can re-pick next time
  }
}

export async function clearPreferredEmailApp(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFERRED_KEY);
  } catch {
    // ignore
  }
}

/** Attempts to open the given scheme. Returns false if it fails. */
export async function openEmailScheme(scheme: string): Promise<boolean> {
  try {
    const ok = await Linking.canOpenURL(scheme);
    if (!ok) return false;
    await Linking.openURL(scheme);
    return true;
  } catch {
    return false;
  }
}
