import { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { supabase } from '../lib/supabase';

interface Friend {
  id: string;
  pseudo: string;
}

interface Props {
  visible: boolean;
  userId: string;
  onClose: () => void;
}

export function FriendsListModal({ visible, userId, onClose }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    supabase
      .from('friend_requests')
      .select('from_user_id, to_user_id')
      .eq('status', 'accepted')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .then(async ({ data }) => {
        if (!data || data.length === 0) { setFriends([]); setLoading(false); return; }
        const friendIds = data.map((r: any) => r.from_user_id === userId ? r.to_user_id : r.from_user_id);
        const { data: profiles } = await supabase.from('profiles').select('id, pseudo').in('id', friendIds);
        setFriends(profiles ?? []);
        setLoading(false);
      });
  }, [visible, userId]);

  const handleRemove = async (friendId: string) => {
    await supabase
      .from('friend_requests')
      .delete()
      .or(`and(from_user_id.eq.${userId},to_user_id.eq.${friendId}),and(from_user_id.eq.${friendId},to_user_id.eq.${userId})`);
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Friends</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#111827" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#4F46E5" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(f) => f.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.rowMain}
                  activeOpacity={0.7}
                  onPress={() => { onClose(); navigation.navigate('UserProfile', { userId: item.id }); }}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarInitial}>{item.pseudo[0]?.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.pseudo}>{item.pseudo}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleRemove(item.id)}
                >
                  <Ionicons name="person-remove-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No friends yet</Text>
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
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#FECACA',
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: '#4F46E5' },
  pseudo: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
