/**
 * Push Notification Service — bridges Expo Notifications with WebSocket events.
 *
 * Responsibilities:
 * - Request & manage notification permissions
 * - Set up Android notification channels
 * - Register for push tokens (Expo + native)
 * - Schedule local notifications from WebSocket events
 * - Handle notification deep-linking (tap → navigate to order/screen)
 * - Respect user notification preferences
 */

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WS_EVENTS } from "@/shared/ws-events";
import type {
  OrderStatusPayload,
  OrderCreatedPayload,
  DriverAssignedPayload,
  DriverEtaPayload,
  StoreNewOrderPayload,
  StoreDriverArrivingPayload,
  AdminAlertPayload,
} from "@/shared/ws-events";

// ─── Constants ───

const STORAGE_KEY_PUSH_TOKEN = "@liquordash:push_token";
const STORAGE_KEY_PERMISSIONS = "@liquordash:notification_permissions";

// ─── Android Notification Channels ───

export const NOTIFICATION_CHANNELS = {
  ORDERS: "orders",
  DELIVERY: "delivery",
  PROMOTIONS: "promotions",
  STORE_ALERTS: "store_alerts",
  DRIVER_ALERTS: "driver_alerts",
  ADMIN_ALERTS: "admin_alerts",
} as const;

export type NotificationChannelId = (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];

// ─── Notification Categories (actions) ───

export const NOTIFICATION_CATEGORIES = {
  ORDER_UPDATE: "order_update",
  NEW_ORDER: "new_order",
  DELIVERY_UPDATE: "delivery_update",
  DRIVER_JOB: "driver_job",
} as const;

// ─── Setup ───

/**
 * Configure the notification handler for foreground display.
 * Must be called at app startup (outside component).
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Set up Android notification channels with proper importance levels.
 */
export async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Promise.all([
    Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.ORDERS, {
      name: "Order Updates",
      description: "Status changes for your orders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#D4A574",
      sound: "default",
      enableVibrate: true,
    }),
    Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.DELIVERY, {
      name: "Delivery Alerts",
      description: "Driver en route and arrival notifications",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
      lightColor: "#22C55E",
      sound: "default",
      enableVibrate: true,
    }),
    Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.PROMOTIONS, {
      name: "Promotions & Deals",
      description: "Sales, discounts, and special offers",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    }),
    Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.STORE_ALERTS, {
      name: "Store Partner Alerts",
      description: "New orders and store notifications",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: "#D4A574",
      sound: "default",
      enableVibrate: true,
    }),
    Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.DRIVER_ALERTS, {
      name: "Driver Alerts",
      description: "New delivery jobs and updates",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: "#3B82F6",
      sound: "default",
      enableVibrate: true,
    }),
    Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.ADMIN_ALERTS, {
      name: "Admin Alerts",
      description: "Platform alerts and notifications",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    }),
  ]);
}

/**
 * Set up notification categories with interactive actions.
 */
export async function setupNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.ORDER_UPDATE, [
    {
      identifier: "view_order",
      buttonTitle: "View Order",
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.NEW_ORDER, [
    {
      identifier: "accept_order",
      buttonTitle: "Accept",
      options: { opensAppToForeground: true },
    },
    {
      identifier: "view_details",
      buttonTitle: "View Details",
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.DELIVERY_UPDATE, [
    {
      identifier: "track_delivery",
      buttonTitle: "Track",
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.DRIVER_JOB, [
    {
      identifier: "accept_job",
      buttonTitle: "Accept Job",
      options: { opensAppToForeground: true },
    },
    {
      identifier: "decline_job",
      buttonTitle: "Decline",
      options: { isDestructive: true },
    },
  ]);
}

// ─── Permissions ───

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

/**
 * Request notification permissions from the user.
 */
export async function requestNotificationPermissions(): Promise<PermissionStatus> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === "granted") {
    await AsyncStorage.setItem(STORAGE_KEY_PERMISSIONS, "granted");
    return { granted: true, canAskAgain: true, status: existingStatus };
  }

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  const granted = status === "granted";
  await AsyncStorage.setItem(STORAGE_KEY_PERMISSIONS, status);

  return { granted, canAskAgain: status !== "denied", status };
}

/**
 * Check current permission status without prompting.
 */
export async function getNotificationPermissionStatus(): Promise<PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return {
    granted: status === "granted",
    canAskAgain: status !== "denied",
    status,
  };
}

// ─── Push Token ───

/**
 * Get or register the Expo push token.
 */
export async function getPushToken(): Promise<string | null> {
  try {
    // Check cached token first
    const cached = await AsyncStorage.getItem(STORAGE_KEY_PUSH_TOKEN);
    if (cached) return cached;

    const permission = await getNotificationPermissionStatus();
    if (!permission.granted) return null;

    // For Expo Go / development, use Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: undefined, // Will use the project ID from app config
    });

    const token = tokenData.data;
    await AsyncStorage.setItem(STORAGE_KEY_PUSH_TOKEN, token);
    return token;
  } catch (error) {
    console.warn("[notifications] Failed to get push token:", error);
    return null;
  }
}

