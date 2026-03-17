import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { FriendRequestsModal } from '../components/FriendRequestsModal';
import { FriendsListModal } from '../components/FriendsListModal';

export function ProfileScreen() {
  const { session, logout } = useAuth();
  const { height } = useWindowDimensions();
  const bannerHeight = height * 0.2;

  const pseudo = session?.user?.user_metadata?.pseudo ?? session?.user?.email?.split('@')[0] ?? 'User';
  const initial = pseudo[0]?.toUpperCase() ?? 'U';

  const [friendsCount, setFriendsCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [requestsModalVisible, setRequestsModalVisible] = useState(false);
  const [friendsModalVisible, setFriendsModalVisible] = useState(false);

  const fetchCounts = async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    const [pendingRes, friendsRes] = await Promise.all([
      supabase.from('friend_requests').select('id').eq('to_user_id', userId).eq('status', 'pending'),
      supabase.from('friend_requests').select('id').eq('status', 'accepted').or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`),
    ]);
    setPendingCount(pendingRes.data?.length ?? 0);
    setFriendsCount(friendsRes.data?.length ?? 0);
  };

  useEffect(() => { fetchCounts(); }, [session]);

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Banner */}
      <View style={[styles.banner, { height: bannerHeight }]}>
        <SafeAreaView edges={['top']} style={styles.bannerSafe}>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="pencil-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      {/* Avatar */}
      <View style={styles.avatarRing}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Name + friends */}
        <View style={styles.userInfo}>
          <Text style={styles.name}>{pseudo}</Text>
          <TouchableOpacity style={styles.friendsRow} onPress={() => setFriendsModalVisible(true)}>
            <Ionicons name="people-outline" size={16} color="#6B7280" />
            <Text style={styles.friendsText}>
              <Text style={styles.friendsCount}>{friendsCount}</Text>{' friends'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Friend requests */}
        <TouchableOpacity style={styles.section} activeOpacity={0.7} onPress={() => setRequestsModalVisible(true)}>
          <View style={styles.sectionRow}>
            <Ionicons name="mail-outline" size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Friend requests</Text>
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={16} color="#D1D5DB" style={{ marginLeft: 'auto' }} />
          </View>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <FriendRequestsModal
        visible={requestsModalVisible}
        userId={session?.user?.id ?? ''}
        onClose={() => setRequestsModalVisible(false)}
        onChanged={fetchCounts}
      />

      <FriendsListModal
        visible={friendsModalVisible}
        userId={session?.user?.id ?? ''}
        onClose={() => setFriendsModalVisible(false)}
        onChanged={fetchCounts}
      />

      {/* Sign out — pinned to bottom */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const AVATAR_SIZE = 88;
const AVATAR_BORDER = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  banner: { backgroundColor: '#4F46E5' },
  bannerSafe: { paddingHorizontal: 16, paddingTop: 4, alignItems: 'flex-end' },
  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  avatarRing: {
    alignSelf: 'center',
    marginTop: -(AVATAR_SIZE / 2 + AVATAR_BORDER),
    width: AVATAR_SIZE + AVATAR_BORDER * 2,
    height: AVATAR_SIZE + AVATAR_BORDER * 2,
    borderRadius: (AVATAR_SIZE + AVATAR_BORDER * 2) / 2,
    backgroundColor: '#F9FAFB',
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 34, fontWeight: '700', color: '#4F46E5' },

  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },
  userInfo: { alignItems: 'center', marginBottom: 24, gap: 4 },
  name: { fontSize: 20, fontWeight: '700', color: '#111827' },
  friendsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  friendsText: { fontSize: 14, color: '#6B7280' },
  friendsCount: { fontWeight: '700', color: '#111827' },

  section: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  badge: {
    backgroundColor: '#4F46E5', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingBottom: 8, backgroundColor: '#F9FAFB',
  },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: '#FECACA',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
});
