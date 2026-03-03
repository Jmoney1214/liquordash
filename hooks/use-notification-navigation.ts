/**
 * useNotificationNavigation — Handles deep-linking from push notification taps.
 *
 * When a user taps a notification, this hook reads the `url` field from
 * the notification data and navigates to the corresponding screen.
 *
 * Note: Expo Notifications APIs for response listeners are only available
 * on native platforms (iOS/Android), not on web.
 */

import { useEffect } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";

/**
 * Hook that listens for notification taps and navigates to the appropriate screen.
 * Should be called once in the root layout.
 * Safely no-ops on web where notification response APIs are unavailable.
 */
export function useNotificationNavigation() {
  const router = useRouter();

  useEffect(() => {
    // Notification response listeners are only available on native platforms
    if (Platform.OS === "web") return;

    let subscription: { remove: () => void } | undefined;

    // Dynamic import to avoid web bundling issues
    (async () => {
      try {
        const Notifications = await import("expo-notifications");

        // Handle notification taps when app is in foreground or background
        subscription = Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data;
          if (data?.url && typeof data.url === "string") {
            setTimeout(() => {
              try {
                router.push(data.url as any);
              } catch (error) {
                console.warn("[NotificationNav] Failed to navigate:", error);
              }
            }, 300);
          }
        });

        // Check if app was opened from a notification (cold start)
        const lastResponse = await Notifications.getLastNotificationResponseAsync();
        if (lastResponse) {
          const data = lastResponse.notification.request.content.data;
          if (data?.url && typeof data.url === "string") {
            setTimeout(() => {
              try {
                router.push(data.url as any);
              } catch (error) {
                console.warn("[NotificationNav] Failed to navigate on cold start:", error);
              }
            }, 1000);
          }
        }
      } catch (error) {
        console.warn("[NotificationNav] Failed to set up notification listeners:", error);
      }
    })();

    return () => {
      subscription?.remove();
    };
  }, [router]);
}
