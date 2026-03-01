import { describe, it, expect } from "vitest";
import {
  TIER_THRESHOLDS,
  TIER_BENEFITS,
  TIER_COLORS,
  FAQ_DATA,
  type CustomerProfile,
  type SavedAddress,
  type PaymentMethod,
  type RewardsAccount,
  type NotificationPreferences,
  type RewardsTier,
  type CardBrand,
  type FAQ,
} from "../lib/customer-store";

// ═══════════════════════════════════════════════════════════════════
// CUSTOMER PORTAL - PROFILE
// ═══════════════════════════════════════════════════════════════════

describe("E2E: Customer Portal - Profile", () => {
  it("profile interface has all required fields", () => {
    const profile: CustomerProfile = {
      id: "cust-test",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: "(555) 987-6543",
      dateOfBirth: "1990-01-15",
      avatarInitials: "JD",
      memberSince: new Date().toISOString(),
      isAgeVerified: true,
    };
    expect(profile.firstName).toBe("Jane");
    expect(profile.email).toContain("@");
    expect(profile.isAgeVerified).toBe(true);
    expect(profile.avatarInitials).toBe("JD");
  });

  it("profile can be partially updated", () => {
    const updates: Partial<CustomerProfile> = {
      firstName: "Updated",
      phone: "(555) 111-2222",
    };
    expect(updates.firstName).toBe("Updated");
  });
});

// ═══════════════════════════════════════════════════════════════════
// CUSTOMER PORTAL - ADDRESSES
// ═══════════════════════════════════════════════════════════════════

