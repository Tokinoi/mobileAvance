import { View, Text, ViewStyle } from 'react-native';

interface BadgeProps {
  count: number;
  color?: string;
  textColor?: string;
  size?: number;
  style?: ViewStyle;
}

export function Badge({ count, color = '#EF4444', textColor = '#fff', size = 16, style }: BadgeProps) {
  if (count <= 0) return null;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text style={{ color: textColor, fontSize: size * 0.56, fontWeight: '700' }}>{count}</Text>
    </View>
  );
}
