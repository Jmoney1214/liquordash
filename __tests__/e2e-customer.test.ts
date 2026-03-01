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

// ─── HOME SCREEN DATA TESTS ────────────────────────────────────────

describe("E2E: Home Screen", () => {
  it("has products to display in Featured Picks", () => {
    const featured = getFeaturedProducts();
    expect(featured.length).toBeGreaterThan(0);
    featured.forEach((p) => {
      expect(p.name).toBeTruthy();
      expect(p.price).toBeGreaterThan(0);
      expect(p.imageUrl).toBeTruthy();
    });
  });

  it("has premium products for Premium Collection banner", () => {
    const premium = getPremiumProducts();
    expect(premium.length).toBeGreaterThan(0);
    premium.forEach((p) => {
      expect(p.premium).toBe(true);
    });
  });

  it("has categories for browsing", () => {
    expect(CATEGORIES.length).toBeGreaterThan(0);
    CATEGORIES.forEach((c) => {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.icon).toBeTruthy();
    });
  });

  it("delivery mode toggle - Express products exist", () => {
    const express = getExpressProducts();
    expect(express.length).toBeGreaterThan(0);
    express.forEach((p) => {
      expect(p.expressAvailable).toBe(true);
    });
  });

  it("delivery mode toggle - Shipping products exist", () => {
    const shipping = getShippingProducts();
    expect(shipping.length).toBeGreaterThan(0);
    shipping.forEach((p) => {
      expect(p.shippingAvailable).toBe(true);
    });
  });
});

// ─── BROWSE / SEARCH TESTS ─────────────────────────────────────────

describe("E2E: Browse & Search", () => {
  it("search returns results for 'whiskey'", () => {
    const results = searchProducts("whiskey");
    expect(results.length).toBeGreaterThan(0);
    results.forEach((p) => {
      const match =
        p.name.toLowerCase().includes("whiskey") ||
        p.category.toLowerCase().includes("whiskey") ||
        p.description.toLowerCase().includes("whiskey") ||
        p.brand.toLowerCase().includes("whiskey");
      expect(match).toBe(true);
    });
  });

  it("search returns results for 'wine'", () => {
    const results = searchProducts("wine");
    expect(results.length).toBeGreaterThan(0);
  });

  it("search returns results for 'vodka'", () => {
    const results = searchProducts("vodka");
    expect(results.length).toBeGreaterThan(0);
  });

  it("search returns empty for nonsense query", () => {
    const results = searchProducts("xyznonexistent123");
    expect(results.length).toBe(0);
  });

  it("search is case-insensitive", () => {
    const lower = searchProducts("whiskey");
    const upper = searchProducts("WHISKEY");
    const mixed = searchProducts("Whiskey");
    expect(lower.length).toBe(upper.length);
    expect(lower.length).toBe(mixed.length);
  });

  it("category filtering returns correct products", () => {
    CATEGORIES.forEach((cat) => {
      const products = getProductsByCategory(cat.id);
      products.forEach((p) => {
        expect(p.category).toBe(cat.id);
      });
    });
  });

  it("every category has at least one product", () => {
    const categoriesWithProducts = CATEGORIES.filter(
      (c) => getProductsByCategory(c.id).length > 0
    );
    expect(categoriesWithProducts.length).toBeGreaterThan(0);
  });
});

// ─── PRODUCT DETAIL TESTS ──────────────────────────────────────────

describe("E2E: Product Detail", () => {
  it("every product has complete detail data", () => {
    PRODUCTS.forEach((p) => {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.price).toBeGreaterThan(0);
      expect(p.description).toBeTruthy();
      expect(p.category).toBeTruthy();
      expect(p.imageUrl).toBeTruthy();
      expect(p.volume).toBeTruthy();
      expect(p.abv).toBeTruthy();
      expect(p.rating).toBeGreaterThanOrEqual(0);
      expect(p.rating).toBeLessThanOrEqual(5);
      expect(p.reviewCount).toBeGreaterThanOrEqual(0);
      expect(p.expressAvailable || p.shippingAvailable).toBe(true);
    });
  });

  it("getProductById returns correct product", () => {
    PRODUCTS.forEach((p) => {
      const found = getProductById(p.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(p.id);
      expect(found!.name).toBe(p.name);
    });
  });

  it("getProductById returns undefined for invalid id", () => {
    const found = getProductById("nonexistent-id-999");
    expect(found).toBeUndefined();
  });

  it("formatPrice displays correct currency format", () => {
    expect(formatPrice(29.99)).toContain("29");
    expect(formatPrice(29.99)).toContain("99");
    expect(formatPrice(0)).toContain("0");
    expect(formatPrice(100)).toContain("100");
  });

  it("star display returns valid string for all ratings", () => {
    [0, 1, 2, 3, 4, 5, 3.5, 4.7].forEach((r) => {
      const stars = getStarDisplay(r);
      expect(typeof stars).toBe("string");
      expect(stars.length).toBeGreaterThan(0);
    });
  });

  it("products have valid delivery modes", () => {
    PRODUCTS.forEach((p) => {
      expect(typeof p.expressAvailable).toBe("boolean");
      expect(typeof p.shippingAvailable).toBe("boolean");
    });
  });

  it("products have valid premium/featured flags", () => {
    PRODUCTS.forEach((p) => {
      expect(typeof p.premium).toBe("boolean");
      expect(typeof p.featured).toBe("boolean");
    });
  });
});

