import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Search } from 'lucide-react-native';
import { fetchSpots } from '../lib/spots';
import { Spot, getCoords } from '../lib/types';
import { colors, fonts, radius, shadow, spacing, categoryFace } from '../theme/theme';

// Zoomed-out neutral view used only while no better center exists.
const WORLD_REGION: Region = {
  latitude: 20,
  longitude: 0,
  latitudeDelta: 100,
  longitudeDelta: 100,
};

export default function MapSpotsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Where the map should start: your location if you allow it, else the city
  // you type, else wherever your pins are.
  const [center, setCenter] = useState<Region | null>(null);
  const [resolvingLocation, setResolvingLocation] = useState(true);
  const [askCity, setAskCity] = useState(false);
  const [city, setCity] = useState('');
  const [cityError, setCityError] = useState<string | null>(null);
  const [searchingCity, setSearchingCity] = useState(false);

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
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
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
        } else {
          setAskCity(true);
        }
      } catch {
        setAskCity(true);
      } finally {
        setResolvingLocation(false);
      }
    })();
  }, []);

  const submitCity = async () => {
    const q = city.trim();
    if (!q) return;
    setSearchingCity(true);
    setCityError(null);
    try {
      const results = await Location.geocodeAsync(q);
      if (results.length > 0) {
        setCenter({
          latitude: results[0].latitude,
          longitude: results[0].longitude,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        });
        setAskCity(false);
      } else {
        setCityError("Couldn't find that place — try another spelling?");
      }
    } catch {
      setCityError('Search failed — check your connection and try again.');
    } finally {
      setSearchingCity(false);
    }
  };

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
  // Remount the map when the chosen center changes so it actually re-centers.
  const mapKey = `${initialRegion.latitude.toFixed(4)},${initialRegion.longitude.toFixed(4)}`;

  return (
    <View style={styles.container}>
      <MapView
        key={mapKey}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
      >
        {located.map(({ spot, coords }) => {
          const face = categoryFace(spot.category);
          return (
            <Marker
              key={spot.id}
              coordinate={coords}
              onCalloutPress={() =>
                navigation.navigate('Feed', {
                  screen: 'SpotDetailScreen',
                  params: { spot },
                })
              }
            >
              <View style={styles.pin}>
                <Text style={styles.pinEmoji}>{face.emoji}</Text>
                <View style={styles.pinTail} />
              </View>
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
        <Text style={styles.topTitle}>Your map 🗺️</Text>
        <Text style={styles.topSubtitle}>
          {located.length > 0
            ? `${located.length} ${located.length === 1 ? 'spot' : 'spots'} pinned`
            : 'No spots pinned yet'}
        </Text>
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
              Location is off, no worries — type a city and we'll take you there.
            </Text>
            <View style={styles.cityRow}>
              <View style={styles.cityInputWrap}>
                <Search color={colors.inkFaint} size={16} />
                <TextInput
                  style={styles.cityInput}
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Melbourne, Tokyo, Kathmandu"
                  placeholderTextColor={colors.inkFaint}
                  returnKeyType="search"
                  onSubmitEditing={submitCity}
                  autoCapitalize="words"
                />
              </View>
              <TouchableOpacity
                style={[styles.cityGo, searchingCity && { opacity: 0.6 }]}
                onPress={submitCity}
                disabled={searchingCity}
                activeOpacity={0.85}
              >
                {searchingCity ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.cityGoText}>Go</Text>
                )}
              </TouchableOpacity>
            </View>
            {cityError ? <Text style={styles.cityError}>{cityError}</Text> : null}
            {spotsRegion ? (
              <TouchableOpacity onPress={() => setAskCity(false)} hitSlop={8}>
                <Text style={styles.citySkip}>Just show my pins</Text>
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
  pin: {
    alignItems: 'center',
  },
  pinEmoji: {
    fontSize: 20,
    width: 42,
    height: 42,
    textAlign: 'center',
    lineHeight: 42,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadow.soft,
  },
  pinTail: {
    width: 3,
    height: 8,
    backgroundColor: colors.primary,
    marginTop: -1,
    borderRadius: 2,
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
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  topTitle: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink },
  topSubtitle: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.inkMuted },
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
  cityRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cityInputWrap: {
    flex: 1,
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
  cityInput: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  cityGo: {
    width: 60,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityGoText: { fontFamily: fonts.bodyBlack, fontSize: 15, color: '#fff' },
  cityError: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.accentInk,
    marginTop: spacing.sm,
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
