// The feed: new posts near you. White chrome, photo-forward cards; when we
// know where you are, the closest fresh pins come first and each card says
// how far away it is.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Pressable,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Search, Compass } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import SpotCard from '../components/SpotCard';
import ProfileButton from '../components/ProfileButton';
import { fetchSpots } from '../lib/spots';
import { Spot, getCoords, SpotLocation } from '../lib/types';
import { distanceKm, formatDistance } from '../lib/geo';
import { isBackendConfigured } from '../lib/backend';
import { colors, fonts, radius, spacing } from '../theme/theme';
import { categoryStyle } from '../theme/categoryIcons';

const ALL = '__all__';

function FadeInItem({ index, children }: { index: number; children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay: Math.min(index, 8) * 55,
      useNativeDriver: true,
    }).start();
  }, [anim, index]);
  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(ALL);
  const [here, setHere] = useState<SpotLocation | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      setSpots(await fetchSpots());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Where the reader is. Uses the permission the map tab already asked for —
  // never prompts from the feed; without it the feed simply shows newest first.
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }));
        setHere({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } catch {
        // No fix — recency order is a fine fallback.
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    spots.forEach((s) => s.category && set.add(s.category));
    return Array.from(set).sort();
  }, [spots]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = spots.filter((s) => {
      if (activeCategory !== ALL && s.category !== activeCategory) return false;
      if (!q) return true;
      const hay = [
        s.title,
        s.description,
        ...(s.tags ?? []),
        s.category ?? '',
        s.profiles?.username ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
    if (!here) return matches; // newest first, as fetched
    return matches
      .map((spot) => {
        const coords = getCoords(spot);
        return { spot, km: coords ? distanceKm(here, coords) : Infinity };
      })
      .sort((a, b) => a.km - b.km)
      .map((x) => x.spot);
  }, [spots, query, activeCategory, here]);

  const distanceFor = useCallback(
    (spot: Spot) => {
      if (!here) return null;
      const coords = getCoords(spot);
      return coords ? formatDistance(distanceKm(here, coords)) : null;
    },
    [here]
  );

  const header = (
    <View>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Near you</Text>
            <Text style={styles.subtitle}>
              {here ? 'The closest fresh pins first' : 'The newest pins first'}
            </Text>
          </View>
          <ProfileButton />
        </View>

        <View style={styles.searchBar}>
          <Search color={colors.inkFaint} size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search spots, tags, vibes…"
            placeholderTextColor={colors.inkFaint}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
        </View>
      </View>

      {categories.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
          contentContainerStyle={styles.chipRowContent}
        >
          {[ALL, ...categories].map((cat) => {
            const active = cat === activeCategory;
            const meta = cat === ALL ? null : categoryStyle(cat);
            return (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[styles.chip, active && styles.chipActive]}
              >
                {meta ? (
                  <meta.Icon
                    size={14}
                    strokeWidth={2.2}
                    color={active ? colors.primaryInk : colors.inkMuted}
                  />
                ) : null}
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat === ALL ? 'All spots' : meta!.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {error ? (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Couldn't load spots</Text>
          <Text style={styles.noticeBody}>{error}</Text>
          {!isBackendConfigured ? (
            <Text style={styles.noticeBody}>
              No backend is configured. Copy .env.example to .env, fill in
              your project's values, and restart the dev server.
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Finding your spots…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item, index }) => (
          <FadeInItem index={index}>
            <SpotCard
              spot={item}
              distanceLabel={distanceFor(item)}
              onPress={() =>
                navigation.navigate('SpotDetailScreen', { spot: item })
              }
            />
          </FadeInItem>
        )}
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <View style={styles.emptyBadge}>
                <Compass color={colors.primary} size={34} strokeWidth={1.8} />
              </View>
              <Text style={styles.emptyTitle}>
                {spots.length === 0 ? 'No spots yet' : 'Nothing matches'}
              </Text>
              <Text style={styles.emptyBody}>
                {spots.length === 0
                  ? 'Tap the + button to pin your first place and start your map.'
                  : 'Try a different search or category.'}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { fontFamily: fonts.bodyMedium, color: colors.inkMuted, fontSize: 14 },
  topBar: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink },
  subtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
    color: colors.inkMuted,
    marginTop: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    height: 46,
    marginTop: spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  chipRow: { flexGrow: 0 },
  chipRowContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkMuted },
  chipTextActive: { color: colors.primaryInk },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
    flexGrow: 1,
  },
  notice: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
  },
  noticeTitle: {
    fontFamily: fonts.bodyBold,
    color: colors.accentInk,
    fontSize: 14,
    marginBottom: 4,
  },
  noticeBody: {
    fontFamily: fonts.body,
    color: colors.accentInk,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  empty: { alignItems: 'center', paddingHorizontal: spacing.xxl, paddingTop: spacing.huge },
  emptyBadge: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 6,
  },
});
