import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Search, X, Trees } from 'lucide-react-native';
import { fetchSpots } from '../lib/spots';
import { fetchNearbyPlaces, NearbyPlace, MAX_LOOKUP_SPAN } from '../lib/places';
import { Spot, getCoords } from '../lib/types';
import { loadStartRegion, saveStartRegion, WORLD_REGION } from '../lib/startRegion';
import PlaceSearch, { Place } from '../components/PlaceSearch';
import { colors, fonts, radius, shadow, spacing } from '../theme/theme';
import { categoryStyle } from '../theme/categoryIcons';

type LocatedSpot = { spot: Spot; coords: { latitude: number; longitude: number } };
type SpotCluster = { key: string; coords: { latitude: number; longitude: number }; items: LocatedSpot[] };

// Group spots into grid cells sized relative to the visible region, so pins
// that would overlap at the current zoom merge into one numbered bubble.
// Zooming in shrinks the cells until every spot stands alone again.
function clusterSpots(located: LocatedSpot[], region: Region): SpotCluster[] {
  const cellLat = region.latitudeDelta / 7;
  const cellLng = region.longitudeDelta / 7;
  const cells = new Map<string, LocatedSpot[]>();
  for (const item of located) {
    const key = `${Math.floor(item.coords.latitude / cellLat)}:${Math.floor(
      item.coords.longitude / cellLng
    )}`;
    const bucket = cells.get(key);
    if (bucket) bucket.push(item);
    else cells.set(key, [item]);
  }
  return [...cells.entries()].map(([key, items]) => ({
    key,
    items,
    coords: {
      latitude: items.reduce((s, x) => s + x.coords.latitude, 0) / items.length,
      longitude: items.reduce((s, x) => s + x.coords.longitude, 0) / items.length,
    },
  }));
}

