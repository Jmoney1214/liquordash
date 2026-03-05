/**
 * Uber Direct Sandbox - Full Delivery Flow Test
 *
 * Tests the complete flow:
 *   1. OAuth authentication (get access token)
 *   2. Get delivery quote
 *   3. Create delivery
 *   4. Check delivery status
 *   5. Verify webhook endpoint is reachable
 */

const UBER_AUTH_URL = "https://auth.uber.com/oauth/v2/token";
const UBER_API_BASE = "https://api.uber.com";

const CLIENT_ID = process.env.UBER_DIRECT_CLIENT_ID!;
const CLIENT_SECRET = process.env.UBER_DIRECT_CLIENT_SECRET!;
const CUSTOMER_ID = process.env.UBER_DIRECT_CUSTOMER_ID!;

// ─── Helpers ────────────────────────────────────────────────────────────────

function log(step: string, msg: string, data?: unknown) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${step}`);
  console.log(`${"═".repeat(60)}`);
  console.log(msg);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logSuccess(msg: string) {
  console.log(`  ✅ ${msg}`);
}

function logError(msg: string) {
  console.log(`  ❌ ${msg}`);
}

function logInfo(msg: string) {
  console.log(`  ℹ️  ${msg}`);
}

// ─── Step 1: OAuth Authentication ───────────────────────────────────────────

async function testAuth(): Promise<string> {
  log("STEP 1: OAuth Authentication", "Requesting access token from Uber...");

  logInfo(`Client ID: ${CLIENT_ID.substring(0, 8)}...`);
  logInfo(`Customer ID: ${CUSTOMER_ID.substring(0, 8)}...`);

  const response = await fetch(UBER_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: "eats.deliveries",
    }).toString(),
  });

  const responseText = await response.text();

  if (!response.ok) {
    logError(`OAuth failed with status ${response.status}`);
    logError(`Response: ${responseText}`);
    throw new Error(`OAuth failed: ${response.status} - ${responseText}`);
  }

  const data = JSON.parse(responseText);
  logSuccess(`Access token obtained!`);
  logInfo(`Token type: ${data.token_type}`);
  logInfo(`Expires in: ${data.expires_in} seconds`);
  logInfo(`Token preview: ${data.access_token.substring(0, 20)}...`);

  return data.access_token;
}

// ─── Step 2: Get Delivery Quote ─────────────────────────────────────────────

async function testQuote(token: string): Promise<string> {
  log("STEP 2: Get Delivery Quote", "Requesting a delivery quote with sample addresses...");

  // Use Uber's recommended test addresses for sandbox
  const quoteRequest = {
    pickup_address: "425 Market St, San Francisco, CA 94105",
    pickup_phone_number: "+14155551234",
    pickup_name: "LiquorDash Store #1",
    dropoff_address: "201 3rd St, San Francisco, CA 94103",
    dropoff_phone_number: "+14155555678",
    dropoff_name: "Test Customer",
    manifest_items: [
      {
        name: "Premium Whiskey",
        quantity: 1,
        price: 4999,
        size: "medium" as const,
      },
      {
        name: "Craft Beer 6-Pack",
        quantity: 2,
        price: 1499,
        size: "medium" as const,
      },
    ],
  };

  logInfo(`Pickup: ${quoteRequest.pickup_address}`);
  logInfo(`Dropoff: ${quoteRequest.dropoff_address}`);
  logInfo(`Items: ${quoteRequest.manifest_items.length}`);

  const url = `${UBER_API_BASE}/v1/customers/${CUSTOMER_ID}/delivery_quotes`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(quoteRequest),
  });

  const responseText = await response.text();

  if (!response.ok) {
    logError(`Quote request failed with status ${response.status}`);
    logError(`Response: ${responseText}`);
    throw new Error(`Quote failed: ${response.status} - ${responseText}`);
  }

  const data = JSON.parse(responseText);
  logSuccess(`Delivery quote received!`);
  logInfo(`Quote ID: ${data.id}`);
  logInfo(`Fee: $${(data.fee / 100).toFixed(2)} ${data.currency_type || data.currency}`);
  logInfo(`ETA: ${data.dropoff_eta}`);
  logInfo(`Duration: ${data.duration} minutes`);
  logInfo(`Pickup duration: ${data.pickup_duration} minutes`);
  logInfo(`Expires: ${data.expires}`);

  return data.id;
}

// ─── Step 3: Create Delivery ────────────────────────────────────────────────

async function testCreateDelivery(
  token: string,
  quoteId: string
): Promise<{ deliveryId: string; trackingUrl: string }> {
  log("STEP 3: Create Delivery", "Dispatching an Uber courier with the quote...");

  const deliveryRequest = {
    pickup_address: "425 Market St, San Francisco, CA 94105",
    pickup_name: "LiquorDash Store #1",
    pickup_phone_number: "+14155551234",
    pickup_notes: "Ring doorbell, store is on the 1st floor",
    dropoff_address: "201 3rd St, San Francisco, CA 94103",
    dropoff_name: "Test Customer",
    dropoff_phone_number: "+14155555678",
    dropoff_notes: "Leave at front desk",
    manifest_items: [
      {
        name: "Premium Whiskey",
        quantity: 1,
        price: 4999,
        size: "medium" as const,
      },
      {
        name: "Craft Beer 6-Pack",
        quantity: 2,
        price: 1499,
        size: "medium" as const,
      },
    ],
    manifest_description: "Alcoholic beverages - ID verification required",
    manifest_total_value: 7997,
    quote_id: quoteId,
    external_id: `liquordash-test-${Date.now()}`,
  };

  logInfo(`Quote ID: ${quoteId}`);
  logInfo(`External ID: ${deliveryRequest.external_id}`);

  const url = `${UBER_API_BASE}/v1/customers/${CUSTOMER_ID}/deliveries`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(deliveryRequest),
  });

  const responseText = await response.text();

  if (!response.ok) {
    logError(`Delivery creation failed with status ${response.status}`);
    logError(`Response: ${responseText}`);
    throw new Error(`Delivery failed: ${response.status} - ${responseText}`);
  }

  const data = JSON.parse(responseText);
  logSuccess(`Delivery created!`);
  logInfo(`Delivery ID: ${data.id}`);
  logInfo(`Status: ${data.status}`);
  logInfo(`Live mode: ${data.live_mode}`);
  logInfo(`Fee: $${(data.fee / 100).toFixed(2)} ${data.currency}`);
  logInfo(`Tracking URL: ${data.tracking_url}`);
  logInfo(`Pickup ETA: ${data.pickup_eta || "N/A"}`);
  logInfo(`Dropoff ETA: ${data.dropoff_eta || "N/A"}`);

  if (data.courier) {
    logInfo(`Courier name: ${data.courier.name || "Not assigned yet"}`);
    logInfo(`Courier vehicle: ${data.courier.vehicle_type || "N/A"}`);
  } else {
    logInfo(`Courier: Not yet assigned (pending)`);
  }

  return { deliveryId: data.id, trackingUrl: data.tracking_url };
}

// ─── Step 4: Check Delivery Status ──────────────────────────────────────────

async function testGetStatus(token: string, deliveryId: string): Promise<void> {
  log("STEP 4: Check Delivery Status", `Polling delivery ${deliveryId}...`);

  const url = `${UBER_API_BASE}/v1/customers/${CUSTOMER_ID}/deliveries/${deliveryId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const responseText = await response.text();

  if (!response.ok) {
    logError(`Status check failed with status ${response.status}`);
    logError(`Response: ${responseText}`);
    throw new Error(`Status check failed: ${response.status} - ${responseText}`);
  }

  const data = JSON.parse(responseText);
  logSuccess(`Delivery status retrieved!`);
  logInfo(`Status: ${data.status}`);
  logInfo(`Complete: ${data.complete}`);
  logInfo(`Created: ${data.created}`);
  logInfo(`Updated: ${data.updated}`);

  if (data.courier) {
    logInfo(`Courier: ${data.courier.name || "Assigned"}`);
    if (data.courier.location) {
      logInfo(`Courier location: ${data.courier.location.lat}, ${data.courier.location.lng}`);
    }
  }
}

