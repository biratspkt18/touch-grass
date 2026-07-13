import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { RouteProp, useRoute } from '@react-navigation/native';
import { MapPin, Tag as TagIcon } from 'lucide-react-native';
import { Spot, getCoords, getImageUrl } from '../lib/types';

type ParamList = { SpotDetailScreen: { spot: Spot } };

function prettyCategory(category: string | null): string | null {
  if (!category) return null;
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function SpotDetailScreen() {
  const { params } = useRoute<RouteProp<ParamList, 'SpotDetailScreen'>>();
  const spot = params.spot;
  const image = getImageUrl(spot);
  const coords = getCoords(spot);
  const category = prettyCategory(spot.category);
  const tags = spot.tags ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {image ? (
          <Image source={{ uri: image }} style={styles.hero} />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]}>
            <MapPin color="#94A3B8" size={40} />
          </View>
        )}

        <Text style={styles.title}>{spot.title}</Text>

        {category ? (
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{category}</Text>
          </View>
        ) : null}

        {spot.description ? (
          <Text style={styles.description}>{spot.description}</Text>
        ) : null}

        {tags.length > 0 ? (
          <View style={styles.tagRow}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <TagIcon color="#0EA5E9" size={12} />
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {coords ? (
          <>
            <View style={styles.locationHeader}>
              <MapPin color="#334155" size={16} />
              <Text style={styles.locationText}>
                {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
              </Text>
            </View>
            <MapView
              style={styles.map}
              pointerEvents="none"
              initialRegion={{
                latitude: coords.latitude,
                longitude: coords.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
            >
              <Marker coordinate={coords} title={spot.title} />
            </MapView>
          </>
        ) : (
          <Text style={styles.noLocation}>No location saved for this spot.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  hero: { width: '100%', height: 240, borderRadius: 16, backgroundColor: '#f0f0f0' },
  heroPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '800', marginTop: 16, color: '#0F172A' },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 10,
  },
  categoryPillText: { color: '#0369A1', fontWeight: '700', fontSize: 13 },
  description: { fontSize: 16, lineHeight: 24, color: '#334155', marginTop: 16 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tagText: { color: '#0F172A', fontSize: 13 },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    marginBottom: 8,
  },
  locationText: { color: '#334155', fontSize: 14, fontWeight: '600' },
  map: { width: '100%', height: 180, borderRadius: 16 },
  noLocation: { color: '#94A3B8', marginTop: 24, fontStyle: 'italic' },
});
