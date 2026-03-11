import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useGroups } from '../context/GroupsContext';

type GroupDetailRouteProp = RouteProp<RootStackParamList, 'GroupDetail'>;

export function GroupDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<GroupDetailRouteProp>();
  const { groupId } = route.params;
  const { groups } = useGroups();

  const group = groups.find((g) => g.id === groupId);

  if (!group) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.notFound}>Group not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="settings-outline" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Group info */}
      <View style={styles.groupInfo}>
        <View style={[styles.groupIcon, { backgroundColor: group.color + '20' }]}>
          <Ionicons name={group.icon as any} size={32} color={group.color} />
        </View>
        <View style={styles.groupMeta}>
          <Text style={styles.groupName}>{group.name}</Text>
          {!!group.description && <Text style={styles.groupDesc}>{group.description}</Text>}
          <Text style={styles.groupCount}>{group.itemCount} items</Text>
        </View>
      </View>

      {/* Empty state */}
      <FlatList
        data={[]}
        keyExtractor={(item) => item}
        renderItem={() => null}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: group.color + '15' }]}>
              <Ionicons name={group.icon as any} size={32} color={group.color} />
            </View>
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.emptySubtitle}>Tap the + button to add your first item</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { color: '#6B7280', fontSize: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: { flex: 1 },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  groupIcon: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  groupMeta: { flex: 1 },
  groupName: { fontSize: 22, fontWeight: '700', color: '#111827' },
  groupDesc: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  groupCount: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  listContent: { flexGrow: 1, padding: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
