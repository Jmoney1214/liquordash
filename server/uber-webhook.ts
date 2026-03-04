/**
 * Uber Direct Webhook Handler
 *
 * Receives real-time delivery status updates from Uber Direct.
 * Verifies HMAC-SHA256 signatures and broadcasts events via WebSocket.
 *
 * Webhook types handled:
 *   - event.delivery_status — delivery status or courier_imminent changed
 *   - event.courier_update  — courier location update (every ~20s)
 *
 * Uber sends webhooks to: POST /api/webhooks/uber
 * Signature header: x-uber-signature (HMAC-SHA256 of body with client_secret)
 * Must respond with HTTP 200 and empty body.
 */

import { createHmac } from "crypto";
import type { Request, Response, Express } from "express";
import { broadcast, broadcastToRoomType } from "./websocket";
import { WS_EVENTS } from "../shared/ws-events";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Uber delivery status values */
export type UberDeliveryStatus =
  | "pending"
  | "pickup"
  | "pickup_complete"
  | "dropoff"
  | "delivered"
  | "canceled"
  | "returned"
  | "shopping_completed";

/** Courier info from webhook payload */
export interface UberCourierInfo {
  name?: string;
  phone_number?: string;
  vehicle_type?: string;
  vehicle_color?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  img_href?: string;
  rating?: string;
  location?: { lat: number; lng: number };
  vehicle_license_plate?: string;
}

/** The data object inside the delivery status webhook */
export interface UberDeliveryData {
  id: string;
  status: UberDeliveryStatus;
  complete: boolean;
  courier?: UberCourierInfo | null;
  courier_imminent?: boolean;
  fee?: number;
  currency?: string;
  tracking_url?: string;
  pickup_eta?: string;
  dropoff_eta?: string;
  dropoff_deadline?: string;
  external_id?: string;
  pickup?: {
    address: string;
    name: string;
    phone_number: string;
    status?: string;
    status_timestamp?: string;
  };
  dropoff?: {
    address: string;
    name: string;
    phone_number: string;
    status?: string;
    status_timestamp?: string;
    verification?: {
      picture?: { image_url: string };
      signature?: { image_url: string; signer_name?: string };
    };
  };
  manifest_items?: Array<{
    name: string;
    quantity: number;
    price?: number;
    fulfilled_quantity?: number;
  }>;
  created?: string;
  updated?: string;
  undeliverable_action?: string;
  undeliverable_reason?: string;
  related_deliveries?: Array<{
    id: string;
    relationship: string;
  }>;
}

/** Top-level webhook event envelope */
export interface UberWebhookEvent {
  id: string;
  kind: string; // "event.delivery_status" | "event.courier_update"
  created: string;
  customer_id: string;
  delivery_id: string;
  account_id?: string;
  developer_id?: string;
  live_mode: boolean;
  status?: UberDeliveryStatus;
  data: UberDeliveryData;
  batch_id?: string;
  route_id?: string;
}

// ─── Signature Verification ─────────────────────────────────────────────────

/**
 * Verify the HMAC-SHA256 signature from Uber.
 * Uses the client_secret as the HMAC key.
 */
export function verifySignature(
  rawBody: string | Buffer,
  signature: string,
  clientSecret: string
): boolean {
  if (!signature || !clientSecret) return false;

  const expectedSignature = createHmac("sha256", clientSecret)
    .update(rawBody)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) return false;

  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
}

// ─── Status Mapping ─────────────────────────────────────────────────────────

/**
 * Map Uber delivery status to LiquorDash order status.
 */
export function mapUberStatusToOrderStatus(
  uberStatus: UberDeliveryStatus,
  courierImminent?: boolean
): string {
  switch (uberStatus) {
    case "pending":
      return "confirmed";
    case "pickup":
      return courierImminent ? "ready" : "preparing";
    case "pickup_complete":
      return "out-for-delivery";
    case "dropoff":
      return "out-for-delivery";
    case "delivered":
      return "delivered";
    case "canceled":
      return "cancelled";
    case "returned":
      return "cancelled";
    default:
      return "confirmed";
  }
}

/**
 * Generate a human-readable status message for the delivery update.
 */
