// Backend config + client — the vendor seam.
//
// This file, auth.tsx and storage.ts are the only places in the app allowed
// to mention Supabase. Everything else talks to those wrappers (or to the
// data modules spots.ts / comments.ts, which use the `db` client exported
// here without knowing what powers it).
//
// Credentials come from .env (see .env.example) — never hardcoded.

import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const backendUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const backendKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** False until .env points the app at a real backend; screens show a hint. */
export const isBackendConfigured = !!backendUrl && !!backendKey;

/** Public storage bucket that holds every user photo. */
export const IMAGE_BUCKET = 'location-images';

/**
 * Base URL public image paths are resolved against. The database only ever
 * stores paths (e.g. "user-id/1720000000.jpg"); full URLs are built from
 * this single value.
 */
export const IMAGE_BASE_URL = `${backendUrl}/storage/v1/object/public/${IMAGE_BUCKET}`;

export const db = createClient(
  // A syntactically valid placeholder keeps an unconfigured app booting so it
  // can render the "connect your backend" hint instead of crashing at import.
  isBackendConfigured ? backendUrl : 'https://unconfigured.invalid',
  isBackendConfigured ? backendKey : 'unconfigured',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // Mobile OAuth returns via a deep link that auth.tsx exchanges
      // explicitly, so URL detection stays off and PKCE is used.
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  }
);

// Only refresh tokens while the app is foregrounded (vendor recommendation).
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    db.auth.startAutoRefresh();
  } else {
    db.auth.stopAutoRefresh();
  }
});
