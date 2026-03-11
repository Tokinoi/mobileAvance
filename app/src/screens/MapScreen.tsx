import { useRef, useState, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Modal, ScrollView } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useGroups } from '../context/GroupsContext';

interface PinnedItem {
  id: string;
  name: string;
  label: string;
  latitude: number;
  longitude: number;
  groupColor: string;
}

export function MapScreen() {
  const { items, groups, resolveTemplate } = useGroups();
  const mapRef = useRef<MapView>(null);
  const [permissionStatus, setPermissionStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [showPopup, setShowPopup] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Set<string> | null>(null); // null = all

  // Groups that have at least one location field in their resolved template
  const groupsWithLocation = useMemo(() => {
    return groups.filter((g) => {
      const template = resolveTemplate(g.id);
      return template?.some((f) => f.type === 'location');
    });
  }, [groups, resolveTemplate]);

  const toggleGroup = (id: string) => {
    setSelectedGroups((prev) => {
      const all = new Set(groupsWithLocation.map((g) => g.id));
      const current = prev ?? all;
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const pinnedItems = useMemo<PinnedItem[]>(() => {
    const activeGroups = selectedGroups ?? new Set(groupsWithLocation.map((g) => g.id));
    const result: PinnedItem[] = [];
    for (const item of items) {
      if (!activeGroups.has(item.groupId)) continue;
      const group = groups.find((g) => g.id === item.groupId);
      for (const val of Object.values(item.data)) {
        if (val && typeof val === 'object' && typeof val.latitude === 'number' && typeof val.longitude === 'number') {
          result.push({
            id: item.id,
            name: item.name,
            label: val.label ?? `${val.latitude.toFixed(4)}, ${val.longitude.toFixed(4)}`,
            latitude: val.latitude,
            longitude: val.longitude,
            groupColor: group?.color ?? '#4F46E5',
          });
          break;
        }
      }
    }
    return result;
  }, [items, groups, selectedGroups, groupsWithLocation]);

  const requestPermission = async () => {
    setShowPopup(false);
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status === 'granted' ? 'granted' : 'denied');
  };

  const declinePermission = () => {
    setShowPopup(false);
    setPermissionStatus('denied');
  };

  const goToLocation = async () => {
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    mapRef.current?.animateToRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 800);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={permissionStatus === 'granted'}
        showsMyLocationButton={false}
        initialRegion={{
          latitude: 48.8566,
          longitude: 2.3522,
          latitudeDelta: 10,
          longitudeDelta: 10,
        }}
      >
        {pinnedItems.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            pinColor={pin.groupColor}
          >
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{pin.name}</Text>
                <Text style={styles.calloutLabel}>{pin.label}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {permissionStatus === 'granted' && (
        <TouchableOpacity style={styles.locBtn} onPress={goToLocation}>
          <Ionicons name="locate" size={22} color="#4F46E5" />
        </TouchableOpacity>
      )}

      {/* Filter button */}
      {groupsWithLocation.length > 0 && (
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilter(true)}>
          <Ionicons name="filter" size={18} color="#4F46E5" />
          {selectedGroups !== null && selectedGroups.size < groupsWithLocation.length && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{selectedGroups.size}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Filter panel */}
      <Modal visible={showFilter} transparent animationType="slide">
        <TouchableOpacity style={styles.filterOverlay} activeOpacity={1} onPress={() => setShowFilter(false)} />
        <View style={styles.filterPanel}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filter by group</Text>
            <TouchableOpacity onPress={() => { setSelectedGroups(null); setShowFilter(false); }}>
              <Text style={styles.filterReset}>Reset</Text>
            </TouchableOpacity>
          </View>
          <ScrollView bounces={false}>
            {groupsWithLocation.map((g) => {
              const active = selectedGroups === null || selectedGroups.has(g.id);
              return (
                <TouchableOpacity key={g.id} style={styles.filterRow} onPress={() => toggleGroup(g.id)}>
                  <View style={[styles.filterIcon, { backgroundColor: g.color + '20' }]}>
                    <Ionicons name={g.icon as any} size={18} color={g.color} />
                  </View>
                  <Text style={styles.filterGroupName}>{g.name}</Text>
                  <View style={[styles.filterCheck, active && { backgroundColor: '#4F46E5', borderColor: '#4F46E5' }]}>
                    {active && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {permissionStatus === 'denied' && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Location access denied — your position won't be shown.</Text>
        </View>
      )}

      {/* Pre-permission popup */}
      <Modal visible={showPopup} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.popup}>
            <View style={styles.popupIcon}>
              <Ionicons name="location" size={32} color="#4F46E5" />
            </View>
            <Text style={styles.popupTitle}>Use your location?</Text>
            <Text style={styles.popupBody}>
              We use your location only to show where you are on the map. It is never stored or shared.
            </Text>
            <TouchableOpacity style={styles.allowBtn} onPress={requestPermission}>
              <Text style={styles.allowBtnText}>Allow location access</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.denyBtn} onPress={declinePermission}>
              <Text style={styles.denyBtnText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  locBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  banner: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  bannerText: { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  popup: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  popupIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  popupTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 10 },
  popupBody: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  allowBtn: {
    width: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  allowBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  denyBtn: { paddingVertical: 10 },
  denyBtnText: { color: '#6B7280', fontSize: 14 },
  filterBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  filterOverlay: { flex: 1 },
  filterPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  filterReset: { fontSize: 14, color: '#4F46E5', fontWeight: '600' },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  filterIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  filterGroupName: { flex: 1, fontSize: 15, fontWeight: '500', color: '#111827' },
  filterCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callout: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    minWidth: 140,
    maxWidth: 220,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  calloutName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  calloutLabel: { fontSize: 12, color: '#6B7280', lineHeight: 16 },
});
