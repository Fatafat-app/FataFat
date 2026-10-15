import { useEffect, useRef } from 'react';
import { oneSignalService } from '../services/onesignal.service';

/**
 * Hook to handle Push Subscription Registration.
 *
 * 1. Register a push subscription observer immediately after OneSignal is initialized.
 * 2. Retain the observer for the lifetime of the component in framework-retained state (useRef).
 * 3. Treat the device as registered only when the push subscription ID is a real, server-assigned value
 *    (non-empty and not prefixed with 'local-').
 * 4. Silently request OS notification permission without developer debug dialogs.
 */
export function useOneSignalVerification() {
  const observerRef = useRef<((event: any) => void) | null>(null);
  const hasShownAlertRef = useRef<boolean>(false);

  useEffect(() => {
    try {
      // Ensure OneSignal is initialized before registering observer
      const isReady = oneSignalService.initialize();
      if (!isReady) {
        return;
      }

      const handleVerification = (subscriptionId?: string | null) => {
        if (
          subscriptionId &&
          typeof subscriptionId === 'string' &&
          subscriptionId.trim().length > 0 &&
          !subscriptionId.startsWith('local-') &&
          !hasShownAlertRef.current
        ) {
          hasShownAlertRef.current = true;
          // Automatically request native notification permission without developer debug alert
          oneSignalService.requestPermission(false);
        }
      };

      // 1. Evaluate immediately at observer-registration time
      const initialId = oneSignalService.getPushSubscriptionId();
      handleVerification(initialId);

      // 2. Register push subscription observer and retain in useRef
      observerRef.current = (event: any) => {
        const currentId = event?.current?.id ?? event?.current?.subscriptionId;
        handleVerification(currentId);
      };

      oneSignalService.addPushSubscriptionObserver(observerRef.current);
    } catch (err) {
      console.warn('[useOneSignalVerification] hook error:', err);
    }

    return () => {
      try {
        if (observerRef.current) {
          oneSignalService.removePushSubscriptionObserver(observerRef.current);
        }
      } catch (err) {
        // Safe cleanup
      }
    };
  }, []);
}
