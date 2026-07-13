import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Spot, getImageUrl } from '../lib/types';

function prettyCategory(category: string | null): string | null {
  if (!category) return null;
  return category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function SpotCard({
  spot,
  onPress,
}: {
  spot: Spot;
  onPress?: () => void;
}) {
  const image = getImageUrl(spot);
  const category = prettyCategory(spot.category);
  const tags = spot.tags ?? [];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <MapPin color="#94A3B8" size={32} />
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {spot.title}
          </Text>
          {category ? (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{category}</Text>
            </View>
          ) : null}
        </View>
        {spot.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {spot.description}
          </Text>
        ) : null}
        {tags.length > 0 ? (
          <Text style={styles.tags} numberOfLines={1}>
            {tags.map((t) => `#${t}`).join('  ')}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  image: { height: 170, width: '100%', backgroundColor: '#f0f0f0' },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  body: { padding: 14 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { fontWeight: '800', fontSize: 18, color: '#0F172A', flexShrink: 1 },
  categoryPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  categoryPillText: { color: '#0369A1', fontWeight: '700', fontSize: 12 },
  description: { color: '#475569', fontSize: 14, marginTop: 6, lineHeight: 20 },
  tags: { marginTop: 8, color: '#0EA5E9', fontSize: 13, fontWeight: '600' },
});
