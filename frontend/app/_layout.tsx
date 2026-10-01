import '../global.css';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useAuthStore } from '../store/auth.store';
import { useLocationStore } from '../store/location.store';
import { useConfigStore } from '../store/config.store';
import { socketService } from '../services/socket.service';
import { pushNotificationService } from '../services/pushNotification.service';
import { useNotificationStore } from '../store/notification.store';
import InAppNotificationBanner from '../components/InAppNotificationBanner';

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
    useLocationStore.getState().detectCurrentLocation();
    useConfigStore.getState().fetchBootstrap();
  }, [initAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
      pushNotificationService.registerForPushNotifications();
      useNotificationStore.getState().fetchNotifications();
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
      <InAppNotificationBanner />
    </QueryClientProvider>
  );
}
