import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IconBox } from '../atoms/IconBox';
import { Group } from '../types';

interface GroupCardProps {
  group: Group;
  onPress: () => void;
}

export function GroupCard({ group, onPress }: GroupCardProps) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <IconBox icon={group.icon as any} color={group.color} size={24} boxSize={48} borderRadius={12} />
      <View style={styles.body}>
        <Text style={styles.name}>{group.name}</Text>
        <Text style={styles.desc} numberOfLines={1}>{group.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  body: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827' },
  desc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
});