/**
 * Clear the cached push token (e.g., on logout).
 */
export async function clearPushToken(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY_PUSH_TOKEN);
}

// ─── Badge Management ───

/**
 * Set the app badge count.
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch {}
}

/**
 * Clear the app badge.
 */
export async function clearBadge(): Promise<void> {
  await setBadgeCount(0);
}

/**
 * Get the current badge count.
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch {
    return 0;
  }
}

// ─── Local Notification Scheduling ───

/**
 * Schedule an immediate local notification (triggered by WebSocket events).
 */
export async function sendLocalNotification(options: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channelId?: NotificationChannelId;
  categoryId?: string;
  badge?: number;
  sound?: boolean;
}): Promise<string> {
  const { title, body, data, channelId, categoryId, badge, sound = true } = options;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
      categoryIdentifier: categoryId,
      badge,
      sound: sound ? "default" : undefined,
      ...(Platform.OS === "android" && channelId
        ? { channelId }
        : {}),
    },
    trigger: null, // Immediate
  });

  return id;
}

// ─── Order Status Notification Helpers ───

const ORDER_STATUS_MESSAGES: Record<string, { title: string; body: (orderId: string) => string }> = {
  confirmed: {
    title: "Order Confirmed",
    body: (id) => `Your order #${id.slice(0, 8)} has been confirmed by the store.`,
  },
  preparing: {
    title: "Order Being Prepared",
    body: (id) => `Your order #${id.slice(0, 8)} is being prepared.`,
  },
  ready: {
    title: "Order Ready for Pickup",
    body: (id) => `Your order #${id.slice(0, 8)} is ready and waiting for a driver.`,
  },
  out_for_delivery: {
    title: "Driver On The Way",
    body: (id) => `Your order #${id.slice(0, 8)} is on its way to you!`,
  },
  delivered: {
    title: "Order Delivered",
    body: (id) => `Your order #${id.slice(0, 8)} has been delivered. Enjoy!`,
  },
  cancelled: {
    title: "Order Cancelled",
    body: (id) => `Your order #${id.slice(0, 8)} has been cancelled.`,
  },
  shipped: {
    title: "Order Shipped",
    body: (id) => `Your order #${id.slice(0, 8)} has been shipped and is on its way.`,
  },
  in_transit: {
    title: "Package In Transit",
    body: (id) => `Your order #${id.slice(0, 8)} is in transit.`,
  },
};

/**
 * Send a notification for an order status change (customer-facing).
 */
export async function notifyOrderStatusChange(payload: OrderStatusPayload): Promise<void> {
  const statusInfo = ORDER_STATUS_MESSAGES[payload.newStatus];
  if (!statusInfo) return;

  await sendLocalNotification({
    title: statusInfo.title,
    body: statusInfo.body(payload.orderId),
    data: {
      type: "order_status",
      orderId: payload.orderId,
      status: payload.newStatus,
      url: `/order/${payload.orderId}`,
    },
    channelId: NOTIFICATION_CHANNELS.ORDERS,
    categoryId: NOTIFICATION_CATEGORIES.ORDER_UPDATE,
  });
}

/**
 * Send a notification when a driver is assigned (customer-facing).
 */
export async function notifyDriverAssigned(payload: DriverAssignedPayload): Promise<void> {
  await sendLocalNotification({
    title: "Driver Assigned",
    body: `${payload.driverName} is heading to pick up your order. ETA: ${payload.estimatedPickupMinutes} min.`,
    data: {
      type: "driver_assigned",
      orderId: payload.orderId,
      driverId: payload.driverId,
      url: `/tracking/${payload.orderId}`,
    },
    channelId: NOTIFICATION_CHANNELS.DELIVERY,
    categoryId: NOTIFICATION_CATEGORIES.DELIVERY_UPDATE,
  });
}

/**
 * Send a notification when driver ETA updates significantly (customer-facing).
 */
export async function notifyDriverEta(payload: DriverEtaPayload): Promise<void> {
  if (payload.etaMinutes <= 5) {
    await sendLocalNotification({
      title: "Almost There!",
      body: `Your driver is ${payload.etaMinutes} minutes away.`,
      data: {
        type: "driver_eta",
        orderId: payload.orderId,
        url: `/tracking/${payload.orderId}`,
      },
      channelId: NOTIFICATION_CHANNELS.DELIVERY,
    });
  }
}

