import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, ScrollView, TouchableOpacity,
  StyleSheet, useWindowDimensions, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Group } from '../types';

const COLUMNS = 2;
const GAP = 12;
const H_PAD = 16;

/* ── Types ── */
interface UserResult {
  id: string;
  pseudo: string;
}

/* ── Gallery card (no-search default view) ── */
function GalleryCard({ group }: { group: Group }) {
  const { width } = useWindowDimensions();
  const cardSize = (width - H_PAD * 2 - GAP) / COLUMNS;

  return (
    <View style={[styles.galleryCard, { width: cardSize }]}>
      <View style={[styles.galleryCardTop, { backgroundColor: group.color + '20', height: cardSize * 0.6 }]}>
        <Ionicons name={group.icon as any} size={36} color={group.color} />
      </View>
      <View style={styles.galleryCardBottom}>
        <Text style={styles.galleryCardName} numberOfLines={1}>{group.name}</Text>
        {!!group.description && (
          <Text style={styles.galleryCardDesc} numberOfLines={1}>{group.description}</Text>
        )}
      </View>
    </View>
  );
}

/* ── Search result rows ── */
function GroupRow({ group }: { group: Group }) {
  return (
    <View style={styles.resultRow}>
      <View style={[styles.resultIcon, { backgroundColor: group.color + '20' }]}>
        <Ionicons name={group.icon as any} size={20} color={group.color} />
      </View>
      <View style={styles.resultBody}>
        <Text style={styles.resultName}>{group.name}</Text>
        {!!group.description && (
          <Text style={styles.resultSub} numberOfLines={1}>{group.description}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </View>
  );
}

function UserRow({ user }: { user: UserResult }) {
  return (
    <View style={styles.resultRow}>
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarInitial}>{user.pseudo[0]?.toUpperCase()}</Text>
      </View>
      <View style={styles.resultBody}>
        <Text style={styles.resultName}>{user.pseudo}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </View>
  );
}

/* ── Screen ── */
export function HomeScreen() {
  const [query, setQuery] = useState('');
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [searchGroups, setSearchGroups] = useState<Group[]>([]);
  const [searchUsers, setSearchUsers] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Fetch all public groups on mount
  useEffect(() => {
    supabase
      .from('groups')
      .select('*')
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setAllGroups(data.map((g) => ({
            id: g.id,
            name: g.name,
            description: g.description,
            icon: g.icon,
            color: g.color,
            itemCount: g.item_count,
            parentId: g.parent_id ?? undefined,
            template: g.template ?? undefined,
          })));
        }
        setLoadingGroups(false);
      });
  }, []);

  // Search groups + users
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchGroups([]);
      setSearchUsers([]);
      return;
    }
    setSearching(true);
    const [groupsRes, usersRes] = await Promise.all([
      supabase
        .from('groups')
        .select('*')
        .ilike('name', `%${q}%`)
        .is('parent_id', null)
        .limit(20),
      supabase
        .from('profiles')
        .select('id, pseudo')
        .ilike('pseudo', `%${q}%`)
        .limit(10),
    ]);

    setSearchGroups(
      (groupsRes.data ?? []).map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        icon: g.icon,
        color: g.color,
        itemCount: g.item_count,
        parentId: g.parent_id ?? undefined,
        template: g.template ?? undefined,
      }))
    );
    setSearchUsers(usersRes.data ?? []);
    setSearching(false);
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    runSearch(text);
  };

  const isSearching = query.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Search groups or users…"
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
          />
          {!!query && (
            <TouchableOpacity onPress={() => handleQueryChange('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search results */}
      {isSearching ? (
        <ScrollView contentContainerStyle={styles.searchResults} showsVerticalScrollIndicator={false}>
          {searching ? (
            <ActivityIndicator color="#4F46E5" style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Users section */}
              {searchUsers.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Users</Text>
                  {searchUsers.map((u) => <UserRow key={u.id} user={u} />)}
                </View>
              )}

              {/* Groups section */}
              {searchGroups.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Groups</Text>
                  {searchGroups.map((g) => <GroupRow key={g.id} group={g} />)}
                </View>
              )}

              {searchUsers.length === 0 && searchGroups.length === 0 && (
                <View style={styles.empty}>
                  <Ionicons name="search-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No results for "{query}"</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      ) : (
        /* Default gallery */
        <FlatList
          data={allGroups}
          keyExtractor={(g) => g.id}
          numColumns={COLUMNS}
          columnWrapperStyle={styles.galleryRow}
          contentContainerStyle={styles.galleryList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <GalleryCard group={item} />}
          ListHeaderComponent={
            loadingGroups ? <ActivityIndicator color="#4F46E5" style={{ marginVertical: 40 }} /> : null
          }
          ListEmptyComponent={
            !loadingGroups ? (
              <View style={styles.empty}>
                <Ionicons name="globe-outline" size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>No public groups yet</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },

  /* ── Header ── */
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: H_PAD,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },

  /* ── Search ── */
  searchRow: {
    paddingHorizontal: H_PAD,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827', padding: 0 },

  /* ── Search results ── */
  searchResults: { padding: H_PAD, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBody: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  resultSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarInitial: { fontSize: 17, fontWeight: '700', color: '#4F46E5' },

  /* ── Gallery ── */
  galleryList: { padding: H_PAD, paddingBottom: 40 },
  galleryRow: { gap: GAP, marginBottom: GAP },
  galleryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  galleryCardTop: { alignItems: 'center', justifyContent: 'center' },
  galleryCardBottom: { padding: 10, gap: 2 },
  galleryCardName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  galleryCardDesc: { fontSize: 12, color: '#9CA3AF' },

  /* ── Empty ── */
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
