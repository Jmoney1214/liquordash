import { describe, it, expect } from "vitest";
import {
  SAMPLE_STORE_APPLICATIONS,
  SAMPLE_DRIVER_APPROVALS,
  SAMPLE_PLATFORM_ORDERS,
  SAMPLE_PLATFORM_USERS,
  SAMPLE_METRICS,
  SAMPLE_REVENUE_DATA,
  DEFAULT_PLATFORM_SETTINGS,
  formatAdminCurrency,
  formatCompactNumber,
  getTimeAgoAdmin,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  DRIVER_STATUS_COLORS,
  APP_REVIEW_STATUS_COLORS,
} from "../lib/admin-store";

describe("Admin Store - Sample Data", () => {
  it("has sample store applications with required fields", () => {
    expect(SAMPLE_STORE_APPLICATIONS.length).toBeGreaterThan(0);
    SAMPLE_STORE_APPLICATIONS.forEach((app) => {
      expect(app.id).toBeTruthy();
      expect(app.businessName).toBeTruthy();
      expect(app.ownerName).toBeTruthy();
      expect(app.ownerEmail).toContain("@");
      expect(["pending", "under_review", "approved", "rejected"]).toContain(app.status);
    });
  });

  it("has sample driver approvals with required fields", () => {
    expect(SAMPLE_DRIVER_APPROVALS.length).toBeGreaterThan(0);
    SAMPLE_DRIVER_APPROVALS.forEach((d) => {
      expect(d.id).toBeTruthy();
      expect(d.firstName).toBeTruthy();
      expect(d.lastName).toBeTruthy();
      expect(d.email).toContain("@");
      expect(["pending", "approved", "suspended", "rejected"]).toContain(d.status);
    });
  });

  it("has sample platform orders with required fields", () => {
    expect(SAMPLE_PLATFORM_ORDERS.length).toBeGreaterThan(0);
    SAMPLE_PLATFORM_ORDERS.forEach((o) => {
      expect(o.id).toBeTruthy();
      expect(o.customerName).toBeTruthy();
      expect(o.storeName).toBeTruthy();
      expect(o.total).toBeGreaterThan(0);
      expect(["express", "shipping"]).toContain(o.deliveryMode);
    });
  });

  it("has sample platform users with required fields", () => {
    expect(SAMPLE_PLATFORM_USERS.length).toBeGreaterThan(0);
    SAMPLE_PLATFORM_USERS.forEach((u) => {
      expect(u.id).toBeTruthy();
      expect(u.name).toBeTruthy();
      expect(u.email).toContain("@");
      expect(["bronze", "silver", "gold", "platinum"]).toContain(u.rewardsTier);
    });
  });

  it("has valid platform metrics", () => {
    expect(SAMPLE_METRICS.totalRevenue).toBeGreaterThan(0);
    expect(SAMPLE_METRICS.totalOrders).toBeGreaterThan(0);
    expect(SAMPLE_METRICS.totalCustomers).toBeGreaterThan(0);
    expect(SAMPLE_METRICS.totalStores).toBeGreaterThan(0);
    expect(SAMPLE_METRICS.totalDrivers).toBeGreaterThan(0);
    expect(SAMPLE_METRICS.avgOrderValue).toBeGreaterThan(0);
  });

  it("has revenue data for each day of the week", () => {
    expect(SAMPLE_REVENUE_DATA.length).toBe(7);
    SAMPLE_REVENUE_DATA.forEach((d) => {
      expect(d.label).toBeTruthy();
      expect(d.revenue).toBeGreaterThan(0);
      expect(d.orders).toBeGreaterThan(0);
      expect(d.commission).toBeGreaterThan(0);
    });
  });

  it("has valid platform settings", () => {
    expect(DEFAULT_PLATFORM_SETTINGS.commissionRate).toBeGreaterThan(0);
    expect(DEFAULT_PLATFORM_SETTINGS.expressDeliveryFee).toBeGreaterThan(0);
    expect(DEFAULT_PLATFORM_SETTINGS.shippingFee).toBeGreaterThan(0);
    expect(DEFAULT_PLATFORM_SETTINGS.minimumOrderAmount).toBeGreaterThan(0);
  });
});

describe("Admin Store - Helpers", () => {
  it("formats currency correctly", () => {
    const result = formatAdminCurrency(1234.56);
    expect(result).toContain("1");
    expect(result).toContain("234");
    expect(result).toContain("$");
  });

  it("formats compact numbers", () => {
    expect(formatCompactNumber(500)).toBe("500");
    expect(formatCompactNumber(1500)).toBe("1.5K");
    expect(formatCompactNumber(1500000)).toBe("1.5M");
  });

  it("formats time ago", () => {
    const now = new Date().toISOString();
    const result = getTimeAgoAdmin(now);
    expect(result).toBeTruthy();
    // Should be "just now" or "0m ago" or similar
    expect(typeof result).toBe("string");
  });
});

describe("Admin Store - Constants", () => {
  it("has order status labels for all statuses", () => {
    expect(ORDER_STATUS_LABELS.pending).toBeTruthy();
    expect(ORDER_STATUS_LABELS.confirmed).toBeTruthy();
    expect(ORDER_STATUS_LABELS.delivered).toBeTruthy();
    expect(ORDER_STATUS_LABELS.cancelled).toBeTruthy();
  });

  it("has order status colors for all statuses", () => {
    expect(ORDER_STATUS_COLORS.pending).toBeTruthy();
    expect(ORDER_STATUS_COLORS.delivered).toBeTruthy();
    expect(ORDER_STATUS_COLORS.cancelled).toBeTruthy();
  });

  it("has driver status colors", () => {
    expect(DRIVER_STATUS_COLORS.pending).toBeTruthy();
    expect(DRIVER_STATUS_COLORS.approved).toBeTruthy();
    expect(DRIVER_STATUS_COLORS.suspended).toBeTruthy();
  });

  it("has app status colors", () => {
    expect(APP_REVIEW_STATUS_COLORS.pending).toBeTruthy();
    expect(APP_REVIEW_STATUS_COLORS.approved).toBeTruthy();
    expect(APP_REVIEW_STATUS_COLORS.rejected).toBeTruthy();
  });
});
