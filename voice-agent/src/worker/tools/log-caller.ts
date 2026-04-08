import { insert, upsert } from "../lib/supabase";
import type { Env, ToolResponse } from "../lib/types";

const MAX_N8N_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // ms

/**
 * log_caller — Log a call interaction and upsert the customer record.
 * Also forwards data to n8n webhook for downstream automations.
 *
 * Parameters:
 *   phone: string
 *   caller_name?: string
 *   summary?: string
 *   outcome?: string — purchased, waitlisted, inquiry, no_action, transferred
 *   products_discussed?: string[] — product names mentioned
 *   sentiment?: string — positive, neutral, negative
 *   conversation_id?: string
 */
export async function logCaller(
  params: Record<string, unknown>,
  env: Env
): Promise<ToolResponse> {
  const phone = String(params.phone ?? "").trim();
  if (!phone) {
    return { result: "Call logged (no phone number provided)." };
  }

  const callerName = params.caller_name ? String(params.caller_name) : undefined;
  const summary = params.summary ? String(params.summary) : undefined;
  const outcome = params.outcome ? String(params.outcome) : undefined;
  const sentiment = params.sentiment ? String(params.sentiment) : undefined;
  const conversationId = params.conversation_id ? String(params.conversation_id) : undefined;
  const productsDiscussed = Array.isArray(params.products_discussed)
    ? params.products_discussed.map(String)
    : [];

  // Parse name into first/last
  let firstName: string | undefined;
  let lastName: string | undefined;
  if (callerName) {
    const parts = callerName.split(" ");
    firstName = parts[0];
    lastName = parts.length > 1 ? parts.slice(1).join(" ") : undefined;
  }

  try {
    // Upsert customer record
    const customerData: Record<string, unknown> = { phone };
    if (firstName) customerData.first_name = firstName;
    if (lastName) customerData.last_name = lastName;
    customerData.last_contact_at = new Date().toISOString();

    const customer = await upsert<{ id: number }>(env, "customers", customerData, "phone");
    const customerId = customer?.id;

    // Insert interaction record
    await insert(env, "customer_interactions", {
      customer_id: customerId ?? null,
      channel: "phone_inbound",
      direction: "inbound",
      summary,
      outcome,
      sentiment,
      products_discussed: productsDiscussed,
      conversation_id: conversationId,
      caller_phone: phone,
      caller_name: callerName,
    });

    // Forward to n8n webhook (fire-and-forget with retry)
    if (env.N8N_WEBHOOK_URL) {
      forwardToN8n(env.N8N_WEBHOOK_URL, {
        phone,
        caller_name: callerName,
        customer_id: customerId,
        summary,
        outcome,
        products_discussed: productsDiscussed,
        sentiment,
        conversation_id: conversationId,
        timestamp: new Date().toISOString(),
      }).catch((err) => {
        console.error("n8n forwarding failed after retries:", err);
      });
    }

    return { result: "Call logged successfully." };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("log_caller error:", msg);
    return { result: "Call details noted." };
  }
}

async function forwardToN8n(
  url: string,
  payload: Record<string, unknown>,
  attempt = 0
): Promise<void> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok && attempt < MAX_N8N_RETRIES) {
      await sleep(RETRY_DELAYS[attempt] ?? 4000);
      return forwardToN8n(url, payload, attempt + 1);
    }
  } catch {
    if (attempt < MAX_N8N_RETRIES) {
      await sleep(RETRY_DELAYS[attempt] ?? 4000);
      return forwardToN8n(url, payload, attempt + 1);
    }
    throw new Error(`n8n webhook failed after ${MAX_N8N_RETRIES} retries`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
