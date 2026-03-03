/**
 * useNotifications — React hook that bridges WebSocket events to native push notifications.
 *
 * Listens to WebSocket events and triggers local push notifications based on user preferences.
 * Also handles notification tap deep-linking via Expo Router.
 *
 * Usage:
 *   const { permissionGranted, pushToken, requestPermission } = useNotifications({ role: "customer" });
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useWebSocket } from "./use-websocket";
import { WS_EVENTS } from "@/shared/ws-events";
import type {
  OrderStatusPayload,
  DriverAssignedPayload,
  DriverEtaPayload,
  StoreNewOrderPayload,
  StoreDriverArrivingPayload,
  AdminAlertPayload,
} from "@/shared/ws-events";
import {
  initializeNotifications,
  requestNotificationPermissions,
  notifyOrderStatusChange,
  notifyDriverAssigned,
  notifyDriverEta,
  notifyStoreNewOrder,
  notifyStoreDriverArriving,
  notifyDriverNewJob,
  notifyAdminAlert,
  notifyAdminNewStoreApplication,
  notifyAdminNewDriverApplication,
  clearBadge,
  setBadgeCount,
  type PermissionStatus,
} from "@/lib/notifications";

// ─── Types ───

export type NotificationRole = "customer" | "store" | "driver" | "admin";

interface UseNotificationsOptions {
  /** The active role determines which WS events trigger push notifications */
  role: NotificationRole;
  /** Whether notifications are enabled by the user (from preferences) */
  enabled?: boolean;
  /** Specific preferences for filtering notification types */
  preferences?: {
    orderUpdates?: boolean;
    deliveryAlerts?: boolean;
    promotions?: boolean;
  };
}

interface UseNotificationsReturn {
  /** Whether push notification permission is granted */
  permissionGranted: boolean;
  /** The Expo push token (null if not available) */
  pushToken: string | null;
  /** Whether the notification system is initialized */
  isInitialized: boolean;
  /** Number of unread notifications */
  unreadCount: number;
  /** Request notification permission from the user */
  requestPermission: () => Promise<PermissionStatus>;
  /** Clear the badge count */
  clearBadge: () => Promise<void>;
  /** Mark all as read */
  markAllRead: () => void;
}

// ─── Hook ───

