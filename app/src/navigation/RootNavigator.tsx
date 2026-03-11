import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { CreateGroupScreen } from '../screens/CreateGroupScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { useAuth } from '../context/AuthContext';

export type RootStackParamList = {
  Tabs: undefined;
  CreateGroup: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) return <LoginScreen />;

  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
