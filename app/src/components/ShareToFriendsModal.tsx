import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, FlatList,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

interface Friend {
  id: string;
  pseudo: string;
  inviteStatus: 'none' | 'pending' | 'accepted';
}

interface Props {
  visible: boolean;
  groupId: string;
  groupName: string;
  onClose: () => void;
}

export function ShareToFriendsModal({ visible, groupId, groupName, onClose }: Props) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sharing, setSharing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSelected(new Set());
    setQuery('');
    setDone(false);
    setLoading(true);

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }

      const { data: friendData } = await supabase
        .from('friend_requests')
        .select('from_user_id, to_user_id')
        .eq('status', 'accepted')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);

      if (!friendData || friendData.length === 0) { setFriends([]); setLoading(false); return; }

      const friendIds = friendData.map((r: any) =>
        r.from_user_id === user.id ? r.to_user_id : r.from_user_id
      );

      const [{ data: profiles }, { data: invites }] = await Promise.all([
        supabase.from('profiles').select('id, pseudo').in('id', friendIds),
        supabase
          .from('group_invitations')
          .select('to_user_id, status')
          .eq('group_id', groupId)
          .eq('from_user_id', user.id)
          .in('to_user_id', friendIds),
      ]);

      const inviteMap: Record<string, 'pending' | 'accepted'> = {};
      for (const inv of invites ?? []) {
        if (inv.status === 'accepted') inviteMap[inv.to_user_id] = 'accepted';
        else if (inv.status === 'pending' && !inviteMap[inv.to_user_id]) inviteMap[inv.to_user_id] = 'pending';
      }

      setFriends((profiles ?? []).map((p: any) => ({
        id: p.id,
        pseudo: p.pseudo,
        inviteStatus: inviteMap[p.id] ?? 'none',
      })));
      setLoading(false);
    });
  }, [visible, groupId]);

  const toggle = (friend: Friend) => {
    if (friend.inviteStatus !== 'none') return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(friend.id)) next.delete(friend.id); else next.add(friend.id);
      return next;
    });
  };

  const handleShare = async () => {
    setSharing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const rows = [...selected].map((toId) => ({
        group_id: groupId,
        from_user_id: user.id,
        to_user_id: toId,
        status: 'pending',
      }));
      await supabase.from('group_invitations').insert(rows);
    }
    setSharing(false);
    setDone(true);
    setTimeout(onClose, 900);
  };

  const filtered = query.trim()
    ? friends.filter((f) => f.pseudo.toLowerCase().includes(query.toLowerCase()))
    : friends;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        <Text style={styles.title}>Share with friends</Text>
        <Text style={styles.subtitle} numberOfLines={1}>"{groupName}"</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={15} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search..."
            placeholderTextColor="#9CA3AF"
            autoCorrect={false}
          />
        </View>

        {loading ? (
          <ActivityIndicator color="#4F46E5" style={{ marginVertical: 32 }} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(f) => f.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = selected.has(item.id);
              const disabled = item.inviteStatus !== 'none';
              return (
                <TouchableOpacity
                  style={[styles.row, disabled && styles.rowDisabled]}
                  onPress={() => toggle(item)}
                  activeOpacity={disabled ? 1 : 0.7}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarInitial}>{item.pseudo[0]?.toUpperCase()}</Text>
                  </View>
                  <Text style={[styles.pseudo, disabled && styles.pseudoDisabled]}>{item.pseudo}</Text>

                  {item.inviteStatus === 'pending' && (
                    <Ionicons name="hourglass-outline" size={20} color="#F59E0B" />
                  )}
                  {item.inviteStatus === 'accepted' && (
                    <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
                  )}
                  {item.inviteStatus === 'none' && (
                    <View style={[styles.check, isSelected && styles.checkSelected]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={36} color="#E5E7EB" />
                <Text style={styles.emptyText}>{query ? 'No match' : 'No friends yet'}</Text>
              </View>
            }
          />
        )}

        <SafeAreaView edges={['bottom']} style={styles.footer}>
          {done ? (
            <View style={styles.doneRow}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              <Text style={styles.doneText}>Shared!</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.shareBtn, (selected.size === 0 || sharing) && styles.shareBtnDisabled]}
              onPress={handleShare}
              disabled={selected.size === 0 || sharing}
            >
              {sharing
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.shareBtnText}>
                    Send{selected.size > 0 ? ` · ${selected.size}` : ''}
                  </Text>
              }
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '75%', paddingHorizontal: 16,
  },
  handleRow: { alignItems: 'center', paddingVertical: 10 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 2 },
  subtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 14 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F3F4F6', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 9, marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', padding: 0 },
  list: { flexGrow: 0, maxHeight: 320 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  rowDisabled: { opacity: 0.6 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: '#4F46E5' },
  pseudo: { flex: 1, fontSize: 15, fontWeight: '500', color: '#111827' },
  pseudoDisabled: { color: '#9CA3AF' },
  check: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },
  checkSelected: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  footer: { paddingTop: 12, paddingBottom: 4 },
  shareBtn: {
    backgroundColor: '#4F46E5', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  shareBtnDisabled: { backgroundColor: '#C7D2FE' },
  shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  doneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  doneText: { fontSize: 15, fontWeight: '700', color: '#16A34A' },
});
