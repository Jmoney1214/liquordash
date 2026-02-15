import { describe, it, expect } from "vitest";
import {
  TIER_THRESHOLDS,
  TIER_BENEFITS,
  TIER_COLORS,
  FAQ_DATA,
} from "../lib/customer-store";

describe("Customer Store Constants", () => {
  it("should have correct tier thresholds in ascending order", () => {
    expect(TIER_THRESHOLDS.bronze).toBe(0);
    expect(TIER_THRESHOLDS.silver).toBe(500);
    expect(TIER_THRESHOLDS.gold).toBe(1500);
    expect(TIER_THRESHOLDS.platinum).toBe(5000);
    expect(TIER_THRESHOLDS.bronze).toBeLessThan(TIER_THRESHOLDS.silver);
    expect(TIER_THRESHOLDS.silver).toBeLessThan(TIER_THRESHOLDS.gold);
    expect(TIER_THRESHOLDS.gold).toBeLessThan(TIER_THRESHOLDS.platinum);
  });

  it("should have benefits for all tiers", () => {
    const tiers = ["bronze", "silver", "gold", "platinum"] as const;
    tiers.forEach((tier) => {
      expect(TIER_BENEFITS[tier]).toBeDefined();
      expect(TIER_BENEFITS[tier].length).toBeGreaterThan(0);
    });
  });

  it("should have increasing benefits per tier", () => {
    expect(TIER_BENEFITS.bronze.length).toBeLessThanOrEqual(TIER_BENEFITS.silver.length);
    expect(TIER_BENEFITS.silver.length).toBeLessThanOrEqual(TIER_BENEFITS.gold.length);
    expect(TIER_BENEFITS.gold.length).toBeLessThanOrEqual(TIER_BENEFITS.platinum.length);
  });

  it("should have colors for all tiers", () => {
    expect(TIER_COLORS.bronze).toBe("#CD7F32");
    expect(TIER_COLORS.silver).toBe("#C0C0C0");
    expect(TIER_COLORS.gold).toBe("#FFD700");
    expect(TIER_COLORS.platinum).toBe("#E5E4E2");
  });
});

describe("FAQ Data", () => {
  it("should have at least 5 FAQ entries", () => {
    expect(FAQ_DATA.length).toBeGreaterThanOrEqual(5);
  });

  it("should have unique IDs", () => {
    const ids = FAQ_DATA.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have non-empty questions and answers", () => {
    FAQ_DATA.forEach((faq) => {
      expect(faq.question.length).toBeGreaterThan(0);
      expect(faq.answer.length).toBeGreaterThan(0);
      expect(faq.category.length).toBeGreaterThan(0);
    });
  });

  it("should cover key categories", () => {
    const categories = new Set(FAQ_DATA.map((f) => f.category));
    expect(categories.has("Delivery")).toBe(true);
    expect(categories.has("Payment")).toBe(true);
    expect(categories.has("Rewards")).toBe(true);
  });
});
