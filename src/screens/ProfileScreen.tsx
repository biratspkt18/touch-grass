// The "You" tab. Signed out it's the join/sign-in form; signed in it's your
// profile: identity card, the spots you've pinned, and sign out.

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LogOut, MapPin } from 'lucide-react-native';
import { useAuth } from '../lib/auth';
import { fetchSpotsByUser } from '../lib/spots';
import { Spot, commentCount } from '../lib/types';
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

export default function ProfileScreen() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return session ? <ProfileView /> : <AuthView />;
}

// ── Signed out: sign in with Google or email ────────────────────────────────

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

function AuthView() {
  const insets = useSafeAreaInsets();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState<'google' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submitGoogle = async () => {
    if (busy) return;
    setError(null);
    setNotice(null);
    setBusy('google');
    try {
      await signInWithGoogle();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const submitEmail = async () => {
    if (busy) return;
    setError(null);
    setNotice(null);
    if (!email.trim() || !password) {
      setError('Fill in your email and password first.');
      return;
    }
    if (mode === 'signup' && !USERNAME_RE.test(username)) {
      setError('Usernames are 3–20 letters, numbers or underscores.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Passwords need at least 6 characters.');
      return;
    }
    setBusy('email');
    try {
      if (mode === 'signup') {
        const signedIn = await signUpWithEmail(email, password, username);
        if (!signedIn) {
          setNotice(
            'Almost in! Check your inbox for a confirmation link, then sign in here.'
          );
          setMode('signin');
        }
      } else {
        await signInWithEmail(email, password);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const signup = mode === 'signup';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <Text style={styles.headerTitle}>Join the club 🌱</Text>
        <Text style={styles.headerSubtitle}>
          An account puts your name on your spots — and in the conversation.
        </Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.authBody}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.authEmoji}>🌿</Text>
          <Text style={styles.authTitle}>
            {signup ? 'Pick a name, plant a flag' : 'Good to see you'}
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={submitGoogle}
            disabled={!!busy}
            style={styles.submitWrap}
          >
            <LinearGradient
              colors={gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.submit, busy === 'google' && { opacity: 0.7 }]}
            >
              <Text style={styles.submitText}>
                {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {signup ? (
            <TextInput
              style={styles.authInput}
              value={username}
              onChangeText={setUsername}
              placeholder="Username (e.g. grass_toucher)"
              placeholderTextColor={colors.inkFaint}
              autoCapitalize="none"
              autoCorrect={false}
            />
          ) : null}
          <TextInput
            style={styles.authInput}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.inkFaint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={styles.authInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.inkFaint}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={signup ? 'new-password' : 'current-password'}
            returnKeyType="go"
            onSubmitEditing={submitEmail}
          />

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={submitEmail}
            disabled={!!busy}
            style={[styles.emailSubmit, busy === 'email' && { opacity: 0.7 }]}
          >
            <Text style={styles.emailSubmitText}>
              {busy === 'email'
                ? signup
                  ? 'Creating account…'
                  : 'Signing in…'
                : signup
                  ? 'Create account'
                  : 'Sign in'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setMode(signup ? 'signin' : 'signup');
              setError(null);
              setNotice(null);
            }}
            hitSlop={8}
          >
            <Text style={styles.modeToggle}>
              {signup
                ? 'Already have an account? Sign in'
                : 'New here? Create an account'}
            </Text>
          </TouchableOpacity>

          {notice ? (
            <Text style={styles.notice}>{notice}</Text>
          ) : null}
          {error ? (
            <Text style={[styles.error, { textAlign: 'center' }]}>{error}</Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Signed in: profile + your spots ────────────────────────────────────────

function ProfileView() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { session, profile, signOut } = useAuth();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loadingSpots, setLoadingSpots] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = session!.user.id;
  const username = profile?.username ?? 'explorer';

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      fetchSpotsByUser(userId)
        .then((rows) => {
          if (!cancelled) {
            setSpots(rows);
            setError(null);
          }
        })
        .catch((e) => {
          if (!cancelled) setError((e as Error).message);
        })
        .finally(() => {
          if (!cancelled) setLoadingSpots(false);
        });
      return () => {
        cancelled = true;
      };
    }, [userId])
  );

  const header = (
    <View>
      <LinearGradient
        colors={gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={styles.identityRow}>
          <Avatar name={username} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={styles.identityName}>@{username}</Text>
            <Text style={styles.identityEmail}>{session!.user.email}</Text>
          </View>
          <Pressable
            onPress={signOut}
            hitSlop={8}
            style={styles.signOutButton}
            accessibilityLabel="Sign out"
          >
            <LogOut color="#fff" size={18} />
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your spots</Text>
        <Text style={styles.sectionCount}>{spots.length}</Text>
      </View>

      {error ? <Text style={[styles.error, { marginHorizontal: spacing.xl }]}>{error}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={spots}
        keyExtractor={(s) => String(s.id)}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: spacing.huge }}
        renderItem={({ item }) => <MySpotRow spot={item} navigation={navigation} />}
        ListEmptyComponent={
          loadingSpots ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🗺️</Text>
              <Text style={styles.emptyTitle}>No spots yet</Text>
              <Text style={styles.emptyBody}>
                Hit the + button and pin the first place worth leaving the house for.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

function MySpotRow({ spot, navigation }: { spot: Spot; navigation: any }) {
  const cat = categoryStyle(spot.category);
  const when = relativeTime(spot.created_at);
  const comments = commentCount(spot);
  return (
    <Pressable
      onPress={() =>
        navigation.navigate('Feed', {
          screen: 'SpotDetailScreen',
          params: { spot },
        })
      }
      style={styles.spotRow}
    >
      <View style={[styles.spotRowIcon, { backgroundColor: cat.soft }]}>
        <cat.Icon color={cat.color} size={22} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.spotRowTitle} numberOfLines={1}>
          {spot.title}
        </Text>
        <Text style={styles.spotRowMeta} numberOfLines={1}>
          {cat.label}
          {when ? ` · ${when}` : ''}
          {comments > 0 ? ` · 💬 ${comments}` : ''}
        </Text>
      </View>
      <MapPin color={colors.inkFaint} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerTitle: { fontFamily: fonts.displayBold, fontSize: 26, color: '#fff' },
  headerSubtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },

  // Auth (signed-out) view
  authBody: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.huge,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: colors.inkFaint,
  },
  authInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  emailSubmit: {
    paddingVertical: 15,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  emailSubmitText: {
    fontFamily: fonts.bodyBlack,
    fontSize: 15,
    color: colors.primaryInk,
  },
  modeToggle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13.5,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  notice: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.primaryInk,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  authEmoji: { fontSize: 44, textAlign: 'center' },
  authTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.ink,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  authText: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  error: {
    fontFamily: fonts.bodyBold,
    fontSize: 13.5,
    color: colors.accentInk,
    marginTop: spacing.lg,
  },
  submitWrap: { marginTop: spacing.xxl, borderRadius: radius.md, ...shadow.soft },
  submit: { paddingVertical: 16, borderRadius: radius.md, alignItems: 'center' },
  submitText: { fontFamily: fonts.bodyBlack, fontSize: 16, color: '#fff' },

  // Profile
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  identityName: { fontFamily: fonts.displayBold, fontSize: 22, color: '#fff' },
  identityEmail: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
  signOutButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  sectionCount: {
    fontFamily: fonts.bodyBlack,
    fontSize: 12,
    color: colors.primaryInk,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadow.soft,
  },
  spotRowIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotRowTitle: { fontFamily: fonts.bodyBold, fontSize: 15.5, color: colors.ink },
  spotRowMeta: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: colors.inkFaint,
    marginTop: 1,
  },
  empty: { alignItems: 'center', paddingHorizontal: spacing.xxxl, marginTop: spacing.xxl },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
    marginTop: spacing.md,
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
  },
});
