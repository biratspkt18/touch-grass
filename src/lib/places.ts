// Nearby points of interest (parks & co.) from OpenStreetMap's Overpass API —
// free, no API key, same data family as the Photon place search. The map
// screen shows these as "discover" markers alongside the user-pinned spots.

import { SpotLocation } from './types';

export type NearbyPlace = SpotLocation & {
  id: string;
  name: string;
  /** One of the app's spot categories, so map styling can be reused. */
  category: 'park' | 'nature' | 'viewpoint';
};

export type BoundingBox = {
  south: number;
  west: number;
  north: number;
  east: number;
};

// Don't query when the map shows more than ~this many degrees of latitude —
// Overpass would return a whole region's parks and the map would drown in dots.
export const MAX_LOOKUP_SPAN = 0.35;

const MAX_RESULTS = 60;

// OSM tag → app category. Only named features are requested; an unnamed
// "park" polygon is usually a grass verge, not somewhere to go.
const TAG_CATEGORY: Array<{ key: string; values: string[]; category: NearbyPlace['category'] }> = [
  { key: 'leisure', values: ['park', 'garden', 'dog_park', 'playground'], category: 'park' },
  { key: 'leisure', values: ['nature_reserve'], category: 'nature' },
  { key: 'natural', values: ['beach', 'waterfall'], category: 'nature' },
  { key: 'tourism', values: ['viewpoint'], category: 'viewpoint' },
];

function overpassQuery(bbox: BoundingBox): string {
  const box = `(${bbox.south},${bbox.west},${bbox.north},${bbox.east})`;
  const selectors = TAG_CATEGORY.flatMap(({ key, values }) => {
    const match = `["${key}"~"^(${values.join('|')})$"]["name"]`;
    return [`node${match}${box};`, `way${match}${box};`, `relation${match}${box};`];
  }).join('\n  ');
  // "out center" gives ways/relations a single centroid coordinate.
  return `[out:json][timeout:10];\n(\n  ${selectors}\n);\nout center ${MAX_RESULTS};`;
}

function categorize(tags: Record<string, string>): NearbyPlace['category'] | null {
  for (const { key, values, category } of TAG_CATEGORY) {
    if (values.includes(tags[key])) return category;
  }
  return null;
}

/**
 * Named parks, gardens, nature reserves, beaches and viewpoints inside the
 * bounding box. Results are capped at {@link MAX_RESULTS} and deduped by name
 * so multi-part features (a park mapped as several ways) appear once.
 */
export async function fetchNearbyPlaces(
  bbox: BoundingBox,
  signal?: AbortSignal
): Promise<NearbyPlace[]> {
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // Overpass's usage policy asks clients to identify themselves; their
      // frontend intermittently 406s generic/missing user agents.
      'User-Agent': 'touch-grass-app/1.0',
    },
    body: `data=${encodeURIComponent(overpassQuery(bbox))}`,
    signal,
  });
  if (!res.ok) throw new Error(`Nearby places lookup failed (${res.status})`);
  const json = await res.json();

  const seenNames = new Set<string>();
  const places: NearbyPlace[] = [];
  for (const el of json.elements ?? []) {
    const tags: Record<string, string> = el.tags ?? {};
    const name = tags.name;
    const category = name ? categorize(tags) : null;
    const latitude = el.lat ?? el.center?.lat;
    const longitude = el.lon ?? el.center?.lon;
    if (
      !category ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      seenNames.has(name)
    ) {
      continue;
    }
    seenNames.add(name);
    places.push({ id: `${el.type}/${el.id}`, name, category, latitude, longitude });
  }
  return places;
}