function getStatusMessage(
  uberStatus: UberDeliveryStatus,
  courierImminent?: boolean,
  courierName?: string
): string {
  const driver = courierName || "Your courier";

  switch (uberStatus) {
    case "pending":
      return "Looking for a courier to pick up your order...";
    case "pickup":
      return courierImminent
        ? `${driver} is arriving at the store in about 1 minute!`
        : `${driver} is heading to the store to pick up your order.`;
    case "pickup_complete":
      return `${driver} has picked up your order and is on the way!`;
    case "dropoff":
      return courierImminent
        ? `${driver} is almost there — about 1 minute away!`
        : `${driver} is heading to your location.`;
    case "delivered":
      return "Your order has been delivered. Enjoy!";
    case "canceled":
      return "This delivery has been cancelled.";
    case "returned":
      return "The delivery was cancelled and items are being returned to the store.";
    default:
      return "Delivery status updated.";
  }
}

// ─── Event Handlers ─────────────────────────────────────────────────────────

/**
 * Handle a delivery status webhook event.
 * Broadcasts to relevant WebSocket rooms.
 */
function handleDeliveryStatus(event: UberWebhookEvent): void {
  const { delivery_id, status, data } = event;
  const uberStatus = status || data.status;
  const courierImminent = data.courier_imminent;
  const orderStatus = mapUberStatusToOrderStatus(uberStatus, courierImminent);
  const externalId = data.external_id; // This is our LiquorDash order ID

  console.log(
    `[uber-webhook] Delivery ${delivery_id} status: ${uberStatus}` +
    (courierImminent ? " (courier imminent)" : "") +
    (externalId ? ` (order: ${externalId})` : "")
  );

  // Build the payload for WebSocket broadcast
  const wsPayload = {
    deliveryId: delivery_id,
    orderId: externalId || "",
    uberStatus,
    orderStatus,
    courierImminent: courierImminent ?? false,
    message: getStatusMessage(uberStatus, courierImminent, data.courier?.name),
    courier: data.courier
      ? {
          name: data.courier.name || "",
          phone: data.courier.phone_number || "",
          vehicleType: data.courier.vehicle_type || "",
          vehicleMake: data.courier.vehicle_make || "",
          vehicleModel: data.courier.vehicle_model || "",
          vehicleColor: data.courier.vehicle_color || "",
          imageUrl: data.courier.img_href || "",
          location: data.courier.location || null,
          rating: data.courier.rating || "",
          licensePlate: data.courier.vehicle_license_plate || "",
        }
      : null,
    trackingUrl: data.tracking_url || "",
    pickupEta: data.pickup_eta || "",
    dropoffEta: data.dropoff_eta || "",
    fee: data.fee,
    currency: data.currency,
    complete: data.complete,
    updatedAt: event.created,
    // Proof of delivery (if delivered)
    proofOfDelivery: data.dropoff?.verification
      ? {
          pictureUrl: data.dropoff.verification.picture?.image_url || "",
          signatureUrl: data.dropoff.verification.signature?.image_url || "",
          signerName: data.dropoff.verification.signature?.signer_name || "",
        }
      : null,
  };

  // Broadcast to the order room (customers tracking this order)
  if (externalId) {
    broadcast(`order:${externalId}`, WS_EVENTS.ORDER_STATUS_UPDATED, {
      orderId: externalId,
      previousStatus: "",
      newStatus: orderStatus,
      updatedAt: event.created,
      updatedBy: "uber",
      message: wsPayload.message,
    });
  }

  // Broadcast detailed Uber update to the order room
  if (externalId) {
    broadcast(`order:${externalId}`, WS_EVENTS.UBER_DELIVERY_UPDATE, wsPayload);
  }

  // Broadcast to store rooms if we have store info
  broadcastToRoomType("store", WS_EVENTS.UBER_DELIVERY_UPDATE, wsPayload);

  // Broadcast to admin for monitoring
  broadcast("admin:platform", WS_EVENTS.ADMIN_ALERT, {
    alertId: event.id,
    type: uberStatus === "delivered" ? "success" : uberStatus === "canceled" ? "error" : "info",
    title: `Uber Delivery ${uberStatus}`,
    message: `Delivery ${delivery_id}${externalId ? ` (Order ${externalId})` : ""}: ${wsPayload.message}`,
    createdAt: event.created,
  });
}

