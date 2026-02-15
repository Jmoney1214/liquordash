import { describe, it, expect } from "vitest";
import {
  SAMPLE_STORES,
  SAMPLE_STORE_ORDERS,
  createEmptyApplication,
  formatCurrency,
  StoreOrderStatus,
} from "../lib/store-data";

describe("Store Data", () => {
  it("should have sample stores", () => {
    expect(SAMPLE_STORES.length).toBeGreaterThan(0);
    SAMPLE_STORES.forEach((store) => {
      expect(store.id).toBeTruthy();
      expect(store.name).toBeTruthy();
      expect(store.city).toBeTruthy();
      expect(store.state).toBeTruthy();
      expect(store.isActive).toBe(true);
    });
  });

  it("should have sample store orders", () => {
    expect(SAMPLE_STORE_ORDERS.length).toBeGreaterThan(0);
    SAMPLE_STORE_ORDERS.forEach((order) => {
      expect(order.id).toBeTruthy();
      expect(order.orderId).toBeTruthy();
      expect(order.customerName).toBeTruthy();
      expect(order.items.length).toBeGreaterThan(0);
      expect(order.subtotal).toBeGreaterThan(0);
      expect(order.commission).toBeGreaterThan(0);
      expect(order.storePayout).toBeGreaterThan(0);
      expect(order.storePayout).toBeLessThan(order.subtotal);
    });
  });

  it("should create empty application", () => {
    const app = createEmptyApplication();
    expect(app.businessName).toBe("");
    expect(app.ownerName).toBe("");
    expect(app.ownerEmail).toBe("");
    expect(app.ownerPhone).toBe("");
    expect(app.status).toBe("draft");
    expect(app.id).toBeTruthy();
  });

  it("should format currency correctly", () => {
    expect(formatCurrency(0)).toBe("$0.00");
    expect(formatCurrency(10)).toBe("$10.00");
    expect(formatCurrency(99.99)).toBe("$99.99");
    expect(formatCurrency(1234.5)).toBe("$1234.50");
  });

  it("store orders should have valid delivery modes", () => {
    SAMPLE_STORE_ORDERS.forEach((order) => {
      expect(["express", "shipping"]).toContain(order.deliveryMode);
    });
  });

  it("store orders should have valid statuses", () => {
    const validStatuses: StoreOrderStatus[] = [
      "pending",
      "accepted",
      "preparing",
      "ready",
      "shipped",
      "completed",
      "rejected",
      "cancelled",
    ];
    SAMPLE_STORE_ORDERS.forEach((order) => {
      expect(validStatuses).toContain(order.status);
    });
  });

  it("commission should be calculated correctly", () => {
    SAMPLE_STORE_ORDERS.forEach((order) => {
      const expectedPayout = order.subtotal - order.commission;
      expect(Math.abs(order.storePayout - expectedPayout)).toBeLessThan(0.01);
    });
  });

  it("stores should have valid delivery settings", () => {
    SAMPLE_STORES.forEach((store) => {
      expect(store.expressDeliveryRadius).toBeGreaterThan(0);
      expect(store.averagePrepTime).toBeGreaterThan(0);
      expect(store.supportsShipping).toBeDefined();
    });
  });
});
