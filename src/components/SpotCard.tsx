import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { Heart, MessageCircle } from 'lucide-react-native';
import { Spot, getImageUrl, authorName, commentCount } from '../lib/types';
import Avatar from './Avatar';
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
}: {
  spot: Spot;
  onPress?: () => void;
}) {
  const image = getImageUrl(spot);
  const cat = categoryStyle(spot.category);
  const tags = (spot.tags ?? []).filter(Boolean);
  const when = relativeTime(spot.created_at);
  const author = authorName(spot);
  const comments = commentCount(spot);

  const scale = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const [liked, setLiked] = useState(false);

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 40 }).start();
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

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
        <View style={styles.media}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} transition={200} />
          ) : (
            <View style={[styles.image, { backgroundColor: cat.soft }]}>
              <cat.Icon color={cat.color} size={52} strokeWidth={1.6} />
            </View>
          )}
          <View style={styles.categoryChip}>
            <cat.Icon color={cat.color} size={13} strokeWidth={2.4} />
            <Text style={styles.categoryLabel}>{cat.label}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.authorRow}>
            <Avatar name={author ?? 'early explorer'} size={26} />
            <Text style={styles.author}>
              {author ? `@${author}` : 'Early explorer'}
            </Text>
            {when ? <Text style={styles.dot}>·</Text> : null}
            {when ? <Text style={styles.time}>{when}</Text> : null}
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {spot.title}
          </Text>
          {spot.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {spot.description}
            </Text>
          ) : null}

          {tags.length > 0 ? (
            <View style={styles.tagRow}>
              {tags.slice(0, 3).map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>#{t}</Text>
                </View>
              ))}
              {tags.length > 3 ? (
                <Text style={styles.moreTags}>+{tags.length - 3}</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.footer}>
            <Pressable
              onPress={toggleLike}
              hitSlop={10}
              style={styles.likeButton}
            >
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Heart
                  size={20}
                  color={liked ? colors.accent : colors.inkFaint}
                  fill={liked ? colors.accent : 'transparent'}
                  strokeWidth={2}
                />
              </Animated.View>
              <Text style={[styles.likeText, liked && { color: colors.accent }]}>
                {liked ? 'Loved' : 'Love it'}
              </Text>
            </Pressable>
            <View style={styles.commentHint}>
              <MessageCircle size={18} color={colors.inkFaint} strokeWidth={2} />
              <Text style={styles.commentHintText}>
                {comments > 0 ? comments : 'Comment'}
              </Text>
            </View>
            <Text style={styles.readMore}>Read ›</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  media: { position: 'relative' },
  image: {
    height: 200,
    width: '100%',
    backgroundColor: colors.surfaceSunken,
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
    ...shadow.soft,
  },
  categoryLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink },
  body: { padding: spacing.lg },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  author: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.ink },
  dot: { color: colors.inkFaint, fontFamily: fonts.bodyBold },
  time: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.inkFaint },
  title: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink },
  description: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.inkMuted,
    marginTop: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tag: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  tagText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primaryInk },
  moreTags: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.inkFaint },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  likeButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkFaint },
  commentHint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentHintText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkFaint },
  readMore: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primary },
});
