import { useState, useEffect } from 'react';
import {
  View, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import { useGroups } from '../context/GroupsContext';
import { supabase } from '../lib/supabase';
import { Group } from '../types';
import { GroupCard } from '../components/molecules/GroupCard';
import { EmptyState } from '../components/atoms/EmptyState';
import { FAB } from '../components/atoms/FAB';
import { ScreenHeader } from '../components/molecules/ScreenHeader';
import { ScreenShell } from '../components/templates/ScreenShell';
import { GroupInviteModal } from '../components/GroupInviteModal';

type Tab = 'personal' | 'shared';

export function GroupsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { groups, loading } = useGroups();
  const rootGroups = groups.filter((g) => !g.parentId);

  const [tab, setTab] = useState<Tab>('personal');
  const [inviteVisible, setInviteVisible] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [sharedGroups, setSharedGroups] = useState<Group[]>([]);
  const [loadingShared, setLoadingShared] = useState(false);

  const fetchPending = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('group_invitations')
      .select('id')
      .eq('to_user_id', user.id)
      .eq('status', 'pending');
    setPendingCount(data?.length ?? 0);
  };

  const fetchShared = async () => {
    setLoadingShared(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadingShared(false); return; }
    const { data: invites } = await supabase
      .from('group_invitations')
      .select('group_id')
      .eq('to_user_id', user.id)
      .eq('status', 'accepted');
    if (!invites || invites.length === 0) { setSharedGroups([]); setLoadingShared(false); return; }
    const groupIds = invites.map((i: any) => i.group_id);
    const { data: gs } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds)
      .is('parent_id', null)
      .order('created_at', { ascending: false });
    setSharedGroups((gs ?? []).map((g: any) => ({
      id: g.id, name: g.name, description: g.description,
      icon: g.icon, color: g.color, itemCount: g.item_count,
      parentId: g.parent_id ?? undefined, template: g.template ?? undefined,
      isPublic: g.is_public ?? false,
    })));
    setLoadingShared(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  useEffect(() => {
    if (tab === 'shared') fetchShared();
  }, [tab]);

  const activeGroups = tab === 'personal' ? rootGroups : sharedGroups;
  const isLoading = tab === 'personal' ? loading : loadingShared;

  return (
    <ScreenShell>
      <ScreenHeader
        title="Groups"
        rightElement={
          <TouchableOpacity style={styles.inviteBtn} onPress={() => setInviteVisible(true)}>
            <Ionicons name="mail-outline" size={20} color="#4F46E5" />
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'personal' && styles.tabActive]}
          onPress={() => setTab('personal')}
        >
          <Text style={[styles.tabText, tab === 'personal' && styles.tabTextActive]}>Personal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'shared' && styles.tabActive]}
          onPress={() => setTab('shared')}
        >
          <Text style={[styles.tabText, tab === 'shared' && styles.tabTextActive]}>Shared</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          key={tab}
          data={activeGroups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GroupCard group={item} onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })} readOnly={tab === 'shared'} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="folder-open-outline"
              title={tab === 'personal' ? 'No groups yet' : 'No shared groups'}
            />
          }
        />
      )}

      {tab === 'personal' && (
        <FAB icon="add" onPress={() => navigation.navigate('CreateGroup')} style={styles.fab} />
      )}

      <GroupInviteModal
        visible={inviteVisible}
        onClose={() => setInviteVisible(false)}
        onChanged={() => { fetchPending(); if (tab === 'shared') fetchShared(); }}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabActive: { borderBottomColor: '#4F46E5' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#4F46E5' },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', bottom: 24, right: 24 },
  inviteBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#EF4444', borderRadius: 8,
    minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
});
