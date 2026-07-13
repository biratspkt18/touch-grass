import React, { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { fetchSpots } from '../lib/spots';
import { Spot, getCoords } from '../lib/types';
import { colors, fonts, radius, shadow, spacing, categoryFace } from '../theme/theme';

export default function MapSpotsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
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

  const initialRegion =
    located.length > 0
      ? {
          latitude:
            located.reduce((sum, x) => sum + x.coords.latitude, 0) / located.length,
          longitude:
            located.reduce((sum, x) => sum + x.coords.longitude, 0) / located.length,
          latitudeDelta: 0.25,
          longitudeDelta: 0.25,
        }
      : { latitude: -37.8136, longitude: 144.9631, latitudeDelta: 0.1, longitudeDelta: 0.1 };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion}>
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

      {located.length === 0 ? (
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
