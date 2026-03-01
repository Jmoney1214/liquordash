import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

// ═══════════════════════════════════════════════════════════════════
// USERS (existing - extended with profile fields)
// ═══════════════════════════════════════════════════════════════════

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ═══════════════════════════════════════════════════════════════════
// USER PROFILES (extended customer data)
// ═══════════════════════════════════════════════════════════════════

export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }),
  isAgeVerified: boolean("isAgeVerified").default(false).notNull(),
  rewardsPoints: int("rewardsPoints").default(0).notNull(),
  rewardsTier: mysqlEnum("rewardsTier", ["bronze", "silver", "gold", "platinum"])
    .default("bronze")
    .notNull(),
  notifPush: boolean("notifPush").default(true).notNull(),
  notifEmail: boolean("notifEmail").default(true).notNull(),
  notifSms: boolean("notifSms").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

// ═══════════════════════════════════════════════════════════════════
// ADDRESSES
// ═══════════════════════════════════════════════════════════════════

export const addresses = mysqlTable("addresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  label: varchar("label", { length: 50 }).notNull(),
  fullName: varchar("fullName", { length: 200 }).notNull(),
  street: varchar("street", { length: 500 }).notNull(),
  apt: varchar("apt", { length: 100 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  zip: varchar("zip", { length: 20 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  instructions: text("instructions"),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Address = typeof addresses.$inferSelect;
export type InsertAddress = typeof addresses.$inferInsert;

// ═══════════════════════════════════════════════════════════════════
// PAYMENT METHODS
// ═══════════════════════════════════════════════════════════════════

export const paymentMethods = mysqlTable("payment_methods", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["card", "apple-pay", "google-pay"]).notNull(),
  brand: varchar("brand", { length: 20 }),
  last4: varchar("last4", { length: 4 }),
  expiry: varchar("expiry", { length: 7 }),
  holderName: varchar("holderName", { length: 200 }),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;

// ═══════════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 10 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export type CategoryRow = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ═══════════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════════

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 255 }).notNull(),
  categorySlug: varchar("categorySlug", { length: 50 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("originalPrice", { precision: 10, scale: 2 }),
  volume: varchar("volume", { length: 50 }).notNull(),
  abv: varchar("abv", { length: 10 }).notNull(),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0.0").notNull(),
  reviewCount: int("reviewCount").default(0).notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  description: text("description").notNull(),
  tastingNotes: text("tastingNotes"),
  pairings: text("pairings"),
  expressAvailable: boolean("expressAvailable").default(false).notNull(),
  shippingAvailable: boolean("shippingAvailable").default(false).notNull(),
  shippingDays: varchar("shippingDays", { length: 20 }),
  inStock: boolean("inStock").default(true).notNull(),
  featured: boolean("featured").default(false).notNull(),
  premium: boolean("premium").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductRow = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ═══════════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════════

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", [
    "confirmed",
    "preparing",
    "out-for-delivery",
    "shipped",
    "in-transit",
    "delivered",
    "cancelled",
  ])
    .default("confirmed")
    .notNull(),
  deliveryMode: mysqlEnum("deliveryMode", ["express", "shipping"]).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("deliveryFee", { precision: 10, scale: 2 }).notNull(),
  serviceFee: decimal("serviceFee", { precision: 10, scale: 2 }).default("0.00").notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  tip: decimal("tip", { precision: 10, scale: 2 }).default("0.00").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  deliveryAddress: text("deliveryAddress").notNull(),
  trackingNumber: varchar("trackingNumber", { length: 100 }),
  estimatedDelivery: varchar("estimatedDelivery", { length: 100 }),
  storeId: int("storeId"),
  driverId: int("driverId"),
  giftMessage: text("giftMessage"),
  recipientName: varchar("recipientName", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrderRow = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ═══════════════════════════════════════════════════════════════════
// ORDER ITEMS
// ═══════════════════════════════════════════════════════════════════

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  productBrand: varchar("productBrand", { length: 255 }).notNull(),
  productImageUrl: varchar("productImageUrl", { length: 500 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: int("quantity").notNull(),
  isGift: boolean("isGift").default(false).notNull(),
  giftMessage: text("giftMessage"),
});

export type OrderItemRow = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ═══════════════════════════════════════════════════════════════════
// CART ITEMS (server-synced cart)
// ═══════════════════════════════════════════════════════════════════

export const cartItems = mysqlTable("cart_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  isGift: boolean("isGift").default(false).notNull(),
  giftMessage: text("giftMessage"),
  recipientName: varchar("recipientName", { length: 200 }),
  recipientAddress: text("recipientAddress"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CartItemRow = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

// ═══════════════════════════════════════════════════════════════════
// FAVORITES
// ═══════════════════════════════════════════════════════════════════

export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FavoriteRow = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;
