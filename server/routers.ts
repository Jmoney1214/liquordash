import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as uberDirect from "./uber-direct";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // CATEGORIES
  // ═══════════════════════════════════════════════════════════════
  categories: router({
    list: publicProcedure.query(async () => {
      return db.getAllCategories();
    }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // PRODUCTS
  // ═══════════════════════════════════════════════════════════════
  products: router({
    list: publicProcedure.query(async () => {
      return db.getAllProducts();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getProductById(input.id);
      }),

    byCategory: publicProcedure
      .input(z.object({ categorySlug: z.string() }))
      .query(async ({ input }) => {
        return db.getProductsByCategory(input.categorySlug);
      }),

    featured: publicProcedure.query(async () => {
      return db.getFeaturedProducts();
    }),

    premium: publicProcedure.query(async () => {
      return db.getPremiumProducts();
    }),

    express: publicProcedure.query(async () => {
      return db.getExpressProducts();
    }),

    shipping: publicProcedure.query(async () => {
      return db.getShippingProducts();
    }),

    search: publicProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        return db.searchProducts(input.query);
      }),

    count: publicProcedure.query(async () => {
      return db.getProductCount();
    }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // ORDERS (authenticated)
  // ═══════════════════════════════════════════════════════════════
  orders: router({
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserOrders(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const order = await db.getOrderById(input.id);
        if (!order) return null;
        const items = await db.getOrderItems(input.id);
        return { ...order, items };
      }),

    create: protectedProcedure
      .input(
        z.object({
          deliveryMode: z.enum(["express", "shipping"]),
          subtotal: z.string(),
          deliveryFee: z.string(),
          serviceFee: z.string().optional(),
          tax: z.string(),
          tip: z.string().optional(),
          total: z.string(),
          deliveryAddress: z.string(),
          estimatedDelivery: z.string().optional(),
          giftMessage: z.string().optional(),
          recipientName: z.string().optional(),
          items: z.array(
            z.object({
              productId: z.number(),
              productName: z.string(),
              productBrand: z.string(),
              productImageUrl: z.string().optional(),
              price: z.string(),
              quantity: z.number(),
              isGift: z.boolean().optional(),
              giftMessage: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { items, ...orderData } = input;
        const orderId = await db.createOrder({
          ...orderData,
          userId: ctx.user.id,
          serviceFee: input.serviceFee ?? "0.00",
          tip: input.tip ?? "0.00",
        });

        await db.addOrderItems(
          items.map((item) => ({
            ...item,
            orderId,
            productImageUrl: item.productImageUrl ?? null,
            isGift: item.isGift ?? false,
            giftMessage: item.giftMessage ?? null,
          }))
        );

        // Clear the user's cart after placing an order
        await db.clearUserCart(ctx.user.id);

        return { orderId };
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          orderId: z.number(),
          status: z.enum([
            "confirmed",
            "preparing",
            "out-for-delivery",
            "shipped",
            "in-transit",
            "delivered",
            "cancelled",
          ]),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateOrderStatus(input.orderId, input.status);
        return { success: true };
      }),

    all: adminProcedure.query(async () => {
      return db.getAllOrders();
    }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // CART (authenticated)
  // ═══════════════════════════════════════════════════════════════
  cart: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const items = await db.getUserCart(ctx.user.id);
      // Join with product data
      const enriched = await Promise.all(
        items.map(async (item) => {
          const product = await db.getProductById(item.productId);
          return { ...item, product };
        })
      );
      return enriched;
    }),

    add: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          quantity: z.number().min(1).default(1),
          isGift: z.boolean().optional(),
          giftMessage: z.string().optional(),
          recipientName: z.string().optional(),
          recipientAddress: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.addToCart({
          userId: ctx.user.id,
          productId: input.productId,
          quantity: input.quantity,
          isGift: input.isGift ?? false,
          giftMessage: input.giftMessage ?? null,
          recipientName: input.recipientName ?? null,
          recipientAddress: input.recipientAddress ?? null,
        });
        return { id };
      }),

    updateQuantity: protectedProcedure
      .input(z.object({ cartItemId: z.number(), quantity: z.number().min(1) }))
      .mutation(async ({ input }) => {
        await db.updateCartItemQuantity(input.cartItemId, input.quantity);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ cartItemId: z.number() }))
      .mutation(async ({ input }) => {
        await db.removeCartItem(input.cartItemId);
        return { success: true };
      }),

    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await db.clearUserCart(ctx.user.id);
      return { success: true };
    }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // FAVORITES (authenticated)
  // ═══════════════════════════════════════════════════════════════
  favorites: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const favs = await db.getUserFavorites(ctx.user.id);
      // Join with product data
      const enriched = await Promise.all(
        favs.map(async (fav) => {
          const product = await db.getProductById(fav.productId);
          return { ...fav, product };
        })
      );
      return enriched;
    }),

    add: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.addFavorite({
          userId: ctx.user.id,
          productId: input.productId,
        });
        return { id };
      }),

    remove: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeFavorite(ctx.user.id, input.productId);
        return { success: true };
      }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // USER PROFILE (authenticated)
  // ═══════════════════════════════════════════════════════════════
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserProfile(ctx.user.id);
    }),

    update: protectedProcedure
      .input(
        z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          phone: z.string().optional(),
          dateOfBirth: z.string().optional(),
          isAgeVerified: z.boolean().optional(),
          notifPush: z.boolean().optional(),
          notifEmail: z.boolean().optional(),
          notifSms: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.upsertUserProfile({
          userId: ctx.user.id,
          ...input,
        });
        return { id };
      }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // ADDRESSES (authenticated)
  // ═══════════════════════════════════════════════════════════════
  addresses: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserAddresses(ctx.user.id);
    }),

    add: protectedProcedure
      .input(
        z.object({
          label: z.string(),
          fullName: z.string(),
          street: z.string(),
          apt: z.string().optional(),
          city: z.string(),
          state: z.string(),
          zip: z.string(),
          phone: z.string().optional(),
          instructions: z.string().optional(),
          isDefault: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.addAddress({
          userId: ctx.user.id,
          ...input,
          apt: input.apt ?? null,
          phone: input.phone ?? null,
          instructions: input.instructions ?? null,
          isDefault: input.isDefault ?? false,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          label: z.string().optional(),
          fullName: z.string().optional(),
          street: z.string().optional(),
          apt: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zip: z.string().optional(),
          phone: z.string().optional(),
          instructions: z.string().optional(),
          isDefault: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateAddress(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAddress(input.id);
        return { success: true };
      }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // PAYMENT METHODS (authenticated)
  // ═══════════════════════════════════════════════════════════════
  payments: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserPaymentMethods(ctx.user.id);
    }),

    add: protectedProcedure
      .input(
        z.object({
          type: z.enum(["card", "apple-pay", "google-pay"]),
          brand: z.string().optional(),
          last4: z.string().optional(),
          expiry: z.string().optional(),
          holderName: z.string().optional(),
          isDefault: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.addPaymentMethod({
          userId: ctx.user.id,
          ...input,
          brand: input.brand ?? null,
          last4: input.last4 ?? null,
          expiry: input.expiry ?? null,
          holderName: input.holderName ?? null,
          isDefault: input.isDefault ?? false,
        });
        return { id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePaymentMethod(input.id);
        return { success: true };
      }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // UBER DIRECT DELIVERY
  // ═══════════════════════════════════════════════════════════════
  delivery: router({
    /** Get a delivery quote with estimated fee and ETA */
    quote: publicProcedure
      .input(
        z.object({
          pickupAddress: z.string().min(1),
          pickupName: z.string().optional(),
          pickupPhone: z.string().optional(),
          dropoffAddress: z.string().min(1),
          dropoffName: z.string().optional(),
          dropoffPhone: z.string().optional(),
          items: z
            .array(
              z.object({
                name: z.string(),
                quantity: z.number().min(1),
                price: z.number().optional(), // cents
                size: z.enum(["small", "medium", "large", "xlarge"]).optional(),
              })
            )
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        const quote = await uberDirect.getDeliveryQuote({
          pickup_address: input.pickupAddress,
          pickup_name: input.pickupName,
          pickup_phone_number: input.pickupPhone,
          dropoff_address: input.dropoffAddress,
          dropoff_name: input.dropoffName,
          dropoff_phone_number: input.dropoffPhone,
          manifest_items: input.items?.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
          })),
        });
        return {
          quoteId: quote.id,
          fee: quote.fee, // cents
          currency: quote.currency_type,
          dropoffEta: quote.dropoff_eta,
          duration: quote.duration, // minutes
          pickupDuration: quote.pickup_duration,
          expires: quote.expires,
        };
      }),

    /** Create a delivery and dispatch an Uber courier */
    create: protectedProcedure
      .input(
        z.object({
          pickupAddress: z.string().min(1),
          pickupName: z.string().min(1),
          pickupPhone: z.string().min(1),
          pickupNotes: z.string().optional(),
          dropoffAddress: z.string().min(1),
          dropoffName: z.string().min(1),
          dropoffPhone: z.string().min(1),
          dropoffNotes: z.string().optional(),
          items: z.array(
            z.object({
              name: z.string(),
              quantity: z.number().min(1),
              price: z.number().optional(),
              size: z.enum(["small", "medium", "large", "xlarge"]).optional(),
            })
          ),
          manifestDescription: z.string().optional(),
          manifestTotalValue: z.number().optional(), // cents
          quoteId: z.string().optional(),
          externalId: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const delivery = await uberDirect.createDelivery({
          pickup_address: input.pickupAddress,
          pickup_name: input.pickupName,
          pickup_phone_number: input.pickupPhone,
          pickup_notes: input.pickupNotes,
          dropoff_address: input.dropoffAddress,
          dropoff_name: input.dropoffName,
          dropoff_phone_number: input.dropoffPhone,
          dropoff_notes: input.dropoffNotes,
          manifest_items: input.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
          })),
          manifest_description: input.manifestDescription,
          manifest_total_value: input.manifestTotalValue,
          quote_id: input.quoteId,
          external_id: input.externalId,
        });
        return {
          deliveryId: delivery.id,
          status: delivery.status,
          fee: delivery.fee,
          currency: delivery.currency,
          trackingUrl: delivery.tracking_url,
          pickupEta: delivery.pickup_eta,
          dropoffEta: delivery.dropoff_eta,
          courier: delivery.courier
            ? {
                name: delivery.courier.name,
                phone: delivery.courier.phone_number,
                vehicleType: delivery.courier.vehicle_type,
                imgUrl: delivery.courier.img_href,
                location: delivery.courier.location,
              }
            : null,
        };
      }),

    /** Get the current status and details of a delivery */
    status: publicProcedure
      .input(z.object({ deliveryId: z.string().min(1) }))
      .query(async ({ input }) => {
        const delivery = await uberDirect.getDeliveryStatus(input.deliveryId);
        return {
          deliveryId: delivery.id,
          status: delivery.status,
          complete: delivery.complete,
          fee: delivery.fee,
          currency: delivery.currency,
          trackingUrl: delivery.tracking_url,
          pickupEta: delivery.pickup_eta,
          dropoffEta: delivery.dropoff_eta,
          courier: delivery.courier
            ? {
                name: delivery.courier.name,
                phone: delivery.courier.phone_number,
                vehicleType: delivery.courier.vehicle_type,
                imgUrl: delivery.courier.img_href,
                location: delivery.courier.location,
              }
            : null,
          pickup: delivery.pickup,
          dropoff: delivery.dropoff,
          manifestItems: delivery.manifest_items,
          created: delivery.created,
          updated: delivery.updated,
        };
      }),

    /** Cancel a delivery (only before courier picks up) */
    cancel: protectedProcedure
      .input(z.object({ deliveryId: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const result = await uberDirect.cancelDelivery(input.deliveryId);
        return { deliveryId: result.id, status: result.status };
      }),

    /** Validate that Uber Direct credentials are working */
    validateCredentials: adminProcedure.query(async () => {
      return uberDirect.validateCredentials();
    }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // ADMIN: Seed data
  // ═══════════════════════════════════════════════════════════════
  admin: router({
    seed: adminProcedure.mutation(async () => {
      const { seedDatabase } = await import("./seed");
      await seedDatabase();
      return { success: true, message: "Database seeded successfully" };
    }),

    stats: adminProcedure.query(async () => {
      const productCount = await db.getProductCount();
      const allOrders = await db.getAllOrders();
      const categories = await db.getAllCategories();
      return {
        productCount,
        orderCount: allOrders.length,
        categoryCount: categories.length,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