export function useNotifications(options: UseNotificationsOptions): UseNotificationsReturn {
  const { role, enabled = true, preferences } = options;
  const { subscribe, isConnected } = useWebSocket();

  const [permissionGranted, setPermissionGranted] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const lastEtaNotifyRef = useRef<Record<string, number>>({});

  // ─── Initialize notification system ───
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const result = await initializeNotifications();
        if (mounted) {
          setPermissionGranted(result.permissionGranted);
          setPushToken(result.pushToken);
          setIsInitialized(true);
        }
      } catch (error) {
        console.warn("[useNotifications] Init failed:", error);
        if (mounted) setIsInitialized(true);
      }
    }

    init();
    return () => { mounted = false; };
  }, []);

  // ─── Handle notification tap → deep link ───
  useEffect(() => {
    // Handle notification taps when app is in foreground
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      const url = data?.url as string | undefined;
      const actionId = response.actionIdentifier;

      if (url && typeof url === "string") {
        // Navigate to the deep link URL
        try {
          router.push(url as any);
        } catch (err) {
          console.warn("[useNotifications] Navigation failed:", err);
        }
      }

      // Handle action buttons
      if (actionId === "accept_order" && data?.orderId) {
        router.push(`/store/order-detail/${data.orderId}` as any);
      } else if (actionId === "track_delivery" && data?.orderId) {
        router.push(`/tracking/${data.orderId}` as any);
      } else if (actionId === "accept_job") {
        router.push("/driver/dashboard" as any);
      }
    });

    // Handle notification that launched the app
    const checkLastNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        const url = response.notification.request.content.data?.url as string | undefined;
        if (url) {
          setTimeout(() => {
            try {
              router.push(url as any);
            } catch {}
          }, 1000); // Delay to let navigation mount
        }
      }
    };
    checkLastNotification();

    return () => subscription.remove();
  }, []);

  // ─── Listen to incoming notifications for badge count ───
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      setUnreadCount((c) => c + 1);
    });
    return () => subscription.remove();
  }, []);

  // ─── Customer: subscribe to order events ───
  useEffect(() => {
    if (!isInitialized || !enabled || !isConnected || role !== "customer") return;

    const unsubs: (() => void)[] = [];

    if (preferences?.orderUpdates !== false) {
      unsubs.push(
        subscribe(WS_EVENTS.ORDER_STATUS_UPDATED, (payload) => {
          notifyOrderStatusChange(payload as OrderStatusPayload);
        }),
      );

      unsubs.push(
        subscribe(WS_EVENTS.ORDER_ASSIGNED_TO_DRIVER, (payload) => {
          notifyDriverAssigned(payload as DriverAssignedPayload);
        }),
      );
    }

    if (preferences?.deliveryAlerts !== false) {
      unsubs.push(
        subscribe(WS_EVENTS.DRIVER_ETA_UPDATED, (payload) => {
          const etaPayload = payload as DriverEtaPayload;
          // Throttle ETA notifications — only notify at 5 min and 2 min
          const key = etaPayload.orderId;
          const lastNotify = lastEtaNotifyRef.current[key] ?? 999;
          if (
            (etaPayload.etaMinutes <= 5 && lastNotify > 5) ||
            (etaPayload.etaMinutes <= 2 && lastNotify > 2)
          ) {
            lastEtaNotifyRef.current[key] = etaPayload.etaMinutes;
            notifyDriverEta(etaPayload);
          }
        }),
      );
    }

    return () => unsubs.forEach((u) => u());
  }, [isInitialized, enabled, isConnected, role, preferences?.orderUpdates, preferences?.deliveryAlerts]);

  // ─── Store: subscribe to store events ───
  useEffect(() => {
    if (!isInitialized || !enabled || !isConnected || role !== "store") return;

    const unsubs: (() => void)[] = [];

    unsubs.push(
      subscribe(WS_EVENTS.STORE_NEW_ORDER, (payload) => {
        notifyStoreNewOrder(payload as StoreNewOrderPayload);
      }),
    );

    unsubs.push(
      subscribe(WS_EVENTS.STORE_DRIVER_ARRIVING, (payload) => {
        notifyStoreDriverArriving(payload as StoreDriverArrivingPayload);
      }),
    );

    return () => unsubs.forEach((u) => u());
  }, [isInitialized, enabled, isConnected, role]);

  // ─── Driver: subscribe to driver events ───
  useEffect(() => {
    if (!isInitialized || !enabled || !isConnected || role !== "driver") return;

    const unsubs: (() => void)[] = [];

    unsubs.push(
      subscribe(WS_EVENTS.STORE_NEW_ORDER, (payload) => {
        const orderPayload = payload as any;
        notifyDriverNewJob({
          orderId: orderPayload.orderId ?? "unknown",
          storeName: orderPayload.storeName ?? "Store",
          distance: orderPayload.distance ?? 2.5,
          estimatedPay: orderPayload.estimatedPay ?? 8.50,
        });
      }),
    );

    return () => unsubs.forEach((u) => u());
  }, [isInitialized, enabled, isConnected, role]);

  // ─── Admin: subscribe to admin events ───
  useEffect(() => {
    if (!isInitialized || !enabled || !isConnected || role !== "admin") return;

    const unsubs: (() => void)[] = [];

    unsubs.push(
      subscribe(WS_EVENTS.ADMIN_ALERT, (payload) => {
        notifyAdminAlert(payload as AdminAlertPayload);
      }),
    );

    unsubs.push(
      subscribe(WS_EVENTS.ADMIN_NEW_STORE_APPLICATION, (payload: any) => {
        notifyAdminNewStoreApplication({
          storeName: payload.storeName ?? "Unknown Store",
          ownerName: payload.ownerName ?? "Unknown",
        });
      }),
    );

    unsubs.push(
      subscribe(WS_EVENTS.ADMIN_NEW_DRIVER_APPLICATION, (payload: any) => {
        notifyAdminNewDriverApplication({
          driverName: payload.driverName ?? "Unknown",
        });
      }),
    );

    return () => unsubs.forEach((u) => u());
  }, [isInitialized, enabled, isConnected, role]);

  // ─── Public API ───

  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermissions();
    setPermissionGranted(result.granted);
    return result;
  }, []);

  const handleClearBadge = useCallback(async () => {
    await clearBadge();
    setUnreadCount(0);
  }, []);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    clearBadge();
  }, []);

  return {
    permissionGranted,
    pushToken,
    isInitialized,
    unreadCount,
    requestPermission,
    clearBadge: handleClearBadge,
    markAllRead,
  };
}
