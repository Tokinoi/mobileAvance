import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, SafeAreaView, Switch, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TemplateField } from '../types';

interface Props {
  visible: boolean;
  groupId: string;
  fields: TemplateField[] | null;
  onClose: () => void;
  onSave: (name: string, values: Record<string, any>) => Promise<string | null>;
}

const RATING_OPTIONS = [1, 2, 3, 4, 5];

export function AddItemModal({ visible, groupId, fields, onClose, onSave }: Props) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setValues({});
      setError(null);
    }
  }, [visible]);

  const setValue = (id: string, val: any) => setValues((prev) => ({ ...prev, [id]: val }));

  const handleSave = async () => {
    const nameField = fields?.find((f) => f.required && f.type === 'text');
    const name = nameField ? String(values[nameField.id] ?? '') : String(values['name'] ?? '');
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError(null);
    const err = await onSave(name.trim(), values);
    setSaving(false);
    if (err) { setError(err); return; }
    onClose();
  };

  const renderField = (field: TemplateField) => {
    const val = values[field.id];

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <TextInput
            style={styles.input}
            value={val !== undefined ? String(val) : ''}
            onChangeText={(v) => setValue(field.id, field.type === 'number' ? v.replace(/[^0-9.]/g, '') : v)}
            placeholder={field.name}
            placeholderTextColor="#9CA3AF"
            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
          />
        );

      case 'date':
        return (
          <TextInput
            style={styles.input}
            value={val !== undefined ? String(val) : ''}
            onChangeText={(v) => setValue(field.id, v)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
          />
        );

      case 'toggle':
        return (
          <Switch
            value={!!val}
            onValueChange={(v) => setValue(field.id, v)}
            trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
            thumbColor={val ? '#4F46E5' : '#fff'}
          />
        );

      case 'rating':
        return (
          <View style={styles.ratingRow}>
            {RATING_OPTIONS.map((n) => (
              <TouchableOpacity key={n} onPress={() => setValue(field.id, n)}>
                <Ionicons
                  name={n <= (val ?? 0) ? 'star' : 'star-outline'}
                  size={28}
                  color={n <= (val ?? 0) ? '#F59E0B' : '#D1D5DB'}
                />
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'dropdown':
        return (
          <View style={styles.chipsRow}>
            {(field.options ?? []).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, val === opt && styles.chipSelected]}
                onPress={() => setValue(field.id, opt)}
              >
                <Text style={[styles.chipText, val === opt && styles.chipTextSelected]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  const noTemplate = !fields || fields.length === 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Item</Text>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving || noTemplate}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveBtnText}>Save</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {noTemplate ? (
            <View style={styles.noTemplate}>
              <Ionicons name="document-outline" size={48} color="#D1D5DB" />
              <Text style={styles.noTemplateTitle}>No template defined</Text>
              <Text style={styles.noTemplateDesc}>
                Add a template to this group (or a parent group) to start adding items.
              </Text>
            </View>
          ) : (
            fields!.filter((f) => f.visible !== false).map((field) => (
              <View key={field.id} style={styles.fieldCard}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>{field.name}</Text>
                  {field.required && <Text style={styles.required}>*</Text>}
                </View>
                {renderField(field)}
              </View>
            ))
          )}
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
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  saveBtn: { backgroundColor: '#4F46E5', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, minWidth: 56, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: '#DC2626', fontSize: 13 },
  fieldCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', gap: 10, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  required: { color: '#EF4444', fontSize: 14 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#111827' },
  ratingRow: { flexDirection: 'row', gap: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  chipSelected: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  chipText: { fontSize: 13, color: '#6B7280' },
  chipTextSelected: { color: '#4F46E5', fontWeight: '600' },
  noTemplate: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 12 },
  noTemplateTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  noTemplateDesc: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
});
