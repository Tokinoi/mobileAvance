import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setPermissionDenied(true); setReady(true); return; }
      setReady(true);
    })();
  }, []);

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
        showsUserLocation={!permissionDenied}
        showsMyLocationButton={false}
        initialRegion={{
          latitude: 48.8566,
          longitude: 2.3522,
          latitudeDelta: 10,
          longitudeDelta: 10,
        }}
      />

      {!ready && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      )}

      {permissionDenied && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Location permission denied</Text>
        </View>
      )}

      {ready && !permissionDenied && (
        <TouchableOpacity style={styles.locBtn} onPress={goToLocation}>
          <Ionicons name="locate" size={22} color="#4F46E5" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
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
});
