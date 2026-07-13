import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Search, Plus } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import SpotCard from '../components/SpotCard';
import { fetchSpots } from '../lib/spots';
import { Spot } from '../lib/types';
import { isUsingDefaultBackend } from '../components/Supabase';

const ALL = '__all__';

function prettyCategory(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(ALL);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await fetchSpots();
      setSpots(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refetch whenever the tab regains focus, so newly added spots appear.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    spots.forEach((s) => s.category && set.add(s.category));
    return Array.from(set).sort();
  }, [spots]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return spots.filter((s) => {
      if (activeCategory !== ALL && s.category !== activeCategory) return false;
      if (!q) return true;
      const haystack = [
        s.title,
        s.description,
        ...(s.tags ?? []),
        s.category ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [spots, query, activeCategory]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text style={styles.message}>Loading spots...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search color="#94A3B8" size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search spots, tags, vibes..."
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('Add')}
        >
          <Plus color="#fff" size={22} />
        </TouchableOpacity>
      </View>

      {categories.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
          contentContainerStyle={styles.chipRowContent}
        >
          {[ALL, ...categories].map((cat) => {
            const active = cat === activeCategory;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat === ALL ? 'All' : prettyCategory(cat)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {error ? (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Couldn't load spots</Text>
          <Text style={styles.noticeBody}>{error}</Text>
          {isUsingDefaultBackend ? (
            <Text style={styles.noticeBody}>
              The app is using the built-in demo backend, which is offline. Set
              EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in a
              .env file to connect your own Supabase.
            </Text>
          ) : null}
        </View>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
        }
        renderItem={({ item }) => (
          <SpotCard
            spot={item}
            onPress={() =>
              navigation.navigate('SpotDetailScreen', { spot: item })
            }
          />
        )}
        ListEmptyComponent={
          !error ? (
            <View style={styles.center}>
              <Text style={styles.message}>
                {spots.length === 0
                  ? 'No spots yet. Tap + to pin your first place.'
                  : 'No spots match your search.'}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  message: { fontSize: 15, color: '#64748B', marginTop: 10, textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#0F172A' },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipRow: { flexGrow: 0 },
  chipRowContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' },
  chipText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  list: { padding: 16, paddingTop: 8, flexGrow: 1 },
  notice: {
    margin: 16,
    marginTop: 4,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  noticeTitle: { fontWeight: '700', color: '#B91C1C', marginBottom: 4 },
  noticeBody: { color: '#7F1D1D', fontSize: 13, marginTop: 4, lineHeight: 18 },
});
