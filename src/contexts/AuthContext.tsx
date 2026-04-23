import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, AppState } from 'react-native';
import * as Linking from 'expo-linking';
import { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from '@/src/lib/supabase';

const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
// Configure once on module load. webClientId is required on Android; iOS needs iosClientId too.
// Gating this on only iosClientId previously left Android users unconfigured.
if (webClientId || iosClientId) {
  GoogleSignin.configure({
    ...(iosClientId ? { iosClientId } : {}),
    ...(webClientId ? { webClientId } : {}),
  });
}

type UserRole = 'free' | 'lite' | 'pro' | 'admin';

type SignUpResult = { error: string | null; needsConfirmation?: boolean };
type OAuthResult = { error: string | null; canceled?: boolean; alreadyExists?: boolean; isNewUser?: boolean };
type LinkResult = { error: string | null; canceled?: boolean };

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isNewSignUp: boolean;
  userRole: UserRole;
  isAdmin: boolean;
  linkedProviders: string[];
  isEmailVerified: boolean;
  hasPasswordIdentity: boolean;
  clearNewSignUp: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  signInWithApple: () => Promise<OAuthResult>;
  signInWithGoogle: () => Promise<OAuthResult>;
  linkWithApple: () => Promise<LinkResult>;
  linkWithGoogle: () => Promise<LinkResult>;
  unlinkProvider: (provider: 'apple' | 'google') => Promise<{ error: string | null }>;
  resendVerificationEmail: () => Promise<{ error: string | null }>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  deleteAccount: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Matches Supabase error codes where available, falls back to message string matching.
const isAlreadyRegistered = (err: { code?: string; message?: string }) => {
  if (err.code === 'user_already_exists' || err.code === 'email_exists' || err.code === 'identity_already_exists') {
    return true;
  }
  const m = (err.message ?? '').toLowerCase();
  return (
    m.includes('already registered') ||
    m.includes('already been registered') ||
    m.includes('user already exists') ||
    m.includes('already exists')
  );
};

// Detect the transient RN fetch error ("Network request failed") so we can
// automatically retry once before surfacing it to the user. This error fires
// at the XHR level — typically from brief cellular/wifi hand-offs.
const isTransientNetworkError = (err: unknown): boolean => {
  const e = err as { name?: string; message?: string };
  return e?.name === 'TypeError' && /network request failed/i.test(e.message ?? '');
};

async function withNetworkRetry<T>(fn: () => Promise<T>, delayMs = 600): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (!isTransientNetworkError(err)) throw err;
    if (__DEV__) console.warn('[Auth] transient network error, retrying once');
    await new Promise((r) => setTimeout(r, delayMs));
    return await fn();
  }
}