/**
 * Handle a courier update webhook event (location updates).
 */
function handleCourierUpdate(event: UberWebhookEvent): void {
  const { delivery_id, data } = event;
  const externalId = data.external_id;

  if (!data.courier?.location) return;

  console.log(
    `[uber-webhook] Courier update for ${delivery_id}: ` +
    `lat=${data.courier.location.lat}, lng=${data.courier.location.lng}`
  );

  const locationPayload = {
    orderId: externalId || "",
    deliveryId: delivery_id,
    driverId: `uber_${delivery_id}`,
    driverName: data.courier.name || "Uber Courier",
    latitude: data.courier.location.lat,
    longitude: data.courier.location.lng,
    heading: 0,
    speed: 0,
    updatedAt: event.created,
    vehicleType: data.courier.vehicle_type || "",
    vehicleColor: data.courier.vehicle_color || "",
    imageUrl: data.courier.img_href || "",
  };

  // Broadcast to the order room for live tracking
  if (externalId) {
    broadcast(
      `order:${externalId}`,
      WS_EVENTS.DRIVER_LOCATION_UPDATED,
      locationPayload
    );
  }
}

// ─── Express Route Registration ─────────────────────────────────────────────

/**
 * Register the Uber Direct webhook endpoint on the Express app.
 *
 * IMPORTANT: This must be registered BEFORE the global express.json() middleware,
 * or we need to capture the raw body for signature verification.
 * We use a custom middleware to capture the raw body.
 */
export function registerUberWebhookRoutes(app: Express): void {
  // Webhook endpoint — uses raw body for signature verification
  app.post(
    "/api/webhooks/uber",
    // Custom raw body parser for this route
    (req: Request, res: Response, next) => {
      // If body is already parsed (from global express.json), we need raw body
      // We'll store raw body via a custom approach
      if ((req as any)._rawBody) {
        next();
        return;
      }

      let rawBody = "";
      req.setEncoding("utf8");
      req.on("data", (chunk: string) => {
        rawBody += chunk;
      });
      req.on("end", () => {
        (req as any)._rawBody = rawBody;
        try {
          req.body = JSON.parse(rawBody);
        } catch {
          req.body = {};
        }
        next();
      });
    },
    (req: Request, res: Response) => {
      const clientSecret = process.env.UBER_DIRECT_CLIENT_SECRET;

      if (!clientSecret) {
        console.error("[uber-webhook] Missing UBER_DIRECT_CLIENT_SECRET");
        res.status(500).send();
        return;
      }

      // Verify signature
      const signature =
        (req.headers["x-uber-signature"] as string) ||
        (req.headers["x-postmates-signature"] as string) ||
        "";

      const rawBody = (req as any)._rawBody || JSON.stringify(req.body);

      if (signature && !verifySignature(rawBody, signature, clientSecret)) {
        console.warn("[uber-webhook] Invalid signature — rejecting request");
        res.status(401).send();
        return;
      }

      // In test/sandbox mode, Uber may not send signatures
      if (!signature) {
        console.warn("[uber-webhook] No signature header — accepting (test mode)");
      }

      const event = req.body as UberWebhookEvent;

      if (!event || !event.kind) {
        console.warn("[uber-webhook] Invalid webhook payload");
        res.status(400).send();
        return;
      }

      console.log(
        `[uber-webhook] Received ${event.kind} for delivery ${event.delivery_id}` +
        ` (live_mode: ${event.live_mode})`
      );

      // Route to appropriate handler
      try {
        switch (event.kind) {
          case "event.delivery_status":
            handleDeliveryStatus(event);
            break;
          case "event.courier_update":
            handleCourierUpdate(event);
            break;
          default:
            console.log(`[uber-webhook] Unhandled event kind: ${event.kind}`);
        }
      } catch (err) {
        console.error("[uber-webhook] Error processing event:", err);
        // Still return 200 to prevent Uber from retrying
      }

      // Always respond with 200 and empty body per Uber docs
      res.status(200).send();
    }
  );

  console.log("[uber-webhook] Webhook endpoint registered at POST /api/webhooks/uber");
}
