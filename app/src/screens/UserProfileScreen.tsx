import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Group } from '../types';
import { ScreenShell } from '../components/templates/ScreenShell';
import { IconBox } from '../components/atoms/IconBox';

type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
type FriendStatus = 'none' | 'pending' | 'friends';

interface Profile {
  id: string;
  pseudo: string;
}

export function UserProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userId } = useRoute<UserProfileRouteProp>().params;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('none');
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      Promise.all([
        supabase.from('profiles').select('id, pseudo').eq('id', userId).single(),
        supabase.from('groups').select('*').eq('user_id', userId).eq('is_public', true).is('parent_id', null).order('created_at', { ascending: false }),
        supabase.from('friend_requests').select('status').or(`and(from_user_id.eq.${user!.id},to_user_id.eq.${userId}),and(from_user_id.eq.${userId},to_user_id.eq.${user!.id})`).maybeSingle(),
      ]).then(([profileRes, groupsRes, friendRes]) => {
        if (profileRes.data) setProfile(profileRes.data);
        if (groupsRes.data) setGroups(groupsRes.data.map((g: any) => ({
          id: g.id, name: g.name, description: g.description,
          icon: g.icon, color: g.color, itemCount: g.item_count,
          parentId: g.parent_id ?? undefined, template: g.template ?? undefined,
          isPublic: g.is_public ?? false,
        })));
        if (friendRes.data) {
          setFriendStatus(friendRes.data.status === 'accepted' ? 'friends' : 'pending');
        }
        setLoading(false);
      });
    });
  }, [userId]);

  const handleFriendRequest = async () => {
    setSendingRequest(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('friend_requests').insert({ from_user_id: user!.id, to_user_id: userId });
    setFriendStatus('pending');
    setSendingRequest(false);
  };

  if (loading) {
    return (
      <ScreenShell>
        <View style={styles.centered}><ActivityIndicator color="#4F46E5" /></View>
      </ScreenShell>
    );
  }

  const pseudo = profile?.pseudo ?? 'User';
  const initial = pseudo[0]?.toUpperCase() ?? 'U';

  return (
    <ScreenShell>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
            <Text style={styles.pseudo}>{pseudo}</Text>

            {friendStatus === 'friends' ? (
              <View style={styles.friendsBadge}>
                <Ionicons name="people" size={16} color="#16A34A" />
                <Text style={styles.friendsBadgeText}>Friends</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.friendBtn, friendStatus === 'pending' && styles.friendBtnPending]}
                onPress={friendStatus === 'none' ? handleFriendRequest : undefined}
                disabled={sendingRequest || friendStatus === 'pending'}
              >
                {sendingRequest ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name={friendStatus === 'pending' ? 'time-outline' : 'person-add-outline'}
                      size={16}
                      color={friendStatus === 'pending' ? '#6B7280' : '#fff'}
                    />
                    <Text style={[styles.friendBtnText, friendStatus === 'pending' && styles.friendBtnTextPending]}>
                      {friendStatus === 'pending' ? 'Request sent' : 'Ask for friend'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {groups.length > 0 && (
              <Text style={styles.subtitle}>Public groups</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.groupRow}
            activeOpacity={0.7}
            onPress={() => navigation.push('GroupDetail', { groupId: item.id })}
          >
            <IconBox icon={item.icon as any} color={item.color} size={20} boxSize={38} borderRadius={10} />
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
            <Text style={styles.emptyText}>No public groups</Text>
          </View>
        }
      />
    </ScreenShell>
  );
}

const AVATAR_SIZE = 80;

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: 2 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  list: { padding: 16, paddingBottom: 40 },
  profileSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  avatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  avatarInitial: { fontSize: 32, fontWeight: '700', color: '#4F46E5' },
  pseudo: { fontSize: 20, fontWeight: '700', color: '#111827' },
  friendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#4F46E5', borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 8,
  },
  friendBtnPending: { backgroundColor: '#F3F4F6' },
  friendBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  friendBtnTextPending: { color: '#6B7280' },
  friendsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F0FDF4', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 8, marginTop: 8,
  },
  friendsBadgeText: { fontSize: 14, fontWeight: '600', color: '#16A34A' },
  subtitle: { fontSize: 13, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16 },
  groupRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  groupBody: { flex: 1 },
  groupName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  groupDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 32, gap: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