// New user = sign-in timestamp is within 10s of user creation. Can't string-compare
// because Supabase writes created_at and last_sign_in_at in separate statements.
const isFreshUser = (createdAt?: string | null, lastSignInAt?: string | null): boolean => {
  if (!createdAt) return false;
  if (!lastSignInAt) return true; // first-ever sign-in, never signed in before
  const created = new Date(createdAt).getTime();
  const lastSignIn = new Date(lastSignInAt).getTime();
  return Math.abs(lastSignIn - created) < 10_000;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewSignUp, setIsNewSignUp] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('free');

  const linkedProviders: string[] = session?.user?.identities?.map((i) => i.provider) ?? [];
  const isEmailVerified = !!session?.user?.email_confirmed_at;
  const hasPasswordIdentity = linkedProviders.includes('email');

  const fetchRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        if (__DEV__) console.warn('[Auth] fetchRole error', error.message);
        return;
      }
      if (!data) {
        if (__DEV__) console.warn('[Auth] no profile row for user — handle_new_user trigger may have failed');
        return;
      }
      if (data.role) setUserRole(data.role as UserRole);
    } catch (err) {
      if (__DEV__) console.warn('[Auth] fetchRole threw', err);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        if (__DEV__) console.warn('Session error, signing out:', error.message);
        await supabase.auth.signOut();
        setSession(null);
        setIsLoading(false);
        return;
      }
      if (!session) {
        setSession(null);
        setIsLoading(false);
        return;
      }
      // Verify the cached session still maps to an existing user on the server.
      // Catches the "deleted user, stale JWT" case after account deletion.
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user) {
        if (__DEV__) console.warn('Cached session refers to missing user, clearing');
        await supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(session);
        fetchRole(session.user.id);
      }
      setIsLoading(false);
    });

    // Track which user id we've fetched role for, so TOKEN_REFRESHED (fires
    // every ~hour) doesn't cause redundant role lookups on unchanged users.
    let roleFetchedForUserId: string | null = null;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        const nextUserId = session?.user?.id ?? null;
        if (nextUserId && nextUserId !== roleFetchedForUserId) {
          roleFetchedForUserId = nextUserId;
          fetchRole(nextUserId);
        } else if (!nextUserId) {
          roleFetchedForUserId = null;
          setUserRole('free');
        }
      }
    );

    // Refresh on foreground (pick up email_confirmed_at changes from web-side
    // verify) or after a deep link. Throttle to once per 60s — users
    // background/foreground frequently, and autoRefreshToken already keeps
    // JWTs fresh between manual refreshes. Deep links bypass the throttle
    // because they signal a deliberate state change (e.g., verify complete).
    let lastManualRefresh = 0;
    const refreshIfActive = async (force = false) => {
      const now = Date.now();
      if (!force && now - lastManualRefresh < 60_000) return;
      lastManualRefresh = now;
      try { await supabase.auth.refreshSession(); } catch {}
    };
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') refreshIfActive();
    });
    const linkSub = Linking.addEventListener('url', ({ url }) => {
      if (url.startsWith('pourcost://')) refreshIfActive(true);
    });

    return () => {
      subscription.unsubscribe();
      appStateSub.remove();
      linkSub.remove();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await withNetworkRetry(() =>
      supabase.auth.signInWithPassword({ email, password })
    );
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string): Promise<SignUpResult> => {
    const { data, error } = await withNetworkRetry(() =>
      supabase.auth.signUp({ email, password })
    );
    if (error) return { error: error.message };
    // If the project requires email confirmation, signUp returns user but no session.
    const needsConfirmation = !!data.user && !data.session;
    if (!needsConfirmation) setIsNewSignUp(true);

    // Optional email verification: Supabase auto-confirms email signups (since
    // enable_confirmations=false), but we still want to send a verification
    // email so users can flip their status from "unverified" to "verified."
    // Step 1: ask our edge function to null email_confirmed_at (server-side).
    // Step 2: call resend to trigger Supabase's signup-confirmation email.
    // Both fire-and-forget — failure shouldn't block the signup UX.
    if (data.session && data.user) {
      (async () => {
        try {
          const { error: markErr } = await supabase.functions.invoke(
            'request-email-verification',
            { method: 'POST' },
          );
          if (markErr) {
            if (__DEV__) console.warn('[Verify] request-email-verification error', markErr);
            return;
          }
          const { error: resendErr } = await supabase.auth.resend({ type: 'signup', email });
          if (resendErr && __DEV__) console.warn('[Verify] resend error', resendErr.message);
        } catch (err) {
          if (__DEV__) console.warn('[Verify] threw', err);
        }
      })();
    }

    return { error: null, needsConfirmation };
  };

  const signOut = async () => {
    setIsNewSignUp(false);
    setUserRole('free');
    // Best-effort sign out of Google to drop cached account across app restarts.
    try { await GoogleSignin.signOut(); } catch {}
    await supabase.auth.signOut();
  };

  // --- Apple (native id_token flow) ---------------------------------------
  const getAppleCredential = async () => {
    if (Platform.OS !== 'ios') throw new Error('Apple sign-in is only available on iOS');
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    );
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
    if (!credential.identityToken) throw new Error('No identity token returned from Apple');
    return { credential, rawNonce };
  };

  const signInWithApple = async (): Promise<OAuthResult> => {
    try {
      const { credential, rawNonce } = await getAppleCredential();
      const { data, error } = await withNetworkRetry(() =>
        supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken!,
          nonce: rawNonce,
        })
      );

      if (error) {
        return { error: error.message, alreadyExists: isAlreadyRegistered(error) };
      }

      // Best-effort phantom-session guard: Supabase can mint a JWT for a user_id
      // that wasn't committed to auth.users. If getUser returns cleanly with no user,
      // sign out and fail. If getUser throws (network glitch), trust signInWithIdToken's
      // response — the cold-boot handler will catch any phantom on next launch.
      try {
        const { data: userCheck, error: userCheckErr } = await supabase.auth.getUser();
        if (!userCheckErr && !userCheck?.user) {
          await supabase.auth.signOut();
          return { error: 'Sign-in did not complete. Please try again — if this persists, contact support.' };
        }
      } catch (verifyErr) {
        if (__DEV__) console.warn('[Apple] phantom guard threw (non-fatal)', verifyErr);
      }

      let isNewUser = false;
      if (data.user) {
        // New user = first sign-in is within 10s of user creation. We can't use string
        // equality because Supabase writes created_at and last_sign_in_at in separate
        // statements (a few ms apart).
        isNewUser = isFreshUser(data.user.created_at, data.user.last_sign_in_at);
        if (isNewUser) setIsNewSignUp(true);

        // Apple returns fullName only on the very first authorization. Upsert to profiles
        // (app reads from here) AND write to auth.users.user_metadata (dashboard / admin tools).
        const fullName = credential.fullName;
        if (fullName && (fullName.givenName || fullName.familyName)) {
          const displayName = [fullName.givenName, fullName.familyName]
            .filter(Boolean).join(' ').trim();
          if (displayName) {
            await supabase
              .from('profiles')
              .upsert({ id: data.user.id, display_name: displayName }, { onConflict: 'id' });
            await supabase.auth.updateUser({
              data: {
                full_name: displayName,
                given_name: fullName.givenName ?? undefined,
                family_name: fullName.familyName ?? undefined,
              },
            });
          }
        }

        // Exchange the one-time authorization code for a refresh_token server-side
        // so we can call Apple's /auth/revoke on account deletion (SIWA compliance).
        // Fire-and-forget — failure here shouldn't block the sign-in UX.
        if (!credential.authorizationCode) {
          console.warn('[SIWA] No authorizationCode returned by Apple — cannot store refresh token');
        } else {
          console.log('[SIWA] Calling store-apple-token edge function');
          supabase.functions
            .invoke('store-apple-token', {
              method: 'POST',
              body: { authorizationCode: credential.authorizationCode },
            })
            .then((res) => {
              if (res.error) console.warn('[SIWA] store-apple-token error', res.error);
              else console.log('[SIWA] store-apple-token success', res.data);
            })
            .catch((err) => {
              console.warn('[SIWA] store-apple-token threw', err);
            });
        }
      }

      return { error: null, isNewUser };
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code === 'ERR_REQUEST_CANCELED') return { error: null, canceled: true };
      return { error: e.message ?? 'Apple sign-in failed' };
    }
  };

  // --- Google (native id_token flow) --------------------------------------
  // react-native-google-signin v15 does not reliably accept a client-supplied nonce across
  // iOS and Android. The safe path is to not pass a nonce to Supabase — Supabase will skip
  // nonce verification. This matches Supabase's own RN example.
  // See https://supabase.com/docs/guides/auth/social-login/auth-google (React Native tab).
  const getGoogleIdToken = async () => {
    await GoogleSignin.hasPlayServices();
    // Sign out of the previous Google session so account chooser always shows.
    try { await GoogleSignin.signOut(); } catch {}
    const response = await GoogleSignin.signIn();
    return response.data?.idToken ?? null;
  };

  const signInWithGoogle = async (): Promise<OAuthResult> => {
    try {
      console.log('[Google] Starting native sign-in');
      const idToken = await getGoogleIdToken();
      if (!idToken) {
        console.log('[Google] Canceled or no idToken');
        return { error: null, canceled: true };
      }
      console.log('[Google] Got idToken, calling signInWithIdToken');

      const { data, error } = await withNetworkRetry(() =>
        supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        })
      );
      if (error) {
        console.warn('[Google] signInWithIdToken error', error.message);
        return { error: error.message, alreadyExists: isAlreadyRegistered(error) };
      }
      console.log('[Google] signInWithIdToken OK, user id:', data.user?.id);

      // Best-effort phantom-session guard — see signInWithApple for rationale.
      try {
        const { data: userCheck, error: userCheckErr } = await supabase.auth.getUser();
        if (!userCheckErr && !userCheck?.user) {
          console.warn('[Google] phantom session detected, signing out');
          await supabase.auth.signOut();
          return { error: 'Sign-in did not complete. Please try again — if this persists, contact support.' };
        }
        console.log('[Google] Session verified');
      } catch (verifyErr) {
        console.warn('[Google] phantom guard threw (non-fatal)', verifyErr);
      }

      const isNewUser = !!data.user && isFreshUser(data.user.created_at, data.user.last_sign_in_at);
      if (isNewUser) setIsNewSignUp(true);

      return { error: null, isNewUser };
    } catch (err) {
      const e = err as { code?: string; message?: string; name?: string };
      console.warn('[Google] threw', e.name, e.code, e.message);
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return { error: null, canceled: true };
      // Distinguish network vs provider errors so the user sees something actionable.
      if (e.name === 'TypeError' && /network/i.test(e.message ?? '')) {
        return { error: 'Network request failed. Check your connection and try again.' };
      }
      return { error: e.message ?? 'Google sign-in failed' };
    }
  };

  // --- Account linking (native id_token via edge function) ----------------
  // supabase-js doesn't expose a native-id-token linking API — linkIdentity only
  // does browser OAuth. We handle linking ourselves: grab a native id_token the
  // same way as sign-in (Face ID for Apple, Google SDK for Google), POST it to
  // our `link-identity` edge function which verifies the token against the
  // provider's JWKS and inserts into auth.identities for the current user.
  const invokeLinkIdentity = async (
    provider: 'apple' | 'google',
    idToken: string,
    rawNonce?: string,
  ): Promise<LinkResult> => {
    const { data, error } = await supabase.functions.invoke('link-identity', {
      method: 'POST',
      body: { provider, idToken, ...(rawNonce ? { rawNonce } : {}) },
    });
    if (error) {
      // supabase-js wraps non-2xx as FunctionsHttpError. Pull the server's error
      // message out of the response body when available.
      const serverMsg = (data as { error?: string } | null)?.error;
      return { error: serverMsg ?? error.message };
    }
    await supabase.auth.refreshSession();
    return { error: null };
  };

  const linkWithApple = async (): Promise<LinkResult> => {
    try {
      const { credential, rawNonce } = await getAppleCredential();
      const result = await invokeLinkIdentity('apple', credential.identityToken!, rawNonce);
      if (result.error) return result;

      // Store the Apple refresh_token so future /auth/revoke calls work on unlink
      // or account delete. Same fire-and-forget pattern as sign-in.
      if (credential.authorizationCode) {
        supabase.functions
          .invoke('store-apple-token', {
            method: 'POST',
            body: { authorizationCode: credential.authorizationCode },
          })
          .catch((err) => {
            if (__DEV__) console.warn('[Link] store-apple-token failed', err);
          });
      }

      return result;
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code === 'ERR_REQUEST_CANCELED') return { error: null, canceled: true };
      return { error: e.message ?? 'Apple linking failed' };
    }
  };

  const linkWithGoogle = async (): Promise<LinkResult> => {
    try {
      const idToken = await getGoogleIdToken();
      if (!idToken) return { error: null, canceled: true };
      return await invokeLinkIdentity('google', idToken);
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return { error: null, canceled: true };
      return { error: e.message ?? 'Google linking failed' };
    }
  };

  const unlinkProvider = async (provider: 'apple' | 'google' | 'email') => {
    const identity = session?.user?.identities?.find((i) => i.provider === provider);
    if (!identity) return { error: `No ${provider} identity found on this account.` };

    // Refuse if this is the user's only identity — they'd have no way to sign in.
    const identityCount = session?.user?.identities?.length ?? 0;
    if (identityCount <= 1) {
      return { error: 'Cannot remove your only sign-in method. Link another first.' };
    }

    const { error } = await supabase.auth.unlinkIdentity(identity);
    if (error) return { error: error.message };

    // Revoke provider-side state so the next sign-in issues a fresh id_token
    // with full claims (email, fullName). Without this, Apple/Google remember
    // the grant and return minimal tokens on re-signup → empty-profile users.
    if (provider === 'apple') {
      supabase.functions
        .invoke('revoke-apple-token', { method: 'POST' })
        .then((res) => {
          console.log('[Unlink] revoke-apple-token response:', JSON.stringify(res.data ?? res));
          if (res.error) console.warn('[Unlink] revoke error:', res.error);
        })
        .catch((err) => { console.warn('[Unlink] Apple revoke threw:', err); });
    } else if (provider === 'google') {
      // Revoke at Google locally — drops the refresh token, forces re-consent next sign-in.
      try { await GoogleSignin.revokeAccess(); } catch {}
      try { await GoogleSignin.signOut(); } catch {}
    }

    await supabase.auth.refreshSession();
    return { error: null };
  };

  const resendVerificationEmail = async () => {
    const email = session?.user?.email;
    if (!email) return { error: 'No email on this account.' };
    const { error } = await withNetworkRetry(() =>
      supabase.auth.resend({ type: 'signup', email })
    );
    return { error: error?.message ?? null };
  };

  const sendPasswordResetEmail = async (email: string) => {
    const { error } = await withNetworkRetry(() =>
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://www.pourcost.app/reset-password',
      })
    );
    return { error: error?.message ?? null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await withNetworkRetry(() =>
      supabase.auth.updateUser({ password: newPassword })
    );
    return { error: error?.message ?? null };
  };

  const deleteAccount = async () => {
    // Check the server result BEFORE clearing local session. If the edge function
    // fails, we keep the user signed in so they can retry — otherwise they'd be
    // stranded on the login screen with a lingering server-side account.
    const { error } = await supabase.functions.invoke('delete-account', {
      method: 'POST',
    });
    if (error) return { error: error.message };

    // Server deletion succeeded — tear down local state.
    setIsNewSignUp(false);
    // revokeAccess drops the Google refresh token at Google's end too, so the
    // next Google sign-in prompts fresh consent (mirrors Apple's /auth/revoke).
    try { await GoogleSignin.revokeAccess(); } catch {}
    try { await GoogleSignin.signOut(); } catch {}
    // Scope 'local' — the user was just deleted server-side, so hitting
    // /auth/v1/logout with their stale JWT would return 403 user_not_found.
    await supabase.auth.signOut({ scope: 'local' });
    return { error: null };
  };

  const clearNewSignUp = () => setIsNewSignUp(false);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        isNewSignUp,
        userRole,
        isAdmin: userRole === 'admin',
        linkedProviders,
        isEmailVerified,
        hasPasswordIdentity,
        clearNewSignUp,
        signIn,
        signUp,
        signOut,
        signInWithApple,
        signInWithGoogle,
        linkWithApple,
        linkWithGoogle,
        unlinkProvider,
        resendVerificationEmail,
        sendPasswordResetEmail,
        updatePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
