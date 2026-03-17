import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { IconBox } from './atoms/IconBox';

interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  groupIcon: string;
  groupColor: string;
  fromPseudo: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export function GroupInviteModal({ visible, onClose, onChanged }: Props) {
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  const fetchInvitations = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: invites } = await supabase
      .from('group_invitations')
      .select('id, group_id, from_user_id')
      .eq('to_user_id', user.id)
      .eq('status', 'pending');

    if (!invites || invites.length === 0) { setInvitations([]); setLoading(false); return; }

    const groupIds = invites.map((i: any) => i.group_id);
    const fromIds = invites.map((i: any) => i.from_user_id);

    const [{ data: groups }, { data: profiles }] = await Promise.all([
      supabase.from('groups').select('id, name, icon, color').in('id', groupIds),
      supabase.from('profiles').select('id, pseudo').in('id', fromIds),
    ]);

    const groupMap = Object.fromEntries((groups ?? []).map((g: any) => [g.id, g]));
    const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p.pseudo]));

    setInvitations(invites.map((i: any) => ({
      id: i.id,
      groupId: i.group_id,
      groupName: groupMap[i.group_id]?.name ?? 'Unknown group',
      groupIcon: groupMap[i.group_id]?.icon ?? 'folder-outline',
      groupColor: groupMap[i.group_id]?.color ?? '#4F46E5',
      fromPseudo: profileMap[i.from_user_id] ?? 'Unknown',
    })));
    setLoading(false);
  };

  useEffect(() => {
    if (visible) fetchInvitations();
  }, [visible]);

  const handleRespond = async (inviteId: string, accept: boolean) => {
    setResponding(inviteId);
    await supabase
      .from('group_invitations')
      .update({ status: accept ? 'accepted' : 'declined' })
      .eq('id', inviteId);
    setInvitations((prev) => prev.filter((i) => i.id !== inviteId));
    setResponding(null);
    onChanged();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Group Invitations</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#111827" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#4F46E5" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={invitations}
            keyExtractor={(i) => i.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <IconBox icon={item.groupIcon as any} color={item.groupColor} size={20} boxSize={42} borderRadius={10} />
                <View style={styles.body}>
                  <Text style={styles.groupName}>{item.groupName}</Text>
                  <Text style={styles.fromText}>from {item.fromPseudo}</Text>
                </View>
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
                <Text style={styles.emptyText}>No pending invitations</Text>
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
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  body: { flex: 1 },
  groupName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  fromText: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
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
