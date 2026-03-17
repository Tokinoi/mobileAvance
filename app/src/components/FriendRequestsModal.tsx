import { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

interface FriendRequest {
  id: string;
  from_user_id: string;
  pseudo: string;
}

interface Props {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onChanged: () => void;
}

export function FriendRequestsModal({ visible, userId, onClose, onChanged }: Props) {
  const [invitations, setInvitations] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  const fetchInvitations = async () => {
    setLoading(true);
    const { data: requests } = await supabase
      .from('friend_requests')
      .select('id, from_user_id')
      .eq('to_user_id', userId)
      .eq('status', 'pending');
    if (!requests || requests.length === 0) {
      setInvitations([]);
      setLoading(false);
      return;
    }
    const fromIds = requests.map((r: any) => r.from_user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, pseudo')
      .in('id', fromIds);
    const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p.pseudo]));
    setInvitations(requests.map((r: any) => ({
      id: r.id,
      from_user_id: r.from_user_id,
      pseudo: profileMap[r.from_user_id] ?? 'Unknown',
    })));
    setLoading(false);
  };

  useEffect(() => {
    if (visible) fetchInvitations();
  }, [visible]);

  const handleRespond = async (requestId: string, accept: boolean) => {
    setResponding(requestId);
    await supabase
      .from('friend_requests')
      .update({ status: accept ? 'accepted' : 'declined' })
      .eq('id', requestId);
    setInvitations((prev) => prev.filter((r) => r.id !== requestId));
    setResponding(null);
    onChanged();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Friend Requests</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#111827" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#4F46E5" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={invitations}
            keyExtractor={(r) => r.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitial}>{item.pseudo[0]?.toUpperCase()}</Text>
                </View>
                <Text style={styles.pseudo}>{item.pseudo}</Text>
                {responding === item.id ? (
                  <ActivityIndicator size="small" color="#4F46E5" />
                ) : (
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleRespond(item.id, true)}>
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.declineBtn} onPress={() => handleRespond(item.id, false)}>
                      <Ionicons name="close" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="mail-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No pending requests</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  closeBtn: { padding: 4 },
  list: { padding: 16, gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: '#4F46E5' },
  pseudo: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  actions: { flexDirection: 'row', gap: 8 },
  acceptBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center',
  },
  declineBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#FECACA',
  },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
