/**
 * usePushBridge — Bridges WebSocket events to local push notifications.
 *
 * Listens for real-time WebSocket events and triggers corresponding
 * local push notifications so users get native alerts.
 */

import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import {
  sendLocalNotification,
  NOTIFICATION_CHANNELS,
  type NotificationChannelId,
} from "@/lib/notifications";
import {
  WS_EVENTS,
  type WsMessage,
  type OrderStatusPayload,
  type OrderCreatedPayload,
  type DriverAssignedPayload,
  type DriverEtaPayload,
  type StoreNewOrderPayload,
  type AdminAlertPayload,
} from "@/shared/ws-events";

// ─── Event → Notification mapping ───

interface NotificationPayload {
  title: string;
  body: string;
  channelId: NotificationChannelId;
  data: Record<string, string>;
}

function mapEventToNotification(msg: WsMessage): NotificationPayload | null {
  const { event, payload } = msg;

  switch (event) {
    // ─── Customer: Order status ───
    case WS_EVENTS.ORDER_STATUS_UPDATED: {
      const p = payload as OrderStatusPayload;
      return {
        title: getOrderStatusTitle(p.newStatus),
        body: getOrderStatusBody(p.orderId, p.newStatus),
        channelId: NOTIFICATION_CHANNELS.ORDERS,
        data: { type: "order_status", orderId: p.orderId, url: `/order/${p.orderId}` },
      };
    }

    case WS_EVENTS.ORDER_CREATED: {
      const p = payload as OrderCreatedPayload;
      return {
        title: "Order Placed!",
        body: `Order ${p.orderId.slice(0, 8)} confirmed. ${p.itemCount} item${p.itemCount !== 1 ? "s" : ""} from ${p.storeName}.`,
        channelId: NOTIFICATION_CHANNELS.ORDERS,
        data: { type: "order_created", orderId: p.orderId, url: `/order/${p.orderId}` },
      };
    }

    case WS_EVENTS.ORDER_ASSIGNED_TO_DRIVER: {
      const p = payload as DriverAssignedPayload;
      return {
        title: "Driver Assigned",
        body: `${p.driverName} is picking up your order. ETA: ${p.estimatedPickupMinutes} min.`,
        channelId: NOTIFICATION_CHANNELS.DELIVERY,
        data: { type: "driver_assigned", orderId: p.orderId, url: `/tracking/${p.orderId}` },
      };
    }

    case WS_EVENTS.DRIVER_ETA_UPDATED: {
      const p = payload as DriverEtaPayload;
      // Only notify when driver is very close
      if (p.etaMinutes <= 5) {
        return {
          title: "Driver Nearby!",
          body: `Your driver is ${p.etaMinutes} minute${p.etaMinutes !== 1 ? "s" : ""} away (${p.distanceMiles.toFixed(1)} mi).`,
          channelId: NOTIFICATION_CHANNELS.DELIVERY,
          data: { type: "driver_nearby", orderId: p.orderId, url: `/tracking/${p.orderId}` },
        };
      }
      return null;
    }

    case WS_EVENTS.ORDER_DELIVERED: {
      const p = payload as OrderStatusPayload;
      return {
        title: "Order Delivered!",
        body: "Your order has arrived. Enjoy your drinks!",
        channelId: NOTIFICATION_CHANNELS.ORDERS,
        data: { type: "order_delivered", orderId: p.orderId, url: `/order/${p.orderId}` },
      };
    }

    case WS_EVENTS.ORDER_CANCELLED: {
      const p = payload as OrderStatusPayload;
      return {
        title: "Order Cancelled",
        body: `Order ${p.orderId.slice(0, 8)} has been cancelled.`,
        channelId: NOTIFICATION_CHANNELS.ORDERS,
        data: { type: "order_cancelled", orderId: p.orderId, url: `/order/${p.orderId}` },
      };
    }

    // ─── Store Partner: New orders ───
    case WS_EVENTS.STORE_NEW_ORDER: {
      const p = payload as StoreNewOrderPayload;
      return {
        title: "New Order!",
        body: `${p.customerName} — ${p.itemCount} item${p.itemCount !== 1 ? "s" : ""}, $${p.totalAmount.toFixed(2)} (${p.deliveryMode})`,
        channelId: NOTIFICATION_CHANNELS.STORE_ALERTS,
        data: { type: "store_new_order", orderId: p.orderId, url: "/store/orders" },
      };
    }

    case WS_EVENTS.STORE_DRIVER_ARRIVING: {
      const p = payload as { orderId: string; driverId: string; driverName: string; etaMinutes: number };
      return {
        title: "Driver Arriving",
        body: `${p.driverName} will arrive in ${p.etaMinutes} min to pick up order ${p.orderId.slice(0, 8)}.`,
        channelId: NOTIFICATION_CHANNELS.STORE_ALERTS,
        data: { type: "store_driver_arriving", orderId: p.orderId, url: "/store/orders" },
      };
    }

    // ─── Driver: New jobs ───
    case WS_EVENTS.DRIVER_WENT_ONLINE:
    case WS_EVENTS.DRIVER_WENT_OFFLINE:
      // No push for these — they're self-initiated
      return null;

    // ─── Admin: Platform alerts ───
    case WS_EVENTS.ADMIN_NEW_ORDER: {
      const p = payload as OrderCreatedPayload;
      return {
        title: "New Platform Order",
        body: `${p.customerName} ordered ${p.itemCount} item${p.itemCount !== 1 ? "s" : ""} from ${p.storeName} ($${p.totalAmount.toFixed(2)})`,
        channelId: NOTIFICATION_CHANNELS.ADMIN_ALERTS,
        data: { type: "admin_new_order", orderId: p.orderId, url: "/admin/orders" },
      };
    }

    case WS_EVENTS.ADMIN_NEW_STORE_APPLICATION: {
      const p = payload as { storeName: string; applicationId: string };
      return {
        title: "New Store Application",
        body: `${p.storeName} has applied to become a partner.`,
        channelId: NOTIFICATION_CHANNELS.ADMIN_ALERTS,
        data: { type: "admin_new_application", url: "/admin/store-applications" },
      };
    }

    case WS_EVENTS.ADMIN_NEW_DRIVER_APPLICATION: {
      const p = payload as { driverName: string; applicationId: string };
      return {
        title: "New Driver Application",
        body: `${p.driverName} has applied to become a driver.`,
        channelId: NOTIFICATION_CHANNELS.ADMIN_ALERTS,
        data: { type: "admin_new_driver", url: "/admin/driver-management" },
      };
    }

    case WS_EVENTS.ADMIN_ALERT: {
      const p = payload as AdminAlertPayload;
      return {
        title: p.title,
        body: p.message,
        channelId: NOTIFICATION_CHANNELS.ADMIN_ALERTS,
        data: { type: "admin_alert", alertId: p.alertId, url: p.actionUrl || "/admin/dashboard" },
      };
    }

    default:
      return null;
  }
}

