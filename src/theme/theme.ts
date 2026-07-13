// Touch Grass design system.
// A committed green identity (the app is literally about going outside) warmed
// by a coral accent for playful, social moments. Backgrounds are a faintly
// green-tinted off-white — never cream. Rounding stays friendly but restrained.

import { Platform, TextStyle } from 'react-native';

export const colors = {
  // Surfaces
  bg: '#F3F7F1',
  surface: '#FFFFFF',
  surfaceSunken: '#ECF2EA',

  // Ink (text)
  ink: '#13231A',
  inkMuted: '#566356',
  inkFaint: '#8A968C',
  onPrimary: '#FFFFFF',

  // Brand green
  primary: '#16A34A',
  primaryDark: '#12833C',
  primaryPressed: '#0E6E33',
  primarySoft: '#E3F5E8',
  primaryInk: '#0B5D2C',

  // Warm coral accent — hearts, highlights, whimsy
  accent: '#FF6F52',
  accentSoft: '#FFE6DF',
  accentInk: '#B23A22',

  // Utility
  border: '#E4EBE2',
  borderStrong: '#D3DDD0',
  overlay: 'rgba(11, 22, 15, 0.55)',
  star: '#F5B301',
};

export const gradients = {
  brand: ['#3BC96D', '#12924A'] as const,
  brandDeep: ['#1BA453', '#0C7A38'] as const,
  // Bottom-up scrim so white text stays legible over any hero photo.
  heroScrim: ['rgba(10,20,14,0)', 'rgba(10,20,14,0.72)'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
};

export const fonts = {
  // Fredoka: rounded display for brand + headings (the whimsy).
  display: 'Fredoka_600SemiBold',
  displayBold: 'Fredoka_700Bold',
  displayMedium: 'Fredoka_500Medium',
  // Nunito: humanist body — pairs with Fredoka on the display/text axis.
  body: 'Nunito_400Regular',
  bodyMedium: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  bodyBlack: 'Nunito_800ExtraBold',
};

// Soft, single-layer shadows (never paired with a heavy border).
export const shadow = {
  card: {
    shadowColor: '#12341F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  soft: {
    shadowColor: '#12341F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  lifted: {
    shadowColor: '#0B3D1E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const type: Record<string, TextStyle> = {
  brand: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink },
  h1: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.ink },
  h2: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  h3: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  title: { fontFamily: fonts.bodyBlack, fontSize: 18, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 15, color: colors.inkMuted, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  meta: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.inkFaint },
};

// The 10 categories from schema.sql, each with a face.
export const categoryMeta: Record<string, { emoji: string; label: string }> = {
  food: { emoji: '🍜', label: 'Food' },
  cafe: { emoji: '☕️', label: 'Café' },
  bar: { emoji: '🍸', label: 'Bar' },
  park: { emoji: '🌳', label: 'Park' },
  nature: { emoji: '🏞️', label: 'Nature' },
  viewpoint: { emoji: '🌄', label: 'Viewpoint' },
  activity: { emoji: '🚵', label: 'Activity' },
  culture: { emoji: '🎭', label: 'Culture' },
  shopping: { emoji: '🛍️', label: 'Shopping' },
  other: { emoji: '📍', label: 'Other' },
};

export function categoryFace(category: string | null | undefined): {
  emoji: string;
  label: string;
} {
  if (!category) return { emoji: '📍', label: 'Spot' };
  return (
    categoryMeta[category] ?? {
      emoji: '📍',
      label: category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    }
  );
}

// "just now" · "5m" · "3h" · "2d" · "Mar 4" — social-feed style timestamps.
export function relativeTime(input?: string): string {
  if (!input) return '';
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 45) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const d = new Date(then);
  const month = d.toLocaleString('en', { month: 'short' });
  return `${month} ${d.getDate()}`;
}

export const hairline = Platform.select({ ios: 0.5, default: 1 }) as number;
