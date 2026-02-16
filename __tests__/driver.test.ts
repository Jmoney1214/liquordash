import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  getDeliverySteps,
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  VEHICLE_TYPES,
  createDefaultDriverProfile,
  DeliveryJobStatus,
} from "../lib/driver-store";

describe("Driver Store - formatCurrency", () => {
  it("formats positive amounts correctly", () => {
    const result = formatCurrency(25.5);
    expect(result).toContain("25");
  });

  it("formats zero correctly", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });

  it("formats large amounts", () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain("1");
    expect(result).toContain("234");
  });
});

describe("Driver Store - getDeliverySteps", () => {
  it("returns steps for accepted status", () => {
    const steps = getDeliverySteps("accepted");
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].label).toBeDefined();
  });

  it("returns steps for en-route status", () => {
    const steps = getDeliverySteps("en-route");
    expect(steps.length).toBeGreaterThan(0);
    const activeSteps = steps.filter((s) => s.active);
    expect(activeSteps.length).toBeGreaterThanOrEqual(1);
  });

  it("marks earlier steps as completed", () => {
    const steps = getDeliverySteps("picked-up");
    const completedSteps = steps.filter((s) => s.completed);
    expect(completedSteps.length).toBeGreaterThan(0);
  });

  it("returns steps for delivered status", () => {
    const steps = getDeliverySteps("delivered");
    // delivered is the last step, check that most steps are completed
    const completedCount = steps.filter((s) => s.completed).length;
    expect(completedCount).toBeGreaterThanOrEqual(steps.length - 1);
  });
});

describe("Driver Store - Constants", () => {
  it("has all job status labels", () => {
    const statuses: DeliveryJobStatus[] = [
      "available", "accepted", "arriving-store", "at-store",
      "picked-up", "en-route", "arriving", "delivered", "cancelled",
    ];
    statuses.forEach((s) => {
      expect(JOB_STATUS_LABELS[s]).toBeDefined();
      expect(typeof JOB_STATUS_LABELS[s]).toBe("string");
    });
  });

  it("has all job status colors", () => {
    const statuses: DeliveryJobStatus[] = [
      "available", "accepted", "arriving-store", "at-store",
      "picked-up", "en-route", "arriving", "delivered", "cancelled",
    ];
    statuses.forEach((s) => {
      expect(JOB_STATUS_COLORS[s]).toBeDefined();
      expect(JOB_STATUS_COLORS[s]).toMatch(/^#/);
    });
  });

  it("has vehicle types", () => {
    expect(VEHICLE_TYPES.length).toBeGreaterThan(0);
    VEHICLE_TYPES.forEach((v) => {
      expect(v.value).toBeDefined();
      expect(v.label).toBeDefined();
      expect(v.icon).toBeDefined();
    });
  });


});

describe("Driver Store - Default Factories", () => {
  it("creates a default driver profile", () => {
    const profile = createDefaultDriverProfile();
    expect(profile.id).toBeDefined();
    expect(profile.firstName).toBe("");
    expect(profile.lastName).toBe("");
    expect(profile.rating).toBeGreaterThanOrEqual(4.0);
    expect(profile.totalDeliveries).toBe(0);
    expect(profile.isVerified).toBe(false);
  });


});
