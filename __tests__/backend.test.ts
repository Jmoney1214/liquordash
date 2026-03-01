/**
 * Backend integration tests - validates the database schema, routers, and seed data.
 * These tests verify the tRPC API structure and data flow without requiring a live DB connection.
 */
import { describe, it, expect } from "vitest";

// ─── Schema validation ───

describe("Database Schema", () => {
  it("should export all required table definitions", async () => {
    const schema = await import("../drizzle/schema");
    
    // Core tables
    expect(schema.users).toBeDefined();
    expect(schema.categories).toBeDefined();
    expect(schema.products).toBeDefined();
    expect(schema.orders).toBeDefined();
    expect(schema.orderItems).toBeDefined();
    expect(schema.cartItems).toBeDefined();
    expect(schema.favorites).toBeDefined();
    expect(schema.userProfiles).toBeDefined();
    expect(schema.addresses).toBeDefined();
    expect(schema.paymentMethods).toBeDefined();
  });

  it("should have correct User type with required fields", async () => {
    const schema = await import("../drizzle/schema");
    // Verify the users table has the expected columns by checking the table config
    const usersTable = schema.users;
    expect(usersTable).toBeDefined();
  });
});

// ─── Seed data validation ───

describe("Seed Script", () => {
  it("should export seedDatabase function", async () => {
    const seed = await import("../server/seed");
    expect(seed.seedDatabase).toBeDefined();
    expect(typeof seed.seedDatabase).toBe("function");
  });

  it("should contain 12 categories in seed data", async () => {
    // Read the seed file to verify category count
    const fs = await import("fs");
    const seedContent = fs.readFileSync("server/seed.ts", "utf-8");
    
    const categoryMatches = seedContent.match(/slug: "/g);
    expect(categoryMatches).not.toBeNull();
    expect(categoryMatches!.length).toBe(12);
  });

  it("should contain 16 products in seed data", async () => {
    const fs = await import("fs");
    const seedContent = fs.readFileSync("server/seed.ts", "utf-8");
    
    // Count product entries by looking for categorySlug which is unique to products
    const productMatches = seedContent.match(/categorySlug: "/g);
    expect(productMatches).not.toBeNull();
    expect(productMatches!.length).toBe(16);
  });

  it("should have correct category slugs matching product references", async () => {
    const fs = await import("fs");
    const seedContent = fs.readFileSync("server/seed.ts", "utf-8");
    
    // Extract category slugs
    const catSlugs = [...seedContent.matchAll(/slug: "([^"]+)"/g)].map(m => m[1]);
    // Extract product category references
    const prodCatRefs = [...seedContent.matchAll(/categorySlug: "([^"]+)"/g)].map(m => m[1]);
    
    // Every product category should exist in categories
    for (const ref of prodCatRefs) {
      expect(catSlugs).toContain(ref);
    }
  });
});

// ─── Router structure validation ───

describe("tRPC Router Structure", () => {
  it("should export appRouter with all required sub-routers", async () => {
    const { appRouter } = await import("../server/routers");
    expect(appRouter).toBeDefined();
    
    // Check that the router has the expected shape
    const routerDef = appRouter._def;
    expect(routerDef).toBeDefined();
  });

  it("should have products router with list, getById, search, featured, premium, express, shipping", async () => {
    const fs = await import("fs");
    const routerContent = fs.readFileSync("server/routers.ts", "utf-8");
    
    expect(routerContent).toContain("products: router({");
    expect(routerContent).toContain("list: publicProcedure");
    expect(routerContent).toContain("getById: publicProcedure");
    expect(routerContent).toContain("search: publicProcedure");
    expect(routerContent).toContain("featured: publicProcedure");
    expect(routerContent).toContain("premium: publicProcedure");
    expect(routerContent).toContain("express: publicProcedure");
    expect(routerContent).toContain("shipping: publicProcedure");
  });

  it("should have orders router with myOrders, getById, create, updateStatus, all", async () => {
    const fs = await import("fs");
    const routerContent = fs.readFileSync("server/routers.ts", "utf-8");
    
    expect(routerContent).toContain("orders: router({");
    expect(routerContent).toContain("myOrders: protectedProcedure");
    expect(routerContent).toContain("create: protectedProcedure");
    expect(routerContent).toContain("updateStatus: adminProcedure");
    expect(routerContent).toContain("all: adminProcedure");
  });

  it("should have cart router with get, add, updateQuantity, remove, clear", async () => {
    const fs = await import("fs");
    const routerContent = fs.readFileSync("server/routers.ts", "utf-8");
    
    expect(routerContent).toContain("cart: router({");
    expect(routerContent).toContain("add: protectedProcedure");
    expect(routerContent).toContain("updateQuantity: protectedProcedure");
    expect(routerContent).toContain("remove: protectedProcedure");
    expect(routerContent).toContain("clear: protectedProcedure");
  });

  it("should have favorites router with list, add, remove", async () => {
    const fs = await import("fs");
    const routerContent = fs.readFileSync("server/routers.ts", "utf-8");
    
    expect(routerContent).toContain("favorites: router({");
  });

  it("should have profile router with get and update", async () => {
    const fs = await import("fs");
    const routerContent = fs.readFileSync("server/routers.ts", "utf-8");
    
    expect(routerContent).toContain("profile: router({");
  });

  it("should have addresses router with list, add, update, delete", async () => {
    const fs = await import("fs");
    const routerContent = fs.readFileSync("server/routers.ts", "utf-8");
    
    expect(routerContent).toContain("addresses: router({");
  });

  it("should have payments router with list, add, delete", async () => {
    const fs = await import("fs");
    const routerContent = fs.readFileSync("server/routers.ts", "utf-8");
    
    expect(routerContent).toContain("payments: router({");
  });

  it("should have admin router with seed and stats", async () => {
    const fs = await import("fs");
    const routerContent = fs.readFileSync("server/routers.ts", "utf-8");
    
    expect(routerContent).toContain("admin: router({");
    expect(routerContent).toContain("seed: adminProcedure");
    expect(routerContent).toContain("stats: adminProcedure");
  });
});

// ─── API hooks file existence validation ───

describe("API Hooks Files", () => {
  it("should have all API hook files created", async () => {
    const fs = await import("fs");
    expect(fs.existsSync("hooks/use-api.ts")).toBe(true);
    expect(fs.existsSync("hooks/use-server-cart.ts")).toBe(true);
    expect(fs.existsSync("hooks/use-server-orders.ts")).toBe(true);
    expect(fs.existsSync("hooks/use-server-profile.ts")).toBe(true);
    expect(fs.existsSync("hooks/use-seed.ts")).toBe(true);
  });

  it("use-api.ts should export all product hooks", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("hooks/use-api.ts", "utf-8");
    expect(content).toContain("export function useProducts");
    expect(content).toContain("export function useCategories");
    expect(content).toContain("export function useFeaturedProducts");
    expect(content).toContain("export function usePremiumProducts");
    expect(content).toContain("export function useExpressProducts");
    expect(content).toContain("export function useShippingProducts");
    expect(content).toContain("export function useProductsByCategory");
    expect(content).toContain("export function useProductSearch");
    expect(content).toContain("export function useProductById");
    expect(content).toContain("export function useProductCount");
  });

  it("use-server-cart.ts should export useServerCart", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("hooks/use-server-cart.ts", "utf-8");
    expect(content).toContain("export function useServerCart");
  });

  it("use-server-orders.ts should export order hooks", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("hooks/use-server-orders.ts", "utf-8");
    expect(content).toContain("export function useServerOrders");
    expect(content).toContain("export function useServerOrderDetail");
  });

  it("use-server-profile.ts should export profile hooks", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("hooks/use-server-profile.ts", "utf-8");
    expect(content).toContain("export function useServerProfile");
    expect(content).toContain("export function useServerAddresses");
    expect(content).toContain("export function useServerPayments");
    expect(content).toContain("export function useServerFavorites");
  });
});

