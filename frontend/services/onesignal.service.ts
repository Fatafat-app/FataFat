import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

let OneSignal: any = null;
let LogLevel: any = null;

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).executionEnvironment === 'storeClient';

try {
  if (Platform.OS !== 'web' && !isExpoGo) {
    // Dynamic import to prevent crash when running in web or Expo Go
    const onesignalModule = require('react-native-onesignal');
    OneSignal = onesignalModule.OneSignal;
    LogLevel = onesignalModule.LogLevel;
  }
} catch (e) {
  // Graceful fallback for environments where native modules are not linked
}

declare const process: any;

export const ONESIGNAL_APP_ID =
  process.env?.EXPO_PUBLIC_ONESIGNAL_APP_ID || '06421e37-d6b3-4074-8b76-565e25449498';

/**
 * Centralized OneSignal Service wrapper.
 * All OneSignal interactions throughout the application must route through this class.
 */
export class OneSignalService {
  private static instance: OneSignalService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): OneSignalService {
    if (!OneSignalService.instance) {
      OneSignalService.instance = new OneSignalService();
    }
    return OneSignalService.instance;
  }

  /**
   * Initializes the OneSignal SDK with the configured App ID
   */
  public initialize(appId: string = ONESIGNAL_APP_ID): void {
    if (this.isInitialized) {
      return;
    }

    if (!OneSignal) {
      return;
    }

    try {
      // Configure log levels
      const isDev = typeof __DEV__ !== 'undefined' ? Boolean(__DEV__) : false;
      if (isDev && LogLevel?.Verbose) {
        OneSignal.Debug.setLogLevel(LogLevel.Verbose);
      } else if (LogLevel?.Warn) {
        OneSignal.Debug.setLogLevel(LogLevel.Warn);
      }

      // Initialize SDK
      OneSignal.initialize(appId);
      this.isInitialized = true;
    } catch (error) {
      console.error('[OneSignal] Initialization failed:', error);
    }
  }

  /**
   * Sets custom log level
   */
  public setLogLevel(level: any): void {
    if (!OneSignal) return;
    try {
      OneSignal.Debug.setLogLevel(level);
    } catch (error) {
      console.error('[OneSignal] setLogLevel error:', error);
    }
  }

  /**
   * Set user identity (login external user ID)
   */
  public login(externalId: string): void {
    if (!OneSignal || !externalId) return;
    try {
      OneSignal.login(String(externalId));
    } catch (error) {
      console.error('[OneSignal] login error:', error);
    }
  }

  /**
   * Clear user identity (logout)
   */
  public logout(): void {
    if (!OneSignal) return;
    try {
      OneSignal.logout();
    } catch (error) {
      console.error('[OneSignal] logout error:', error);
    }
  }

  /**
   * Add email subscription for current user
   */
  public addEmail(email: string): void {
    if (!OneSignal || !email) return;
    try {
      OneSignal.User.addEmail(email);
    } catch (error) {
      console.error('[OneSignal] addEmail error:', error);
    }
  }

  /**
   * Remove email subscription
   */
  public removeEmail(email: string): void {
    if (!OneSignal || !email) return;
    try {
      OneSignal.User.removeEmail(email);
    } catch (error) {
      console.error('[OneSignal] removeEmail error:', error);
    }
  }

  /**
   * Add SMS subscription for current user
   */
  public addSms(smsNumber: string): void {
    if (!OneSignal || !smsNumber) return;
    try {
      OneSignal.User.addSms(smsNumber);
    } catch (error) {
      console.error('[OneSignal] addSms error:', error);
    }
  }

  /**
   * Remove SMS subscription
   */
  public removeSms(smsNumber: string): void {
    if (!OneSignal || !smsNumber) return;
    try {
      OneSignal.User.removeSms(smsNumber);
    } catch (error) {
      console.error('[OneSignal] removeSms error:', error);
    }
  }

  /**
   * Add user tag
   */
  public addTag(key: string, value: string): void {
    if (!OneSignal || !key) return;
    try {
      OneSignal.User.addTag(key, String(value));
    } catch (error) {
      console.error('[OneSignal] addTag error:', error);
    }
  }

  /**
   * Add multiple user tags
   */
  public addTags(tags: Record<string, string>): void {
    if (!OneSignal || !tags) return;
    try {
      OneSignal.User.addTags(tags);
    } catch (error) {
      console.error('[OneSignal] addTags error:', error);
    }
  }

  /**
   * Remove user tag
   */
  public removeTag(key: string): void {
    if (!OneSignal || !key) return;
    try {
      OneSignal.User.removeTag(key);
    } catch (error) {
      console.error('[OneSignal] removeTag error:', error);
    }
  }

  /**
   * Remove multiple user tags
   */
  public removeTags(keys: string[]): void {
    if (!OneSignal || !keys || keys.length === 0) return;
    try {
      OneSignal.User.removeTags(keys);
    } catch (error) {
      console.error('[OneSignal] removeTags error:', error);
    }
  }

  /**
   * Request push notification permission
   */
  public async requestPermission(fallbackToSettings: boolean = true): Promise<boolean> {
    if (!OneSignal) return false;
    try {
      return await OneSignal.Notifications.requestPermission(fallbackToSettings);
    } catch (error) {
      console.error('[OneSignal] requestPermission error:', error);
      return false;
    }
  }

  /**
   * Retrieve current push subscription ID (server-assigned ID)
   */
  public getPushSubscriptionId(): string | null {
    if (!OneSignal) return null;
    try {
      const sub = OneSignal.User?.pushSubscription;
      return sub?.id ?? sub?.getPushSubscriptionId?.() ?? null;
    } catch (error) {
      console.error('[OneSignal] getPushSubscriptionId error:', error);
      return null;
    }
  }

  /**
   * Retrieve current push subscription token
   */
  public getPushSubscriptionToken(): string | null {
    if (!OneSignal) return null;
    try {
      const sub = OneSignal.User?.pushSubscription;
      return sub?.token ?? sub?.getPushSubscriptionToken?.() ?? null;
    } catch (error) {
      console.error('[OneSignal] getPushSubscriptionToken error:', error);
      return null;
    }
  }

  /**
   * Check if user is currently opted in to push notifications
   */
  public isPushSubscribed(): boolean {
    if (!OneSignal) return false;
    try {
      return !!OneSignal.User?.pushSubscription?.optedIn;
    } catch (error) {
      return false;
    }
  }

  /**
   * Register a push subscription state change observer
   */
  public addPushSubscriptionObserver(observer: (state: any) => void): void {
    if (!OneSignal) return;
    try {
      OneSignal.User?.pushSubscription?.addEventListener('change', observer);
    } catch (error) {
      console.error('[OneSignal] addPushSubscriptionObserver error:', error);
    }
  }

  /**
   * Remove a push subscription state change observer
   */
  public removePushSubscriptionObserver(observer: (state: any) => void): void {
    if (!OneSignal) return;
    try {
      OneSignal.User?.pushSubscription?.removeEventListener('change', observer);
    } catch (error) {
      console.error('[OneSignal] removePushSubscriptionObserver error:', error);
    }
  }
}

export const oneSignalService = OneSignalService.getInstance();
