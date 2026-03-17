import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LocationPermissionPopupProps {
  visible: boolean;
  title?: string;
  body?: string;
  allowLabel?: string;
  declineLabel?: string;
  onAllow: () => void;
  onDecline: () => void;
}

export function LocationPermissionPopup({
  visible,
  title = 'Use your location?',
  body = 'We use your location only to show where you are on the map. It is never stored or shared.',
  allowLabel = 'Allow location access',
  declineLabel = 'Not now',
  onAllow,
  onDecline,
}: LocationPermissionPopupProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="location" size={32} color="#4F46E5" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <TouchableOpacity style={styles.allowBtn} onPress={onAllow}>
            <Text style={styles.allowBtnText}>{allowLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
            <Text style={styles.declineBtnText}>{declineLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
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
    gap: 12,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  body: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  allowBtn: {
    width: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  allowBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  declineBtn: { paddingVertical: 10 },
  declineBtnText: { color: '#6B7280', fontSize: 14 },
});