function getOrderStatusTitle(status: string): string {
  switch (status) {
    case "confirmed": return "Order Confirmed";
    case "preparing": return "Preparing Your Order";
    case "ready": return "Order Ready for Pickup";
    case "out_for_delivery": return "Out for Delivery!";
    case "delivered": return "Order Delivered!";
    case "shipped": return "Order Shipped";
    case "cancelled": return "Order Cancelled";
    default: return "Order Update";
  }
}

function getOrderStatusBody(orderId: string, status: string): string {
  const shortId = orderId?.slice(0, 8) || "";
  switch (status) {
    case "confirmed": return `Order ${shortId} has been confirmed by the store.`;
    case "preparing": return `Order ${shortId} is being prepared.`;
    case "ready": return `Order ${shortId} is ready and waiting for pickup.`;
    case "out_for_delivery": return `Order ${shortId} is on its way to you!`;
    case "delivered": return `Order ${shortId} has been delivered. Enjoy!`;
    case "shipped": return `Order ${shortId} has been shipped. Check tracking for updates.`;
    case "cancelled": return `Order ${shortId} has been cancelled.`;
    default: return `Order ${shortId} status updated to ${status}.`;
  }
}

// ─── Hook ───

/**
 * Hook that bridges WebSocket events to push notifications.
 * Rate-limited to prevent notification spam (max 1 per event type per 10s).
 */
export function usePushBridge() {
  const lastNotifyRef = useRef<Record<string, number>>({});

  return {
    /**
     * Call this with each WebSocket message to potentially trigger a push notification.
     */
    handleWsEvent: (msg: WsMessage) => {
      // Rate limit: don't spam the same notification type
      const now = Date.now();
      const p = msg.payload as Record<string, unknown>;
      const key = `${msg.event}:${(p?.orderId as string) || "global"}`;
      const lastTime = lastNotifyRef.current[key] || 0;
      if (now - lastTime < 10000) return; // 10s cooldown per event type+id
      lastNotifyRef.current[key] = now;

      const notification = mapEventToNotification(msg);
      if (!notification) return;

      // Send the local push notification
      sendLocalNotification({
        title: notification.title,
        body: notification.body,
        data: notification.data,
        channelId: notification.channelId,
      });
    },
  };
}
