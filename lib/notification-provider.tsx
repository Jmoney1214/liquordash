/**
 * NotificationProvider — App-level provider that initializes the notification system
 * and provides notification state/actions to all screens.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";
import {
  configureNotificationHandler,
  setupAndroidChannels,
  setupNotificationCategories,
  requestNotificationPermissions,
  getNotificationPermissionStatus,
  getPushToken,
  clearBadge,
  setBadgeCount,
  dismissAllNotifications,
  type PermissionStatus,
} from "@/lib/notifications";

// ─── Context ───

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
  requestPermission: () => Promise<PermissionStatus>;
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

  // Initialize on mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Configure foreground handler (must be called outside component in production,
        // but safe to call here for initialization)
        configureNotificationHandler();

        // Set up Android channels
        await setupAndroidChannels();

        // Set up notification categories (interactive actions)
        await setupNotificationCategories();

        // Check existing permission (don't prompt on first launch)
        const permission = await getNotificationPermissionStatus();
        if (mounted) {
          setPermissionGranted(permission.granted);
        }

        // Get push token if permission already granted
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
  }, []);

  // Listen for incoming notifications → increment unread
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {
      setUnreadCount((c) => c + 1);
    });
    return () => sub.remove();
  }, []);

  // Clear badge when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === "active") {
        // App came to foreground — clear badge
        clearBadge();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermissions();
    setPermissionGranted(result.granted);
    if (result.granted) {
      const token = await getPushToken();
      setPushToken(token);
    }
    return result;
  }, []);

  const clearAll = useCallback(async () => {
    setUnreadCount(0);
    await clearBadge();
    await dismissAllNotifications();
  }, []);

  const incrementUnread = useCallback(() => {
    setUnreadCount((c) => c + 1);
    setBadgeCount(unreadCount + 1);
  }, [unreadCount]);

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
