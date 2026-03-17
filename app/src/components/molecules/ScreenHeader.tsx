import { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { IconButton } from '../atoms/IconButton';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: ReactNode;
  style?: ViewStyle;
}

export function ScreenHeader({ title, onBack, rightElement, style }: ScreenHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      {onBack && (
        <IconButton icon="arrow-back" onPress={onBack} style={{ marginRight: 2 }} />
      )}
      <Text style={styles.title}>{title}</Text>
      {rightElement}
    </View>
  );
}

const styles = StyleSheet.create({
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
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#111827' },
});
