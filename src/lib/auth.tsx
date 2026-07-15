// Auth wrapper — sign in with Google or email+password. This module is one of
// the two vendor seams (with storage.ts): nothing outside it should know what
// powers auth.
//
// Module API: signInWithGoogle(), signInWithEmail(), signUpWithEmail(),
// signOut(), getCurrentUser(), onAuthStateChange(callback). For React trees,
// wrap the app in <AuthProvider> and read with useAuth() — it adds the user's
// profile row and a loading flag.
//
// The OAuth dance: open the provider's page in the system browser, let it
// redirect back into the app via our deep link carrying a one-time code, then
// exchange the code for a session (PKCE). The SDK persists the session and
// refreshes tokens, so sign-in survives app restarts.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { Session, User } from '@supabase/supabase-js';
import { db } from './backend';

// Completes any auth session left hanging by a previous app launch.
WebBrowser.maybeCompleteAuthSession();

// In Expo Go this resolves to exp://<host>/--/auth-callback; in a dev or
// production build it uses the "touchgrass" scheme from app.json. Whichever
// form your workflow produces must be in the backend's allowed redirect URLs.
const redirectTo = Linking.createURL('auth-callback');

/** Parse the OAuth redirect URL and turn it into a stored session. */
async function createSessionFromUrl(url: string): Promise<void> {
  const { queryParams } = Linking.parse(url);
  const errorDescription = queryParams?.error_description;
  if (errorDescription) throw new Error(String(errorDescription));

  const code = queryParams?.code;
  if (typeof code === 'string' && code) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (error) throw new Error(error.message);
    return;
  }

  // Fallback for implicit-flow responses: tokens arrive in the URL fragment.
  const fragment = url.split('#')[1];
  if (fragment) {
    const params: Record<string, string> = {};
    for (const pair of fragment.split('&')) {
      const [k, v] = pair.split('=');
      if (k && v) params[decodeURIComponent(k)] = decodeURIComponent(v);
    }
    if (params.access_token && params.refresh_token) {
      const { error } = await db.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (error) throw new Error(error.message);
      return;
    }
  }

  throw new Error('Sign-in was interrupted before it finished. Try again.');
}

/**
 * Start Google sign-in. Resolves once signed in; resolves without a session
 * if the user closes the browser; throws on real failures.
 */
export async function signInWithGoogle(): Promise<void> {
  const { data, error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw new Error(error.message);
  if (!data?.url) throw new Error('Could not start Google sign-in.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'success' && result.url) {
    await createSessionFromUrl(result.url);
  }
  // 'cancel' / 'dismiss': the user backed out — not an error.
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<void> {
  const { error } = await db.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(error.message);
}

/**
 * Create an account with email + password. The username travels as user
 * metadata, where the signup trigger picks it up for the profile row.
 * Returns true when signed in right away; false when the backend requires
 * the email address to be confirmed first (check your inbox, then sign in).
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  username: string
): Promise<boolean> {
  const { data, error } = await db.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { username } },
  });
  if (error) throw new Error(error.message);
  return !!data.session;
}

export async function signOut(): Promise<void> {
  await db.auth.signOut();
}

/** The signed-in user, or null. Reads the persisted session (no network). */
export async function getCurrentUser(): Promise<User | null> {
  const { data } = await db.auth.getSession();
  return data.session?.user ?? null;
}

/**
 * Subscribe to sign-in/sign-out/token-refresh changes. Fires immediately with
 * the current state on subscribe. Returns an unsubscribe function.
 */
export function onAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  const { data } = db.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}

// ── React bindings ──────────────────────────────────────────────────────────

export type Profile = {
  id: string;
  username: string;
};

type AuthContextValue = {
  /** Null while signed out. */
  session: Session | null;
  /** The signed-in user's profile row; null while signed out or still loading. */
  profile: Profile | null;
  /** True until the persisted session has been restored on launch. */
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  /** Resolves false when email confirmation is required before signing in. */
  signUpWithEmail: (
    email: string,
    password: string,
    username: string
  ) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = db.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    // Safety net: if the OAuth redirect arrives as a plain deep link (some
    // Android browsers) rather than through the auth session, consume it here.
    const linkSub = Linking.addEventListener('url', ({ url }) => {
      if (url.includes('auth-callback')) {
        createSessionFromUrl(url).catch(() => {});
      }
    });

    return () => {
      sub.subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    db.from('profiles')
      .select('id, username')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (!cancelled && data) setProfile(data as Profile);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const contextSignIn = useCallback(() => signInWithGoogle(), []);
  const contextSignOut = useCallback(() => signOut(), []);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        signInWithGoogle: contextSignIn,
        signInWithEmail,
        signUpWithEmail,
        signOut: contextSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
