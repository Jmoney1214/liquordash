import { describe, it, expect } from "vitest";

describe("Lightspeed Credentials", () => {
  it("should have LIGHTSPEED_CLIENT_ID set", () => {
    const clientId = process.env.LIGHTSPEED_CLIENT_ID;
    expect(clientId).toBeDefined();
    expect(clientId).not.toBe("");
    expect(clientId).toBe("794b0f8bd5a4945a6e426904f19cc14312e05a548d4f630586b4c74d81ddcab5");
  });

  it("should have LIGHTSPEED_CLIENT_SECRET set", () => {
    const clientSecret = process.env.LIGHTSPEED_CLIENT_SECRET;
    expect(clientSecret).toBeDefined();
    expect(clientSecret).not.toBe("");
    expect(clientSecret).toBe("f1cdb89e4af706689942c541c2b62809099ce7c30d2f5eef36cb3d6bd08df6ae");
  });

  it("should generate a valid Lightspeed OAuth authorization URL", () => {
    const clientId = process.env.LIGHTSPEED_CLIENT_ID;
    const redirectUri = "https://sfacg5jbch-zaxolr37dq-uk.a.run.app/api/lightspeed/callback";
    const authUrl = `https://cloud.lightspeedapp.com/oauth/authorize.php?response_type=code&client_id=${clientId}&scope=employee%3Aall&redirect_uri=${encodeURIComponent(redirectUri)}`;

    expect(authUrl).toContain("794b0f8bd5a4945a6e426904f19cc14312e05a548d4f630586b4c74d81ddcab5");
    expect(authUrl).toContain("cloud.lightspeedapp.com");
    expect(authUrl).toContain("response_type=code");
  });
});
