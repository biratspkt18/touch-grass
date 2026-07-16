// Feed card, Airbnb grammar: a rounded photo carries the card, text sits
// quietly below it. The heart floats on the photo; category rides as a small
// white pill. No box, no border — the photo is the card.

import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { Heart } from 'lucide-react-native';
import { Spot, getImageUrl, authorName, commentCount } from '../lib/types';
import {
  colors,
  fonts,
  radius,
  shadow,
  spacing,
  relativeTime,
} from '../theme/theme';
import { categoryStyle } from '../theme/categoryIcons';

export default function SpotCard({
  spot,
  onPress,
  distanceLabel,
}: {
  spot: Spot;
  onPress?: () => void;
  /** e.g. "2.4 km away" — shown when the viewer's location is known. */
  distanceLabel?: string | null;
}) {
  const image = getImageUrl(spot);
  const cat = categoryStyle(spot.category);
  const when = relativeTime(spot.created_at);
  const author = authorName(spot);
  const comments = commentCount(spot);

  const scale = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const [liked, setLiked] = useState(false);

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

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

  const metaParts = [
    author ? `@${author}` : 'early explorer',
    when,
    comments > 0 ? `${comments} ${comments === 1 ? 'comment' : 'comments'}` : null,
  ].filter(Boolean);

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
        <View style={styles.media}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} transition={200} />
          ) : (
            <View style={[styles.image, styles.imageEmpty, { backgroundColor: cat.soft }]}>
              <cat.Icon color={cat.color} size={48} strokeWidth={1.6} />
            </View>
          )}
          <View style={styles.categoryChip}>
            <cat.Icon color={colors.inkMuted} size={12} strokeWidth={2.4} />
            <Text style={styles.categoryLabel}>{cat.label}</Text>
          </View>
          <Pressable
            onPress={toggleLike}
            hitSlop={10}
            style={styles.heartButton}
            accessibilityLabel={liked ? 'Unlike' : 'Like'}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Heart
                size={18}
                color={liked ? colors.accent : colors.ink}
                fill={liked ? colors.accent : 'transparent'}
                strokeWidth={2.2}
              />
            </Animated.View>
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {spot.title}
            </Text>
            {distanceLabel ? (
              <Text style={styles.distance}>{distanceLabel}</Text>
            ) : null}
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {metaParts.join(' · ')}
          </Text>
          {spot.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {spot.description}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.xxl,
  },
  media: { position: 'relative' },
  image: {
    height: 230,
    width: '100%',
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSunken,
  },
  imageEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChip: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  categoryLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink },
  heartButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.soft,
  },
  body: { paddingTop: spacing.md, paddingHorizontal: 2 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    flex: 1,
    fontFamily: fonts.bodyBlack,
    fontSize: 16.5,
    color: colors.ink,
  },
  distance: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.inkMuted,
  },
  meta: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
    marginTop: 6,
  },
});