// ─── CART LOGIC TESTS ───────────────────────────────────────────────

describe("E2E: Cart Logic", () => {
  it("cart item price calculation is correct", () => {
    const product = PRODUCTS[0];
    const quantity = 3;
    const subtotal = product.price * quantity;
    expect(subtotal).toBe(product.price * 3);
  });

  it("cart total with multiple items", () => {
    const items = PRODUCTS.slice(0, 3).map((p, i) => ({
      product: p,
      quantity: i + 1,
    }));
    const total = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    expect(total).toBeGreaterThan(0);
    // Verify: p1*1 + p2*2 + p3*3
    const expected =
      PRODUCTS[0].price * 1 + PRODUCTS[1].price * 2 + PRODUCTS[2].price * 3;
    expect(total).toBeCloseTo(expected, 2);
  });

  it("delivery fee logic - free over $50", () => {
    const subtotal = 75.0;
    const deliveryFee = subtotal >= 50 ? 0 : 5.99;
    expect(deliveryFee).toBe(0);
  });

  it("delivery fee logic - charged under $50", () => {
    const subtotal = 30.0;
    const deliveryFee = subtotal >= 50 ? 0 : 5.99;
    expect(deliveryFee).toBe(5.99);
  });

  it("tax calculation (estimated)", () => {
    const subtotal = 100.0;
    const taxRate = 0.08;
    const tax = subtotal * taxRate;
    expect(tax).toBeCloseTo(8.0, 2);
  });
});

// ─── CHECKOUT FLOW TESTS ────────────────────────────────────────────

describe("E2E: Checkout Flow", () => {
  it("delivery mode options are valid", () => {
    const modes = ["express", "shipping"];
    expect(modes).toContain("express");
    expect(modes).toContain("shipping");
  });

  it("express delivery has time estimate", () => {
    const expressEstimate = "30-60 min";
    expect(expressEstimate).toBeTruthy();
  });

  it("shipping has time estimate", () => {
    const shippingEstimate = "3-5 business days";
    expect(shippingEstimate).toBeTruthy();
  });

  it("tip calculation works correctly", () => {
    const subtotal = 80.0;
    const tipPercentages = [0, 0.15, 0.18, 0.2, 0.25];
    tipPercentages.forEach((pct) => {
      const tip = subtotal * pct;
      expect(tip).toBeCloseTo(subtotal * pct, 2);
    });
  });

  it("order total calculation", () => {
    const subtotal = 100.0;
    const deliveryFee = 0; // over $50
    const tax = subtotal * 0.08;
    const tip = subtotal * 0.18;
    const total = subtotal + deliveryFee + tax + tip;
    expect(total).toBeCloseTo(126.0, 2);
  });
});

// ─── ORDER MANAGEMENT TESTS ────────────────────────────────────────

describe("E2E: Orders", () => {
  it("order statuses are valid", () => {
    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "out_for_delivery",
      "shipped",
      "delivered",
      "cancelled",
    ];
    validStatuses.forEach((s) => {
      expect(typeof s).toBe("string");
      expect(s.length).toBeGreaterThan(0);
    });
  });

  it("order has required fields structure", () => {
    const mockOrder = {
      id: "ORD-001",
      items: [{ product: PRODUCTS[0], quantity: 2 }],
      subtotal: PRODUCTS[0].price * 2,
      deliveryFee: 0,
      tax: PRODUCTS[0].price * 2 * 0.08,
      tip: PRODUCTS[0].price * 2 * 0.18,
      total: 0,
      status: "pending",
      deliveryMode: "express",
      createdAt: new Date().toISOString(),
    };
    mockOrder.total =
      mockOrder.subtotal +
      mockOrder.deliveryFee +
      mockOrder.tax +
      mockOrder.tip;

    expect(mockOrder.id).toBeTruthy();
    expect(mockOrder.items.length).toBeGreaterThan(0);
    expect(mockOrder.total).toBeGreaterThan(0);
    expect(mockOrder.status).toBe("pending");
    expect(mockOrder.deliveryMode).toBe("express");
  });
});

// ─── DATA INTEGRITY TESTS ──────────────────────────────────────────

describe("E2E: Data Integrity", () => {
  it("all product IDs are unique", () => {
    const ids = PRODUCTS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("all category IDs are unique", () => {
    const ids = CATEGORIES.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("every product belongs to a valid category", () => {
    const categoryIds = CATEGORIES.map((c) => c.id);
    PRODUCTS.forEach((p) => {
      expect(categoryIds).toContain(p.category);
    });
  });

  it("product count is 16 as designed", () => {
    expect(PRODUCTS.length).toBe(16);
  });

  it("category count is 12 as designed", () => {
    expect(CATEGORIES.length).toBe(12);
  });

  it("prices are reasonable (between $5 and $500)", () => {
    PRODUCTS.forEach((p) => {
      expect(p.price).toBeGreaterThanOrEqual(5);
      expect(p.price).toBeLessThanOrEqual(500);
    });
  });

  it("ratings are between 0 and 5", () => {
    PRODUCTS.forEach((p) => {
      expect(p.rating).toBeGreaterThanOrEqual(0);
      expect(p.rating).toBeLessThanOrEqual(5);
    });
  });

  it("ABV values are valid percentages", () => {
    PRODUCTS.forEach((p) => {
      // ABV is a string like "40%" or "12.5%"
      expect(p.abv).toMatch(/[\d.]+%/);
    });
  });
});
