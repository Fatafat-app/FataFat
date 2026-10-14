import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { oneSignalService } from '../services/onesignal.service';

/**
 * Hook to handle the Push Subscription Verification Dialog.
 *
 * Implements OneSignal Verification Dialog requirements:
 * 1. Register a push subscription observer immediately after OneSignal is initialized.
 * 2. Retain the observer for the lifetime of the component in framework-retained state (useRef).
 * 3. Treat the device as registered only when the push subscription ID is a real, server-assigned value
 *    (non-empty and not prefixed with 'local-').
 * 4. Evaluate current subscription ID both on change and immediately at observer-registration time.
 * 5. Show alert exactly once when a real ID is present:
 *    - Title: "Your OneSignal SDK integration is complete!"
 *    - Message: "You can now send Push Notifications & In-App Messages through OneSignal. Tap below to enable push notifications."
 *    - Single button: "Got it"
 * 6. On button tap, request push permission.
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
          Alert.alert(
            'Your OneSignal SDK integration is complete!',
            'You can now send Push Notifications & In-App Messages through OneSignal. Tap below to enable push notifications.',
            [
              {
                text: 'Got it',
                onPress: () => {
                  oneSignalService.requestPermission(true);
                },
              },
            ]
          );
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