// ─── Store Notification Helpers ───

/**
 * Send a notification for a new incoming order (store-facing).
 */
export async function notifyStoreNewOrder(payload: StoreNewOrderPayload): Promise<void> {
  await sendLocalNotification({
    title: "New Order!",
    body: `${payload.customerName} placed a ${payload.deliveryMode} order ($${payload.totalAmount.toFixed(2)}, ${payload.itemCount} items).`,
    data: {
      type: "store_new_order",
      orderId: payload.orderId,
      url: `/store/orders`,
    },
    channelId: NOTIFICATION_CHANNELS.STORE_ALERTS,
    categoryId: NOTIFICATION_CATEGORIES.NEW_ORDER,
    sound: true,
  });
}

/**
 * Send a notification when a driver is arriving at the store.
 */
export async function notifyStoreDriverArriving(payload: StoreDriverArrivingPayload): Promise<void> {
  await sendLocalNotification({
    title: "Driver Arriving",
    body: `${payload.driverName} is ${payload.etaMinutes} min away to pick up order #${payload.orderId.slice(0, 8)}.`,
    data: {
      type: "store_driver_arriving",
      orderId: payload.orderId,
      url: `/store/order-detail/${payload.orderId}`,
    },
    channelId: NOTIFICATION_CHANNELS.STORE_ALERTS,
  });
}

// ─── Driver Notification Helpers ───

/**
 * Send a notification for a new delivery job available (driver-facing).
 */
export async function notifyDriverNewJob(payload: {
  orderId: string;
  storeName: string;
  distance: number;
  estimatedPay: number;
}): Promise<void> {
  await sendLocalNotification({
    title: "New Delivery Available!",
    body: `Pickup from ${payload.storeName} (${payload.distance.toFixed(1)} mi) — $${payload.estimatedPay.toFixed(2)} est.`,
    data: {
      type: "driver_new_job",
      orderId: payload.orderId,
      url: `/driver/dashboard`,
    },
    channelId: NOTIFICATION_CHANNELS.DRIVER_ALERTS,
    categoryId: NOTIFICATION_CATEGORIES.DRIVER_JOB,
    sound: true,
  });
}

// ─── Admin Notification Helpers ───

/**
 * Send a notification for admin alerts (admin-facing).
 */
export async function notifyAdminAlert(payload: AdminAlertPayload): Promise<void> {
  await sendLocalNotification({
    title: payload.title,
    body: payload.message,
    data: {
      type: "admin_alert",
      alertId: payload.alertId,
      url: payload.actionUrl ?? "/admin/dashboard",
    },
    channelId: NOTIFICATION_CHANNELS.ADMIN_ALERTS,
  });
}

/**
 * Send a notification for a new store application (admin-facing).
 */
export async function notifyAdminNewStoreApplication(payload: {
  storeName: string;
  ownerName: string;
}): Promise<void> {
  await sendLocalNotification({
    title: "New Store Application",
    body: `${payload.ownerName} submitted an application for "${payload.storeName}".`,
    data: {
      type: "admin_new_store_app",
      url: "/admin/store-applications",
    },
    channelId: NOTIFICATION_CHANNELS.ADMIN_ALERTS,
  });
}

/**
 * Send a notification for a new driver application (admin-facing).
 */
export async function notifyAdminNewDriverApplication(payload: {
  driverName: string;
}): Promise<void> {
  await sendLocalNotification({
    title: "New Driver Application",
    body: `${payload.driverName} applied to become a delivery driver.`,
    data: {
      type: "admin_new_driver_app",
      url: "/admin/driver-management",
    },
    channelId: NOTIFICATION_CHANNELS.ADMIN_ALERTS,
  });
}

// ─── Dismiss / Cancel ───

/**
 * Dismiss all delivered notifications.
 */
export async function dismissAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get the count of delivered notifications.
 */
export async function getDeliveredNotificationCount(): Promise<number> {
  const notifications = await Notifications.getPresentedNotificationsAsync();
  return notifications.length;
}

// ─── Full initialization ───

/**
 * Initialize the entire notification system.
 * Call once at app startup.
 */
export async function initializeNotifications(): Promise<{
  permissionGranted: boolean;
  pushToken: string | null;
}> {
  // 1. Configure foreground handler
  configureNotificationHandler();

  // 2. Set up Android channels
  await setupAndroidChannels();

  // 3. Set up notification categories
  await setupNotificationCategories();

  // 4. Request permissions
  const permission = await requestNotificationPermissions();

  // 5. Get push token
  let pushToken: string | null = null;
  if (permission.granted) {
    pushToken = await getPushToken();
  }

  return { permissionGranted: permission.granted, pushToken };
}
