// Type-ahead place search backed by Photon (OpenStreetMap) — free, no API key.
// Shows suggestions as you type; selecting one hands back coordinates.

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { Search, MapPin } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../theme/theme';

export type Place = {
  latitude: number;
  longitude: number;
  label: string;
};

type Props = {
  placeholder?: string;
  autoFocus?: boolean;
  onSelect: (place: Place) => void;
};

export default function PlaceSearch({ placeholder, autoFocus, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const search = async (q: string) => {
    const id = ++seq.current;
    setSearching(true);
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=en`
      );
      const json = await res.json();
      if (id !== seq.current) return; // a newer keystroke superseded this one
      const seen = new Set<string>();
      const places: Place[] = (json.features ?? [])
        .map((f: any) => {
          const p = f.properties ?? {};
          const label = [
            p.name,
            p.city && p.city !== p.name ? p.city : null,
            p.state && p.state !== p.name ? p.state : null,
            p.country,
          ]
            .filter(Boolean)
            .join(', ');
          return {
            latitude: f.geometry?.coordinates?.[1],
            longitude: f.geometry?.coordinates?.[0],
            label,
          };
        })
        .filter(
          (pl: Place) =>
            Number.isFinite(pl.latitude) &&
            Number.isFinite(pl.longitude) &&
            pl.label &&
            !seen.has(pl.label) &&
            seen.add(pl.label)
        );
      setSuggestions(places);
      setError(places.length === 0 ? 'No matches — try another spelling?' : null);
    } catch {
      if (id === seq.current) {
        setSuggestions([]);
        setError('Search failed — check your connection.');
      }
    } finally {
      if (id === seq.current) setSearching(false);
    }
  };

  const onChange = (text: string) => {
    setQuery(text);
    setError(null);
    if (timer.current) clearTimeout(timer.current);
    const q = text.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(() => search(q), 300);
  };

  const pick = (place: Place) => {
    setQuery(place.label);
    setSuggestions([]);
    setError(null);
    Keyboard.dismiss();
    onSelect(place);
  };

  return (
    <View>
      <View style={styles.inputWrap}>
        <Search color={colors.inkFaint} size={16} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={onChange}
          placeholder={placeholder ?? 'Search a city or place…'}
          placeholderTextColor={colors.inkFaint}
          autoFocus={autoFocus}
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => {
            if (suggestions.length > 0) pick(suggestions[0]);
          }}
        />
        {searching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>

      {suggestions.length > 0 ? (
        <View style={styles.list}>
          {suggestions.map((s, i) => (
            <TouchableOpacity
              key={s.label}
              style={[styles.row, i > 0 && styles.rowBorder]}
              onPress={() => pick(s)}
              activeOpacity={0.7}
            >
              <MapPin color={colors.primary} size={15} />
              <Text style={styles.rowText} numberOfLines={1}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSunken,
    height: 46,
  },
  input: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  list: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.ink,
  },
  error: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.accentInk,
    marginTop: spacing.sm,
  },
});
