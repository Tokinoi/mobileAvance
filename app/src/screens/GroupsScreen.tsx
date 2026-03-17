import { useState, useEffect } from 'react';
import {
  View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import { useGroups } from '../context/GroupsContext';
import { supabase } from '../lib/supabase';
import { GroupCard } from '../components/molecules/GroupCard';
import { EmptyState } from '../components/atoms/EmptyState';
import { FAB } from '../components/atoms/FAB';
import { ScreenHeader } from '../components/molecules/ScreenHeader';
import { ScreenShell } from '../components/templates/ScreenShell';
import { GroupInviteModal } from '../components/GroupInviteModal';

export function GroupsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { groups, loading } = useGroups();
  const rootGroups = groups.filter((g) => !g.parentId);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

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

  useEffect(() => { fetchPending(); }, []);

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

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      )}

      <FlatList
        data={rootGroups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GroupCard group={item} onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="folder-open-outline" title="No groups yet" />
        }
      />

      <FAB icon="add" onPress={() => navigation.navigate('CreateGroup')} style={styles.fab} />

      <GroupInviteModal
        visible={inviteVisible}
        onClose={() => setInviteVisible(false)}
        onChanged={fetchPending}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  loadingContainer: { position: 'absolute', top: 100, left: 0, right: 0, alignItems: 'center', zIndex: 1 },
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
