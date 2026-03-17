import { useRef, useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { useGroups } from '../context/GroupsContext';
import { FAB } from '../components/atoms/FAB';
import { LocationPermissionPopup } from '../components/organisms/LocationPermissionPopup';
import { MapFilterButton, MapFilterPanel } from '../components/organisms/MapFilterPanel';
import { ItemDetailModal } from '../components/ItemDetailModal';

interface PinnedItem {
  id: string;
  name: string;
  label: string;
  latitude: number;
  longitude: number;
  groupColor: string;
  groupIcon: string;
  groupId: string;
}

export function MapScreen() {
  const { items, groups, resolveTemplate } = useGroups();
  const mapRef = useRef<MapView>(null);
  const [permissionStatus, setPermissionStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [showPopup, setShowPopup] = useState(false);

  const centeredRef = useRef(false);

  const centerOnUser = async () => {
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      mapRef.current?.animateToRegion({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 800);
    } catch {}
  };

  // Re-check permission every time the screen is focused
  useFocusEffect(useCallback(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        setPermissionStatus('granted');
        setShowPopup(false);
        if (!centeredRef.current) {
          centeredRef.current = true;
          centerOnUser();
        }
      } else {
        setPermissionStatus('idle');
        setShowPopup(true);
      }
    });
  }, []));
  const [showFilter, setShowFilter] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Set<string> | null>(null); // null = all
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

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
            groupIcon: group?.icon ?? 'cube-outline',
            groupId: item.groupId,
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
    if (status === 'granted') {
      setPermissionStatus('granted');
      centeredRef.current = true;
      centerOnUser();
    } else {
      setPermissionStatus('denied');
    }
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
            onPress={() => setSelectedItemId(pin.id)}
          >
            <View style={styles.pinContainer}>
              <View style={[styles.pinCircle, { backgroundColor: pin.groupColor }]}>
                <View style={styles.pinInner} />
              </View>
              <View style={[styles.pinTip, { borderTopColor: pin.groupColor }]} />
            </View>
          </Marker>
        ))}
      </MapView>

      {permissionStatus === 'granted' && (
        <FAB
          icon="locate"
          onPress={goToLocation}
          backgroundColor="#fff"
          color="#4F46E5"
          size={48}
          style={styles.locBtn}
        />
      )}

      {groupsWithLocation.length > 0 && (
        <MapFilterButton
          onPress={() => setShowFilter(true)}
          activeCount={selectedGroups !== null ? selectedGroups.size : null}
          totalCount={groupsWithLocation.length}
        />
      )}

      <MapFilterPanel
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        groups={groupsWithLocation}
        selectedGroups={selectedGroups}
        onToggleGroup={toggleGroup}
        onReset={() => setSelectedGroups(null)}
      />

      {permissionStatus === 'denied' && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Location access denied — your position won't be shown.</Text>
        </View>
      )}

      <LocationPermissionPopup
        visible={showPopup}
        onAllow={requestPermission}
        onDecline={declinePermission}
      />

      {(() => {
        const item = items.find((i) => i.id === selectedItemId) ?? null;
        const pin = pinnedItems.find((p) => p.id === selectedItemId);
        const fields = pin ? resolveTemplate(pin.groupId) ?? [] : [];
        return (
          <ItemDetailModal
            visible={selectedItemId !== null}
            item={item}
            fields={fields}
            groupColor={pin?.groupColor ?? '#4F46E5'}
            groupIcon={pin?.groupIcon ?? 'cube-outline'}
            onClose={() => setSelectedItemId(null)}
            onEdit={() => setSelectedItemId(null)}
          />
        );
      })()}
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
  pinContainer: { alignItems: 'center' },
  pinCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  pinInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.7)' },
  pinTip: {
    width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    marginTop: -1,
  },
});
