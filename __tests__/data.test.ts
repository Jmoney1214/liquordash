import { describe, it, expect } from "vitest";
import {
  PRODUCTS,
  CATEGORIES,
  getProductsByCategory,
  getFeaturedProducts,
  getPremiumProducts,
  getExpressProducts,
  getShippingProducts,
  searchProducts,
  getProductById,
  formatPrice,
  getStarDisplay,
} from "../lib/data";

describe("Product Data", () => {
  it("should have products defined", () => {
    expect(PRODUCTS.length).toBeGreaterThan(0);
  });

  it("should have categories defined", () => {
    expect(CATEGORIES.length).toBeGreaterThan(0);
    CATEGORIES.forEach((cat) => {
      expect(cat.id).toBeTruthy();
      expect(cat.name).toBeTruthy();
      expect(cat.icon).toBeTruthy();
    });
  });

  it("every product should have required fields", () => {
    PRODUCTS.forEach((p) => {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.brand).toBeTruthy();
      expect(p.category).toBeTruthy();
      expect(p.price).toBeGreaterThan(0);
      expect(p.volume).toBeTruthy();
      expect(p.rating).toBeGreaterThanOrEqual(0);
      expect(p.rating).toBeLessThanOrEqual(5);
    });
  });
});

describe("getProductsByCategory", () => {
  it("should return whiskey products", () => {
    const whiskeys = getProductsByCategory("whiskey");
    expect(whiskeys.length).toBeGreaterThan(0);
    whiskeys.forEach((p) => expect(p.category).toBe("whiskey"));
  });

  it("should return empty array for non-existent category", () => {
    const result = getProductsByCategory("nonexistent" as any);
    expect(result).toEqual([]);
  });
});

describe("getFeaturedProducts", () => {
  it("should return only featured products", () => {
    const featured = getFeaturedProducts();
    expect(featured.length).toBeGreaterThan(0);
    featured.forEach((p) => expect(p.featured).toBe(true));
  });
});

describe("getPremiumProducts", () => {
  it("should return only premium products", () => {
    const premium = getPremiumProducts();
    expect(premium.length).toBeGreaterThan(0);
    premium.forEach((p) => expect(p.premium).toBe(true));
  });
});

describe("getExpressProducts", () => {
  it("should return only express-available in-stock products", () => {
    const express = getExpressProducts();
    express.forEach((p) => {
      expect(p.expressAvailable).toBe(true);
      expect(p.inStock).toBe(true);
    });
  });
});

describe("getShippingProducts", () => {
  it("should return only shipping-available in-stock products", () => {
    const shipping = getShippingProducts();
    shipping.forEach((p) => {
      expect(p.shippingAvailable).toBe(true);
      expect(p.inStock).toBe(true);
    });
  });
});

describe("searchProducts", () => {
  it("should find products by name", () => {
    const results = searchProducts("Maker's Mark");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].brand).toBe("Maker's Mark");
  });

  it("should find products by brand", () => {
    const results = searchProducts("Grey Goose");
    expect(results.length).toBeGreaterThan(0);
  });

  it("should find products by category", () => {
    const results = searchProducts("tequila");
    expect(results.length).toBeGreaterThan(0);
  });

  it("should return empty for no match", () => {
    const results = searchProducts("xyznonexistent123");
    expect(results).toEqual([]);
  });

  it("should be case insensitive", () => {
    const upper = searchProducts("BOURBON");
    const lower = searchProducts("bourbon");
    expect(upper.length).toBe(lower.length);
  });
});

describe("getProductById", () => {
  it("should return the correct product", () => {
    const product = getProductById("1");
    expect(product).toBeDefined();
    expect(product!.id).toBe("1");
    expect(product!.name).toBe("Maker's Mark Bourbon");
  });

  it("should return undefined for non-existent id", () => {
    const product = getProductById("99999");
    expect(product).toBeUndefined();
  });
});

describe("formatPrice", () => {
  it("should format price with dollar sign and two decimals", () => {
    expect(formatPrice(29.99)).toBe("$29.99");
    expect(formatPrice(100)).toBe("$100.00");
    expect(formatPrice(0)).toBe("$0.00");
    expect(formatPrice(9.9)).toBe("$9.90");
  });
});

describe("getStarDisplay", () => {
  it("should show correct stars for whole numbers", () => {
    expect(getStarDisplay(5)).toBe("★★★★★");
    expect(getStarDisplay(3)).toBe("★★★☆☆");
    expect(getStarDisplay(0)).toBe("☆☆☆☆☆");
  });

  it("should show half star for .5 ratings", () => {
    expect(getStarDisplay(4.5)).toBe("★★★★½");
    expect(getStarDisplay(3.5)).toBe("★★★½☆");
  });
});
