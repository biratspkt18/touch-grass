// Shared domain types for Touch Grass.

import { getImageUrl as resolveImagePath } from './storage';

export type SpotLocation = {
  latitude: number;
  longitude: number;
};

export type Spot = {
  id: number | string;
  title: string;
  description: string;
  category: string | null;
  tags: string[] | null;
  image_url: string[] | string | null;
  // Stored as JSON in the backend. Historically some rows used { lat, lng }
  // instead of { latitude, longitude } — `getCoords` normalises both.
  location: SpotLocation | { lat: number; lng: number } | null;
  created_at?: string;
  // Owner. Null on rows pinned before accounts existed.
  user_id?: string | null;
  // Embedded author profile when fetched with the rich select.
  profiles?: { username: string } | null;
  // Embedded comment count when fetched with the rich select.
  Comments?: { count: number }[];
};

/** The spot author's username, or null for pre-account (anonymous) spots. */
export function authorName(spot: Spot): string | null {
  return spot.profiles?.username ?? null;
}

/** Number of comments on the spot (0 when not fetched). */
export function commentCount(spot: Spot): number {
  return spot.Comments?.[0]?.count ?? 0;
}

/**
 * Normalise a spot's stored location into { latitude, longitude }, tolerating
 * the legacy { lat, lng } shape and top-level lat/lng columns. Returns null
 * when no valid coordinate pair is present.
 */
export function getCoords(spot: Spot): SpotLocation | null {
  const loc: any = spot.location;
  const candidates = [
    loc && { latitude: loc.latitude, longitude: loc.longitude },
    loc && { latitude: loc.lat, longitude: loc.lng },
    { latitude: (spot as any).lat, longitude: (spot as any).lng },
  ];
  for (const c of candidates) {
    if (!c) continue;
    const latitude = Number(c.latitude);
    const longitude = Number(c.longitude);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }
  }
  return null;
}

/**
 * First usable image URL for a spot, or null when there is none. Rows store
 * storage paths (legacy rows may hold full URLs); either way this returns a
 * renderable URL.
 */
export function getImageUrl(spot: Spot): string | null {
  return getImageUrls(spot)[0] ?? null;
}

/** All usable image URLs for a spot (spots carry up to 5 photos). */
export function getImageUrls(spot: Spot): string[] {
  const img = spot.image_url;
  const paths = Array.isArray(img) ? img : img ? [img] : [];
  return paths.filter(Boolean).map(resolveImagePath);
}
