// supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Prefer environment configuration (EXPO_PUBLIC_* is bundled by Expo and
// readable at runtime). Falls back to the original project values so existing
// setups keep working. NOTE: the original hardcoded project below is no longer
// reachable — set EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY in a
// .env file (see .env.example) to point the app at a live Supabase backend.
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  'https://ugljlhyggvclslvioeii.supabase.co'
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbGpsaHlnZ3ZjbHNsdmlvZWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTkwNTYsImV4cCI6MjA2ODEzNTA1Nn0.NMhOKDTLSYlWWukSfvJ3HviBQSDQNiu7XlpNYe_5KqA'

// True when the app is still using the built-in (dead) demo project rather than
// a configured backend. Screens use this to show a helpful setup hint.
export const isUsingDefaultBackend = !process.env.EXPO_PUBLIC_SUPABASE_URL

const supabase = createClient(supabaseUrl, supabaseKey)
export default supabase;
