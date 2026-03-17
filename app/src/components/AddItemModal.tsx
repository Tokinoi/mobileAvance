import { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, SafeAreaView, Switch, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { TemplateField } from '../types';
import { IconButton } from './atoms/IconButton';
import { ErrorBox } from './atoms/ErrorBox';
import { LocationPermissionPopup } from './organisms/LocationPermissionPopup';

interface Props {
  visible: boolean;
  groupId: string;
  fields: TemplateField[] | null;
  onClose: () => void;
  onSave: (name: string, values: Record<string, any>) => Promise<string | null>;
  initialValues?: Record<string, any>;
  editMode?: boolean;
}

const RATING_OPTIONS = [1, 2, 3, 4, 5];

interface LocationValue {
  label: string;
  latitude?: number;
  longitude?: number;
}

function LocationField({ value, onChange }: { value: LocationValue | undefined; onChange: (v: LocationValue) => void }) {
  const [query, setQuery] = useState(value?.label ?? '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [permModal, setPermModal] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = (text: string) => {
    setQuery(text);
    onChange({ label: text });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text || text.length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5&addressdetails=1`,
          { headers: { 'User-Agent': 'CollectionManagerApp/1.0' } }
        );
        setSuggestions(await res.json());
      } catch {}
      setSearching(false);
    }, 600);
  };

  const selectSuggestion = (item: any) => {
    const label = item.display_name;
    setQuery(label);
    setSuggestions([]);
    onChange({ label, latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) });
  };

  const locate = async () => {
    setLocating(true);
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      const label = geo
        ? [geo.name, geo.street, geo.city, geo.country].filter(Boolean).join(', ')
        : `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
      setQuery(label);
      setSuggestions([]);
      onChange({ label, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {}
    setLocating(false);
  };

  const handlePin = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') { setPermModal(true); return; }
    await locate();
  };

  const requestAndLocate = async () => {
    setPermModal(false);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') await locate();
  };

  return (
    <View style={locStyles.container}>
      <View style={locStyles.inputRow}>
        <TextInput
          style={locStyles.input}
          value={query}
          onChangeText={search}
          placeholder="Search address…"
          placeholderTextColor="#9CA3AF"
        />
        {searching
          ? <ActivityIndicator size="small" color="#4F46E5" style={locStyles.pin} />
          : (
            <TouchableOpacity style={locStyles.pin} onPress={handlePin} disabled={locating}>
              {locating
                ? <ActivityIndicator size="small" color="#4F46E5" />
                : <Ionicons name="location" size={20} color="#4F46E5" />}
            </TouchableOpacity>
          )}
      </View>

      {suggestions.length > 0 && (
        <View style={locStyles.suggestions}>
          {suggestions.map((item) => (
            <TouchableOpacity key={item.place_id} style={locStyles.suggestion} onPress={() => selectSuggestion(item)}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={locStyles.suggestionText} numberOfLines={2}>{item.display_name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <LocationPermissionPopup
        visible={permModal}
        title="Location Access"
        body="We need your location to auto-fill this field with your current position."
        allowLabel="Allow Location"
        declineLabel="Cancel"
        onAllow={requestAndLocate}
        onDecline={() => setPermModal(false)}
      />
    </View>
  );
}

const locStyles = StyleSheet.create({
  container: { gap: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, paddingLeft: 12, overflow: 'hidden',
  },
  input: { flex: 1, fontSize: 15, color: '#111827', paddingVertical: 10 },
  pin: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  suggestions: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  suggestion: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  suggestionText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 18 },
});

function ImageField({ value, onChange }: { value: string | undefined; onChange: (v: string) => void }) {
  const [permModal, setPermModal] = useState(false);
  const pendingCamera = useRef(false);

  const handlePress = async (useCamera: boolean) => {
    const cam = await ImagePicker.getCameraPermissionsAsync();
    const lib = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (cam.status !== 'granted' || lib.status !== 'granted') {
      pendingCamera.current = useCamera;
      setPermModal(true);
      return;
    }
    await launch(useCamera);
  };

  const launch = async (useCamera: boolean) => {
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets[0]) onChange(result.assets[0].uri);
  };

  const onAllow = async () => {
    setPermModal(false);
    await ImagePicker.requestCameraPermissionsAsync();
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    await launch(pendingCamera.current);
  };

  return (
    <View>
      {value ? (
        <View style={imgStyles.preview}>
          <Image source={{ uri: value }} style={imgStyles.image} resizeMode="cover" />
          <TouchableOpacity style={imgStyles.removeBtn} onPress={() => onChange('')}>
            <Ionicons name="close-circle" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={imgStyles.btnRow}>
          <TouchableOpacity style={imgStyles.btn} onPress={() => handlePress(false)}>
            <Ionicons name="image-outline" size={20} color="#4F46E5" />
            <Text style={imgStyles.btnText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={imgStyles.btn} onPress={() => handlePress(true)}>
            <Ionicons name="camera-outline" size={20} color="#4F46E5" />
            <Text style={imgStyles.btnText}>Camera</Text>
          </TouchableOpacity>
        </View>
      )}
      <LocationPermissionPopup
        visible={permModal}
        title="Camera & Storage Access"
        body="We need access to your camera and photo library to attach images to items."
        allowLabel="Allow Access"
        declineLabel="Cancel"
        onAllow={onAllow}
        onDecline={() => setPermModal(false)}
      />
    </View>
  );
}

const imgStyles = StyleSheet.create({
  btnRow: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#EEF2FF', borderRadius: 10, paddingVertical: 12,
    borderWidth: 1, borderColor: '#C7D2FE',
  },
  btnText: { fontSize: 14, fontWeight: '600', color: '#4F46E5' },
  preview: { position: 'relative' },
  image: { width: '100%', height: 180, borderRadius: 10 },
  removeBtn: { position: 'absolute', top: 6, right: 6, backgroundColor: '#fff', borderRadius: 12 },
});

export function AddItemModal({ visible, groupId, fields, onClose, onSave, initialValues, editMode }: Props) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setValues(initialValues ?? {});
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

      case 'location':
        return (
          <LocationField
            value={val}
            onChange={(v) => setValue(field.id, v)}
          />
        );

      case 'image':
        return (
          <ImageField
            value={val}
            onChange={(v) => setValue(field.id, v)}
          />
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
          <IconButton icon="close" onPress={onClose} />
          <Text style={styles.title}>{editMode ? 'Edit Item' : 'Add Item'}</Text>
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
          <ErrorBox message={error} />

          {noTemplate ? (
            <View style={styles.noTemplate}>
              <Ionicons name="document-outline" size={48} color="#D1D5DB" />
              <Text style={styles.noTemplateTitle}>No template defined</Text>
              <Text style={styles.noTemplateDesc}>
                Add a template to this group (or a parent group) to start adding items.
              </Text>
            </View>
          ) : (
            fields!.map((field) => (
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
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  saveBtn: { backgroundColor: '#4F46E5', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, minWidth: 56, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
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
