import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from '@/src/lib/supabase';

const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
if (iosClientId) {
  GoogleSignin.configure({ iosClientId, webClientId });
}

type UserRole = 'free' | 'lite' | 'pro' | 'admin';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isNewSignUp: boolean;
  userRole: UserRole;
  isAdmin: boolean;
  linkedProviders: string[];
  clearNewSignUp: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  signInWithApple: () => Promise<{ error: string | null; canceled?: boolean; alreadyExists?: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null; canceled?: boolean; alreadyExists?: boolean }>;
  linkWithApple: () => Promise<{ error: string | null; canceled?: boolean }>;
  linkWithGoogle: () => Promise<{ error: string | null; canceled?: boolean }>;
  deleteAccount: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewSignUp, setIsNewSignUp] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('free');

  const linkedProviders: string[] = session?.user?.identities?.map((i) => i.provider) ?? [];

  const fetchRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (data?.role) setUserRole(data.role as UserRole);
    } catch {
      // non-fatal — default role stays 'free'
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Invalid refresh token — clear stale session
        if (__DEV__) console.warn('Session error, signing out:', error.message);
        supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(session);
        if (session?.user) fetchRole(session.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) fetchRole(session.user.id);
        else setUserRole('free');
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (!error) setIsNewSignUp(true);
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    setIsNewSignUp(false);
    setUserRole('free');
    await supabase.auth.signOut();
  };

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

  const signInWithApple = async () => {
    try {
      const { credential, rawNonce } = await getAppleCredential();
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
        nonce: rawNonce,
      });

      if (error) {
        const alreadyExists = error.message.toLowerCase().includes('already registered') ||
          error.message.toLowerCase().includes('already been registered');
        return { error: error.message, alreadyExists };
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles').select('id').eq('id', data.user.id).single();
        if (!profile) setIsNewSignUp(true);

        // Apple returns fullName only on the very first authorization — update if present
        const fullName = credential.fullName;
        if (fullName && (fullName.givenName || fullName.familyName)) {
          const displayName = [fullName.givenName, fullName.familyName]
            .filter(Boolean).join(' ').trim();
          if (displayName) {
            await supabase.from('profiles').update({ display_name: displayName }).eq('id', data.user.id);
          }
        }
      }

      return { error: null };
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code === 'ERR_REQUEST_CANCELED') return { error: null, canceled: true };
      return { error: e.message ?? 'Apple sign-in failed' };
    }
  };

  const linkWithApple = async () => {
    try {
      const { credential, rawNonce } = await getAppleCredential();
      const { error } = await supabase.auth.linkIdentity({
        provider: 'apple' as any,
        options: {
          idToken: credential.identityToken!,
          nonce: rawNonce,
        } as any,
      });
      if (error) {
        const alreadyLinked = error.message.toLowerCase().includes('already linked') ||
          error.message.toLowerCase().includes('identity is already');
        if (alreadyLinked) return { error: 'This Apple ID is already linked to another account.' };
        return { error: error.message };
      }
      await supabase.auth.refreshSession();
      return { error: null };
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code === 'ERR_REQUEST_CANCELED') return { error: null, canceled: true };
      return { error: e.message ?? 'Apple linking failed' };
    }
  };

  const getGoogleIdToken = async () => {
    await GoogleSignin.hasPlayServices();
    try { await GoogleSignin.revokeAccess(); } catch {}
    try { await GoogleSignin.signOut(); } catch {}
    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken ?? null;
    if (!idToken) return { idToken: null, nonce: undefined };
    // Extract nonce that Google embedded in the token (v15 doesn't let us set our own)
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      return { idToken, nonce: payload.nonce as string | undefined };
    } catch {
      return { idToken, nonce: undefined };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { idToken, nonce } = await getGoogleIdToken();
      if (!idToken) return { error: null, canceled: true };
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
        ...(nonce ? { nonce } : {}),
      });
      if (error) {
        const alreadyExists = error.message.toLowerCase().includes('already registered') ||
          error.message.toLowerCase().includes('already been registered');
        return { error: error.message, alreadyExists };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles').select('id').eq('id', user.id).single();
        if (!profile) setIsNewSignUp(true);
      }

      return { error: null };
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return { error: null, canceled: true };
      return { error: e.message ?? 'Google sign-in failed' };
    }
  };

  const linkWithGoogle = async () => {
    try {
      const { idToken, nonce } = await getGoogleIdToken();
      if (!idToken) return { error: null, canceled: true };
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google' as any,
        options: { idToken, ...(nonce ? { nonce } : {}) } as any,
      });
      if (error) {
        const alreadyLinked = error.message.toLowerCase().includes('already linked') ||
          error.message.toLowerCase().includes('identity is already');
        if (alreadyLinked) return { error: 'This Google account is already linked to another account.' };
        return { error: error.message };
      }
      await supabase.auth.refreshSession();
      return { error: null };
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return { error: null, canceled: true };
      return { error: e.message ?? 'Google linking failed' };
    }
  };

  const deleteAccount = async () => {
    const { error } = await supabase.functions.invoke('delete-account', {
      method: 'POST',
    });
    if (error) return { error: error.message };
    setIsNewSignUp(false);
    await supabase.auth.signOut();
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
        clearNewSignUp,
        signIn,
        signUp,
        signOut,
        signInWithApple,
        signInWithGoogle,
        linkWithApple,
        linkWithGoogle,
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
