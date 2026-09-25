import { Redirect } from 'expo-router';
import { useAuthStore } from '../store';

export default function Index() {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}
