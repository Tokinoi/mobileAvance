import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, FlatList,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Group } from '../types';
import { IconBox } from './atoms/IconBox';

interface Friend {
  id: string;
  pseudo: string;
}

interface Props {
  visible: boolean;
  groups: Group[];
  onClose: () => void;
}

export function GroupInviteModal({ visible, groups, onClose }: Props) {
  const [step, setStep] = useState<'group' | 'friends'>('group');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setStep('group');
    setSelectedGroup(null);
    setSelected(new Set());
    setQuery('');
    setDone(false);
  }, [visible]);

  const pickGroup = async (group: Group) => {
    setSelectedGroup(group);
    setStep('friends');
    setLoadingFriends(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadingFriends(false); return; }
    const { data: requests } = await supabase
      .from('friend_requests')
      .select('from_user_id, to_user_id')
      .eq('status', 'accepted')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);
    if (!requests || requests.length === 0) { setFriends([]); setLoadingFriends(false); return; }
    const ids = requests.map((r: any) => r.from_user_id === user.id ? r.to_user_id : r.from_user_id);
    const { data: profiles } = await supabase.from('profiles').select('id, pseudo').in('id', ids);
    setFriends(profiles ?? []);
    setLoadingFriends(false);
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    setSending(true);
    await new Promise((r) => setTimeout(r, 600));
    setSending(false);
    setDone(true);
    setTimeout(onClose, 900);
  };

  const filtered = query.trim()
    ? friends.filter((f) => f.pseudo.toLowerCase().includes(query.toLowerCase()))
    : friends;

  const rootGroups = groups.filter((g) => !g.parentId);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          {step === 'friends' && !done ? (
            <TouchableOpacity onPress={() => setStep('group')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn} />
          )}
          <Text style={styles.title}>
            {step === 'group' ? 'Invite to a group' : selectedGroup?.name ?? ''}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Step 1 — pick group */}
        {step === 'group' && (
          <FlatList
            data={rootGroups}
            keyExtractor={(g) => g.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.groupRow} activeOpacity={0.7} onPress={() => pickGroup(item)}>
                <IconBox icon={item.icon as any} color={item.color} size={20} boxSize={40} borderRadius={10} />
                <View style={styles.groupBody}>
                  <Text style={styles.groupName}>{item.name}</Text>
                  {!!item.description && (
                    <Text style={styles.groupDesc} numberOfLines={1}>{item.description}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="folder-open-outline" size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>No groups yet</Text>
              </View>
            }
          />
        )}

        {/* Step 2 — pick friends */}
        {step === 'friends' && (
          <>
            <View style={styles.searchRow}>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={15} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search friends..."
                  placeholderTextColor="#9CA3AF"
                  autoCorrect={false}
                />
              </View>
            </View>

            {loadingFriends ? (
              <ActivityIndicator color="#4F46E5" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(f) => f.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = selected.has(item.id);
                  return (
                    <TouchableOpacity style={styles.friendRow} onPress={() => toggle(item.id)} activeOpacity={0.7}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarInitial}>{item.pseudo[0]?.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.pseudo}>{item.pseudo}</Text>
                      <View style={[styles.check, isSelected && styles.checkSelected]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.empty}>
                    <Ionicons name="people-outline" size={40} color="#D1D5DB" />
                    <Text style={styles.emptyText}>{query ? 'No match' : 'No friends yet'}</Text>
                  </View>
                }
              />
            )}

            <SafeAreaView edges={['bottom']} style={styles.footer}>
              {done ? (
                <View style={styles.doneRow}>
                  <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                  <Text style={styles.doneText}>Invitation sent!</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.sendBtn, (selected.size === 0 || sending) && styles.sendBtnDisabled]}
                  onPress={handleSend}
                  disabled={selected.size === 0 || sending}
                >
                  {sending
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.sendBtnText}>
                        Send invite{selected.size > 0 ? ` · ${selected.size}` : ''}
                      </Text>
                  }
                </TouchableOpacity>
              )}
            </SafeAreaView>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'center' },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  groupRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  groupBody: { flex: 1 },
  groupName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  groupDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F3F4F6', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', padding: 0 },
  friendRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: '#4F46E5' },
  pseudo: { flex: 1, fontSize: 15, fontWeight: '500', color: '#111827' },
  check: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },
  checkSelected: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, backgroundColor: '#F9FAFB' },
  sendBtn: {
    backgroundColor: '#4F46E5', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#C7D2FE' },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  doneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  doneText: { fontSize: 15, fontWeight: '700', color: '#16A34A' },
});
