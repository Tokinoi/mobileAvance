import { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useGroups } from '../context/GroupsContext';
import { TemplateModal } from '../components/TemplateModal';
import { GroupSettingsModal } from '../components/GroupSettingsModal';
import { AddItemModal } from '../components/AddItemModal';
import { ItemDetailModal } from '../components/ItemDetailModal';
import { Item } from '../types';
import { ScreenShell } from '../components/templates/ScreenShell';
import { GroupDetailHeader } from '../components/organisms/GroupDetailHeader';
import { FABMenu } from '../components/organisms/FABMenu';
import { SubGroupCard } from '../components/molecules/SubGroupCard';
import { ItemCard } from '../components/molecules/ItemCard';
import { EmptyState } from '../components/atoms/EmptyState';

type GroupDetailRouteProp = RouteProp<RootStackParamList, 'GroupDetail'>;

export function GroupDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<GroupDetailRouteProp>();
  const { groupId } = route.params;
  const { groups, getSubGroups, saveTemplate, resolveTemplate, addItem, updateItem, getGroupItems } = useGroups();
  const [templateVisible, setTemplateVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [addItemVisible, setAddItemVisible] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const group = groups.find((g) => g.id === groupId);
  const subGroups = getSubGroups(groupId);
  const groupItems = getGroupItems(groupId);
  if (!group) {
    return (
      <ScreenShell>
        <View style={styles.centered}>
          <Text style={styles.notFound}>Group not found</Text>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell style={{ paddingTop: 16 }}>
      <GroupDetailHeader
        group={group}
        onBack={() => group.parentId
          ? navigation.navigate('GroupDetail', { groupId: group.parentId })
          : navigation.goBack()
        }
        onTemplatePress={() => setTemplateVisible(true)}
        onSettingsPress={() => setSettingsVisible(true)}
      />

      <FlatList
        data={[
          ...subGroups.map((s) => ({ kind: 'subgroup' as const, id: s.id, item: s as any })),
          ...(groupItems.length > 0 ? [{ kind: 'header' as const, id: '__items_header__', item: null as any }] : []),
          ...groupItems.map((i) => ({ kind: 'item' as const, id: i.id, item: i as any })),
        ]}
        keyExtractor={(entry) => entry.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          subGroups.length > 0 ? <Text style={styles.sectionTitle}>Subgroups</Text> : null
        }
        renderItem={({ item: entry }) => {
          if (entry.kind === 'header') {
            return <Text style={[styles.sectionTitle, { marginTop: subGroups.length > 0 ? 8 : 0 }]}>Items</Text>;
          }
          if (entry.kind === 'subgroup') {
            const s = entry.item as typeof subGroups[0];
            return (
              <SubGroupCard
                group={s}
                onPress={() => navigation.navigate('GroupDetail', { groupId: s.id })}
              />
            );
          }
          const i = entry.item as typeof groupItems[0];
          const template = resolveTemplate(groupId);
          const visibleFields = (template ?? []).filter((f) => f.visible !== false && f.id !== 'name');
          return (
            <ItemCard
              item={i}
              groupColor={group.color}
              groupIcon={group.icon}
              visibleFields={visibleFields}
              onPress={() => setSelectedItem(i)}
            />
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon={group.icon as any}
            iconColor={group.color}
            iconSize={32}
            title="No items yet"
            subtitle="Tap the + button to add your first item"
          />
        }
      />

      <FABMenu
        open={fabOpen}
        onToggle={() => setFabOpen((v) => !v)}
        items={[
          {
            icon: 'folder-outline',
            label: 'SubGroup',
            onPress: () => { setFabOpen(false); navigation.navigate('CreateGroup', { parentId: groupId }); },
          },
          {
            icon: 'document-outline',
            label: 'Item',
            onPress: () => { setFabOpen(false); setAddItemVisible(true); },
          },
        ]}
      />

      <TemplateModal
        visible={templateVisible}
        onClose={() => setTemplateVisible(false)}
        initialFields={group?.template}
        onSave={(fields) => saveTemplate(groupId, fields)}
      />

      <GroupSettingsModal
        visible={settingsVisible}
        group={group}
        onClose={() => setSettingsVisible(false)}
        onDeleted={() => navigation.goBack()}
      />

      <AddItemModal
        visible={addItemVisible}
        groupId={groupId}
        fields={resolveTemplate(groupId)}
        onClose={() => setAddItemVisible(false)}
        onSave={(name, values) => addItem(groupId, name, values)}
      />

      <ItemDetailModal
        visible={!!selectedItem}
        item={selectedItem}
        fields={resolveTemplate(groupId)}
        groupColor={group.color}
        groupIcon={group.icon}
        onClose={() => setSelectedItem(null)}
        onEdit={() => { setEditingItem(selectedItem); setSelectedItem(null); }}
      />

      <AddItemModal
        visible={!!editingItem}
        groupId={groupId}
        fields={resolveTemplate(groupId)}
        editMode
        initialValues={editingItem ? { ...editingItem.data, name: editingItem.name } : {}}
        onClose={() => setEditingItem(null)}
        onSave={(name, values) => updateItem(editingItem!.id, name, values)}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { color: '#6B7280', fontSize: 16 },
  listContent: { flexGrow: 1, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
});
