import { describe, it, expect } from "vitest";

describe("Uber Direct credentials", () => {
  it("should have all required environment variables set", () => {
    // These are set via webdev_request_secrets
    // In CI/test they may be placeholder values, but they must exist
    const clientId = process.env.UBER_DIRECT_CLIENT_ID;
    const clientSecret = process.env.UBER_DIRECT_CLIENT_SECRET;
    const customerId = process.env.UBER_DIRECT_CUSTOMER_ID;

    expect(clientId).toBeDefined();
    expect(clientSecret).toBeDefined();
    expect(customerId).toBeDefined();
    expect(typeof clientId).toBe("string");
    expect(typeof clientSecret).toBe("string");
    expect(typeof customerId).toBe("string");
  });

  it("should have a valid UUID format for customer ID", () => {
    const customerId = process.env.UBER_DIRECT_CUSTOMER_ID;
    if (customerId) {
      // UUID v4 format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(customerId).toMatch(uuidRegex);
    }
  });

  it("uber-direct service module should export expected functions", async () => {
    // Validate the module structure without making actual API calls
    const mod = await import("../server/uber-direct");
    expect(typeof mod.getAccessToken).toBe("function");
    expect(typeof mod.getDeliveryQuote).toBe("function");
    expect(typeof mod.createDelivery).toBe("function");
    expect(typeof mod.getDeliveryStatus).toBe("function");
    expect(typeof mod.cancelDelivery).toBe("function");
    expect(typeof mod.validateCredentials).toBe("function");
  });
});
