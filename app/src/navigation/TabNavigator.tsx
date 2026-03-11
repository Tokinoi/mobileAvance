import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { GroupsScreen } from '../screens/GroupsScreen';
import { MapScreen } from '../screens/MapScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const TABS = [
  { label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { label: 'Groups', icon: 'folder-outline', activeIcon: 'folder' },
  { label: 'Map', icon: 'map-outline', activeIcon: 'map' },
  { label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
] as const;

const SCREENS = [HomeScreen, GroupsScreen, MapScreen, ProfileScreen];

export function TabNavigator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  const goToTab = (index: number) => {
    pagerRef.current?.setPage(index);
    setActiveIndex(index);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setActiveIndex(e.nativeEvent.position)}
      >
        {SCREENS.map((Screen, i) => (
          <View key={i} style={styles.page}>
            <Screen />
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
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={24}
                color={isActive ? '#4F46E5' : '#9CA3AF'}
              />
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
});
