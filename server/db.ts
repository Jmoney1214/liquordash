import { eq, like, or, and, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  products,
  categories,
  orders,
  orderItems,
  cartItems,
  favorites,
  userProfiles,
  addresses,
  paymentMethods,
  InsertProduct,
  InsertCategory,
  InsertOrder,
  InsertOrderItem,
  InsertCartItem,
  InsertFavorite,
  InsertUserProfile,
  InsertAddress,
  InsertPaymentMethod,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ═══════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ═══════════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function upsertCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(categories).values(data).onDuplicateKeyUpdate({
    set: { name: data.name, icon: data.icon, color: data.color, sortOrder: data.sortOrder },
  });
}

// ═══════════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════════

export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).orderBy(desc(products.featured), asc(products.name));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductsByCategory(categorySlug: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.categorySlug, categorySlug));
}

export async function getFeaturedProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.featured, true));
}

export async function getPremiumProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.premium, true));
}

export async function searchProducts(query: string) {
  const db = await getDb();
  if (!db) return [];
  const pattern = `%${query}%`;
  return db
    .select()
    .from(products)
    .where(
      or(
        like(products.name, pattern),
        like(products.brand, pattern),
        like(products.categorySlug, pattern),
        like(products.description, pattern)
      )
    );
}

export async function getExpressProducts() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(products)
    .where(and(eq(products.expressAvailable, true), eq(products.inStock, true)));
}

export async function getShippingProducts() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(products)
    .where(and(eq(products.shippingAvailable, true), eq(products.inStock, true)));
}

export async function insertProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(data);
  return result[0].insertId;
}

export async function getProductCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(products);
  return result[0]?.count ?? 0;
}

// ═══════════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════════

export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values(data);
  return result[0].insertId;
}

export async function getUserOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function addOrderItems(items: InsertOrderItem[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (items.length === 0) return;
  await db.insert(orderItems).values(items);
}

export async function updateOrderStatus(
  orderId: number,
  status: "confirmed" | "preparing" | "out-for-delivery" | "shipped" | "in-transit" | "delivered" | "cancelled"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ status }).where(eq(orders.id, orderId));
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

// ═══════════════════════════════════════════════════════════════════
// CART
// ═══════════════════════════════════════════════════════════════════

export async function getUserCart(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cartItems).where(eq(cartItems.userId, userId));
}

export async function addToCart(data: InsertCartItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Check if product already in cart
  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, data.userId), eq(cartItems.productId, data.productId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(cartItems)
      .set({ quantity: (existing[0].quantity || 1) + (data.quantity || 1) })
      .where(eq(cartItems.id, existing[0].id));
    return existing[0].id;
  }

  const result = await db.insert(cartItems).values(data);
  return result[0].insertId;
}

export async function updateCartItemQuantity(cartItemId: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, cartItemId));
}

export async function removeCartItem(cartItemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
}

export async function clearUserCart(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// ═══════════════════════════════════════════════════════════════════
// FAVORITES
// ═══════════════════════════════════════════════════════════════════

export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(favorites).where(eq(favorites.userId, userId));
}

export async function addFavorite(data: InsertFavorite) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, data.userId), eq(favorites.productId, data.productId)))
    .limit(1);
  if (existing.length > 0) return existing[0].id;
  const result = await db.insert(favorites).values(data);
  return result[0].insertId;
}

export async function removeFavorite(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)));
}

// ═══════════════════════════════════════════════════════════════════
// USER PROFILES
// ═══════════════════════════════════════════════════════════════════

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUserProfile(data: InsertUserProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, data.userId))
    .limit(1);

  if (existing.length > 0) {
    const { userId, ...updateData } = data;
    await db.update(userProfiles).set(updateData).where(eq(userProfiles.userId, userId));
    return existing[0].id;
  }

  const result = await db.insert(userProfiles).values(data);
  return result[0].insertId;
}

// ═══════════════════════════════════════════════════════════════════
// ADDRESSES
// ═══════════════════════════════════════════════════════════════════

export async function getUserAddresses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(addresses).where(eq(addresses.userId, userId));
}

export async function addAddress(data: InsertAddress) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // If setting as default, unset others first
  if (data.isDefault) {
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.userId, data.userId));
  }
  const result = await db.insert(addresses).values(data);
  return result[0].insertId;
}

export async function updateAddress(id: number, userId: number, data: Partial<InsertAddress>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
  }
  await db.update(addresses).set(data).where(eq(addresses.id, id));
}

export async function deleteAddress(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(addresses).where(eq(addresses.id, id));
}

// ═══════════════════════════════════════════════════════════════════
// PAYMENT METHODS
// ═══════════════════════════════════════════════════════════════════

export async function getUserPaymentMethods(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paymentMethods).where(eq(paymentMethods.userId, userId));
}

export async function addPaymentMethod(data: InsertPaymentMethod) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.isDefault) {
    await db
      .update(paymentMethods)
      .set({ isDefault: false })
      .where(eq(paymentMethods.userId, data.userId));
  }
  const result = await db.insert(paymentMethods).values(data);
  return result[0].insertId;
}

export async function deletePaymentMethod(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
}
