import { TouchableOpacity, View, Text, StyleSheet, Image } from 'react-native';
import { IconBox } from '../atoms/IconBox';
import { Item, TemplateField } from '../types';

interface ItemCardProps {
  item: Item;
  groupColor: string;
  groupIcon: string;
  visibleFields: TemplateField[];
  onPress: () => void;
}

export function ItemCard({ item, groupColor, groupIcon, visibleFields, onPress }: ItemCardProps) {
  const imageField = visibleFields.find((f) => f.type === 'image' && item.data[f.id]);
  const imageUri: string | undefined = imageField ? item.data[imageField.id] : undefined;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <IconBox icon={groupIcon as any} color={groupColor} size={18} boxSize={36} borderRadius={10} />
      )}
      <View style={styles.body}>
        <Text style={styles.name}>{item.name}</Text>
        {visibleFields.length > 0 && (
          <View style={styles.fields}>
            {visibleFields.map((f) => {
              const val = item.data[f.id];
              if (val === undefined || val === null || val === '') return null;
              if (f.type === 'image') return null;
              const display =
                f.type === 'location' && typeof val === 'object'
                  ? (val.label ?? `${val.latitude?.toFixed(4)}, ${val.longitude?.toFixed(4)}`)
                  : String(val);
              return (
                <View key={f.id} style={styles.field}>
                  <Text style={styles.fieldLabel}>{f.name}:</Text>
                  <Text style={styles.fieldValue}>{display}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
  thumbnail: { width: 36, height: 36, borderRadius: 10 },
  body: { flex: 1, gap: 4 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827' },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  field: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  fieldLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  fieldValue: { fontSize: 12, color: '#6B7280' },
});
