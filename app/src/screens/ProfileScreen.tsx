import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const FRIENDS_COUNT = 0;

export function ProfileScreen() {
  const { session, logout } = useAuth();
  const { height } = useWindowDimensions();
  const bannerHeight = height * 0.2;

  const pseudo = session?.user?.user_metadata?.pseudo ?? session?.user?.email?.split('@')[0] ?? 'User';
  const initial = pseudo[0]?.toUpperCase() ?? 'U';

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Banner — top 20% */}
      <View style={[styles.banner, { height: bannerHeight }]}>
        <SafeAreaView edges={['top']} style={styles.bannerSafe}>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="pencil-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      {/* Avatar — overlaps banner / white divide */}
      <View style={styles.avatarRing}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
      </View>

      {/* White content area */}
      <View style={styles.content}>
        <Text style={styles.name}>{pseudo}</Text>
        {/* Friends row */}
        <View style={styles.friendsRow}>
          <Ionicons name="people-outline" size={16} color="#6B7280" />
          <Text style={styles.friendsText}>
            <Text style={styles.friendsCount}>{FRIENDS_COUNT}</Text>
            {' friends'}
          </Text>
        </View>
      </View>

      {/* Disconnect button — pinned to bottom */}
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
  container: { flex: 1, backgroundColor: '#fff' },

  /* ── Banner ── */
  banner: {
    backgroundColor: '#4F46E5',
    justifyContent: 'space-between',
  },
  bannerSafe: {
    paddingHorizontal: 16,
    paddingTop: 4,
    alignItems: 'flex-end',
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Avatar ── */
  avatarRing: {
    alignSelf: 'center',
    marginTop: -(AVATAR_SIZE / 2 + AVATAR_BORDER),
    width: AVATAR_SIZE + AVATAR_BORDER * 2,
    height: AVATAR_SIZE + AVATAR_BORDER * 2,
    borderRadius: (AVATAR_SIZE + AVATAR_BORDER * 2) / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '700',
    color: '#4F46E5',
  },

  /* ── Content ── */
  content: {
    alignItems: 'center',
    paddingTop: 12,
    gap: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  friendsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  friendsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  friendsCount: {
    fontWeight: '700',
    color: '#111827',
  },

  /* ── Footer ── */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
});
