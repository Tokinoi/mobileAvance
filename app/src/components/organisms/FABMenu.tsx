import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FAB } from '../atoms/FAB';

interface FABMenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

interface FABMenuProps {
  open: boolean;
  onToggle: () => void;
  items: FABMenuItem[];
}

export function FABMenu({ open, onToggle, items }: FABMenuProps) {
  return (
    <>
      {open && (
        <>
          <TouchableOpacity style={styles.backdrop} onPress={onToggle} />
          <View style={styles.menu}>
            {items.map((item, index) => (
              <View key={item.label}>
                {index > 0 && <View style={styles.divider} />}
                <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
                  <View style={styles.menuItemIcon}>
                    <Ionicons name={item.icon} size={18} color="#4F46E5" />
                  </View>
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}
      <FAB
        icon={open ? 'close' : 'add'}
        onPress={onToggle}
        style={styles.fab}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  menu: {
    position: 'absolute',
    bottom: 92,
    right: 24,
    backgroundColor: '#fff',
    borderRadius: 14,
    zIndex: 11,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: { fontSize: 15, fontWeight: '500', color: '#111827' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
});
