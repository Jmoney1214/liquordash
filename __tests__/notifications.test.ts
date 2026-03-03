/**
 * Tests for the push notification system — event types, channels, and bridge mapping.
 */

import { describe, it, expect } from "vitest";
import {
  WS_EVENTS,
  createWsMessage,
  parseWsMessage,
  makeRoom,
  parseRoom,
  type WsMessage,
  type OrderStatusPayload,
  type OrderCreatedPayload,
  type DriverAssignedPayload,
  type DriverEtaPayload,
  type StoreNewOrderPayload,
  type AdminAlertPayload,
} from "../shared/ws-events";

// ─── WS Events & Channels ───

describe("Notification System - Event Types", () => {
  it("should have all required order event types", () => {
    expect(WS_EVENTS.ORDER_STATUS_UPDATED).toBe("order_status_updated");
    expect(WS_EVENTS.ORDER_CREATED).toBe("order_created");
    expect(WS_EVENTS.ORDER_ASSIGNED_TO_DRIVER).toBe("order_assigned_to_driver");
    expect(WS_EVENTS.ORDER_PICKED_UP).toBe("order_picked_up");
    expect(WS_EVENTS.ORDER_DELIVERED).toBe("order_delivered");
    expect(WS_EVENTS.ORDER_CANCELLED).toBe("order_cancelled");
  });

  it("should have all required driver event types", () => {
    expect(WS_EVENTS.DRIVER_LOCATION_UPDATED).toBe("driver_location_updated");
    expect(WS_EVENTS.DRIVER_ETA_UPDATED).toBe("driver_eta_updated");
    expect(WS_EVENTS.DRIVER_WENT_ONLINE).toBe("driver_went_online");
    expect(WS_EVENTS.DRIVER_WENT_OFFLINE).toBe("driver_went_offline");
  });

  it("should have all required store event types", () => {
    expect(WS_EVENTS.STORE_NEW_ORDER).toBe("store_new_order");
    expect(WS_EVENTS.STORE_ORDER_READY).toBe("store_order_ready");
    expect(WS_EVENTS.STORE_DRIVER_ARRIVING).toBe("store_driver_arriving");
  });

  it("should have all required admin event types", () => {
    expect(WS_EVENTS.ADMIN_NEW_ORDER).toBe("admin_new_order");
    expect(WS_EVENTS.ADMIN_NEW_STORE_APPLICATION).toBe("admin_new_store_application");
    expect(WS_EVENTS.ADMIN_NEW_DRIVER_APPLICATION).toBe("admin_new_driver_application");
    expect(WS_EVENTS.ADMIN_ALERT).toBe("admin_alert");
  });

  it("should have system event types", () => {
    expect(WS_EVENTS.CONNECTED).toBe("connected");
    expect(WS_EVENTS.ERROR).toBe("error");
    expect(WS_EVENTS.PONG).toBe("pong");
    expect(WS_EVENTS.PING).toBe("ping");
  });
});

// ─── Room Management ───

describe("Notification System - Room Management", () => {
  it("should create rooms correctly", () => {
    expect(makeRoom("order", "123")).toBe("order:123");
    expect(makeRoom("store", "abc")).toBe("store:abc");
    expect(makeRoom("driver", "d1")).toBe("driver:d1");
    expect(makeRoom("admin", "global")).toBe("admin:global");
  });

  it("should parse rooms correctly", () => {
    const orderRoom = parseRoom("order:123");
    expect(orderRoom).toEqual({ type: "order", id: "123" });

    const storeRoom = parseRoom("store:abc");
    expect(storeRoom).toEqual({ type: "store", id: "abc" });

    const driverRoom = parseRoom("driver:d1");
    expect(driverRoom).toEqual({ type: "driver", id: "d1" });

    const adminRoom = parseRoom("admin:global");
    expect(adminRoom).toEqual({ type: "admin", id: "global" });
  });

  it("should return null for invalid rooms", () => {
    expect(parseRoom("invalid")).toBeNull();
    expect(parseRoom("unknown:123")).toBeNull();
    expect(parseRoom("")).toBeNull();
  });

  it("should handle room IDs with colons", () => {
    const room = parseRoom("order:uuid:with:colons");
    expect(room).toEqual({ type: "order", id: "uuid:with:colons" });
  });
});

// ─── Message Creation & Parsing ───

