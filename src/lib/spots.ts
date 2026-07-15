import { db } from './backend';
import { Spot, SpotLocation } from './types';

// Spots plus their author's username and how many comments they have.
const RICH_SELECT = '*, profiles(username), Comments(count)';

/**
 * Fetch all spots, newest first. Throws on a backend error so callers can
 * surface a message. Degrades gracefully on older backends: first drops the
 * profiles/Comments embeds (pre-social schema), then the created_at ordering.
 */
export async function fetchSpots(): Promise<Spot[]> {
  let { data, error } = await db
    .from('Spots')
    .select(RICH_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    ({ data, error } = await db
      .from('Spots')
      .select('*')
      .order('created_at', { ascending: false }));
  }
  if (error && /created_at/.test(error.message)) {
    ({ data, error } = await db.from('Spots').select('*'));
  }

  if (error) throw new Error(error.message);
  return (data as Spot[]) || [];
}

/** All spots pinned by one user, newest first (profile screen). */
export async function fetchSpotsByUser(userId: string): Promise<Spot[]> {
  let { data, error } = await db
    .from('Spots')
    .select(RICH_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    ({ data, error } = await db
      .from('Spots')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }));
  }

  if (error) throw new Error(error.message);
  return (data as Spot[]) || [];
}

export type NewSpot = {
  title: string;
  description: string;
  category: string | null;
  tags: string[];
  /** Storage paths (from storage.uploadImage) — never full URLs. */
  imagePaths: string[];
  location: SpotLocation;
  userId: string;
};

/** Pin a new spot as the signed-in user. */
export async function addSpot(spot: NewSpot): Promise<void> {
  const { error } = await db.from('Spots').insert([
    {
      title: spot.title,
      description: spot.description,
      category: spot.category,
      tags: spot.tags,
      image_url: spot.imagePaths,
      location: spot.location,
      user_id: spot.userId,
    },
  ]);
  if (error) throw new Error(error.message);
}

/** The category values the backend accepts (Add Spot dropdown). */
export async function fetchCategories(): Promise<string[]> {
  const { data, error } = await db.rpc('get_category_enum_values');
  if (error) throw new Error(error.message);
  return (data as string[]) || [];
}
