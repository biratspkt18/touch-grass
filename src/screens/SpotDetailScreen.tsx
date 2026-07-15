import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, MapPin, Heart, MessageCircle, Send } from 'lucide-react-native';
import { Spot, getCoords, getImageUrls, authorName } from '../lib/types';
import { useAuth } from '../lib/auth';
import {
  SpotComment,
  fetchComments,
  addComment,
  deleteComment,
} from '../lib/comments';
import Avatar from '../components/Avatar';
import {
  colors,
  fonts,
  gradients,
  radius,
  shadow,
  spacing,
  relativeTime,
} from '../theme/theme';
import { categoryStyle } from '../theme/categoryIcons';

type ParamList = { SpotDetailScreen: { spot: Spot } };

export default function SpotDetailScreen() {
  const { params } = useRoute<RouteProp<ParamList, 'SpotDetailScreen'>>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { session, profile } = useAuth();
  const spot = params.spot;
  const images = getImageUrls(spot);
  const { width: windowWidth } = useWindowDimensions();
  const [photoIndex, setPhotoIndex] = useState(0);
  const coords = getCoords(spot);
  const cat = categoryStyle(spot.category);
  const tags = (spot.tags ?? []).filter(Boolean);
  const when = relativeTime(spot.created_at);
  const author = authorName(spot);

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

  // ── Comments ──────────────────────────────────────────────────────────────
  const [comments, setComments] = useState<SpotComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let cancelled = false;
    fetchComments(spot.id)
      .then((rows) => {
        if (!cancelled) setComments(rows);
      })
      .catch((e) => {
        if (!cancelled) setCommentError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoadingComments(false);
      });
    return () => {
      cancelled = true;
    };
  }, [spot.id]);

  const send = async () => {
    const content = draft.trim();
    if (!content || sending || !session) return;
    setSending(true);
    try {
      const created = await addComment(spot.id, session.user.id, content);
      // The embed can be momentarily missing right after signup; patch it in.
      if (!created.profiles && profile) {
        created.profiles = { username: profile.username };
      }
      setComments((prev) => [...prev, created]);
      setDraft('');
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } catch (e) {
      Alert.alert("Couldn't post that", (e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const confirmDelete = (comment: SpotComment) => {
    if (comment.user_id !== session?.user.id) return;
    Alert.alert('Delete comment?', 'This removes your comment for everyone.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(comment.id);
            setComments((prev) => prev.filter((c) => c.id !== comment.id));
          } catch (e) {
            Alert.alert('Error', (e as Error).message);
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={tabBarHeight}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroWrap}>
          {images.length > 0 ? (
            // Swipeable photo pager — spots carry up to 5 photos.
            <ScrollView
              style={styles.hero}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) =>
                setPhotoIndex(
                  Math.round(e.nativeEvent.contentOffset.x / windowWidth)
                )
              }
            >
              {images.map((uri) => (
                <Image
                  key={uri}
                  source={{ uri }}
                  style={{ width: windowWidth, height: '100%' }}
                  contentFit="cover"
                  transition={200}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.hero, styles.heroEmpty, { backgroundColor: cat.soft }]}>
              <cat.Icon color={cat.color} size={72} strokeWidth={1.4} />
            </View>
          )}
          <LinearGradient
            colors={gradients.heroScrim}
            style={styles.scrim}
            pointerEvents="none"
          />

          <View style={[styles.heroContent, { paddingTop: insets.top + 8 }]}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              style={styles.backButton}
            >
              <ChevronLeft color={colors.ink} size={24} />
            </Pressable>
          </View>

          <View style={styles.heroFooter} pointerEvents="none">
            {images.length > 1 ? (
              <View style={styles.photoDots}>
                {images.map((uri, i) => (
                  <View
                    key={uri}
                    style={[styles.photoDot, i === photoIndex && styles.photoDotActive]}
                  />
                ))}
              </View>
            ) : null}
            <View style={styles.categoryChip}>
              <cat.Icon color={cat.color} size={13} strokeWidth={2.4} />
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </View>
            <Text style={styles.heroTitle}>{spot.title}</Text>
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={styles.authorRow}>
            <Avatar name={author ?? 'early explorer'} size={40} />
            <View>
              <Text style={styles.author}>
                {author ? `@${author}` : 'Early explorer'}
              </Text>
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

          <View style={styles.commentsHeader}>
            <MessageCircle color={colors.primary} size={17} />
            <Text style={styles.commentsTitle}>
              Comments{comments.length > 0 ? ` (${comments.length})` : ''}
            </Text>
          </View>

          {loadingComments ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
          ) : commentError ? (
            <Text style={styles.commentsEmpty}>
              Couldn't load comments — is the backend schema up to date?
            </Text>
          ) : comments.length === 0 ? (
            <Text style={styles.commentsEmpty}>
              No comments yet. Been here? Say something nice. 🌿
            </Text>
          ) : (
            comments.map((c) => {
              const name = c.profiles?.username;
              const mine = c.user_id === session?.user.id;
              return (
                <Pressable
                  key={c.id}
                  onLongPress={() => confirmDelete(c)}
                  delayLongPress={400}
                  style={styles.comment}
                >
                  <Avatar name={name ?? 'explorer'} size={32} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentAuthor}>
                        {name ? `@${name}` : 'explorer'}
                        {mine ? ' (you)' : ''}
                      </Text>
                      <Text style={styles.commentTime}>
                        {relativeTime(c.created_at)}
                      </Text>
                    </View>
                    <Text style={styles.commentBody}>{c.content}</Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {session ? (
        <View style={[styles.composer, { paddingBottom: spacing.md }]}>
          <TextInput
            style={styles.composerInput}
            value={draft}
            onChangeText={setDraft}
            placeholder="Add a comment…"
            placeholderTextColor={colors.inkFaint}
            multiline
            maxLength={2000}
          />
          <Pressable
            onPress={send}
            disabled={!draft.trim() || sending}
            style={({ pressed }) => [
              styles.sendButton,
              (!draft.trim() || sending) && { opacity: 0.4 },
              pressed && { transform: [{ scale: 0.94 }] },
            ]}
          >
            <LinearGradient
              colors={gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendGradient}
            >
              <Send color="#fff" size={17} strokeWidth={2.2} />
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => navigation.navigate('You')}
          style={[styles.signInBar, { paddingBottom: spacing.md }]}
        >
          <Text style={styles.signInBarText}>
            🌱 Sign in to join the conversation
          </Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xl },
  heroWrap: { height: 340, justifyContent: 'flex-end' },
  hero: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceSunken,
  },
  heroEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoDots: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: spacing.sm,
  },
  photoDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  photoDotActive: {
    backgroundColor: '#FFFFFF',
    width: 16,
  },
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

  // Comments
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  commentsTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  commentsEmpty: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  comment: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.lg,
  },
  commentMeta: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  commentAuthor: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.ink },
  commentTime: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.inkFaint },
  commentBody: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.ink,
    marginTop: 2,
  },

  // Composer
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  composerInput: {
    flex: 1,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: 10,
    fontFamily: fonts.bodyMedium,
    fontSize: 14.5,
    color: colors.ink,
    backgroundColor: colors.bg,
  },
  sendButton: { borderRadius: radius.pill, ...shadow.soft },
  sendGradient: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInBar: {
    alignItems: 'center',
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  signInBarText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.primaryInk,
  },
});
