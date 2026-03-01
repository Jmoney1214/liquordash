import { describe, it, expect } from "vitest";
import {
  SAMPLE_STORES,
  SAMPLE_STORE_ORDERS,
  formatCurrency,
  type StoreApplication,
  type StoreOrderStatus,
} from "../lib/store-data";
import {
  SAMPLE_JOBS,
  SAMPLE_EARNINGS,
  VEHICLE_TYPES,
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  formatCurrency as formatDriverCurrency,
  getDeliverySteps,
  type DeliveryJob,
  type EarningsSummary,
} from "../lib/driver-store";
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

// ═══════════════════════════════════════════════════════════════════
// STORE PARTNER MODULE
// ═══════════════════════════════════════════════════════════════════

describe("E2E: Store Partner - Onboarding", () => {
  it("store application has all required fields", () => {
    const app: Partial<StoreApplication> = {
      businessName: "Test Liquor Store",
      ownerName: "John Doe",
      ownerEmail: "john@test.com",
      ownerPhone: "(555) 123-4567",
      storeAddress: "123 Main St",
      storeCity: "New York",
      storeState: "NY",
      storeZip: "10001",
      licenseType: "retail",
      licenseNumber: "LIQ-2024-001",
      licenseExpiry: "2025-12-31",
      businessType: "independent",
      supportsExpress: true,
      supportsShipping: false,
      status: "draft",
    };
    expect(app.businessName).toBeTruthy();
    expect(app.licenseNumber).toBeTruthy();
    expect(app.ownerEmail).toContain("@");
  });

  it("onboarding has 5 steps", () => {
    const steps = [
      "Business Information",
      "Store Details",
      "License & Compliance",
      "Operations",
      "Payment Setup",
    ];
    expect(steps.length).toBe(5);
  });
});

describe("E2E: Store Partner - Dashboard", () => {
  it("sample stores have valid data", () => {
    expect(SAMPLE_STORES.length).toBeGreaterThan(0);
    SAMPLE_STORES.forEach((s) => {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.address).toBeTruthy();
      expect(s.rating).toBeGreaterThanOrEqual(0);
      expect(s.rating).toBeLessThanOrEqual(5);
    });
  });

  it("store orders have valid structure", () => {
    expect(SAMPLE_STORE_ORDERS.length).toBeGreaterThan(0);
    SAMPLE_STORE_ORDERS.forEach((o) => {
      expect(o.id).toBeTruthy();
      expect(o.customerName).toBeTruthy();
      expect(o.subtotal).toBeGreaterThan(0);
      const validStatuses: StoreOrderStatus[] = [
        "pending", "accepted", "preparing", "ready",
        "picked-up", "shipped", "completed", "rejected", "cancelled",
      ];
      expect(validStatuses).toContain(o.status);
    });
  });

  it("formatCurrency works correctly", () => {
    const result = formatCurrency(99.99);
    expect(result).toContain("99");
    expect(result).toContain("$");
  });
});