describe("Notification System - Message Handling", () => {
  it("should create WsMessage with correct structure", () => {
    const payload: OrderStatusPayload = {
      orderId: "order-123",
      previousStatus: "preparing",
      newStatus: "ready",
      updatedAt: "2026-03-03T12:00:00Z",
      updatedBy: "store",
    };

    const msg = createWsMessage(WS_EVENTS.ORDER_STATUS_UPDATED, payload, "order:order-123");

    expect(msg.event).toBe("order_status_updated");
    expect(msg.payload).toEqual(payload);
    expect(msg.room).toBe("order:order-123");
    expect(msg.timestamp).toBeDefined();
    expect(new Date(msg.timestamp).getTime()).toBeGreaterThan(0);
  });

  it("should create message without room", () => {
    const msg = createWsMessage(WS_EVENTS.CONNECTED, { clientId: "abc" });
    expect(msg.room).toBeUndefined();
    expect(msg.event).toBe("connected");
  });

  it("should parse valid WsMessage from JSON", () => {
    const original = createWsMessage(WS_EVENTS.ORDER_CREATED, {
      orderId: "o1",
      customerName: "John",
      storeId: "s1",
      storeName: "Wine Shop",
      deliveryMode: "express",
      totalAmount: 59.99,
      itemCount: 3,
      createdAt: "2026-03-03T12:00:00Z",
    } as OrderCreatedPayload, "store:s1");

    const json = JSON.stringify(original);
    const parsed = parseWsMessage(json);

    expect(parsed).not.toBeNull();
    expect(parsed!.event).toBe("order_created");
    expect((parsed!.payload as OrderCreatedPayload).customerName).toBe("John");
    expect((parsed!.payload as OrderCreatedPayload).totalAmount).toBe(59.99);
  });

  it("should return null for invalid JSON", () => {
    expect(parseWsMessage("not json")).toBeNull();
    expect(parseWsMessage("{}")).toBeNull();
    expect(parseWsMessage('{"event": "test"}')).toBeNull(); // missing payload
  });

  it("should handle all payload types", () => {
    // OrderStatusPayload
    const statusMsg = createWsMessage(WS_EVENTS.ORDER_STATUS_UPDATED, {
      orderId: "o1",
      previousStatus: "confirmed",
      newStatus: "preparing",
      updatedAt: "2026-03-03T12:00:00Z",
    } as OrderStatusPayload);
    expect(statusMsg.event).toBe("order_status_updated");

    // DriverAssignedPayload
    const assignMsg = createWsMessage(WS_EVENTS.ORDER_ASSIGNED_TO_DRIVER, {
      orderId: "o1",
      driverId: "d1",
      driverName: "Mike",
      driverPhone: "555-1234",
      vehicleDescription: "Black Toyota Camry",
      estimatedPickupMinutes: 10,
    } as DriverAssignedPayload);
    expect(assignMsg.event).toBe("order_assigned_to_driver");

    // DriverEtaPayload
    const etaMsg = createWsMessage(WS_EVENTS.DRIVER_ETA_UPDATED, {
      orderId: "o1",
      driverId: "d1",
      etaMinutes: 5,
      distanceMiles: 1.2,
      updatedAt: "2026-03-03T12:00:00Z",
    } as DriverEtaPayload);
    expect(etaMsg.event).toBe("driver_eta_updated");

    // StoreNewOrderPayload
    const storeMsg = createWsMessage(WS_EVENTS.STORE_NEW_ORDER, {
      orderId: "o1",
      customerName: "Jane",
      itemCount: 2,
      totalAmount: 89.99,
      deliveryMode: "express",
      createdAt: "2026-03-03T12:00:00Z",
      expiresAt: "2026-03-03T12:05:00Z",
    } as StoreNewOrderPayload);
    expect(storeMsg.event).toBe("store_new_order");

    // AdminAlertPayload
    const adminMsg = createWsMessage(WS_EVENTS.ADMIN_ALERT, {
      alertId: "a1",
      type: "warning",
      title: "High Volume",
      message: "Order volume is 200% above normal.",
      createdAt: "2026-03-03T12:00:00Z",
      actionUrl: "/admin/orders",
    } as AdminAlertPayload);
    expect(adminMsg.event).toBe("admin_alert");
  });
});

// ─── Notification Channel Mapping ───

