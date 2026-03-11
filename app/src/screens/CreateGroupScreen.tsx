import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useGroups } from '../context/GroupsContext';

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

export function CreateGroupScreen() {
  const navigation = useNavigation();
  const { addGroup } = useGroups();
  const { width } = useWindowDimensions();
  const cellSize = (width - 32 - 32 - 8 * 5) / 6; // padding 16*2, card padding 16*2, 5 gaps
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const err = await addGroup({ name: name.trim(), description: description.trim(), icon: selectedIcon.icon, color: selectedColor });
    setSaving(false);
    if (err) { setError(err); return; }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Group</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preview */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Preview</Text>
          <View style={styles.previewRow}>
            <View style={[styles.previewIcon, { backgroundColor: selectedColor + '20' }]}>
              <Ionicons name={selectedIcon.icon} size={28} color={selectedColor} />
            </View>
            <View>
              <Text style={styles.previewName}>{name || 'Group Name'}</Text>
              <Text style={styles.previewDesc}>{description || 'Group description'}</Text>
            </View>
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Basic Information</Text>
          <Text style={styles.label}>Group Name <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter group name"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={[styles.label, { marginTop: 16 }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Icon Selection */}
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
                  <Ionicons
                    name={item.icon}
                    size={24}
                    color={isSelected ? '#4F46E5' : '#6B7280'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Color Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Color</Text>
          <View style={styles.grid}>
            {COLOR_OPTIONS.map((color) => {
              const isSelected = selectedColor === color;
              return (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={[styles.colorCell, { backgroundColor: color, width: cellSize, height: cellSize }]}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, (!name.trim() || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!name.trim() || saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Create Group</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  card: {
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
  sectionLabel: { fontSize: 13, fontWeight: '500', color: '#6B7280', marginBottom: 12 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  previewIcon: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  previewName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  previewDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
  required: { color: '#EF4444' },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  textarea: { height: 88, paddingTop: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconCell: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  iconCellSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  colorCell: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { color: '#DC2626', fontSize: 13 },
});
