import { View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IconBoxProps {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  size?: number;
  boxSize?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function IconBox({ icon, color, size = 24, boxSize = 48, borderRadius = 12, style }: IconBoxProps) {
  return (
    <View
      style={[
        {
          width: boxSize,
          height: boxSize,
          borderRadius,
          backgroundColor: color + '20',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </View>
  );
}
