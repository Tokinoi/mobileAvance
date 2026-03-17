import { ReactNode } from 'react';
import { ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenShellProps {
  children: ReactNode;
  backgroundColor?: string;
  style?: ViewStyle;
}

export function ScreenShell({ children, backgroundColor = '#F9FAFB', style }: ScreenShellProps) {
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor }, style]}>
      {children}
    </SafeAreaView>
  );
}
