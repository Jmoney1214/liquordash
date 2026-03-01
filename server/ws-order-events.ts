/**
 * Order Event Emitters — convenience functions to broadcast order lifecycle events
 * to the correct rooms (order, store, driver, admin).
 */

import { WS_EVENTS, makeRoom } from "../shared/ws-events";
import type {
  OrderStatusPayload,
  OrderCreatedPayload,
  DriverLocationPayload,
  DriverEtaPayload,
  DriverAssignedPayload,
  StoreNewOrderPayload,
  StoreDriverArrivingPayload,
  AdminAlertPayload,
} from "../shared/ws-events";
import { broadcast, broadcastToRoomType } from "./websocket";

// ─── Order lifecycle events ───

export function emitOrderCreated(data: OrderCreatedPayload): void {
  const orderRoom = makeRoom("order", data.orderId);
  const storeRoom = makeRoom("store", data.storeId);

  // Notify the order room (customer tracking)
  broadcast(orderRoom, WS_EVENTS.ORDER_CREATED, data);

  // Notify the store
  const storePayload: StoreNewOrderPayload = {
    orderId: data.orderId,
    customerName: data.customerName,
    itemCount: data.itemCount,
    totalAmount: data.totalAmount,
    deliveryMode: data.deliveryMode,
    createdAt: data.createdAt,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min to accept
  };
  broadcast(storeRoom, WS_EVENTS.STORE_NEW_ORDER, storePayload);

  // Notify all admins
  broadcastToRoomType("admin", WS_EVENTS.ADMIN_NEW_ORDER, data);
}

export function emitOrderStatusUpdated(data: OrderStatusPayload & { storeId?: string }): void {
  const orderRoom = makeRoom("order", data.orderId);

  // Always notify the order room (customer)
  broadcast(orderRoom, WS_EVENTS.ORDER_STATUS_UPDATED, data);

  // Notify the store if storeId is provided
  if (data.storeId) {
    const storeRoom = makeRoom("store", data.storeId);
    broadcast(storeRoom, WS_EVENTS.ORDER_STATUS_UPDATED, data);
  }

  // Notify admins
  broadcastToRoomType("admin", WS_EVENTS.ORDER_STATUS_UPDATED, data);

  // Emit specific events for key status changes
  switch (data.newStatus) {
    case "picked_up":
      broadcast(orderRoom, WS_EVENTS.ORDER_PICKED_UP, data);
      break;
    case "delivered":
      broadcast(orderRoom, WS_EVENTS.ORDER_DELIVERED, data);
      break;
    case "cancelled":
      broadcast(orderRoom, WS_EVENTS.ORDER_CANCELLED, data);
      break;
  }
}

export function emitOrderAssignedToDriver(data: DriverAssignedPayload): void {
  const orderRoom = makeRoom("order", data.orderId);
  broadcast(orderRoom, WS_EVENTS.ORDER_ASSIGNED_TO_DRIVER, data);
}

// ─── Driver events ───

export function emitDriverLocationUpdate(data: DriverLocationPayload): void {
  // Send to the order room so customer can track
  const orderRoom = makeRoom("order", data.orderId);
  broadcast(orderRoom, WS_EVENTS.DRIVER_LOCATION_UPDATED, data);

  // Also send to the driver's own room
  const driverRoom = makeRoom("driver", data.driverId);
  broadcast(driverRoom, WS_EVENTS.DRIVER_LOCATION_UPDATED, data);
}

export function emitDriverEtaUpdate(data: DriverEtaPayload): void {
  const orderRoom = makeRoom("order", data.orderId);
  broadcast(orderRoom, WS_EVENTS.DRIVER_ETA_UPDATED, data);
}

export function emitDriverArrivingAtStore(data: StoreDriverArrivingPayload & { storeId: string }): void {
  const storeRoom = makeRoom("store", data.storeId);
  broadcast(storeRoom, WS_EVENTS.STORE_DRIVER_ARRIVING, {
    orderId: data.orderId,
    driverId: data.driverId,
    driverName: data.driverName,
    etaMinutes: data.etaMinutes,
  });
}

// ─── Admin events ───

export function emitAdminAlert(data: AdminAlertPayload): void {
  broadcastToRoomType("admin", WS_EVENTS.ADMIN_ALERT, data);
}

export function emitNewStoreApplication(applicationId: string, storeName: string): void {
  broadcastToRoomType("admin", WS_EVENTS.ADMIN_NEW_STORE_APPLICATION, {
    applicationId,
    storeName,
    createdAt: new Date().toISOString(),
  });
}

export function emitNewDriverApplication(applicationId: string, driverName: string): void {
  broadcastToRoomType("admin", WS_EVENTS.ADMIN_NEW_DRIVER_APPLICATION, {
    applicationId,
    driverName,
    createdAt: new Date().toISOString(),
  });
}