export default function MapSpotsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Where the map starts: your location if allowed, else the city you picked
  // last time (persisted), else a "pick a city" card.
  const [center, setCenter] = useState<Region | null>(null);
  const [resolvingLocation, setResolvingLocation] = useState(true);
  const [askCity, setAskCity] = useState(false);

  // Parks & nature from OpenStreetMap for the visible area ("discover" layer).
  const [nearby, setNearby] = useState<NearbyPlace[]>([]);
  const [showNearby, setShowNearby] = useState(true);
  const [viewRegion, setViewRegion] = useState<Region | null>(null);

  const load = useCallback(async () => {
    try {
      setSpots(await fetchSpots());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    (async () => {
      try {
        const saved = await loadStartRegion();
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          try {
            // Last known fix is instant; fall back to a fresh read if absent.
            const last = await Location.getLastKnownPositionAsync();
            const pos =
              last ??
              (await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              }));
            setCenter({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            });
            return;
          } catch {
            // GPS unavailable — fall through to the saved city.
          }
        }
        if (saved) {
          setCenter(saved);
        } else {
          setAskCity(true);
        }
      } finally {
        setResolvingLocation(false);
      }
    })();
  }, []);

  const chooseCity = (place: Place) => {
    const region: Region = {
      latitude: place.latitude,
      longitude: place.longitude,
      latitudeDelta: 0.12,
      longitudeDelta: 0.12,
    };
    setCenter(region);
    setViewRegion(region);
    setAskCity(false);
    saveStartRegion(region);
  };

  const located = spots
    .map((s) => ({ spot: s, coords: getCoords(s) }))
    .filter(
      (x): x is { spot: Spot; coords: NonNullable<ReturnType<typeof getCoords>> } =>
        !!x.coords
    );

  const spotsRegion: Region | null =
    located.length > 0
      ? {
          latitude:
            located.reduce((sum, x) => sum + x.coords.latitude, 0) / located.length,
          longitude:
            located.reduce((sum, x) => sum + x.coords.longitude, 0) / located.length,
          latitudeDelta: 0.25,
          longitudeDelta: 0.25,
        }
      : null;

  const initialRegion = center ?? spotsRegion ?? WORLD_REGION;

  // What the user currently sees: their pans/zooms once they move the map,
  // the starting region before that (and nothing while it's still resolving).
  const lookupRegion =
    viewRegion ?? (loading || resolvingLocation ? null : initialRegion);
  const zoomedOut = !!lookupRegion && lookupRegion.latitudeDelta > MAX_LOOKUP_SPAN;

  useEffect(() => {
    if (!showNearby || !lookupRegion || zoomedOut) {
      setNearby([]);
      return;
    }
    const controller = new AbortController();
    // Debounced so panning doesn't fire a request per frame.
    const timer = setTimeout(async () => {
      try {
        setNearby(
          await fetchNearbyPlaces(
            {
              south: lookupRegion.latitude - lookupRegion.latitudeDelta / 2,
              north: lookupRegion.latitude + lookupRegion.latitudeDelta / 2,
              west: lookupRegion.longitude - lookupRegion.longitudeDelta / 2,
              east: lookupRegion.longitude + lookupRegion.longitudeDelta / 2,
            },
            controller.signal
          )
        );
      } catch {
        // Lookup is best-effort decoration; keep whatever is already shown.
      }
    }, 600);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    showNearby,
    zoomedOut,
    lookupRegion?.latitude,
    lookupRegion?.longitude,
    lookupRegion?.latitudeDelta,
  ]);

  if (loading || resolvingLocation) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.centerText}>Loading the map…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Couldn't load spots: {error}</Text>
      </View>
    );
  }

  // Remount the map when the chosen center changes so it actually re-centers.
  const mapKey = `${initialRegion.latitude.toFixed(4)},${initialRegion.longitude.toFixed(4)}`;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        key={mapKey}
        style={styles.map}
        initialRegion={initialRegion}
        onRegionChangeComplete={setViewRegion}
        showsUserLocation
      >
        {showNearby
          ? nearby.map((place) => {
              const cat = categoryStyle(place.category);
              return (
                <Marker
                  key={place.id}
                  coordinate={place}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                >
                  <View style={[styles.poiDot, { backgroundColor: cat.color }]} />
                  <Callout tooltip>
                    <View style={styles.callout}>
                      <Text style={styles.calloutTitle} numberOfLines={1}>
                        {place.name}
                      </Text>
                      <Text style={styles.calloutBody}>
                        {cat.label} · via OpenStreetMap
                      </Text>
                      <Text style={styles.calloutLink}>
                        Been here? Pin it with the + button
                      </Text>
                    </View>
                  </Callout>
                </Marker>
              );
            })
          : null}
        {clusterSpots(located, lookupRegion ?? initialRegion).map((cluster) => {
          if (cluster.items.length > 1) {
            return (
              <Marker
                key={cluster.key}
                coordinate={cluster.coords}
                anchor={{ x: 0.5, y: 0.5 }}
                onPress={() => {
                  const current = lookupRegion ?? initialRegion;
                  mapRef.current?.animateToRegion(
                    {
                      ...cluster.coords,
                      latitudeDelta: current.latitudeDelta / 4,
                      longitudeDelta: current.longitudeDelta / 4,
                    },
                    350
                  );
                }}
              >
                <View style={styles.clusterBubble}>
                  <Text style={styles.clusterCount}>{cluster.items.length}</Text>
                </View>
              </Marker>
            );
          }
          const { spot, coords } = cluster.items[0];
          const cat = categoryStyle(spot.category);
          return (
            <Marker
              key={spot.id}
              coordinate={coords}
              pinColor={cat.color}
              onCalloutPress={() =>
                navigation.navigate('Feed', {
                  screen: 'SpotDetailScreen',
                  params: { spot },
                })
              }
            >
              <Callout tooltip>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle} numberOfLines={1}>
                    {spot.title}
                  </Text>
                  {spot.description ? (
                    <Text numberOfLines={2} style={styles.calloutBody}>
                      {spot.description}
                    </Text>
                  ) : null}
                  <Text style={styles.calloutLink}>Tap to open ›</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>Your map 🗺️</Text>
          <Text style={styles.topSubtitle}>
            {located.length > 0
              ? `${located.length} ${located.length === 1 ? 'spot' : 'spots'} pinned`
              : 'No spots pinned yet'}
            {showNearby && zoomedOut ? ' · zoom in for parks' : ''}
            {showNearby && !zoomedOut && nearby.length > 0
              ? ` · ${nearby.length} green ${nearby.length === 1 ? 'spot' : 'spots'} nearby`
              : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.cityButton, showNearby && styles.nearbyButtonOn]}
          onPress={() => setShowNearby((v) => !v)}
          hitSlop={8}
          accessibilityLabel={showNearby ? 'Hide nearby parks' : 'Show nearby parks'}
        >
          <Trees color={showNearby ? '#FFFFFF' : colors.ink} size={19} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cityButton}
          onPress={() => setAskCity((v) => !v)}
          hitSlop={8}
          accessibilityLabel="Change city"
        >
          {askCity ? (
            <X color={colors.ink} size={19} />
          ) : (
            <Search color={colors.ink} size={19} />
          )}
        </TouchableOpacity>
      </View>

      {askCity ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.cityCardWrap}
          pointerEvents="box-none"
        >
          <View style={styles.cityCard}>
            <Text style={styles.cityTitle}>Where should we start? 🧭</Text>
            <Text style={styles.cityBody}>
              Type a city or place — suggestions appear as you go.
            </Text>
            <View style={{ marginTop: spacing.lg }}>
              <PlaceSearch
                placeholder="e.g. Melbourne, Tokyo, Kathmandu"
                onSelect={chooseCity}
              />
            </View>
            {spotsRegion || center ? (
              <TouchableOpacity onPress={() => setAskCity(false)} hitSlop={8}>
                <Text style={styles.citySkip}>
                  {center ? 'Never mind' : 'Just show my pins'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      ) : null}

      {located.length === 0 && !askCity ? (
        <View style={styles.emptyBanner}>
          <Text style={styles.emptyText}>
            Pin your first place with the + button and it'll land right here. 📍
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    gap: 12,
  },
  centerText: { fontFamily: fonts.bodyMedium, color: colors.inkMuted },
  errorText: {
    fontFamily: fonts.bodyMedium,
    color: colors.accentInk,
    paddingHorizontal: spacing.xxl,
    textAlign: 'center',
  },
  callout: {
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow.card,
  },
  calloutTitle: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink },
  calloutBody: {
    fontFamily: fonts.body,
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  calloutLink: {
    fontFamily: fonts.bodyBold,
    color: colors.primary,
    fontSize: 13,
    marginTop: 8,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  topTitle: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink },
  topSubtitle: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.inkMuted },
  cityButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    ...shadow.soft,
  },
  nearbyButtonOn: {
    backgroundColor: colors.primary,
  },
  clusterBubble: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.soft,
  },
  clusterCount: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  poiDot: {
    width: 16,
    height: 16,
    borderRadius: radius.pill,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    ...shadow.soft,
  },
  cityCardWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  cityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadow.lifted,
  },
  cityTitle: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink },
  cityBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
    marginTop: 4,
  },
  citySkip: {
    fontFamily: fonts.bodyBold,
    fontSize: 13.5,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  emptyBanner: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  emptyText: {
    fontFamily: fonts.bodyMedium,
    color: colors.inkMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
