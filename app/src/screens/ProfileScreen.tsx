import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface FriendRequest {
  id: string;
  from_user_id: string;
  pseudo: string;
}

export function ProfileScreen() {
  const { session, logout } = useAuth();
  const { height } = useWindowDimensions();
  const bannerHeight = height * 0.2;

  const pseudo = session?.user?.user_metadata?.pseudo ?? session?.user?.email?.split('@')[0] ?? 'User';
  const initial = pseudo[0]?.toUpperCase() ?? 'U';

  const [friendsCount, setFriendsCount] = useState(0);
  const [invitations, setInvitations] = useState<FriendRequest[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  const fetchInvitations = async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    const [invRes, friendsRes] = await Promise.all([
      supabase
        .from('friend_requests')
        .select('id, from_user_id, profiles!from_user_id(pseudo)')
        .eq('to_user_id', userId)
        .eq('status', 'pending'),
      supabase
        .from('friend_requests')
        .select('id')
        .eq('status', 'accepted')
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`),
    ]);
    if (invRes.data) {
      setInvitations(invRes.data.map((r: any) => ({
        id: r.id,
        from_user_id: r.from_user_id,
        pseudo: r.profiles?.pseudo ?? 'Unknown',
      })));
    }
    if (friendsRes.data) setFriendsCount(friendsRes.data.length);
    setLoadingInvitations(false);
  };

  useEffect(() => { fetchInvitations(); }, [session]);

  const handleRespond = async (requestId: string, accept: boolean) => {
    setResponding(requestId);
    await supabase
      .from('friend_requests')
      .update({ status: accept ? 'accepted' : 'declined' })
      .eq('id', requestId);
    await fetchInvitations();
    setResponding(null);
  };

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
          <View style={styles.friendsRow}>
            <Ionicons name="people-outline" size={16} color="#6B7280" />
            <Text style={styles.friendsText}>
              <Text style={styles.friendsCount}>{friendsCount}</Text>{' friends'}
            </Text>
          </View>
        </View>

        {/* Invitations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friend requests</Text>
          {loadingInvitations ? (
            <ActivityIndicator color="#4F46E5" style={{ marginTop: 12 }} />
          ) : invitations.length === 0 ? (
            <View style={styles.emptyRow}>
              <Ionicons name="mail-outline" size={20} color="#D1D5DB" />
              <Text style={styles.emptyText}>No pending requests</Text>
            </View>
          ) : (
            invitations.map((inv) => (
              <View key={inv.id} style={styles.invitationRow}>
                <View style={styles.invAvatar}>
                  <Text style={styles.invAvatarInitial}>{inv.pseudo[0]?.toUpperCase()}</Text>
                </View>
                <Text style={styles.invPseudo}>{inv.pseudo}</Text>
                {responding === inv.id ? (
                  <ActivityIndicator size="small" color="#4F46E5" />
                ) : (
                  <View style={styles.invActions}>
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleRespond(inv.id, true)}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.declineBtn} onPress={() => handleRespond(inv.id, false)}>
                      <Ionicons name="close" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Spacer for footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

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
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },

  invitationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  invAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
  },
  invAvatarInitial: { fontSize: 16, fontWeight: '700', color: '#4F46E5' },
  invPseudo: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  invActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center',
  },
  declineBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#FECACA',
  },

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
