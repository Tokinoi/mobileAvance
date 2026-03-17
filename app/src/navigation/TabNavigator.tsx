import { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { GroupsScreen } from '../screens/GroupsScreen';
import { MapScreen } from '../screens/MapScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { supabase } from '../lib/supabase';

const TABS = [
  { label: 'Search', icon: 'search-outline', activeIcon: 'search' },
  { label: 'Groups', icon: 'folder-outline', activeIcon: 'folder' },
  { label: 'Map', icon: 'map-outline', activeIcon: 'map' },
  { label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
] as const;

const SCREENS = [HomeScreen, GroupsScreen, MapScreen, ProfileScreen];

const PROFILE_TAB_INDEX = 3;

export function TabNavigator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visitedTabs, setVisitedTabs] = useState<Set<number>>(new Set([0]));
  const [pendingCount, setPendingCount] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  useEffect(() => {
    const fetchPending = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('friend_requests')
        .select('id')
        .eq('to_user_id', user.id)
        .eq('status', 'pending');
      setPendingCount(data?.length ?? 0);
    };

    fetchPending();

    const channel = supabase
      .channel('friend_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, fetchPending)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const goToTab = (index: number) => {
    pagerRef.current?.setPage(index);
    setActiveIndex(index);
    setVisitedTabs((prev) => new Set(prev).add(index));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => {
          const index = e.nativeEvent.position;
          setActiveIndex(index);
          setVisitedTabs((prev) => new Set(prev).add(index));
        }}
      >
        {SCREENS.map((Screen, i) => (
          <View key={i} style={styles.page}>
            {visitedTabs.has(i) ? <Screen /> : null}
          </View>
        ))}
      </PagerView>

      {/* Bottom Nav */}
      <View style={styles.nav}>
        {TABS.map((tab, i) => {
          const isActive = activeIndex === i;
          return (
            <TouchableOpacity key={tab.label} style={styles.navItem} onPress={() => goToTab(i)}>
              {isActive && <View style={styles.activeDot} />}
              <View>
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={24}
                  color={isActive ? '#4F46E5' : '#9CA3AF'}
                />
                {i === PROFILE_TAB_INDEX && pendingCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  pager: { flex: 1 },
  page: { flex: 1 },
  nav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    height: 60,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4F46E5',
  },
  navLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  navLabelActive: { color: '#4F46E5' },
  badge: {
    position: 'absolute', top: -4, right: -6,
    backgroundColor: '#EF4444', borderRadius: 8,
    minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
});
