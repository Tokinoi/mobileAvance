import { useRef } from 'react';
import {
  Modal, View, Text, ScrollView, StyleSheet, SafeAreaView, Image,
  PanResponder, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Item, TemplateField } from '../types';
import { IconButton } from './atoms/IconButton';
import { IconBox } from './atoms/IconBox';

interface Props {
  visible: boolean;
  item: Item | null;
  fields: TemplateField[] | null;
  groupColor: string;
  groupIcon: string;
  onClose: () => void;
  onEdit: () => void;
}

const RATING_OPTIONS = [1, 2, 3, 4, 5];
const DISMISS_THRESHOLD = 120;

function renderValue(field: TemplateField, val: any) {
  if (val === undefined || val === null || val === '') {
    return <Text style={styles.emptyValue}>—</Text>;
  }

  switch (field.type) {
    case 'toggle':
      return (
        <View style={[styles.badge, val ? styles.badgeOn : styles.badgeOff]}>
          <Text style={[styles.badgeText, val ? styles.badgeTextOn : styles.badgeTextOff]}>
            {val ? 'Yes' : 'No'}
          </Text>
        </View>
      );

    case 'rating':
      return (
        <View style={styles.ratingRow}>
          {RATING_OPTIONS.map((n) => (
            <Ionicons
              key={n}
              name={n <= val ? 'star' : 'star-outline'}
              size={22}
              color={n <= val ? '#F59E0B' : '#D1D5DB'}
            />
          ))}
        </View>
      );

    case 'location':
      if (typeof val === 'object' && val.label) {
        return (
          <View style={styles.locationRow}>
            <Ionicons name="location" size={15} color="#4F46E5" />
            <Text style={styles.locationText}>{val.label}</Text>
          </View>
        );
      }
      return <Text style={styles.value}>{String(val)}</Text>;

    case 'image':
      return <Image source={{ uri: val }} style={styles.image} resizeMode="cover" />;

    default:
      return <Text style={styles.value}>{String(val)}</Text>;
  }
}

export function ItemDetailModal({ visible, item, fields, groupColor, groupIcon, onClose, onEdit }: Props) {
  const translateY = useRef(new Animated.Value(0)).current;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > DISMISS_THRESHOLD || gs.vy > 0.8) {
          Animated.timing(translateY, { toValue: 800, duration: 250, useNativeDriver: true }).start(onClose);
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  if (!item) return null;

  const allFields = fields ?? [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.animated, { transform: [{ translateY }] }]}>
        <SafeAreaView style={styles.safe}>
          {/* Drag handle */}
          <View style={styles.handleArea} {...pan.panHandlers}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <IconButton icon="close" onPress={onClose} />
            <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
            <IconButton
              icon="pencil-outline"
              onPress={onEdit}
              backgroundColor="#EEF2FF"
              iconColor="#4F46E5"
              iconSize={18}
            />
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Hero icon */}
            <View style={styles.hero}>
              <IconBox icon={groupIcon as any} color={groupColor} size={40} boxSize={80} borderRadius={24} />
              <Text style={styles.heroName}>{item.name}</Text>
            </View>

            {/* Fields */}
            {allFields.map((field) => {
              const val = item.data[field.id];
              return (
                <View key={field.id} style={styles.fieldCard}>
                  <View style={styles.fieldHeader}>
                    <Text style={styles.fieldLabel}>{field.name}</Text>
                    {!field.visible && (
                      <Ionicons name="eye-off-outline" size={13} color="#D1D5DB" />
                    )}
                  </View>
                  {renderValue(field, val)}
                </View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  animated: { flex: 1, backgroundColor: '#F9FAFB' },
  safe: { flex: 1 },
  handleArea: { alignItems: 'center', paddingVertical: 10, backgroundColor: '#F9FAFB' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  hero: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  heroName: { fontSize: 22, fontWeight: '700', color: '#111827', textAlign: 'center' },
  fieldCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#F3F4F6', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 15, color: '#111827', fontWeight: '500' },
  emptyValue: { fontSize: 15, color: '#D1D5DB', fontStyle: 'italic' },
  ratingRow: { flexDirection: 'row', gap: 4 },
  badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  badgeOn: { backgroundColor: '#F0FDF4' },
  badgeOff: { backgroundColor: '#F9FAFB' },
  badgeText: { fontSize: 14, fontWeight: '600' },
  badgeTextOn: { color: '#16A34A' },
  badgeTextOff: { color: '#9CA3AF' },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  locationText: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500', lineHeight: 20 },
  image: { width: '100%', height: 200, borderRadius: 10 },
});
