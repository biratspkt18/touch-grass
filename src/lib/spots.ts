import supabase from '../components/Supabase';
import { Spot } from './types';

/**
 * Fetch all spots, newest first. Throws on a Supabase error so callers can
 * surface a message. Ordering by created_at is best-effort: if the column
 * doesn't exist we retry without it rather than failing the whole screen.
 */
export async function fetchSpots(): Promise<Spot[]> {
  let { data, error } = await supabase
    .from('Spots')
    .select('*')
    .order('created_at', { ascending: false });

  // Older schemas may not have a created_at column — degrade gracefully.
  if (error && /created_at/.test(error.message)) {
    ({ data, error } = await supabase.from('Spots').select('*'));
  }

  if (error) throw new Error(error.message);
  return (data as Spot[]) || [];
}