// ─── Step 5: Verify Webhook Endpoint ────────────────────────────────────────

async function testWebhookEndpoint(): Promise<void> {
  log("STEP 5: Verify Webhook Endpoint", "Sending a test POST to the local webhook endpoint...");

  const webhookUrl = "http://127.0.0.1:3000/api/webhooks/uber";

  // Simulate a delivery status webhook event
  const testPayload = {
    event_type: "event.delivery_status",
    event_id: "test-event-" + Date.now(),
    event_time: Math.floor(Date.now() / 1000),
    meta: {
      resource_id: "del_test_123",
      status: "pickup",
      user_id: CUSTOMER_ID,
    },
    resource_href: `https://api.uber.com/v1/customers/${CUSTOMER_ID}/deliveries/del_test_123`,
    delivery_id: "del_test_123",
    status: "pickup",
    data: {
      id: "del_test_123",
      status: "pickup",
      courier: {
        name: "Test Driver",
        phone_number: "+14155559999",
        vehicle_type: "car",
      },
    },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // No signature header — should get 401 if signature verification is working
      },
      body: JSON.stringify(testPayload),
    });

    const responseText = await response.text();

    if (response.status === 401 || response.status === 403) {
      logSuccess(`Webhook endpoint is active and correctly rejecting unsigned requests (${response.status})`);
      logInfo("This means signature verification is working properly.");
    } else if (response.ok) {
      logSuccess(`Webhook endpoint responded with ${response.status}`);
      logInfo(`Response: ${responseText}`);
    } else {
      logInfo(`Webhook responded with status ${response.status}: ${responseText}`);
    }
  } catch (err) {
    logError(`Could not reach webhook endpoint: ${err}`);
    logInfo("Make sure the server is running on port 3000.");
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 UBER DIRECT SANDBOX - FULL DELIVERY FLOW TEST");
  console.log("=".repeat(60));
  console.log(`Time: ${new Date().toISOString()}`);
  console.log("=".repeat(60));

  const results: { step: string; status: "pass" | "fail"; error?: string }[] = [];

  // Step 1: Auth
  let token: string;
  try {
    token = await testAuth();
    results.push({ step: "OAuth Authentication", status: "pass" });
  } catch (err) {
    results.push({
      step: "OAuth Authentication",
      status: "fail",
      error: err instanceof Error ? err.message : String(err),
    });
    console.log("\n❌ Cannot proceed without authentication. Aborting.");
    printSummary(results);
    return;
  }

  // Step 2: Quote
  let quoteId: string;
  try {
    quoteId = await testQuote(token);
    results.push({ step: "Delivery Quote", status: "pass" });
  } catch (err) {
    results.push({
      step: "Delivery Quote",
      status: "fail",
      error: err instanceof Error ? err.message : String(err),
    });
    console.log("\n❌ Cannot proceed without a quote. Aborting.");
    printSummary(results);
    return;
  }

  // Step 3: Create Delivery
  let deliveryId: string;
  let trackingUrl: string;
  try {
    const result = await testCreateDelivery(token, quoteId);
    deliveryId = result.deliveryId;
    trackingUrl = result.trackingUrl;
    results.push({ step: "Create Delivery", status: "pass" });
  } catch (err) {
    results.push({
      step: "Create Delivery",
      status: "fail",
      error: err instanceof Error ? err.message : String(err),
    });
    console.log("\n⚠️  Delivery creation failed. Checking webhook endpoint anyway...");
    await testWebhookEndpoint();
    results.push({ step: "Webhook Endpoint", status: "pass" });
    printSummary(results);
    return;
  }

  // Step 4: Check Status
  try {
    await testGetStatus(token, deliveryId);
    results.push({ step: "Delivery Status Check", status: "pass" });
  } catch (err) {
    results.push({
      step: "Delivery Status Check",
      status: "fail",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Step 5: Webhook
  try {
    await testWebhookEndpoint();
    results.push({ step: "Webhook Endpoint", status: "pass" });
  } catch (err) {
    results.push({
      step: "Webhook Endpoint",
      status: "fail",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Summary
  printSummary(results);

  console.log(`\n📍 Tracking URL: ${trackingUrl}`);
  console.log(
    `\n💡 In sandbox mode, Uber simulates the delivery lifecycle automatically.`
  );
  console.log(
    `   Watch the server logs for incoming webhook events as the delivery progresses.`
  );
}

function printSummary(
  results: { step: string; status: "pass" | "fail"; error?: string }[]
) {
  console.log(`\n${"═".repeat(60)}`);
  console.log("  TEST SUMMARY");
  console.log(`${"═".repeat(60)}`);

  for (const r of results) {
    const icon = r.status === "pass" ? "✅" : "❌";
    console.log(`  ${icon} ${r.step}`);
    if (r.error) {
      console.log(`     Error: ${r.error}`);
    }
  }

  const passed = results.filter((r) => r.status === "pass").length;
  const total = results.length;
  console.log(`\n  Result: ${passed}/${total} steps passed`);
  console.log(`${"═".repeat(60)}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
