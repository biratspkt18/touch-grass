import React, { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { fetchSpots } from '../lib/spots';
import { Spot, getCoords } from '../lib/types';

export default function MapSpotsScreen() {
  const navigation = useNavigation<any>();
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
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text>Loading spots...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red' }}>Error: {error}</Text>
      </View>
    );
  }

  // Center on the average of pinned spots, else default to Melbourne.
  const located = spots
    .map((s) => ({ spot: s, coords: getCoords(s) }))
    .filter((x): x is { spot: Spot; coords: NonNullable<ReturnType<typeof getCoords>> } => !!x.coords);

  const initialRegion =
    located.length > 0
      ? {
          latitude:
            located.reduce((sum, x) => sum + x.coords.latitude, 0) /
            located.length,
          longitude:
            located.reduce((sum, x) => sum + x.coords.longitude, 0) /
            located.length,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }
      : {
          latitude: -37.8136,
          longitude: 144.9631,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        {located.map(({ spot, coords }) => (
          <Marker
            key={spot.id}
            coordinate={coords}
            title={spot.title}
            description={spot.description}
            onCalloutPress={() =>
              navigation.navigate('Feed', {
                screen: 'SpotDetailScreen',
                params: { spot },
              })
            }
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{spot.title}</Text>
                {spot.description ? (
                  <Text numberOfLines={2} style={styles.calloutBody}>
                    {spot.description}
                  </Text>
                ) : null}
                <Text style={styles.calloutLink}>Tap for details ›</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      {located.length === 0 ? (
        <View style={styles.emptyBanner}>
          <Text style={styles.emptyText}>
            No pinned spots yet. Add one from the Add tab.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  callout: { width: 200, padding: 4 },
  calloutTitle: { fontWeight: '700', fontSize: 15, color: '#0F172A' },
  calloutBody: { color: '#475569', fontSize: 13, marginTop: 2 },
  calloutLink: { color: '#0EA5E9', fontWeight: '600', fontSize: 13, marginTop: 6 },
  emptyBanner: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: { color: '#475569', fontSize: 14 },
});