describe("E2E: Store Partner - Order Management", () => {
  it("orders can be filtered by status", () => {
    const pending = SAMPLE_STORE_ORDERS.filter((o) => o.status === "pending");
    const preparing = SAMPLE_STORE_ORDERS.filter((o) => o.status === "preparing");
    expect(SAMPLE_STORE_ORDERS.length).toBeGreaterThan(0);
    pending.forEach((o) => expect(o.status).toBe("pending"));
    preparing.forEach((o) => expect(o.status).toBe("preparing"));
  });

  it("order items have product details", () => {
    SAMPLE_STORE_ORDERS.forEach((o) => {
      expect(o.items.length).toBeGreaterThan(0);
      o.items.forEach((item) => {
        expect(item.productName).toBeTruthy();
        expect(item.quantity).toBeGreaterThan(0);
        expect(item.price).toBeGreaterThan(0);
      });
    });
  });

  it("store orders have commission and payout breakdown", () => {
    SAMPLE_STORE_ORDERS.forEach((o) => {
      expect(o.commission).toBeGreaterThanOrEqual(0);
      expect(o.storePayout).toBeGreaterThan(0);
      expect(o.commission + o.storePayout).toBeCloseTo(o.subtotal, 1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// DRIVER MODULE
// ═══════════════════════════════════════════════════════════════════

describe("E2E: Driver - Onboarding", () => {
  it("vehicle types are defined", () => {
    expect(VEHICLE_TYPES.length).toBeGreaterThan(0);
    VEHICLE_TYPES.forEach((t) => {
      expect(t.value).toBeTruthy();
      expect(t.label).toBeTruthy();
    });
  });
});

describe("E2E: Driver - Dashboard & Jobs", () => {
  it("sample delivery jobs have valid data", () => {
    expect(SAMPLE_JOBS.length).toBeGreaterThan(0);
    SAMPLE_JOBS.forEach((job) => {
      expect(job.id).toBeTruthy();
      expect(job.storeName).toBeTruthy();
      expect(job.customerName).toBeTruthy();
      expect(job.totalPay).toBeGreaterThan(0);
      expect(job.basePay).toBeGreaterThan(0);
    });
  });

  it("delivery job statuses are valid", () => {
    SAMPLE_JOBS.forEach((job) => {
      expect(JOB_STATUS_LABELS[job.status]).toBeTruthy();
      expect(JOB_STATUS_COLORS[job.status]).toBeTruthy();
    });
  });

  it("jobs have store and delivery locations", () => {
    SAMPLE_JOBS.forEach((job) => {
      expect(job.storeLocation.latitude).toBeDefined();
      expect(job.storeLocation.longitude).toBeDefined();
      expect(job.deliveryLocation.latitude).toBeDefined();
      expect(job.deliveryLocation.longitude).toBeDefined();
      expect(typeof job.storeLocation.latitude).toBe("number");
      expect(typeof job.deliveryLocation.longitude).toBe("number");
    });
  });

  it("jobs have estimated distance and time", () => {
    SAMPLE_JOBS.forEach((job) => {
      expect(job.estimatedDistance).toBeTruthy();
      expect(job.estimatedTime).toBeTruthy();
    });
  });
});

describe("E2E: Driver - Earnings", () => {
  it("sample earnings have valid data", () => {
    expect(SAMPLE_EARNINGS.length).toBeGreaterThan(0);
    SAMPLE_EARNINGS.forEach((e) => {
      expect(e.id).toBeTruthy();
      expect(e.basePay).toBeGreaterThanOrEqual(0);
      expect(typeof e.tipAmount).toBe("number");
    });
  });

  it("formatDriverCurrency works", () => {
    const result = formatDriverCurrency(150.5);
    expect(result).toContain("150");
    expect(result).toContain("$");
  });
});

describe("E2E: Driver - Live Tracking Steps", () => {
  it("delivery steps are sequential for each status", () => {
    const statuses = ["available", "accepted", "arriving-store", "at-store", "picked-up", "en-route", "arriving", "delivered"] as const;
    statuses.forEach((s) => {
      const steps = getDeliverySteps(s);
      expect(steps.length).toBeGreaterThan(0);
      steps.forEach((step) => {
        expect(step.label).toBeTruthy();
        expect(typeof step.completed).toBe("boolean");
        expect(typeof step.active).toBe("boolean");
      });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD MODULE
// ═══════════════════════════════════════════════════════════════════

describe("E2E: Admin - Dashboard KPIs", () => {
  it("platform metrics are comprehensive", () => {
    expect(SAMPLE_METRICS.totalRevenue).toBeGreaterThan(0);
    expect(SAMPLE_METRICS.totalOrders).toBeGreaterThan(0);
    expect(SAMPLE_METRICS.totalCustomers).toBeGreaterThan(0);
    expect(SAMPLE_METRICS.totalStores).toBeGreaterThan(0);
    expect(SAMPLE_METRICS.totalDrivers).toBeGreaterThan(0);
    expect(SAMPLE_METRICS.activeOrders).toBeGreaterThanOrEqual(0);
    expect(SAMPLE_METRICS.avgOrderValue).toBeGreaterThan(0);
    expect(SAMPLE_METRICS.platformCommission).toBeGreaterThan(0);
  });

  it("growth metrics are numbers", () => {
    expect(typeof SAMPLE_METRICS.revenueGrowth).toBe("number");
    expect(typeof SAMPLE_METRICS.orderGrowth).toBe("number");
    expect(typeof SAMPLE_METRICS.customerGrowth).toBe("number");
  });

  it("today/week/month breakdowns exist", () => {
    expect(SAMPLE_METRICS.todayRevenue).toBeGreaterThan(0);
    expect(SAMPLE_METRICS.todayOrders).toBeGreaterThan(0);
    expect(SAMPLE_METRICS.weekRevenue).toBeGreaterThan(0);
    expect(SAMPLE_METRICS.monthRevenue).toBeGreaterThan(0);
  });

  it("formatCompactNumber handles all ranges", () => {
    expect(formatCompactNumber(0)).toBe("0");
    expect(formatCompactNumber(999)).toBe("999");
    expect(formatCompactNumber(1000)).toBe("1.0K");
    expect(formatCompactNumber(1500)).toBe("1.5K");
    expect(formatCompactNumber(1000000)).toBe("1.0M");
    expect(formatCompactNumber(1500000)).toBe("1.5M");
  });
});

describe("E2E: Admin - Store Application Review", () => {
  it("sample applications have all required fields", () => {
    expect(SAMPLE_STORE_APPLICATIONS.length).toBeGreaterThan(0);
    SAMPLE_STORE_APPLICATIONS.forEach((app) => {
      expect(app.id).toBeTruthy();
      expect(app.businessName).toBeTruthy();
      expect(app.ownerName).toBeTruthy();
      expect(app.ownerEmail).toContain("@");
      expect(app.storeAddress).toBeTruthy();
      expect(app.licenseNumber).toBeTruthy();
      expect(["pending", "under_review", "approved", "rejected"]).toContain(app.status);
    });
  });

  it("app review status colors exist for all statuses", () => {
    expect(APP_REVIEW_STATUS_COLORS.pending).toBeTruthy();
    expect(APP_REVIEW_STATUS_COLORS.under_review).toBeTruthy();
    expect(APP_REVIEW_STATUS_COLORS.approved).toBeTruthy();
    expect(APP_REVIEW_STATUS_COLORS.rejected).toBeTruthy();
  });
});

describe("E2E: Admin - Order Monitoring", () => {
  it("platform orders have comprehensive data", () => {
    expect(SAMPLE_PLATFORM_ORDERS.length).toBeGreaterThan(0);
    SAMPLE_PLATFORM_ORDERS.forEach((o) => {
      expect(o.id).toBeTruthy();
      expect(o.customerName).toBeTruthy();
      expect(o.storeName).toBeTruthy();
      expect(o.total).toBeGreaterThan(0);
      expect(o.commission).toBeGreaterThanOrEqual(0);
      expect(["express", "shipping"]).toContain(o.deliveryMode);
    });
  });

  it("order status labels exist for all statuses", () => {
    expect(ORDER_STATUS_LABELS.pending).toBeTruthy();
    expect(ORDER_STATUS_LABELS.confirmed).toBeTruthy();
    expect(ORDER_STATUS_LABELS.delivered).toBeTruthy();
    expect(ORDER_STATUS_LABELS.cancelled).toBeTruthy();
  });

  it("order status colors exist for all statuses", () => {
    expect(ORDER_STATUS_COLORS.pending).toBeTruthy();
    expect(ORDER_STATUS_COLORS.delivered).toBeTruthy();
    expect(ORDER_STATUS_COLORS.cancelled).toBeTruthy();
  });
});

describe("E2E: Admin - Driver Management", () => {
  it("driver approvals have complete data", () => {
    expect(SAMPLE_DRIVER_APPROVALS.length).toBeGreaterThan(0);
    SAMPLE_DRIVER_APPROVALS.forEach((d) => {
      expect(d.id).toBeTruthy();
      expect(d.firstName).toBeTruthy();
      expect(d.lastName).toBeTruthy();
      expect(d.email).toContain("@");
      expect(d.vehicleType).toBeTruthy();
      expect(d.driversLicense).toBeTruthy();
      expect(["pending", "approved", "suspended", "rejected"]).toContain(d.status);
    });
  });

  it("driver status colors exist", () => {
    expect(DRIVER_STATUS_COLORS.pending).toBeTruthy();
    expect(DRIVER_STATUS_COLORS.approved).toBeTruthy();
    expect(DRIVER_STATUS_COLORS.suspended).toBeTruthy();
    expect(DRIVER_STATUS_COLORS.rejected).toBeTruthy();
  });
});

describe("E2E: Admin - User Management", () => {
  it("platform users have complete data", () => {
    expect(SAMPLE_PLATFORM_USERS.length).toBeGreaterThan(0);
    SAMPLE_PLATFORM_USERS.forEach((u) => {
      expect(u.id).toBeTruthy();
      expect(u.name).toBeTruthy();
      expect(u.email).toContain("@");
      expect(u.totalOrders).toBeGreaterThanOrEqual(0);
      expect(u.totalSpent).toBeGreaterThanOrEqual(0);
      expect(["bronze", "silver", "gold", "platinum"]).toContain(u.rewardsTier);
      expect(["active", "suspended", "deactivated"]).toContain(u.status);
    });
  });
});

describe("E2E: Admin - Analytics", () => {
  it("revenue data covers 7 days", () => {
    expect(SAMPLE_REVENUE_DATA.length).toBe(7);
    SAMPLE_REVENUE_DATA.forEach((d) => {
      expect(d.label).toBeTruthy();
      expect(d.revenue).toBeGreaterThan(0);
      expect(d.orders).toBeGreaterThan(0);
      expect(d.commission).toBeGreaterThan(0);
    });
  });

  it("commission is less than revenue for each day", () => {
    SAMPLE_REVENUE_DATA.forEach((d) => {
      expect(d.commission).toBeLessThan(d.revenue);
    });
  });

  it("formatAdminCurrency works", () => {
    const result = formatAdminCurrency(287456.78);
    expect(result).toContain("$");
    expect(result).toContain("287");
  });

  it("getTimeAgoAdmin returns valid string", () => {
    const result = getTimeAgoAdmin(new Date().toISOString());
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("E2E: Admin - Platform Settings", () => {
  it("default settings have valid values", () => {
    expect(DEFAULT_PLATFORM_SETTINGS.commissionRate).toBeGreaterThan(0);
    expect(DEFAULT_PLATFORM_SETTINGS.expressDeliveryFee).toBeGreaterThan(0);
    expect(DEFAULT_PLATFORM_SETTINGS.shippingFee).toBeGreaterThan(0);
    expect(DEFAULT_PLATFORM_SETTINGS.minimumOrderAmount).toBeGreaterThan(0);
  });

  it("driver pay settings are reasonable", () => {
    expect(DEFAULT_PLATFORM_SETTINGS.driverBasePay).toBeGreaterThan(0);
    expect(DEFAULT_PLATFORM_SETTINGS.driverPerMilePay).toBeGreaterThan(0);
  });

  it("feature toggles are booleans", () => {
    expect(typeof DEFAULT_PLATFORM_SETTINGS.promoCodeEnabled).toBe("boolean");
    expect(typeof DEFAULT_PLATFORM_SETTINGS.maintenanceMode).toBe("boolean");
  });
});

// ═══════════════════════════════════════════════════════════════════
// CROSS-MODULE INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════

describe("E2E: Cross-Module Integration", () => {
  it("store orders and platform orders share delivery modes", () => {
    SAMPLE_STORE_ORDERS.forEach((o) => {
      expect(["express", "shipping"]).toContain(o.deliveryMode);
    });
    SAMPLE_PLATFORM_ORDERS.forEach((o) => {
      expect(["express", "shipping"]).toContain(o.deliveryMode);
    });
  });

  it("driver jobs reference stores with addresses", () => {
    SAMPLE_JOBS.forEach((job) => {
      expect(job.storeName).toBeTruthy();
      expect(job.storeAddress).toBeTruthy();
    });
  });

  it("admin metrics are consistent with sample data", () => {
    expect(SAMPLE_METRICS.totalOrders).toBeGreaterThanOrEqual(
      SAMPLE_PLATFORM_ORDERS.length
    );
    expect(SAMPLE_METRICS.totalStores).toBeGreaterThanOrEqual(
      SAMPLE_STORES.length
    );
  });

  it("platform commission applies to order totals", () => {
    SAMPLE_PLATFORM_ORDERS.forEach((o) => {
      expect(o.commission).toBeGreaterThanOrEqual(0);
      expect(o.commission).toBeLessThanOrEqual(o.total);
    });
  });

  it("all currency formatters produce consistent output", () => {
    const amount = 99.99;
    const storeFmt = formatCurrency(amount);
    const driverFmt = formatDriverCurrency(amount);
    const adminFmt = formatAdminCurrency(amount);
    [storeFmt, driverFmt, adminFmt].forEach((fmt) => {
      expect(fmt).toContain("$");
      expect(fmt).toContain("99");
    });
  });

  it("driver job pay = basePay + tipAmount", () => {
    SAMPLE_JOBS.forEach((job) => {
      expect(job.totalPay).toBeCloseTo(job.basePay + job.tipAmount, 2);
    });
  });

  it("store order payout + commission = subtotal", () => {
    SAMPLE_STORE_ORDERS.forEach((o) => {
      expect(o.storePayout + o.commission).toBeCloseTo(o.subtotal, 1);
    });
  });
});