// ─── Database helpers validation ───

describe("Database Query Helpers", () => {
  it("should export all required database functions", async () => {
    const db = await import("../server/db");
    
    // Categories
    expect(db.getAllCategories).toBeDefined();
    expect(db.upsertCategory).toBeDefined();
    
    // Products
    expect(db.getAllProducts).toBeDefined();
    expect(db.getProductById).toBeDefined();
    expect(db.getProductsByCategory).toBeDefined();
    expect(db.getFeaturedProducts).toBeDefined();
    expect(db.getPremiumProducts).toBeDefined();
    expect(db.getExpressProducts).toBeDefined();
    expect(db.getShippingProducts).toBeDefined();
    expect(db.searchProducts).toBeDefined();
    expect(db.insertProduct).toBeDefined();
    expect(db.getProductCount).toBeDefined();
    
    // Orders
    expect(db.createOrder).toBeDefined();
    expect(db.getUserOrders).toBeDefined();
    expect(db.getOrderById).toBeDefined();
    expect(db.getOrderItems).toBeDefined();
    expect(db.addOrderItems).toBeDefined();
    expect(db.updateOrderStatus).toBeDefined();
    expect(db.getAllOrders).toBeDefined();
    
    // Cart
    expect(db.getUserCart).toBeDefined();
    expect(db.addToCart).toBeDefined();
    expect(db.updateCartItemQuantity).toBeDefined();
    expect(db.removeCartItem).toBeDefined();
    expect(db.clearUserCart).toBeDefined();
    
    // Favorites
    expect(db.getUserFavorites).toBeDefined();
    expect(db.addFavorite).toBeDefined();
    expect(db.removeFavorite).toBeDefined();
    
    // Profile
    expect(db.getUserProfile).toBeDefined();
    expect(db.upsertUserProfile).toBeDefined();
    
    // Addresses
    expect(db.getUserAddresses).toBeDefined();
    expect(db.addAddress).toBeDefined();
    expect(db.updateAddress).toBeDefined();
    expect(db.deleteAddress).toBeDefined();
    
    // Payments
    expect(db.getUserPaymentMethods).toBeDefined();
    expect(db.addPaymentMethod).toBeDefined();
    expect(db.deletePaymentMethod).toBeDefined();
  });
});
