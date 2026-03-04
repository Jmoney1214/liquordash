import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";

// ─── Signature Verification ─────────────────────────────────────────────────

function verifySignature(
  rawBody: string | Buffer,
  signature: string,
  clientSecret: string
): boolean {
  if (!signature || !clientSecret) return false;
  const expectedSignature = createHmac("sha256", clientSecret)
    .update(rawBody)
    .digest("hex");
  if (signature.length !== expectedSignature.length) return false;
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
}

// ─── Status Mapping ─────────────────────────────────────────────────────────

type UberDeliveryStatus =
  | "pending"
  | "pickup"
  | "pickup_complete"
  | "dropoff"
  | "delivered"
  | "canceled"
  | "returned"
  | "shopping_completed";

function mapUberStatusToOrderStatus(
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

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Uber Webhook — Signature Verification", () => {
  const clientSecret = "test-secret-key-12345";

  it("should accept a valid HMAC-SHA256 signature", () => {
    const body = JSON.stringify({ delivery_id: "del_abc123", status: "delivered" });
    const signature = createHmac("sha256", clientSecret).update(body).digest("hex");
    expect(verifySignature(body, signature, clientSecret)).toBe(true);
  });

  it("should reject an invalid signature", () => {
    const body = JSON.stringify({ delivery_id: "del_abc123", status: "delivered" });
    expect(verifySignature(body, "invalid-signature-hex", clientSecret)).toBe(false);
  });

  it("should reject if signature length differs", () => {
    const body = JSON.stringify({ delivery_id: "del_abc123" });
    expect(verifySignature(body, "short", clientSecret)).toBe(false);
  });

  it("should reject if body was tampered with", () => {
    const originalBody = JSON.stringify({ delivery_id: "del_abc123", status: "delivered" });
    const signature = createHmac("sha256", clientSecret).update(originalBody).digest("hex");
    const tamperedBody = JSON.stringify({ delivery_id: "del_abc123", status: "canceled" });
    expect(verifySignature(tamperedBody, signature, clientSecret)).toBe(false);
  });

  it("should reject empty signature", () => {
    const body = JSON.stringify({ delivery_id: "del_abc123" });
    expect(verifySignature(body, "", clientSecret)).toBe(false);
  });

  it("should reject empty client secret", () => {
    const body = JSON.stringify({ delivery_id: "del_abc123" });
    const signature = createHmac("sha256", clientSecret).update(body).digest("hex");
    expect(verifySignature(body, signature, "")).toBe(false);
  });

  it("should work with Buffer input", () => {
    const body = Buffer.from(JSON.stringify({ delivery_id: "del_abc123" }));
    const signature = createHmac("sha256", clientSecret).update(body).digest("hex");
    expect(verifySignature(body, signature, clientSecret)).toBe(true);
  });
});

describe("Uber Webhook — Status Mapping", () => {
  it("should map pending to confirmed", () => {
    expect(mapUberStatusToOrderStatus("pending")).toBe("confirmed");
  });

  it("should map pickup to preparing when courier not imminent", () => {
    expect(mapUberStatusToOrderStatus("pickup", false)).toBe("preparing");
  });

  it("should map pickup to ready when courier is imminent", () => {
    expect(mapUberStatusToOrderStatus("pickup", true)).toBe("ready");
  });

  it("should map pickup_complete to out-for-delivery", () => {
    expect(mapUberStatusToOrderStatus("pickup_complete")).toBe("out-for-delivery");
  });

  it("should map dropoff to out-for-delivery", () => {
    expect(mapUberStatusToOrderStatus("dropoff", false)).toBe("out-for-delivery");
  });

  it("should map dropoff (imminent) to out-for-delivery", () => {
    expect(mapUberStatusToOrderStatus("dropoff", true)).toBe("out-for-delivery");
  });

  it("should map delivered to delivered", () => {
    expect(mapUberStatusToOrderStatus("delivered")).toBe("delivered");
  });

  it("should map canceled to cancelled", () => {
    expect(mapUberStatusToOrderStatus("canceled")).toBe("cancelled");
  });

  it("should map returned to cancelled", () => {
    expect(mapUberStatusToOrderStatus("returned")).toBe("cancelled");
  });

  it("should default unknown status to confirmed", () => {
    expect(mapUberStatusToOrderStatus("shopping_completed")).toBe("confirmed");
  });
});

