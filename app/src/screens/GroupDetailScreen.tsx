import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useGroups } from '../context/GroupsContext';
import { TemplateModal } from '../components/TemplateModal';
import { GroupSettingsModal } from '../components/GroupSettingsModal';

type GroupDetailRouteProp = RouteProp<RootStackParamList, 'GroupDetail'>;

export function GroupDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<GroupDetailRouteProp>();
  const { groupId } = route.params;
  const { groups, getSubGroups, resolveTemplate, saveTemplate } = useGroups();
  const [templateVisible, setTemplateVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const subGroups = getSubGroups(groupId);
  const resolvedTemplate = group ? resolveTemplate(group) : null;

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
        <TouchableOpacity
          onPress={() => group.parentId
            ? navigation.navigate('GroupDetail', { groupId: group.parentId })
            : navigation.goBack()
          }
          style={styles.iconBtn}
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </TouchableOpacity>

        <View style={[styles.groupIcon, { backgroundColor: group.color + '20' }]}>
          <Ionicons name={group.icon as any} size={24} color={group.color} />
        </View>

        <View style={styles.groupMeta}>
          <Text style={styles.groupName}>{group.name}</Text>
          {!!group.description && <Text style={styles.groupDesc} numberOfLines={1}>{group.description}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.templateBtn, !resolvedTemplate && styles.templateBtnNone, resolvedTemplate?.inherited && styles.templateBtnInherited]}
          onPress={() => setTemplateVisible(true)}
        >
          <Ionicons
            name={resolvedTemplate ? 'list-outline' : 'add-outline'}
            size={16}
            color={resolvedTemplate?.inherited ? '#7C3AED' : resolvedTemplate ? '#4F46E5' : '#9CA3AF'}
          />
          <Text style={[styles.templateBtnText, !resolvedTemplate && styles.templateBtnTextNone, resolvedTemplate?.inherited && styles.templateBtnTextInherited]}>
            {resolvedTemplate?.inherited ? 'Inherited' : resolvedTemplate ? 'Template' : 'No Template'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, { marginLeft: 8 }]} onPress={() => setSettingsVisible(true)}>
          <Ionicons name="settings-outline" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={subGroups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={subGroups.length > 0 ? (
          <Text style={styles.sectionTitle}>Subgroups</Text>
        ) : null}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.subGroupCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
          >
            <View style={[styles.subGroupIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <Text style={styles.subGroupName}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
          </TouchableOpacity>
        )}
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

      {/* FAB popup */}
      {fabOpen && (
        <>
          <TouchableOpacity style={styles.fabBackdrop} onPress={() => setFabOpen(false)} />
          <View style={styles.fabMenu}>
            <TouchableOpacity style={styles.fabMenuItem} onPress={() => { setFabOpen(false); navigation.navigate('CreateGroup', { parentId: groupId }); }}>
              <View style={styles.fabMenuIcon}>
                <Ionicons name="folder-outline" size={18} color="#4F46E5" />
              </View>
              <Text style={styles.fabMenuText}>SubGroup</Text>
            </TouchableOpacity>
            <View style={styles.fabMenuDivider} />
            <TouchableOpacity style={styles.fabMenuItem} onPress={() => setFabOpen(false)}>
              <View style={styles.fabMenuIcon}>
                <Ionicons name="document-outline" size={18} color="#4F46E5" />
              </View>
              <Text style={styles.fabMenuText}>Item</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setFabOpen((v) => !v)}>
        <Ionicons name={fabOpen ? 'close' : 'add'} size={28} color="#fff" />
      </TouchableOpacity>

      <TemplateModal
        visible={templateVisible}
        onClose={() => setTemplateVisible(false)}
        initialFields={resolvedTemplate?.fields}
        onSave={(fields) => saveTemplate(groupId, fields)}
      />

      <GroupSettingsModal
        visible={settingsVisible}
        group={group}
        onClose={() => setSettingsVisible(false)}
        onDeleted={() => navigation.goBack()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB', paddingTop: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { color: '#6B7280', fontSize: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
  },
  templateBtnText: { color: '#4F46E5', fontSize: 13, fontWeight: '600' },
  templateBtnNone: { backgroundColor: '#F3F4F6' },
  templateBtnInherited: { backgroundColor: '#F5F3FF' },
  templateBtnTextNone: { color: '#9CA3AF' },
  templateBtnTextInherited: { color: '#7C3AED' },
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
  groupIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  groupMeta: { flex: 1 },
  groupName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  groupDesc: { fontSize: 12, color: '#6B7280' },
  groupCount: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  listContent: { flexGrow: 1, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  subGroupCard: {
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
  subGroupIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  subGroupName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
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
  fabBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  fabMenu: {
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
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fabMenuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabMenuText: { fontSize: 15, fontWeight: '500', color: '#111827' },
  fabMenuDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },
});
