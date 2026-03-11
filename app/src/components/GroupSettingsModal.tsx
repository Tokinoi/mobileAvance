import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, SafeAreaView, Alert, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGroups } from '../context/GroupsContext';
import { Group } from '../types';

const ICON_OPTIONS: { name: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'Book', icon: 'book-outline' },
  { name: 'Game', icon: 'game-controller-outline' },
  { name: 'Food', icon: 'restaurant-outline' },
  { name: 'Shirt', icon: 'shirt-outline' },
  { name: 'Location', icon: 'location-outline' },
  { name: 'Package', icon: 'cube-outline' },
  { name: 'Music', icon: 'musical-notes-outline' },
  { name: 'Film', icon: 'film-outline' },
  { name: 'Camera', icon: 'camera-outline' },
  { name: 'Headphones', icon: 'headset-outline' },
  { name: 'Watch', icon: 'watch-outline' },
  { name: 'Coffee', icon: 'cafe-outline' },
  { name: 'Bike', icon: 'bicycle-outline' },
  { name: 'Fitness', icon: 'barbell-outline' },
  { name: 'Art', icon: 'color-palette-outline' },
  { name: 'Travel', icon: 'airplane-outline' },
  { name: 'Car', icon: 'car-outline' },
  { name: 'Star', icon: 'star-outline' },
];

const COLOR_OPTIONS = [
  '#6366f1', '#ec4899', '#f59e0b', '#8b5cf6',
  '#10b981', '#06b6d4', '#ef4444', '#f97316',
  '#84cc16', '#14b8a6', '#3b82f6', '#a855f7',
];

interface Props {
  visible: boolean;
  group: Group;
  onClose: () => void;
  onDeleted: () => void;
}

export function GroupSettingsModal({ visible, group, onClose, onDeleted }: Props) {
  const { updateGroup, deleteGroup } = useGroups();
  const { width } = useWindowDimensions();
  const cellSize = (width - 32 - 32 - 8 * 5) / 6;

  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [selectedIcon, setSelectedIcon] = useState(
    ICON_OPTIONS.find((i) => i.icon === group.icon) ?? ICON_OPTIONS[0]
  );
  const [selectedColor, setSelectedColor] = useState(group.color);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(group.name);
      setDescription(group.description);
      setSelectedIcon(ICON_OPTIONS.find((i) => i.icon === group.icon) ?? ICON_OPTIONS[0]);
      setSelectedColor(group.color);
      setError(null);
    }
  }, [visible, group]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const err = await updateGroup(group.id, {
      name: name.trim(),
      description: description.trim(),
      icon: selectedIcon.icon,
      color: selectedColor,
    });
    setSaving(false);
    if (err) { setError(err); return; }
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${group.name}"? This will also delete all subgroups.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const err = await deleteGroup(group.id);
            setDeleting(false);
            if (err) { setError(err); return; }
            onClose();
            onDeleted();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#374151" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Group Settings</Text>
            <Text style={styles.subtitle}>{group.name}</Text>
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, (!name.trim() || saving) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!name.trim() || saving}
          >
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Preview */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Preview</Text>
            <View style={styles.previewRow}>
              <View style={[styles.previewIcon, { backgroundColor: selectedColor + '20' }]}>
                <Ionicons name={selectedIcon.icon} size={26} color={selectedColor} />
              </View>
              <View>
                <Text style={styles.previewName}>{name || 'Group Name'}</Text>
                <Text style={styles.previewDesc}>{description || 'Description'}</Text>
              </View>
            </View>
          </View>

          {/* Basic info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Basic Information</Text>
            <Text style={styles.label}>Name <Text style={{ color: '#EF4444' }}>*</Text></Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Group name" placeholderTextColor="#9CA3AF" />
            <Text style={[styles.label, { marginTop: 14 }]}>Description</Text>
            <TextInput style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription} placeholder="Description" placeholderTextColor="#9CA3AF" multiline numberOfLines={3} textAlignVertical="top" />
          </View>

          {/* Icon */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Icon</Text>
            <View style={styles.grid}>
              {ICON_OPTIONS.map((item) => {
                const isSelected = selectedIcon.name === item.name;
                return (
                  <TouchableOpacity
                    key={item.name}
                    onPress={() => setSelectedIcon(item)}
                    style={[styles.iconCell, isSelected && styles.iconCellSelected, { width: cellSize, height: cellSize }]}
                  >
                    <Ionicons name={item.icon} size={22} color={isSelected ? '#4F46E5' : '#6B7280'} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Color */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Color</Text>
            <View style={styles.grid}>
              {COLOR_OPTIONS.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={[styles.colorCell, { backgroundColor: color, width: cellSize, height: cellSize }]}
                >
                  {selectedColor === color && <Ionicons name="checkmark" size={20} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Delete */}
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleting}>
            {deleting
              ? <ActivityIndicator color="#EF4444" />
              : <>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={styles.deleteBtnText}>Delete Group</Text>
                </>
            }
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280' },
  saveBtn: { marginLeft: 'auto', backgroundColor: '#4F46E5', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, minWidth: 56, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: '#DC2626', fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  sectionLabel: { fontSize: 13, fontWeight: '500', color: '#6B7280', marginBottom: 12 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  previewIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  previewName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  previewDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  textarea: { height: 80, paddingTop: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconCell: { borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E5E7EB' },
  iconCellSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  colorCell: { borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: '#FECACA' },
  deleteBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});
