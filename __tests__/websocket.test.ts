/**
 * WebSocket Real-Time System Tests
 * Tests event types, message serialization, room naming, and payload validation.
 */
import { describe, it, expect } from "vitest";

import {
  WS_EVENTS,
  makeRoom,
  parseRoom,
  createWsMessage,
  parseWsMessage,
  type WsMessage,
  type OrderStatusPayload,
  type OrderCreatedPayload,
  type DriverLocationPayload,
  type DriverEtaPayload,
  type DriverAssignedPayload,
  type StoreNewOrderPayload,
  type StoreDriverArrivingPayload,
  type AdminAlertPayload,
  type ConnectionState,
  type RoomType,
} from "../shared/ws-events";

describe("WS_EVENTS constants", () => {
  it("should define all client-to-server events", () => {
    expect(WS_EVENTS.JOIN_ROOM).toBe("join_room");
    expect(WS_EVENTS.LEAVE_ROOM).toBe("leave_room");
    expect(WS_EVENTS.PING).toBe("ping");
  });

  it("should define all order events", () => {
    expect(WS_EVENTS.ORDER_STATUS_UPDATED).toBe("order_status_updated");
    expect(WS_EVENTS.ORDER_CREATED).toBe("order_created");
    expect(WS_EVENTS.ORDER_ASSIGNED_TO_DRIVER).toBe("order_assigned_to_driver");
    expect(WS_EVENTS.ORDER_PICKED_UP).toBe("order_picked_up");
    expect(WS_EVENTS.ORDER_DELIVERED).toBe("order_delivered");
    expect(WS_EVENTS.ORDER_CANCELLED).toBe("order_cancelled");
  });

  it("should define all driver events", () => {
    expect(WS_EVENTS.DRIVER_LOCATION_UPDATED).toBe("driver_location_updated");
    expect(WS_EVENTS.DRIVER_ETA_UPDATED).toBe("driver_eta_updated");
    expect(WS_EVENTS.DRIVER_WENT_ONLINE).toBe("driver_went_online");
    expect(WS_EVENTS.DRIVER_WENT_OFFLINE).toBe("driver_went_offline");
  });

  it("should define all store events", () => {
    expect(WS_EVENTS.STORE_NEW_ORDER).toBe("store_new_order");
    expect(WS_EVENTS.STORE_ORDER_READY).toBe("store_order_ready");
    expect(WS_EVENTS.STORE_DRIVER_ARRIVING).toBe("store_driver_arriving");
  });

  it("should define all admin events", () => {
    expect(WS_EVENTS.ADMIN_NEW_ORDER).toBe("admin_new_order");
    expect(WS_EVENTS.ADMIN_NEW_STORE_APPLICATION).toBe("admin_new_store_application");
    expect(WS_EVENTS.ADMIN_NEW_DRIVER_APPLICATION).toBe("admin_new_driver_application");
    expect(WS_EVENTS.ADMIN_ALERT).toBe("admin_alert");
  });

  it("should define system events", () => {
    expect(WS_EVENTS.CONNECTED).toBe("connected");
    expect(WS_EVENTS.ERROR).toBe("error");
    expect(WS_EVENTS.PONG).toBe("pong");
  });

  it("should have unique event values", () => {
    const values = Object.values(WS_EVENTS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

describe("Room helpers", () => {
  it("makeRoom creates correct room strings", () => {
    expect(makeRoom("order", "abc-123")).toBe("order:abc-123");
    expect(makeRoom("store", "store-1")).toBe("store:store-1");
    expect(makeRoom("driver", "d-5")).toBe("driver:d-5");
    expect(makeRoom("admin", "global")).toBe("admin:global");
  });

  it("parseRoom extracts type and id", () => {
    const result = parseRoom("order:abc-123");
    expect(result).toEqual({ type: "order", id: "abc-123" });
  });

  it("parseRoom handles colons in id", () => {
    const result = parseRoom("store:store:with:colons");
    expect(result).toEqual({ type: "store", id: "store:with:colons" });
  });

  it("parseRoom returns null for invalid rooms", () => {
    expect(parseRoom("invalid")).toBeNull();
    expect(parseRoom("unknown:123")).toBeNull();
    expect(parseRoom("order:")).toBeNull();
  });

  it("parseRoom accepts all valid room types", () => {
    const types: RoomType[] = ["order", "store", "driver", "admin"];
    types.forEach((t) => {
      const result = parseRoom(`${t}:test-id`);
      expect(result).toEqual({ type: t, id: "test-id" });
    });
  });
});

describe("WsMessage creation and parsing", () => {
  it("createWsMessage builds a valid message envelope", () => {
    const msg = createWsMessage(WS_EVENTS.ORDER_CREATED, { orderId: "o-1" }, "order:o-1");
    expect(msg.event).toBe("order_created");
    expect(msg.payload).toEqual({ orderId: "o-1" });
    expect(msg.room).toBe("order:o-1");
    expect(typeof msg.timestamp).toBe("string");
    expect(new Date(msg.timestamp).getTime()).toBeGreaterThan(0);
  });

  it("createWsMessage works without room", () => {
    const msg = createWsMessage(WS_EVENTS.PING, {});
    expect(msg.event).toBe("ping");
    expect(msg.room).toBeUndefined();
  });

  it("parseWsMessage deserializes valid JSON", () => {
    const original = createWsMessage(WS_EVENTS.ORDER_STATUS_UPDATED, {
      orderId: "o-1",
      previousStatus: "confirmed",
      newStatus: "preparing",
      updatedAt: "2026-03-01T12:00:00Z",
    });
    const serialized = JSON.stringify(original);
    const parsed = parseWsMessage(serialized);

    expect(parsed).not.toBeNull();
    expect(parsed!.event).toBe("order_status_updated");
    expect((parsed!.payload as OrderStatusPayload).orderId).toBe("o-1");
  });

  it("parseWsMessage returns null for invalid JSON", () => {
    expect(parseWsMessage("not json")).toBeNull();
    expect(parseWsMessage("{}")).toBeNull();
    expect(parseWsMessage('{"event": "test"}')).toBeNull();
  });

  it("parseWsMessage returns null for missing event field", () => {
    expect(parseWsMessage('{"payload": {}}')).toBeNull();
  });
});

describe("OrderStatusPayload", () => {
  it("should have required fields", () => {
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

  it("should support optional fields", () => {
    const payload: OrderStatusPayload = {
      orderId: "order-123",
      previousStatus: "preparing",
      newStatus: "out-for-delivery",
      updatedAt: new Date().toISOString(),
      updatedBy: "driver",
      message: "Driver picked up the order",
    };
    expect(payload.updatedBy).toBe("driver");
    expect(payload.message).toBe("Driver picked up the order");
  });
});

describe("OrderCreatedPayload", () => {
  it("should have all required fields", () => {
    const payload: OrderCreatedPayload = {
      orderId: "o-1",
      customerName: "John Doe",
      storeId: "s-1",
      storeName: "Downtown Spirits",
      deliveryMode: "express",
      totalAmount: 89.99,
      itemCount: 3,
      createdAt: new Date().toISOString(),
    };
    expect(payload.totalAmount).toBeGreaterThan(0);
    expect(payload.itemCount).toBeGreaterThan(0);
    expect(["express", "shipping"]).toContain(payload.deliveryMode);
  });
});

describe("DriverLocationPayload", () => {
  it("should validate coordinate ranges", () => {
    const payload: DriverLocationPayload = {
      orderId: "o-1",
      driverId: "d-1",
      driverName: "Marcus J.",
      latitude: 37.7749,
      longitude: -122.4194,
      heading: 45,
      speed: 25,
      updatedAt: new Date().toISOString(),
    };
    expect(payload.latitude).toBeGreaterThanOrEqual(-90);
    expect(payload.latitude).toBeLessThanOrEqual(90);
    expect(payload.longitude).toBeGreaterThanOrEqual(-180);
    expect(payload.longitude).toBeLessThanOrEqual(180);
    expect(payload.heading).toBeGreaterThanOrEqual(0);
    expect(payload.heading).toBeLessThanOrEqual(360);
    expect(payload.speed).toBeGreaterThanOrEqual(0);
  });
});

describe("DriverEtaPayload", () => {
  it("should have positive ETA and distance", () => {
    const payload: DriverEtaPayload = {
      orderId: "o-1",
      driverId: "d-1",
      etaMinutes: 12,
      distanceMiles: 3.5,
      updatedAt: new Date().toISOString(),
    };
    expect(payload.etaMinutes).toBeGreaterThanOrEqual(0);
    expect(payload.distanceMiles).toBeGreaterThanOrEqual(0);
  });
});

describe("DriverAssignedPayload", () => {
  it("should have driver details", () => {
    const payload: DriverAssignedPayload = {
      orderId: "o-1",
      driverId: "d-1",
      driverName: "Marcus J.",
      driverPhone: "(415) 555-0177",
      vehicleDescription: "Silver Toyota Camry",
      estimatedPickupMinutes: 8,
    };
    expect(payload.driverName).toBeTruthy();
    expect(payload.vehicleDescription).toBeTruthy();
    expect(payload.estimatedPickupMinutes).toBeGreaterThan(0);
  });
});

describe("StoreNewOrderPayload", () => {
  it("should have order and expiry info", () => {
    const payload: StoreNewOrderPayload = {
      orderId: "o-1",
      customerName: "Jane",
      itemCount: 2,
      totalAmount: 45.5,
      deliveryMode: "express",
      createdAt: "2026-03-01T12:00:00Z",
      expiresAt: "2026-03-01T12:05:00Z",
    };
    expect(payload.totalAmount).toBeGreaterThan(0);
    expect(payload.itemCount).toBeGreaterThan(0);
    expect(new Date(payload.expiresAt).getTime()).toBeGreaterThan(new Date(payload.createdAt).getTime());
  });
});

describe("StoreDriverArrivingPayload", () => {
  it("should have driver and ETA info", () => {
    const payload: StoreDriverArrivingPayload = {
      orderId: "o-1",
      driverId: "d-1",
      driverName: "Marcus",
      etaMinutes: 3,
    };
    expect(payload.etaMinutes).toBeGreaterThanOrEqual(0);
  });
});

describe("AdminAlertPayload", () => {
  it("should validate severity levels", () => {
    const severities: AdminAlertPayload["type"][] = ["warning", "error", "info", "success"];
    severities.forEach((type) => {
      const payload: AdminAlertPayload = {
        alertId: "alert-1",
        type,
        title: "Test Alert",
        message: "Test message",
        createdAt: new Date().toISOString(),
      };
      expect(["warning", "error", "info", "success"]).toContain(payload.type);
    });
  });

  it("should support optional actionUrl", () => {
    const payload: AdminAlertPayload = {
      alertId: "alert-2",
      type: "warning",
      title: "High Order Volume",
      message: "Orders are 50% above average",
      createdAt: new Date().toISOString(),
      actionUrl: "/admin/orders",
    };
    expect(payload.actionUrl).toBe("/admin/orders");
  });
});

describe("ConnectionState", () => {
  it("should define all valid states", () => {
    const states: ConnectionState[] = ["connecting", "connected", "disconnected", "reconnecting"];
    expect(states).toHaveLength(4);
  });
});

describe("End-to-end message flow simulation", () => {
  it("should simulate a complete order lifecycle via WS messages", () => {
    const orderId = "order-lifecycle-1";
    const room = makeRoom("order", orderId);

    // 1. Order created
    const created = createWsMessage(WS_EVENTS.ORDER_CREATED, {
      orderId,
      customerName: "Alice",
      storeId: "s-1",
      storeName: "Premium Spirits",
      deliveryMode: "express",
      totalAmount: 75.0,
      itemCount: 2,
      createdAt: new Date().toISOString(),
    } satisfies OrderCreatedPayload, room);

    // 2. Status → preparing
    const preparing = createWsMessage(WS_EVENTS.ORDER_STATUS_UPDATED, {
      orderId,
      previousStatus: "confirmed",
      newStatus: "preparing",
      updatedAt: new Date().toISOString(),
      updatedBy: "store",
    } satisfies OrderStatusPayload, room);

    // 3. Driver assigned
    const assigned = createWsMessage(WS_EVENTS.ORDER_ASSIGNED_TO_DRIVER, {
      orderId,
      driverId: "d-1",
      driverName: "Marcus J.",
      driverPhone: "(415) 555-0177",
      vehicleDescription: "Silver Toyota Camry",
      estimatedPickupMinutes: 8,
    } satisfies DriverAssignedPayload, room);

    // 4. Driver location update
    const location = createWsMessage(WS_EVENTS.DRIVER_LOCATION_UPDATED, {
      orderId,
      driverId: "d-1",
      driverName: "Marcus J.",
      latitude: 37.7749,
      longitude: -122.4194,
      heading: 45,
      speed: 25,
      updatedAt: new Date().toISOString(),
    } satisfies DriverLocationPayload, room);

    // 5. Delivered
    const delivered = createWsMessage(WS_EVENTS.ORDER_DELIVERED, {
      orderId,
      previousStatus: "out-for-delivery",
      newStatus: "delivered",
      updatedAt: new Date().toISOString(),
      updatedBy: "driver",
      message: "Left at front door",
    } satisfies OrderStatusPayload, room);

    // Verify all messages are valid
    const messages = [created, preparing, assigned, location, delivered];
    messages.forEach((msg) => {
      expect(msg.event).toBeTruthy();
      expect(msg.payload).toBeDefined();
      expect(msg.room).toBe(room);
      expect(msg.timestamp).toBeTruthy();

      // Verify serialization roundtrip
      const parsed = parseWsMessage(JSON.stringify(msg));
      expect(parsed).not.toBeNull();
      expect(parsed!.event).toBe(msg.event);
    });

    // Verify lifecycle order
    expect(created.event).toBe("order_created");
    expect(preparing.event).toBe("order_status_updated");
    expect(assigned.event).toBe("order_assigned_to_driver");
    expect(location.event).toBe("driver_location_updated");
    expect(delivered.event).toBe("order_delivered");
  });

  it("should simulate store receiving and processing an order", () => {
    const storeRoom = makeRoom("store", "store-1");

    // Store receives new order
    const newOrder = createWsMessage(WS_EVENTS.STORE_NEW_ORDER, {
      orderId: "o-1",
      customerName: "Bob",
      itemCount: 4,
      totalAmount: 120.0,
      deliveryMode: "express",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60000).toISOString(),
    } satisfies StoreNewOrderPayload, storeRoom);

    // Driver arriving for pickup
    const driverArriving = createWsMessage(WS_EVENTS.STORE_DRIVER_ARRIVING, {
      orderId: "o-1",
      driverId: "d-1",
      driverName: "Marcus",
      etaMinutes: 3,
    } satisfies StoreDriverArrivingPayload, storeRoom);

    expect(newOrder.event).toBe("store_new_order");
    expect(driverArriving.event).toBe("store_driver_arriving");
    expect((newOrder.payload as StoreNewOrderPayload).totalAmount).toBe(120.0);
  });

  it("should simulate admin receiving platform alerts", () => {
    const adminRoom = makeRoom("admin", "global");

    const alert = createWsMessage(WS_EVENTS.ADMIN_ALERT, {
      alertId: "alert-1",
      type: "warning",
      title: "High Order Volume",
      message: "Current order rate is 50% above average",
      createdAt: new Date().toISOString(),
      actionUrl: "/admin/orders",
    } satisfies AdminAlertPayload, adminRoom);

    expect(alert.event).toBe("admin_alert");
    expect(alert.room).toBe("admin:global");
    expect((alert.payload as AdminAlertPayload).type).toBe("warning");
  });
});
