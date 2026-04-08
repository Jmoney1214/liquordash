/**
 * Test script for the ElevenLabs voice agent webhook tools.
 * Sends test payloads to each tool endpoint and verifies responses.
 *
 * Usage:
 *   WORKER_URL=http://localhost:8787 npx tsx scripts/test-tools.ts
 *   WORKER_URL=https://legacy-elevenlabs-agent.YOUR.workers.dev npx tsx scripts/test-tools.ts
 */

const WORKER_URL = process.env.WORKER_URL ?? "http://localhost:8787";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "";

interface TestCase {
  name: string;
  toolName: string;
  parameters: Record<string, unknown>;
}

const testCases: TestCase[] = [
  {
    name: "check_inventory — search for bourbon",
    toolName: "check_inventory",
    parameters: { product_name: "bourbon" },
  },
  {
    name: "check_inventory — search for specific brand",
    toolName: "check_inventory",
    parameters: { product_name: "Macallan 18" },
  },
  {
    name: "check_inventory — empty query",
    toolName: "check_inventory",
    parameters: { product_name: "" },
  },
  {
    name: "lookup_customer — known phone",
    toolName: "lookup_customer",
    parameters: { phone: "+14075551234" },
  },
  {
    name: "lookup_customer — unknown phone",
    toolName: "lookup_customer",
    parameters: { phone: "+10000000000" },
  },
  {
    name: "log_caller — basic call log",
    toolName: "log_caller",
    parameters: {
      phone: "+14075559999",
      caller_name: "Test Caller",
      summary: "Test call — checking tool integration",
      outcome: "inquiry",
      sentiment: "positive",
    },
  },
  {
    name: "add_to_waitlist — restock request",
    toolName: "add_to_waitlist",
    parameters: {
      phone: "+14075559999",
      product_name: "Pappy Van Winkle 15 Year",
      caller_name: "Test Caller",
    },
  },
  {
    name: "smart_recommend — with budget",
    toolName: "smart_recommend",
    parameters: { budget: 50, occasion: "birthday gift" },
  },
  {
    name: "update_preferences — save spirits preference",
    toolName: "update_preferences",
    parameters: {
      customer_id: 1,
      preferences: {
        preferred_spirits: ["bourbon", "rye"],
        flavor_notes: ["smoky", "caramel"],
      },
    },
  },
];

async function runTest(tc: TestCase): Promise<{ pass: boolean; detail: string }> {
  const url = `${WORKER_URL}/tools/${tc.toolName}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (WEBHOOK_SECRET) {
    headers["x-webhook-secret"] = WEBHOOK_SECRET;
  }

  const body = JSON.stringify({
    tool_call_id: `test_${Date.now()}`,
    tool_name: tc.toolName,
    parameters: tc.parameters,
    conversation_id: `test_conv_${Date.now()}`,
  });

  try {
    const res = await fetch(url, { method: "POST", headers, body });
    const json = (await res.json()) as { result?: string; error?: string };

    if (res.status !== 200) {
      return { pass: false, detail: `HTTP ${res.status}: ${JSON.stringify(json)}` };
    }
    if (typeof json.result !== "string") {
      return { pass: false, detail: `Missing 'result' field: ${JSON.stringify(json)}` };
    }

    return { pass: true, detail: json.result.slice(0, 120) };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { pass: false, detail: `Request failed: ${msg}` };
  }
}

async function main() {
  console.log(`Testing voice agent tools at: ${WORKER_URL}\n`);

  // Health check first
  try {
    const healthRes = await fetch(`${WORKER_URL}/health`);
    const health = await healthRes.json();
    console.log(`Health check: ${JSON.stringify(health)}\n`);
  } catch {
    console.error(`Cannot reach ${WORKER_URL}/health — is the worker running?\n`);
  }

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    const { pass, detail } = await runTest(tc);
    const icon = pass ? "PASS" : "FAIL";
    console.log(`[${icon}] ${tc.name}`);
    console.log(`       ${detail}\n`);
    if (pass) passed++;
    else failed++;
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
