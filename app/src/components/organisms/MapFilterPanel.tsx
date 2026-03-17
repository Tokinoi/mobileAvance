import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IconBox } from '../atoms/IconBox';
import { Badge } from '../atoms/Badge';
import { Group } from '../types';

interface MapFilterButtonProps {
  onPress: () => void;
  activeCount: number | null;
  totalCount: number;
}

export function MapFilterButton({ onPress, activeCount, totalCount }: MapFilterButtonProps) {
  const showBadge = activeCount !== null && activeCount < totalCount;
  return (
    <TouchableOpacity style={styles.filterBtn} onPress={onPress}>
      <Ionicons name="filter" size={18} color="#4F46E5" />
      {showBadge && (
        <Badge
          count={activeCount!}
          style={{ position: 'absolute', top: -2, right: -2 }}
        />
      )}
    </TouchableOpacity>
  );
}

interface MapFilterPanelProps {
  visible: boolean;
  onClose: () => void;
  groups: Group[];
  selectedGroups: Set<string> | null;
  onToggleGroup: (id: string) => void;
  onReset: () => void;
}

export function MapFilterPanel({
  visible,
  onClose,
  groups,
  selectedGroups,
  onToggleGroup,
  onReset,
}: MapFilterPanelProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Filter by group</Text>
          <TouchableOpacity onPress={() => { onReset(); onClose(); }}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>
        <ScrollView bounces={false}>
          {groups.map((g) => {
            const active = selectedGroups === null || selectedGroups.has(g.id);
            return (
              <TouchableOpacity key={g.id} style={styles.row} onPress={() => onToggleGroup(g.id)}>
                <IconBox icon={g.icon as any} color={g.color} size={18} boxSize={36} borderRadius={10} />
                <Text style={styles.rowName}>{g.name}</Text>
                <View style={[styles.check, active && styles.checkActive]}>
                  {active && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  overlay: { flex: 1 },
  panel: {
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
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  panelTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  resetText: { fontSize: 14, color: '#4F46E5', fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  rowName: { flex: 1, fontSize: 15, fontWeight: '500', color: '#111827' },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
});
