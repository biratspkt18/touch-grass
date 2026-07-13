// Shared domain types for Touch Grass.

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
  // Stored as JSON in Supabase. Historically some rows used { lat, lng }
  // instead of { latitude, longitude } — `getCoords` normalises both.
  location: SpotLocation | { lat: number; lng: number } | null;
  created_at?: string;
};

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

/** First usable image URL for a spot, or null when there is none. */
export function getImageUrl(spot: Spot): string | null {
  const img = spot.image_url;
  if (Array.isArray(img)) return img.find((u) => !!u) ?? null;
  return img || null;
}
