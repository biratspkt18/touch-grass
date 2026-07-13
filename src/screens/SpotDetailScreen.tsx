import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, MapPin, Heart } from 'lucide-react-native';
import { Spot, getCoords, getImageUrl } from '../lib/types';
import {
  colors,
  fonts,
  gradients,
  radius,
  shadow,
  spacing,
  categoryFace,
  relativeTime,
} from '../theme/theme';

type ParamList = { SpotDetailScreen: { spot: Spot } };

export default function SpotDetailScreen() {
  const { params } = useRoute<RouteProp<ParamList, 'SpotDetailScreen'>>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const spot = params.spot;
  const image = getImageUrl(spot);
  const coords = getCoords(spot);
  const face = categoryFace(spot.category);
  const tags = (spot.tags ?? []).filter(Boolean);
  const when = relativeTime(spot.created_at);

  const heartScale = useRef(new Animated.Value(1)).current;
  const [liked, setLiked] = useState(false);
  const toggleLike = () => {
    setLiked((v) => !v);
    heartScale.setValue(0.6);
    Animated.spring(heartScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 140,
    }).start();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          {image ? (
            <Image source={{ uri: image }} style={styles.hero} />
          ) : (
            <LinearGradient colors={gradients.brand} style={styles.hero}>
              <Text style={styles.heroEmoji}>{face.emoji}</Text>
            </LinearGradient>
          )}
          <LinearGradient colors={gradients.heroScrim} style={styles.scrim} />

          <View style={[styles.heroContent, { paddingTop: insets.top + 8 }]}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              style={styles.backButton}
            >
              <ChevronLeft color={colors.ink} size={24} />
            </Pressable>
          </View>

          <View style={styles.heroFooter}>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryEmoji}>{face.emoji}</Text>
              <Text style={styles.categoryLabel}>{face.label}</Text>
            </View>
            <Text style={styles.heroTitle}>{spot.title}</Text>
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🌱</Text>
            </View>
            <View>
              <Text style={styles.author}>You</Text>
              {when ? <Text style={styles.time}>Pinned {when}</Text> : null}
            </View>
            <View style={{ flex: 1 }} />
            <Pressable onPress={toggleLike} hitSlop={10} style={styles.likePill}>
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Heart
                  size={18}
                  color={liked ? '#fff' : colors.accent}
                  fill={liked ? '#fff' : 'transparent'}
                  strokeWidth={2}
                />
              </Animated.View>
              <Text style={[styles.likePillText, liked && { color: '#fff' }]}>
                {liked ? 'Loved' : 'Love'}
              </Text>
            </Pressable>
          </View>

          {spot.description ? (
            <Text style={styles.description}>{spot.description}</Text>
          ) : null}

          {tags.length > 0 ? (
            <View style={styles.tagRow}>
              {tags.map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>#{t}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {coords ? (
            <>
              <View style={styles.locationHeader}>
                <MapPin color={colors.primary} size={16} />
                <Text style={styles.locationText}>
                  {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                </Text>
              </View>
              <View style={styles.mapCard}>
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
              </View>
            </>
          ) : (
            <Text style={styles.noLocation}>No location saved for this spot.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.huge },
  heroWrap: { height: 340, justifyContent: 'flex-end' },
  hero: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceSunken,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEmoji: { fontSize: 72 },
  scrim: { ...StyleSheet.absoluteFillObject },
  heroContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.soft,
  },
  heroFooter: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: 10,
  },
  categoryEmoji: { fontSize: 13 },
  categoryLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink },
  heroTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 30,
    color: '#fff',
    lineHeight: 34,
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -20,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: { fontSize: 18 },
  author: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  time: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.inkFaint },
  likePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  likePillText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.accentInk },
  description: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 25,
    color: colors.ink,
    marginTop: spacing.xl,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.xl },
  tag: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  tagText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primaryInk },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  locationText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  mapCard: { borderRadius: radius.lg, overflow: 'hidden', ...shadow.soft },
  map: { width: '100%', height: 180 },
  noLocation: {
    fontFamily: fonts.body,
    color: colors.inkFaint,
    marginTop: spacing.xxl,
    fontStyle: 'italic',
  },
});
