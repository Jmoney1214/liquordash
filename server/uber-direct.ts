/**
 * Uber Direct API Service
 *
 * Handles OAuth token management, delivery quotes, delivery creation,
 * delivery status tracking, and cancellation via the Uber Direct API.
 *
 * Endpoints:
 *   - POST /oauth/v2/token → get Bearer token
 *   - POST /v1/customers/{customer_id}/delivery_quotes → get delivery quote
 *   - POST /v1/customers/{customer_id}/deliveries → create delivery
 *   - GET  /v1/customers/{customer_id}/deliveries/{delivery_id} → get delivery status
 *   - POST /v1/customers/{customer_id}/deliveries/{delivery_id}/cancel → cancel delivery
 */

// ─── Configuration ───────────────────────────────────────────────────────────

const UBER_AUTH_URL = "https://auth.uber.com/oauth/v2/token";
const UBER_API_BASE = "https://api.uber.com";

function getConfig() {
  const clientId = process.env.UBER_DIRECT_CLIENT_ID;
  const clientSecret = process.env.UBER_DIRECT_CLIENT_SECRET;
  const customerId = process.env.UBER_DIRECT_CUSTOMER_ID;

  if (!clientId || !clientSecret || !customerId) {
    throw new Error(
      "Missing Uber Direct credentials. Set UBER_DIRECT_CLIENT_ID, UBER_DIRECT_CLIENT_SECRET, and UBER_DIRECT_CUSTOMER_ID."
    );
  }

  return { clientId, clientSecret, customerId };
}

// ─── Token Cache ─────────────────────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiresAt = 0; // Unix timestamp in ms

/**
 * Get a valid OAuth Bearer token, refreshing if expired.
 * Tokens are cached for their full lifetime minus a 5-minute buffer.
 */
export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const { clientId, clientSecret } = getConfig();

  const response = await fetch(UBER_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      scope: "eats.deliveries",
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Uber OAuth failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
    token_type: string;
  };

  cachedToken = data.access_token;
  // Cache with 5-minute buffer before expiry
  tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

  return cachedToken;
}

// ─── API Helper ──────────────────────────────────────────────────────────────

async function uberFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const token = await getAccessToken();
  const { customerId } = getConfig();

  const url = `${UBER_API_BASE}${path.replace("{customer_id}", customerId)}`;

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Uber API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ManifestItem {
  name: string;
  quantity: number;
  price?: number; // cents
  size?: "small" | "medium" | "large" | "xlarge";
  weight_v2?: number;
  weight_unit?: "gram" | "kilogram" | "pound" | "ounce";
  special_instructions?: string;
}

export interface DeliveryQuoteRequest {
  pickup_address: string;
  pickup_phone_number?: string;
  pickup_name?: string;
  dropoff_address: string;
  dropoff_phone_number?: string;
  dropoff_name?: string;
  manifest_items?: ManifestItem[];
}

export interface DeliveryQuoteResponse {
  kind: string;
  id: string; // starts with "dqt_"
  created: string;
  expires: string;
  fee: number; // cents
  currency_type: string;
  dropoff_eta: string;
  duration: number; // minutes
  pickup_duration: number; // minutes
  dropoff_deadline: string;
}

export interface CreateDeliveryRequest {
  pickup_address: string;
  pickup_name: string;
  pickup_phone_number: string;
  pickup_notes?: string;
  dropoff_address: string;
  dropoff_name: string;
  dropoff_phone_number: string;
  dropoff_notes?: string;
  manifest_items: ManifestItem[];
  manifest_description?: string;
  manifest_total_value?: number; // cents
  quote_id?: string;
  external_id?: string;
  deliverable_action?: string;
}

export interface DeliveryResponse {
  id: string; // starts with "del_"
  status: string;
  complete: boolean;
  kind: string;
  live_mode: boolean;
  fee: number; // cents
  currency: string;
  tracking_url: string;
  pickup_eta: string;
  dropoff_eta: string;
  dropoff_deadline: string;
  courier: {
    name?: string;
    phone_number?: string;
    vehicle_type?: string;
    img_href?: string;
    location?: { lat: number; lng: number };
  } | null;
  pickup: {
    address: string;
    name: string;
    phone_number: string;
    notes?: string;
  };
  dropoff: {
    address: string;
    name: string;
    phone_number: string;
    notes?: string;
  };
  manifest_items: Array<{
    name: string;
    quantity: number;
    price?: number;
    size?: string;
    fulfilled_quantity?: number;
  }>;
  created: string;
  updated: string;
  quote_id?: string;
  external_id?: string;
  undeliverable_action?: string;
  undeliverable_reason?: string;
}

// ─── API Methods ─────────────────────────────────────────────────────────────

/**
 * Get a delivery quote with estimated fee and ETA.
 * Quotes are valid for ~15 minutes.
 */
export async function getDeliveryQuote(
  request: DeliveryQuoteRequest
): Promise<DeliveryQuoteResponse> {
  return uberFetch<DeliveryQuoteResponse>(
    "/v1/customers/{customer_id}/delivery_quotes",
    {
      method: "POST",
      body: request,
    }
  );
}

/**
 * Create a delivery and dispatch an Uber courier.
 * Returns delivery details including tracking URL.
 */
export async function createDelivery(
  request: CreateDeliveryRequest
): Promise<DeliveryResponse> {
  return uberFetch<DeliveryResponse>(
    "/v1/customers/{customer_id}/deliveries",
    {
      method: "POST",
      body: request,
    }
  );
}

/**
 * Get the current status and details of a delivery.
 */
export async function getDeliveryStatus(
  deliveryId: string
): Promise<DeliveryResponse> {
  return uberFetch<DeliveryResponse>(
    `/v1/customers/{customer_id}/deliveries/${deliveryId}`
  );
}

/**
 * Cancel a delivery. Only possible before courier picks up the order.
 */
export async function cancelDelivery(
  deliveryId: string
): Promise<{ id: string; status: string }> {
  return uberFetch<{ id: string; status: string }>(
    `/v1/customers/{customer_id}/deliveries/${deliveryId}/cancel`,
    { method: "POST" }
  );
}

/**
 * Validate that the Uber Direct credentials are working.
 * Attempts to get an OAuth token — if successful, credentials are valid.
 */
export async function validateCredentials(): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    // Force a fresh token by clearing cache
    cachedToken = null;
    tokenExpiresAt = 0;
    await getAccessToken();
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
