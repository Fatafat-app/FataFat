import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { notificationService } from './notification.service';

// Check if running inside Expo Go client
const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).executionEnvironment === 'storeClient';

export const pushNotificationService = {
  /**
   * Request permissions, get device FCM push token, and sync with backend
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // In Expo Go (SDK 53+), remote push notifications are not supported natively.
      // They activate in standalone APKs / Development Builds.
      if (isExpoGo) {
        return null;
      }

      let Notifications: any = null;
      try {
        Notifications = require('expo-notifications');
      } catch (e) {
        return null;
      }

      if (!Notifications || !Notifications.setNotificationHandler) {
        return null;
      }

      // Foreground notification display handler
      try {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });
      } catch (e) {
        // Ignore handler errors
      }

      if (!Device.isDevice && Platform.OS === 'ios') {
        return null;
      }

      // Android Notification Channel setup
      if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
        try {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Ftafat Notifications',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF6000',
            sound: 'default',
            enableLights: true,
            enableVibrate: true,
            showBadge: true,
          });
        } catch (channelErr) {
          // Fallback
        }
      }

      // Check permissions
      if (Notifications.getPermissionsAsync) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted' && Notifications.requestPermissionsAsync) {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          return null;
        }
      }

      // Get Native Device Push Token (FCM Token on Android)
      let token: string | null = null;
      if (Notifications.getDevicePushTokenAsync) {
        try {
          const deviceToken = await Notifications.getDevicePushTokenAsync();
          token = deviceToken.data;
        } catch (deviceTokenErr) {
          if (Notifications.getExpoPushTokenAsync) {
            try {
              const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
              const expoToken = await Notifications.getExpoPushTokenAsync(
                projectId ? { projectId } : undefined
              );
              token = expoToken.data;
            } catch (expoErr) {
              // Ignore
            }
          }
        }
      }

      if (token) {
        console.log('[PushNotifications] Registered Token:', token);
        await notificationService.updateFcmToken(token);
        return token;
      }

      return null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Listen for notification received while app is running
   */
  addNotificationReceivedListener(callback: (notification: any) => void) {
    if (isExpoGo) return null;
    try {
      const Notifications = require('expo-notifications');
      return Notifications?.addNotificationReceivedListener
        ? Notifications.addNotificationReceivedListener(callback)
        : null;
    } catch {
      return null;
    }
  },

  /**
   * Listen for user tapping on a notification
   */
  addNotificationResponseReceivedListener(callback: (response: any) => void) {
    if (isExpoGo) return null;
    try {
      const Notifications = require('expo-notifications');
      return Notifications?.addNotificationResponseReceivedListener
        ? Notifications.addNotificationResponseReceivedListener(callback)
        : null;
    } catch {
      return null;
    }
  },
};
