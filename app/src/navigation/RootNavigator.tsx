import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { TabNavigator } from './TabNavigator';
import { CreateGroupScreen } from '../screens/CreateGroupScreen';
import { GroupDetailScreen } from '../screens/GroupDetailScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { useAuth } from '../context/AuthContext';

export type RootStackParamList = {
  Tabs: undefined;
  CreateGroup: { parentId?: string } | undefined;
  GroupDetail: { groupId: string };
  UserProfile: { userId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!isLoggedIn) return <LoginScreen />;

  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