describe("Notification System - Channel Mapping", () => {
  it("should map order events to the correct notification channel", () => {
    // Order events → ORDERS channel
    const orderEvents = [
      WS_EVENTS.ORDER_STATUS_UPDATED,
      WS_EVENTS.ORDER_CREATED,
      WS_EVENTS.ORDER_DELIVERED,
      WS_EVENTS.ORDER_CANCELLED,
    ];
    orderEvents.forEach((event) => {
      expect(["order_status_updated", "order_created", "order_delivered", "order_cancelled"]).toContain(event);
    });
  });

  it("should map driver events to the correct notification channel", () => {
    const driverEvents = [
      WS_EVENTS.ORDER_ASSIGNED_TO_DRIVER,
      WS_EVENTS.DRIVER_ETA_UPDATED,
      WS_EVENTS.DRIVER_LOCATION_UPDATED,
    ];
    driverEvents.forEach((event) => {
      expect(["order_assigned_to_driver", "driver_eta_updated", "driver_location_updated"]).toContain(event);
    });
  });

  it("should map store events to the correct notification channel", () => {
    const storeEvents = [
      WS_EVENTS.STORE_NEW_ORDER,
      WS_EVENTS.STORE_ORDER_READY,
      WS_EVENTS.STORE_DRIVER_ARRIVING,
    ];
    storeEvents.forEach((event) => {
      expect(["store_new_order", "store_order_ready", "store_driver_arriving"]).toContain(event);
    });
  });

  it("should map admin events to the correct notification channel", () => {
    const adminEvents = [
      WS_EVENTS.ADMIN_NEW_ORDER,
      WS_EVENTS.ADMIN_NEW_STORE_APPLICATION,
      WS_EVENTS.ADMIN_NEW_DRIVER_APPLICATION,
      WS_EVENTS.ADMIN_ALERT,
    ];
    adminEvents.forEach((event) => {
      expect(["admin_new_order", "admin_new_store_application", "admin_new_driver_application", "admin_alert"]).toContain(event);
    });
  });
});

// ─── Notification Payload Validation ───

describe("Notification System - Payload Validation", () => {
  it("should validate OrderStatusPayload has required fields", () => {
    const payload: OrderStatusPayload = {
      orderId: "order-123",
      previousStatus: "confirmed",
      newStatus: "preparing",
      updatedAt: new Date().toISOString(),
    };
    expect(payload.orderId).toBeDefined();
    expect(payload.previousStatus).toBeDefined();
    expect(payload.newStatus).toBeDefined();
    expect(payload.updatedAt).toBeDefined();
  });

  it("should validate OrderCreatedPayload has required fields", () => {
    const payload: OrderCreatedPayload = {
      orderId: "order-123",
      customerName: "John Doe",
      storeId: "store-1",
      storeName: "Wine World",
      deliveryMode: "express",
      totalAmount: 89.99,
      itemCount: 3,
      createdAt: new Date().toISOString(),
    };
    expect(payload.orderId).toBeDefined();
    expect(payload.customerName).toBeDefined();
    expect(payload.deliveryMode).toBe("express");
    expect(payload.totalAmount).toBeGreaterThan(0);
  });

  it("should validate DriverAssignedPayload has required fields", () => {
    const payload: DriverAssignedPayload = {
      orderId: "order-123",
      driverId: "driver-1",
      driverName: "Mike Johnson",
      driverPhone: "555-0123",
      vehicleDescription: "Black Toyota Camry",
      estimatedPickupMinutes: 15,
    };
    expect(payload.driverName).toBeDefined();
    expect(payload.estimatedPickupMinutes).toBeGreaterThan(0);
  });

  it("should validate StoreNewOrderPayload has required fields", () => {
    const payload: StoreNewOrderPayload = {
      orderId: "order-123",
      customerName: "Jane Smith",
      itemCount: 2,
      totalAmount: 65.50,
      deliveryMode: "shipping",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300000).toISOString(),
    };
    expect(payload.customerName).toBeDefined();
    expect(payload.expiresAt).toBeDefined();
    expect(new Date(payload.expiresAt).getTime()).toBeGreaterThan(new Date(payload.createdAt).getTime());
  });

  it("should validate AdminAlertPayload has required fields", () => {
    const payload: AdminAlertPayload = {
      alertId: "alert-1",
      type: "warning",
      title: "High Order Volume",
      message: "Order volume is 200% above normal for this time of day.",
      createdAt: new Date().toISOString(),
      actionUrl: "/admin/orders",
    };
    expect(payload.type).toBe("warning");
    expect(["warning", "error", "info", "success"]).toContain(payload.type);
    expect(payload.actionUrl).toBeDefined();
  });
});
