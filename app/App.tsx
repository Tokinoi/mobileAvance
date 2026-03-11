import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { GroupsProvider } from './src/context/GroupsContext';

export default function App() {
  return (
    <GroupsProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <RootNavigator />
      </NavigationContainer>
    </GroupsProvider>
  );
}
