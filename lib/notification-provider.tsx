/**
 * NotificationProvider — App-level provider that initializes the notification system
 * and provides notification state/actions to all screens.
 *
 * Safely no-ops on web where Expo Notifications APIs are limited.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";

// ─── Types ───

export interface PermissionStatusResult {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

interface NotificationContextValue {
  /** Whether notification permissions are granted */
  permissionGranted: boolean;
  /** The Expo push token */
  pushToken: string | null;
  /** Whether the system is fully initialized */
  isReady: boolean;
  /** Number of unread notifications */
  unreadCount: number;
  /** Request notification permission */
  requestPermission: () => Promise<PermissionStatusResult>;
  /** Clear badge and unread count */
  clearAll: () => Promise<void>;
  /** Increment unread count */
  incrementUnread: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  permissionGranted: false,
  pushToken: null,
  isReady: false,
  unreadCount: 0,
  requestPermission: async () => ({ granted: false, canAskAgain: true, status: "undetermined" }),
  clearAll: async () => {},
  incrementUnread: () => {},
});

export function useNotificationContext() {
  return useContext(NotificationContext);
}

// ─── Provider ───

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const appStateRef = useRef(AppState.currentState);
  const isNative = Platform.OS !== "web";

  // Initialize on mount — native only
  useEffect(() => {
    if (!isNative) {
      setIsReady(true);
      return;
    }

    let mounted = true;

    async function init() {
      try {
        const {
          configureNotificationHandler,
          setupAndroidChannels,
          setupNotificationCategories,
          getNotificationPermissionStatus,
          getPushToken,
        } = await import("@/lib/notifications");

        configureNotificationHandler();
        await setupAndroidChannels();
        await setupNotificationCategories();

        const permission = await getNotificationPermissionStatus();
        if (mounted) {
          setPermissionGranted(permission.granted);
        }

        if (permission.granted) {
          const token = await getPushToken();
          if (mounted) setPushToken(token);
        }
      } catch (error) {
        console.warn("[NotificationProvider] Init error:", error);
      } finally {
        if (mounted) setIsReady(true);
      }
    }

    init();
    return () => { mounted = false; };
  }, [isNative]);

  // Listen for incoming notifications → increment unread (native only)
  useEffect(() => {
    if (!isNative) return;

    let sub: { remove: () => void } | undefined;

    (async () => {
      try {
        const Notifications = await import("expo-notifications");
        sub = Notifications.addNotificationReceivedListener(() => {
          setUnreadCount((c) => c + 1);
        });
      } catch (error) {
        console.warn("[NotificationProvider] Listener error:", error);
      }
    })();

    return () => sub?.remove();
  }, [isNative]);

  // Clear badge when app comes to foreground (native only)
  useEffect(() => {
    if (!isNative) return;

    const sub = AppState.addEventListener("change", async (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === "active") {
        try {
          const { clearBadge } = await import("@/lib/notifications");
          clearBadge();
        } catch {}
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [isNative]);

  const requestPermission = useCallback(async (): Promise<PermissionStatusResult> => {
    if (!isNative) {
      return { granted: false, canAskAgain: false, status: "unavailable" };
    }
    try {
      const { requestNotificationPermissions, getPushToken } = await import("@/lib/notifications");
      const result = await requestNotificationPermissions();
      setPermissionGranted(result.granted);
      if (result.granted) {
        const token = await getPushToken();
        setPushToken(token);
      }
      return result;
    } catch (error) {
      console.warn("[NotificationProvider] Permission error:", error);
      return { granted: false, canAskAgain: true, status: "error" };
    }
  }, [isNative]);

  const clearAll = useCallback(async () => {
    setUnreadCount(0);
    if (!isNative) return;
    try {
      const { clearBadge, dismissAllNotifications } = await import("@/lib/notifications");
      await clearBadge();
      await dismissAllNotifications();
    } catch {}
  }, [isNative]);

  const incrementUnread = useCallback(() => {
    setUnreadCount((c) => {
      const next = c + 1;
      if (isNative) {
        import("@/lib/notifications").then(({ setBadgeCount }) => {
          setBadgeCount(next);
        }).catch(() => {});
      }
      return next;
    });
  }, [isNative]);

  return (
    <NotificationContext.Provider
      value={{
        permissionGranted,
        pushToken,
        isReady,
        unreadCount,
        requestPermission,
        clearAll,
        incrementUnread,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
