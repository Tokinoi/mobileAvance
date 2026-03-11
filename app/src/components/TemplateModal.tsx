import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TemplateField, FieldType } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (fields: TemplateField[]) => Promise<string | null>;
  initialFields?: TemplateField[];
}

const FIELD_TYPES: { value: FieldType; label: string; icon: string }[] = [
  { value: 'text', label: 'Text', icon: 'text-outline' },
  { value: 'number', label: 'Number', icon: 'calculator-outline' },
  { value: 'date', label: 'Date', icon: 'calendar-outline' },
  { value: 'rating', label: 'Rating', icon: 'star-outline' },
  { value: 'dropdown', label: 'Dropdown', icon: 'chevron-down-outline' },
  { value: 'toggle', label: 'Toggle', icon: 'toggle-outline' },
  { value: 'image', label: 'Image', icon: 'image-outline' },
];

const DEFAULT_FIELDS: TemplateField[] = [
  { id: 'name', name: 'Name', type: 'text', required: true, visible: true },
];

export function TemplateModal({ visible, onClose, onSave, initialFields }: Props) {
  const [fields, setFields] = useState<TemplateField[]>(initialFields ?? DEFAULT_FIELDS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      const base = initialFields && initialFields.length > 0 ? initialFields : DEFAULT_FIELDS;
      setFields(base.map((f) => ({ ...f, visible: f.visible ?? true })));
      setError(null);
    }
  }, [visible, initialFields]);

  const addField = () => {
    setFields((prev) => [
      ...prev,
      { id: `field_${Date.now()}`, name: '', type: 'text', required: false, visible: true },
    ]);
  };

  const updateField = (index: number, updates: Partial<TemplateField>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const hasName = fields.some((f) => f.id === 'name');
    const toSave = hasName ? fields : [{ id: 'name', name: 'Name', type: 'text' as const, required: true, visible: true }, ...fields];
    setSaving(true);
    setError(null);
    const err = await onSave(toSave);
    setSaving(false);
    if (err) { setError(err); return; }
    onClose();
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
            <Text style={styles.title}>Template Editor</Text>
            <Text style={styles.subtitle}>Define fields for items</Text>
          </View>
          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#1D4ED8" />
            <Text style={styles.infoText}>
              Template fields define what information you'll track for each item in this group.
            </Text>
          </View>

          {/* Fields */}
          {fields.map((field, index) => {
            const isName = field.id === 'name';
            return (
            <View key={field.id} style={styles.fieldCard}>
              {/* Field name + actions */}
              <View style={styles.fieldRow}>
                <Ionicons name="reorder-two-outline" size={20} color={isName ? '#E5E7EB' : '#D1D5DB'} style={{ marginRight: 4 }} />
                <TextInput
                  style={[styles.fieldNameInput, !isName && !field.visible && styles.fieldNameInputHidden]}
                  value={field.name}
                  onChangeText={(v) => !isName && updateField(index, { name: v })}
                  placeholder="Field name"
                  placeholderTextColor="#9CA3AF"
                  editable={!isName}
                />
                {isName ? (
                  <View style={[styles.actionBtn, { opacity: 0.3 }]}>
                    <Ionicons name="eye-outline" size={18} color="#6B7280" />
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => updateField(index, { visible: !field.visible })} style={styles.actionBtn}>
                    <Ionicons
                      name={field.visible ? 'eye-outline' : 'eye-off-outline'}
                      size={18}
                      color={field.visible ? '#6B7280' : '#D1D5DB'}
                    />
                  </TouchableOpacity>
                )}
                {!isName && (
                  <TouchableOpacity onPress={() => removeField(index)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Type picker */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                {FIELD_TYPES.map((t) => {
                  const selected = field.type === t.value;
                  return (
                    <TouchableOpacity
                      key={t.value}
                      style={[styles.typeChip, selected && styles.typeChipSelected]}
                      onPress={() => updateField(index, { type: t.value })}
                    >
                      <Ionicons name={t.icon as any} size={14} color={selected ? '#4F46E5' : '#6B7280'} />
                      <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Dropdown options */}
              {field.type === 'dropdown' && (
                <View style={styles.optionsRow}>
                  <Text style={styles.optionsLabel}>Options (comma separated)</Text>
                  <TextInput
                    style={styles.optionsInput}
                    value={field.options?.join(', ') ?? ''}
                    onChangeText={(v) =>
                      updateField(index, {
                        options: v.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="Option 1, Option 2, Option 3"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              )}

              {/* Required toggle */}
              <View style={styles.requiredRow}>
                <Text style={styles.requiredLabel}>Required</Text>
                <Switch
                  value={field.required}
                  onValueChange={(v) => updateField(index, { required: v })}
                  trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
                  thumbColor={field.required ? '#4F46E5' : '#fff'}
                />
              </View>
            </View>
            );
          })}

          {/* Add field */}
          <TouchableOpacity style={styles.addFieldBtn} onPress={addField}>
            <Ionicons name="add" size={20} color="#374151" />
            <Text style={styles.addFieldText}>Add Field</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280' },
  saveBtn: {
    marginLeft: 'auto',
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: '#DC2626', fontSize: 13 },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 13, color: '#1D4ED8', lineHeight: 18 },
  fieldCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fieldNameInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#111827',
  },
  actionBtn: { padding: 6 },
  fieldNameInputHidden: { opacity: 0.4 },
  typeScroll: { marginHorizontal: -2 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 2,
    backgroundColor: '#F9FAFB',
  },
  typeChipSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  typeChipText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  typeChipTextSelected: { color: '#4F46E5' },
  optionsRow: { gap: 6 },
  optionsLabel: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  optionsInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#111827',
  },
  requiredRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  requiredLabel: { fontSize: 13, color: '#374151', fontWeight: '500' },
  addFieldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
  },
  addFieldText: { fontSize: 14, fontWeight: '600', color: '#374151' },
});
