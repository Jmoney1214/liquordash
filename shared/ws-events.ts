/**
 * WebSocket Event Types — shared between server and client.
 *
 * Architecture:
 * - Clients join "rooms" based on their role and context (e.g., order:123, store:456, driver:789)
 * - Server broadcasts events to relevant rooms when state changes
 * - Clients subscribe to rooms and receive typed events
 */

// ─── Room types ───

export type RoomType = "order" | "store" | "driver" | "admin";

export function makeRoom(type: RoomType, id: string): string {
  return `${type}:${id}`;
}

export function parseRoom(room: string): { type: RoomType; id: string } | null {
  const [type, ...rest] = room.split(":");
  const id = rest.join(":");
  if (["order", "store", "driver", "admin"].includes(type) && id) {
    return { type: type as RoomType, id };
  }
  return null;
}

// ─── Event names ───

export const WS_EVENTS = {
  // Client → Server
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  PING: "ping",

  // Server → Client: Order events
  ORDER_STATUS_UPDATED: "order_status_updated",
  ORDER_CREATED: "order_created",
  ORDER_ASSIGNED_TO_DRIVER: "order_assigned_to_driver",
  ORDER_PICKED_UP: "order_picked_up",
  ORDER_DELIVERED: "order_delivered",
  ORDER_CANCELLED: "order_cancelled",

  // Server → Client: Driver events
  DRIVER_LOCATION_UPDATED: "driver_location_updated",
  DRIVER_ETA_UPDATED: "driver_eta_updated",
  DRIVER_WENT_ONLINE: "driver_went_online",
  DRIVER_WENT_OFFLINE: "driver_went_offline",

  // Server → Client: Store events
  STORE_NEW_ORDER: "store_new_order",
  STORE_ORDER_READY: "store_order_ready",
  STORE_DRIVER_ARRIVING: "store_driver_arriving",

  // Server → Client: Admin events
  ADMIN_NEW_ORDER: "admin_new_order",
  ADMIN_NEW_STORE_APPLICATION: "admin_new_store_application",
  ADMIN_NEW_DRIVER_APPLICATION: "admin_new_driver_application",
  ADMIN_ALERT: "admin_alert",

  // Server → Client: System
  CONNECTED: "connected",
  ERROR: "error",
  PONG: "pong",
} as const;

export type WsEventName = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];

// ─── Event payloads ───

export interface OrderStatusPayload {
  orderId: string;
  previousStatus: string;
  newStatus: string;
  updatedAt: string;
  updatedBy?: string; // "store", "driver", "admin", "system"
  message?: string;
}

export interface OrderCreatedPayload {
  orderId: string;
  customerName: string;
  storeId: string;
  storeName: string;
  deliveryMode: "express" | "shipping";
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}

export interface DriverLocationPayload {
  orderId: string;
  driverId: string;
  driverName: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  updatedAt: string;
}

export interface DriverEtaPayload {
  orderId: string;
  driverId: string;
  etaMinutes: number;
  distanceMiles: number;
  updatedAt: string;
}

export interface DriverAssignedPayload {
  orderId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehicleDescription: string;
  estimatedPickupMinutes: number;
}

export interface StoreNewOrderPayload {
  orderId: string;
  customerName: string;
  itemCount: number;
  totalAmount: number;
  deliveryMode: "express" | "shipping";
  createdAt: string;
  expiresAt: string; // store must accept before this time
}

export interface StoreDriverArrivingPayload {
  orderId: string;
  driverId: string;
  driverName: string;
  etaMinutes: number;
}

export interface AdminAlertPayload {
  alertId: string;
  type: "warning" | "error" | "info" | "success";
  title: string;
  message: string;
  createdAt: string;
  actionUrl?: string;
}

// ─── Message envelope ───

export interface WsMessage<T = unknown> {
  event: WsEventName;
  room?: string;
  payload: T;
  timestamp: string;
}

export function createWsMessage<T>(event: WsEventName, payload: T, room?: string): WsMessage<T> {
  return {
    event,
    payload,
    room,
    timestamp: new Date().toISOString(),
  };
}

export function parseWsMessage(data: string): WsMessage | null {
  try {
    const msg = JSON.parse(data);
    if (msg && typeof msg.event === "string" && msg.payload !== undefined) {
      return msg as WsMessage;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Connection state ───

export type ConnectionState = "connecting" | "connected" | "disconnected" | "reconnecting";
