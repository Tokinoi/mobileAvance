import { useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Text, Modal } from 'react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [permissionStatus, setPermissionStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [showPopup, setShowPopup] = useState(true);

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
      />

      {permissionStatus === 'granted' && (
        <TouchableOpacity style={styles.locBtn} onPress={goToLocation}>
          <Ionicons name="locate" size={22} color="#4F46E5" />
        </TouchableOpacity>
      )}

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
});
