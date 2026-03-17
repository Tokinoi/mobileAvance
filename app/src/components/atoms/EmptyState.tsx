import { View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconSize?: number;
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  iconColor = '#D1D5DB',
  iconSize = 48,
  title,
  subtitle,
  style,
}: EmptyStateProps) {
  return (
    <View
      style={[
        { alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 12 },
        style,
      ]}
    >
      <Ionicons name={icon} size={iconSize} color={iconColor} />
      <Text style={{ fontSize: 15, color: '#9CA3AF' }}>{title}</Text>
      {!!subtitle && (
        <Text style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>{subtitle}</Text>
      )}
    </View>
  );
}
