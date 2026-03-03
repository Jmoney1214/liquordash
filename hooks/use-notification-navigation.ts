/**
 * useNotificationNavigation — Handles deep-linking from push notification taps.
 *
 * When a user taps a notification, this hook reads the `url` field from
 * the notification data and navigates to the corresponding screen.
 */

import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";

/**
 * Hook that listens for notification taps and navigates to the appropriate screen.
 * Should be called once in the root layout.
 */
export function useNotificationNavigation() {
  const router = useRouter();

  useEffect(() => {
    // Handle notification taps when app is in foreground or background
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.url && typeof data.url === "string") {
        // Small delay to ensure navigation is ready
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
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        if (data?.url && typeof data.url === "string") {
          setTimeout(() => {
            try {
              router.push(data.url as any);
            } catch (error) {
              console.warn("[NotificationNav] Failed to navigate on cold start:", error);
            }
          }, 1000); // Longer delay for cold start
        }
      }
    });

    return () => subscription.remove();
  }, [router]);
}
