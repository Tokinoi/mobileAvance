import { View, Text, ViewStyle } from 'react-native';

interface ErrorBoxProps {
  message: string | null;
  style?: ViewStyle;
}

export function ErrorBox({ message, style }: ErrorBoxProps) {
  if (!message) return null;
  return (
    <View
      style={[
        {
          backgroundColor: '#FEF2F2',
          borderRadius: 10,
          padding: 12,
          borderWidth: 1,
          borderColor: '#FECACA',
        },
        style,
      ]}
    >
      <Text style={{ color: '#DC2626', fontSize: 13 }}>{message}</Text>
    </View>
  );
}