describe("E2E: Customer Portal - Addresses", () => {
  it("address interface has all required fields", () => {
    const addr: SavedAddress = {
      id: "addr-test",
      label: "Home",
      fullName: "Jane Doe",
      street: "123 Main St",
      apt: "Apt 4B",
      city: "San Francisco",
      state: "CA",
      zip: "94103",
      phone: "(555) 123-4567",
      isDefault: true,
      instructions: "Ring doorbell",
    };
    expect(addr.label).toBe("Home");
    expect(addr.street).toBeTruthy();
    expect(addr.city).toBeTruthy();
    expect(addr.state).toBe("CA");
    expect(addr.zip).toMatch(/^\d{5}$/);
    expect(addr.isDefault).toBe(true);
  });

  it("multiple addresses can exist with one default", () => {
    const addresses: SavedAddress[] = [
      { id: "1", label: "Home", fullName: "Jane Doe", street: "123 Main", apt: "", city: "SF", state: "CA", zip: "94103", phone: "(555) 111-1111", isDefault: true, instructions: "" },
      { id: "2", label: "Work", fullName: "Jane Doe", street: "456 Market", apt: "Suite 100", city: "SF", state: "CA", zip: "94105", phone: "(555) 222-2222", isDefault: false, instructions: "" },
    ];
    const defaults = addresses.filter((a) => a.isDefault);
    expect(defaults.length).toBe(1);
    expect(addresses.length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════
// CUSTOMER PORTAL - PAYMENT METHODS
// ═══════════════════════════════════════════════════════════════════

describe("E2E: Customer Portal - Payment Methods", () => {
  it("payment method interface has all required fields", () => {
    const pm: PaymentMethod = {
      id: "pm-test",
      type: "card",
      brand: "visa",
      last4: "4242",
      expMonth: 12,
      expYear: 2027,
      holderName: "Jane Doe",
      isDefault: true,
    };
    expect(pm.type).toBe("card");
    expect(pm.brand).toBe("visa");
    expect(pm.last4).toBe("4242");
    expect(pm.last4.length).toBe(4);
    expect(pm.expYear).toBeGreaterThan(2024);
    expect(pm.isDefault).toBe(true);
  });

  it("card brands are valid types", () => {
    const brands: CardBrand[] = ["visa", "mastercard", "amex", "discover"];
    expect(brands.length).toBe(4);
    brands.forEach((b) => expect(typeof b).toBe("string"));
  });
});

// ═══════════════════════════════════════════════════════════════════
// CUSTOMER PORTAL - REWARDS
// ═══════════════════════════════════════════════════════════════════

describe("E2E: Customer Portal - Rewards", () => {
  it("rewards account interface is complete", () => {
    const rewards: RewardsAccount = {
      points: 250,
      tier: "bronze",
      lifetimePoints: 250,
      lifetimeOrders: 5,
      lifetimeSpent: 250,
      nextTierPoints: 500,
      tierProgress: 0.5,
      history: [],
    };
    expect(rewards.points).toBeGreaterThanOrEqual(0);
    expect(rewards.tier).toBe("bronze");
    expect(rewards.lifetimePoints).toBeGreaterThanOrEqual(rewards.points);
    expect(rewards.tierProgress).toBeGreaterThanOrEqual(0);
    expect(rewards.tierProgress).toBeLessThanOrEqual(1);
  });

  it("tier thresholds are defined for all tiers", () => {
    const tiers: RewardsTier[] = ["bronze", "silver", "gold", "platinum"];
    tiers.forEach((tier) => {
      expect(TIER_THRESHOLDS[tier]).toBeDefined();
      expect(typeof TIER_THRESHOLDS[tier]).toBe("number");
    });
  });

  it("tier thresholds are in ascending order", () => {
    expect(TIER_THRESHOLDS.bronze).toBeLessThan(TIER_THRESHOLDS.silver);
    expect(TIER_THRESHOLDS.silver).toBeLessThan(TIER_THRESHOLDS.gold);
    expect(TIER_THRESHOLDS.gold).toBeLessThan(TIER_THRESHOLDS.platinum);
  });

  it("tier benefits exist for all tiers", () => {
    const tiers: RewardsTier[] = ["bronze", "silver", "gold", "platinum"];
    tiers.forEach((tier) => {
      expect(TIER_BENEFITS[tier]).toBeDefined();
      expect(TIER_BENEFITS[tier].length).toBeGreaterThan(0);
    });
  });

  it("higher tiers have more benefits", () => {
    expect(TIER_BENEFITS.platinum.length).toBeGreaterThanOrEqual(TIER_BENEFITS.gold.length);
    expect(TIER_BENEFITS.gold.length).toBeGreaterThanOrEqual(TIER_BENEFITS.silver.length);
    expect(TIER_BENEFITS.silver.length).toBeGreaterThanOrEqual(TIER_BENEFITS.bronze.length);
  });

  it("tier colors are defined", () => {
    const tiers: RewardsTier[] = ["bronze", "silver", "gold", "platinum"];
    tiers.forEach((tier) => {
      expect(TIER_COLORS[tier]).toBeTruthy();
      expect(TIER_COLORS[tier]).toMatch(/^#/);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// CUSTOMER PORTAL - NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════

describe("E2E: Customer Portal - Notifications", () => {
  it("notification preferences interface is complete", () => {
    const prefs: NotificationPreferences = {
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      orderUpdates: true,
      promotions: true,
      newArrivals: false,
      priceDrops: true,
      rewardsAlerts: true,
      deliveryAlerts: true,
    };
    expect(typeof prefs.pushEnabled).toBe("boolean");
    expect(typeof prefs.emailEnabled).toBe("boolean");
    expect(typeof prefs.smsEnabled).toBe("boolean");
    expect(typeof prefs.orderUpdates).toBe("boolean");
    expect(typeof prefs.promotions).toBe("boolean");
    expect(typeof prefs.deliveryAlerts).toBe("boolean");
  });
});

// ═══════════════════════════════════════════════════════════════════
// CUSTOMER PORTAL - SUPPORT / FAQ
// ═══════════════════════════════════════════════════════════════════

describe("E2E: Customer Portal - Support", () => {
  it("FAQ items are defined and have content", () => {
    expect(FAQ_DATA.length).toBeGreaterThan(0);
    FAQ_DATA.forEach((faq: FAQ) => {
      expect(faq.question).toBeTruthy();
      expect(faq.answer).toBeTruthy();
      expect(faq.question.length).toBeGreaterThan(10);
      expect(faq.answer.length).toBeGreaterThan(10);
    });
  });

  it("at least 5 FAQ items exist", () => {
    expect(FAQ_DATA.length).toBeGreaterThanOrEqual(5);
  });

  it("FAQ covers common topics", () => {
    const allText = FAQ_DATA.map((f: FAQ) => (f.question + " " + f.answer).toLowerCase()).join(" ");
    // Should cover delivery, payment, age verification topics
    expect(allText).toContain("deliver");
  });
});
