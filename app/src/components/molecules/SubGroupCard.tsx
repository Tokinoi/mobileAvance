import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IconBox } from '../atoms/IconBox';
import { Group } from '../types';

interface SubGroupCardProps {
  group: Group;
  onPress: () => void;
}

export function SubGroupCard({ group, onPress }: SubGroupCardProps) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <IconBox icon={group.icon as any} color={group.color} size={20} boxSize={36} borderRadius={10} />
      <Text style={styles.name}>{group.name}</Text>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  name: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
});
