import { describe, it, expect } from "vitest";

describe("Apple credentials validation", () => {
  it("APPLE_ID should be a valid email", () => {
    const appleId = process.env.APPLE_ID;
    expect(appleId).toBeDefined();
    expect(appleId).not.toBe("your-apple-id@email.com");
    expect(appleId).toMatch(/@/);
    console.log("APPLE_ID format: valid email");
  });

  it("ASC_APP_ID should be a numeric string", () => {
    const ascAppId = process.env.ASC_APP_ID;
    expect(ascAppId).toBeDefined();
    expect(ascAppId).not.toBe("1234567890");
    expect(ascAppId).toMatch(/^\d+$/);
    console.log("ASC_APP_ID format: valid numeric ID");
  });

  it("APPLE_TEAM_ID should be a 10-character alphanumeric string", () => {
    const teamId = process.env.APPLE_TEAM_ID;
    expect(teamId).toBeDefined();
    expect(teamId).not.toBe("XXXXXXXXXX");
    expect(teamId).toMatch(/^[A-Z0-9]{10}$/);
    console.log("APPLE_TEAM_ID format: valid 10-char alphanumeric");
  });
});
