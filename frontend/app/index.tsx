import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/auth.store';

export default function Index() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEFCE8' }}>
        <ActivityIndicator size="large" color="#CA8A04" />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user.role === 'admin') {
    return <Redirect href="/(admin)/dashboard" />;
  }

  if (user.role === 'restaurant_owner') {
    return <Redirect href="/(owner)/dashboard" />;
  }

  return <Redirect href="/(tabs)" />;
}