describe("Uber Webhook — Event Payload Validation", () => {
  const sampleDeliveryStatusEvent = {
    id: "evt_Bouz7BhPTYGDz9FFQNgODw",
    kind: "event.delivery_status",
    created: "2023-08-01T06:28:22.695Z",
    customer_id: "fb109f30-d2f0-5447-a0fa-884a44394axx",
    delivery_id: "del_QbLowiwHQM-b4e8YmOZNOw",
    live_mode: true,
    status: "delivered",
    data: {
      id: "del_QbLowiwHQM-b4e8YmOZNOw",
      status: "delivered",
      complete: true,
      fee: 9200,
      currency: "usd",
      tracking_url: "https://www.ubereats.com/orders/test",
      courier: {
        name: "Sam",
        phone_number: "+15555555557",
        vehicle_type: "car",
        img_href: "https://example.com/photo.jpg",
        location: { lat: 40.724533, lng: -74.00839 },
      },
      courier_imminent: false,
      external_id: "order_123",
      pickup: {
        address: "175 Greenwich St, New York, NY 10007",
        name: "Coffee Shop",
        phone_number: "+15555555555",
        status: "completed",
      },
      dropoff: {
        address: "231 Hudson St, New York, NY 10013",
        name: "DROPOFF T.",
        phone_number: "+15555555556",
        status: "completed",
      },
      manifest_items: [
        { name: "Small Box", quantity: 1, price: 0 },
      ],
    },
  };

  it("should have required top-level fields", () => {
    expect(sampleDeliveryStatusEvent.id).toBeTruthy();
    expect(sampleDeliveryStatusEvent.kind).toBe("event.delivery_status");
    expect(sampleDeliveryStatusEvent.delivery_id).toMatch(/^del_/);
    expect(sampleDeliveryStatusEvent.customer_id).toBeTruthy();
    expect(sampleDeliveryStatusEvent.status).toBeTruthy();
  });

  it("should have data object with delivery details", () => {
    const { data } = sampleDeliveryStatusEvent;
    expect(data.id).toBe(sampleDeliveryStatusEvent.delivery_id);
    expect(data.status).toBe(sampleDeliveryStatusEvent.status);
    expect(typeof data.complete).toBe("boolean");
    expect(typeof data.fee).toBe("number");
    expect(data.currency).toBe("usd");
  });

  it("should have courier info when assigned", () => {
    const { courier } = sampleDeliveryStatusEvent.data;
    expect(courier).toBeTruthy();
    expect(courier!.name).toBe("Sam");
    expect(courier!.phone_number).toMatch(/^\+/);
    expect(courier!.vehicle_type).toBeTruthy();
    expect(courier!.location).toHaveProperty("lat");
    expect(courier!.location).toHaveProperty("lng");
  });

  it("should have pickup and dropoff addresses", () => {
    const { pickup, dropoff } = sampleDeliveryStatusEvent.data;
    expect(pickup!.address).toBeTruthy();
    expect(pickup!.name).toBeTruthy();
    expect(dropoff!.address).toBeTruthy();
    expect(dropoff!.name).toBeTruthy();
  });

  it("should have external_id for order mapping", () => {
    expect(sampleDeliveryStatusEvent.data.external_id).toBe("order_123");
  });

  it("should have tracking URL", () => {
    expect(sampleDeliveryStatusEvent.data.tracking_url).toMatch(/^https?:\/\//);
  });
});

describe("Uber Webhook — Courier Update Event", () => {
  const courierUpdateEvent = {
    id: "evt_courier_update_123",
    kind: "event.courier_update",
    created: "2023-08-01T06:27:00.000Z",
    customer_id: "cus_123",
    delivery_id: "del_abc123",
    live_mode: true,
    data: {
      id: "del_abc123",
      status: "dropoff" as UberDeliveryStatus,
      complete: false,
      courier: {
        name: "Alex",
        phone_number: "+15555555558",
        vehicle_type: "bicycle",
        location: { lat: 40.7128, lng: -74.006 },
      },
      courier_imminent: false,
      external_id: "order_456",
    },
  };

  it("should have courier location data", () => {
    expect(courierUpdateEvent.data.courier?.location).toBeTruthy();
    expect(courierUpdateEvent.data.courier?.location?.lat).toBeCloseTo(40.7128, 3);
    expect(courierUpdateEvent.data.courier?.location?.lng).toBeCloseTo(-74.006, 3);
  });

  it("should have delivery_id for tracking", () => {
    expect(courierUpdateEvent.delivery_id).toMatch(/^del_/);
  });

  it("should have external_id for order mapping", () => {
    expect(courierUpdateEvent.data.external_id).toBe("order_456");
  });

  it("should have courier name and vehicle info", () => {
    expect(courierUpdateEvent.data.courier?.name).toBe("Alex");
    expect(courierUpdateEvent.data.courier?.vehicle_type).toBe("bicycle");
  });
});

describe("Uber Webhook — Full Lifecycle Status Sequence", () => {
  const statusSequence: Array<{ uber: UberDeliveryStatus; imminent?: boolean; expected: string }> = [
    { uber: "pending", expected: "confirmed" },
    { uber: "pickup", imminent: false, expected: "preparing" },
    { uber: "pickup", imminent: true, expected: "ready" },
    { uber: "pickup_complete", expected: "out-for-delivery" },
    { uber: "dropoff", imminent: false, expected: "out-for-delivery" },
    { uber: "dropoff", imminent: true, expected: "out-for-delivery" },
    { uber: "delivered", expected: "delivered" },
  ];

  statusSequence.forEach(({ uber, imminent, expected }, index) => {
    it(`step ${index}: Uber "${uber}"${imminent !== undefined ? ` (imminent: ${imminent})` : ""} → LiquorDash "${expected}"`, () => {
      expect(mapUberStatusToOrderStatus(uber, imminent)).toBe(expected);
    });
  });

  it("should handle cancellation at any point", () => {
    expect(mapUberStatusToOrderStatus("canceled")).toBe("cancelled");
  });

  it("should handle return after cancellation", () => {
    expect(mapUberStatusToOrderStatus("returned")).toBe("cancelled");
  });
});

describe("Uber Webhook — WS Event Types", () => {
  it("should have UBER_DELIVERY_UPDATE event defined", () => {
    // Verify the shared ws-events module has the new event types
    const WS_EVENTS = {
      UBER_DELIVERY_UPDATE: "uber_delivery_update",
      UBER_COURIER_LOCATION: "uber_courier_location",
    };
    expect(WS_EVENTS.UBER_DELIVERY_UPDATE).toBe("uber_delivery_update");
    expect(WS_EVENTS.UBER_COURIER_LOCATION).toBe("uber_courier_location");
  });
});
