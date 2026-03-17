import { useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IconBox } from '../atoms/IconBox';
import { Group } from '../../types';
import { ShareToFriendsModal } from '../ShareToFriendsModal';

interface GroupCardProps {
  group: Group;
  onPress: () => void;
}

export function GroupCard({ group, onPress }: GroupCardProps) {
  const [shareVisible, setShareVisible] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
        <IconBox icon={group.icon as any} color={group.color} size={24} boxSize={48} borderRadius={12} />
        <View style={styles.body}>
          <Text style={styles.name}>{group.name}</Text>
          <Text style={styles.desc} numberOfLines={1}>{group.description}</Text>
        </View>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShareVisible(true)} hitSlop={8}>
          <Ionicons name="share-outline" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>

      <ShareToFriendsModal
        visible={shareVisible}
        groupName={group.name}
        onClose={() => setShareVisible(false)}
      />
    </>
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
  actionBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
