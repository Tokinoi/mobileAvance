import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IconBox } from '../atoms/IconBox';
import { IconButton } from '../atoms/IconButton';
import { Group } from '../types';

interface GroupDetailHeaderProps {
  group: Group;
  onBack: () => void;
  onTemplatePress?: () => void;
  onSettingsPress?: () => void;
}

export function GroupDetailHeader({ group, onBack, onTemplatePress, onSettingsPress }: GroupDetailHeaderProps) {
  const hasTemplate = (group.template?.length ?? 0) > 0;

  return (
    <View style={styles.header}>
      <IconButton icon="arrow-back" onPress={onBack} />

      <IconBox icon={group.icon as any} color={group.color} size={24} boxSize={36} borderRadius={10} />

      <View style={styles.meta}>
        <Text style={styles.name}>{group.name}</Text>
        {!!group.description && (
          <Text style={styles.desc} numberOfLines={1}>{group.description}</Text>
        )}
      </View>

      {!!onTemplatePress && (
        <TouchableOpacity
          style={[styles.templateBtn, hasTemplate ? styles.templateBtnHas : styles.templateBtnNone]}
          onPress={onTemplatePress}
        >
          <Ionicons
            name={hasTemplate ? 'list-outline' : 'add-outline'}
            size={16}
            color={hasTemplate ? '#16A34A' : '#9CA3AF'}
          />
          <Text style={[styles.templateBtnText, hasTemplate ? styles.templateBtnTextHas : styles.templateBtnTextNone]}>
            {hasTemplate ? 'Template' : 'No Template'}
          </Text>
        </TouchableOpacity>
      )}

      {!!onSettingsPress && (
        <IconButton icon="settings-outline" onPress={onSettingsPress} style={{ marginLeft: 8 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  meta: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  desc: { fontSize: 12, color: '#6B7280' },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
  },
  templateBtnHas: { backgroundColor: '#F0FDF4' },
  templateBtnNone: { backgroundColor: '#F3F4F6' },
  templateBtnText: { fontSize: 13, fontWeight: '600' },
  templateBtnTextHas: { color: '#16A34A' },
  templateBtnTextNone: { color: '#9CA3AF' },
});
