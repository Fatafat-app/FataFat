import '../global.css';
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../services/queryClient';
import { Stack } from 'expo-router';
import { useAuthStore } from '../store/auth.store';
import { useLocationStore } from '../store/location.store';
import { useConfigStore } from '../store/config.store';
import { useNotificationStore } from '../store/notification.store';
import { socketService } from '../services/socket.service';
import { pushNotificationService } from '../services/pushNotification.service';
import { oneSignalService } from '../services/onesignal.service';
import { useOneSignalVerification } from '../hooks/useOneSignalVerification';
import InAppNotificationBanner from '../components/InAppNotificationBanner';

// Early OneSignal initialization
try {
  oneSignalService.initialize();
} catch (e) {
  // Safe fallback
}

export default function RootLayout() {
  const initAuth = useAuthStore((state) => state.initAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    try {
      oneSignalService.initialize();
    } catch (e) {
      // Safe fallback
    }
    initAuth();
    useLocationStore.getState().detectCurrentLocation();
    useConfigStore.getState().fetchBootstrap();
  }, [initAuth]);

  // OneSignal Push Subscription Verification Observer
  useOneSignalVerification();

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
