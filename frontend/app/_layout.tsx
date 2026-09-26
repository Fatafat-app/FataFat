import '../global.css';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useAuthStore } from '../store/auth.store';
import { socketService } from '../services/socket.service';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

export default function RootLayout() {
  const initAuth = useAuthStore((state) => state.initAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="restaurant/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="food/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="order/index" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
