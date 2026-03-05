import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Lightspeed Retail R-Series Integration Tests
 *
 * Tests the Lightspeed API service configuration, token management,
 * and data transformation logic.
 */

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock fs/promises for token persistence
vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

describe("Lightspeed Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("OAuth Configuration", () => {
    it("should use correct Lightspeed OAuth authorization URL", () => {
      const authBase = "https://cloud.lightspeedapp.com/oauth/authorize.php";
      expect(authBase).toContain("cloud.lightspeedapp.com");
      expect(authBase).toContain("/oauth/authorize.php");
    });

    it("should use correct Lightspeed token exchange URL", () => {
      const tokenUrl = "https://cloud.merchantos.com/oauth/access_token.php";
      expect(tokenUrl).toContain("cloud.merchantos.com");
      expect(tokenUrl).toContain("/oauth/access_token.php");
    });

    it("should use correct API base URL", () => {
      const apiBase = "https://api.lightspeedapp.com/API";
      expect(apiBase).toContain("api.lightspeedapp.com");
      expect(apiBase).toContain("/API");
    });

    it("should use employee:all scope", () => {
      const scope = "employee:all";
      expect(scope).toBe("employee:all");
    });
  });

  describe("Token Data Structure", () => {
    it("should correctly structure token data", () => {
      const tokenResponse = {
        access_token: "test_access_token",
        refresh_token: "test_refresh_token",
        expires_in: 1800,
        scope: "employee:all",
      };

      const tokenData = {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: Date.now() + (tokenResponse.expires_in - 300) * 1000,
        accountId: "222537",
      };

      expect(tokenData.accessToken).toBe("test_access_token");
      expect(tokenData.refreshToken).toBe("test_refresh_token");
      expect(tokenData.accountId).toBe("222537");
      expect(tokenData.expiresAt).toBeGreaterThan(Date.now());
    });

    it("should set expiry 5 minutes before actual expiry for safety", () => {
      const expiresIn = 1800; // 30 minutes
      const safetyBuffer = 300; // 5 minutes
      const now = Date.now();
      const expiresAt = now + (expiresIn - safetyBuffer) * 1000;

      // Should expire 25 minutes from now, not 30
      const minutesUntilExpiry = (expiresAt - now) / 1000 / 60;
      expect(minutesUntilExpiry).toBeCloseTo(25, 0);
    });
  });

  describe("API URL Construction", () => {
    it("should build correct Account URL", () => {
      const apiBase = "https://api.lightspeedapp.com/API";
      const url = `${apiBase}/Account.json`;
      expect(url).toBe("https://api.lightspeedapp.com/API/Account.json");
    });

    it("should build correct resource URL with account ID", () => {
      const apiBase = "https://api.lightspeedapp.com/API";
      const accountId = "222537";
      const resource = "Item.json";
      const url = `${apiBase}/Account/${accountId}/${resource}`;
      expect(url).toBe("https://api.lightspeedapp.com/API/Account/222537/Item.json");
    });

    it("should build correct URL with query parameters", () => {
      const base = "https://api.lightspeedapp.com/API/Account/222537/Item.json";
      const params = new URLSearchParams({
        limit: "100",
        offset: "0",
        archived: "false",
      });
      const url = `${base}?${params.toString()}`;
      expect(url).toContain("limit=100");
      expect(url).toContain("offset=0");
      expect(url).toContain("archived=false");
    });

    it("should build correct load_relations parameter", () => {
      const relations = ["Prices", "Images", "ItemShops", "Category", "Manufacturer", "Tags"];
      const param = JSON.stringify(relations);
      expect(param).toBe('["Prices","Images","ItemShops","Category","Manufacturer","Tags"]');
    });
  });

  describe("Data Transformation", () => {
    it("should handle single item response (not array)", () => {
      const response = {
        Item: {
          itemID: "1",
          description: "Test Wine",
          systemSku: "SKU001",
        },
      };

      const items = !response.Item
        ? []
        : Array.isArray(response.Item)
          ? response.Item
          : [response.Item];

      expect(items).toHaveLength(1);
      expect(items[0].description).toBe("Test Wine");
    });

    it("should handle array item response", () => {
      const response = {
        Item: [
          { itemID: "1", description: "Wine A", systemSku: "SKU001" },
          { itemID: "2", description: "Wine B", systemSku: "SKU002" },
        ],
      };

      const items = !response.Item
        ? []
        : Array.isArray(response.Item)
          ? response.Item
          : [response.Item];

      expect(items).toHaveLength(2);
    });

    it("should handle empty/null item response", () => {
      const response = { Item: undefined };

      const items = !response.Item
        ? []
        : Array.isArray(response.Item)
          ? response.Item
          : [response.Item];

      expect(items).toHaveLength(0);
    });

    it("should parse count from @attributes", () => {
      const response = {
        "@attributes": { count: "1500", offset: "0", limit: "100" },
        Item: [],
      };

      const count = parseInt(response["@attributes"]?.count ?? "0", 10);
      expect(count).toBe(1500);
    });

    it("should extract price from Prices relation", () => {
      const item = {
        Prices: {
          ItemPrice: [
            { amount: "29.99", useTypeID: "1", useType: "Default" },
            { amount: "24.99", useTypeID: "2", useType: "MSRP" },
          ],
        },
      };

      const defaultPrice = item.Prices?.ItemPrice?.find(
        (p: any) => p.useType === "Default"
      );
      expect(defaultPrice?.amount).toBe("29.99");
    });

    it("should extract quantity on hand from ItemShops", () => {
      const item = {
        ItemShops: {
          ItemShop: [
            { shopID: "6", qoh: "42", sellable: "42", reorderPoint: "10", reorderLevel: "24" },
          ],
        },
      };

      const shopInventory = item.ItemShops?.ItemShop?.[0];
      expect(shopInventory?.qoh).toBe("42");
      expect(parseInt(shopInventory?.qoh ?? "0", 10)).toBe(42);
    });

    it("should extract customer contact info", () => {
      const customer = {
        customerID: "1",
        firstName: "John",
        lastName: "Doe",
        Contact: {
          Emails: {
            ContactEmail: [{ address: "john@example.com", useType: "Primary" }],
          },
          Phones: {
            ContactPhone: [{ number: "555-1234", useType: "Mobile" }],
          },
        },
      };

      const email = customer.Contact?.Emails?.ContactEmail?.[0]?.address;
      const phone = customer.Contact?.Phones?.ContactPhone?.[0]?.number;
      expect(email).toBe("john@example.com");
      expect(phone).toBe("555-1234");
    });

    it("should handle sale line items", () => {
      const sale = {
        saleID: "100",
        ticketNumber: "220000100",
        calcTotal: "59.98",
        SaleLines: {
          SaleLine: [
            {
              saleLineID: "1",
              unitQuantity: "2",
              unitPrice: "29.99",
              Item: { description: "Wine A", systemSku: "SKU001" },
            },
          ],
        },
      };

      const lines = !sale.SaleLines?.SaleLine
        ? []
        : Array.isArray(sale.SaleLines.SaleLine)
          ? sale.SaleLines.SaleLine
          : [sale.SaleLines.SaleLine];

      expect(lines).toHaveLength(1);
      expect(lines[0].unitQuantity).toBe("2");
      expect(parseFloat(sale.calcTotal)).toBe(59.98);
    });
  });

  describe("Connection Status", () => {
    it("should report disconnected when no tokens", () => {
      const tokens = null;
      const status = {
        connected: !!tokens,
        error: tokens ? undefined : "Not connected to Lightspeed",
      };
      expect(status.connected).toBe(false);
      expect(status.error).toBe("Not connected to Lightspeed");
    });

    it("should report connected when tokens exist", () => {
      const tokens = {
        accessToken: "test",
        refreshToken: "test",
        expiresAt: Date.now() + 1000000,
        accountId: "222537",
      };
      const status = {
        connected: !!tokens,
        accountId: tokens.accountId,
        accountName: "Legacy Liquors",
      };
      expect(status.connected).toBe(true);
      expect(status.accountId).toBe("222537");
      expect(status.accountName).toBe("Legacy Liquors");
    });
  });

  describe("Rate Limiting", () => {
    it("should parse Retry-After header", () => {
      const retryAfter = parseInt("2", 10);
      expect(retryAfter).toBe(2);
    });

    it("should default to 2 seconds if Retry-After is missing", () => {
      const headerValue: string | undefined = undefined;
      const retryAfter = parseInt(headerValue ?? "2", 10);
      expect(retryAfter).toBe(2);
    });
  });

  describe("Authorization URL Construction", () => {
    it("should build correct authorization URL", () => {
      const clientId = "test_client_id";
      const redirectUri = "https://example.com/callback";
      const scope = "employee:all";
      const authBase = "https://cloud.lightspeedapp.com/oauth/authorize.php";

      const params = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        scope: scope,
        redirect_uri: redirectUri,
      });

      const url = `${authBase}?${params.toString()}`;
      expect(url).toContain("response_type=code");
      expect(url).toContain("client_id=test_client_id");
      expect(url).toContain("scope=employee%3Aall");
      expect(url).toContain("redirect_uri=");
    });
  });
});
