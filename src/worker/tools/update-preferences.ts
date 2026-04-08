import { upsert } from "../lib/supabase";
import type { Env, ToolResponse } from "../lib/types";

const ALLOWED_FIELDS = new Set([
  "preferred_spirits",
  "preferred_wine",
  "flavor_notes",
  "price_range_min",
  "price_range_max",
  "brand_loyalties",
  "behavioral_notes",
  "life_events",
  "last_recommendations",
  "do_not_suggest",
  "delivery_preference",
  "notes",
]);

/**
 * update_preferences — Save or update customer taste/event info from conversation.
 *
 * Parameters:
 *   customer_id: number
 *   preferences: object — partial update, any subset of CustomerPreferences fields
 */
export async function updatePreferences(
  params: Record<string, unknown>,
  env: Env
): Promise<ToolResponse> {
  const customerId = params.customer_id ? Number(params.customer_id) : null;
  if (!customerId) {
    return { result: "Preferences noted for this session." };
  }

  const rawPrefs =
    typeof params.preferences === "object" && params.preferences !== null
      ? (params.preferences as Record<string, unknown>)
      : {};

  // Filter to allowed fields only
  const updateData: Record<string, unknown> = { customer_id: customerId };
  let fieldCount = 0;
  for (const [key, value] of Object.entries(rawPrefs)) {
    if (ALLOWED_FIELDS.has(key) && value !== undefined) {
      updateData[key] = value;
      fieldCount++;
    }
  }

  if (fieldCount === 0) {
    return { result: "No preference updates to save." };
  }

  updateData.updated_at = new Date().toISOString();

  try {
    await upsert(env, "customer_preferences", updateData, "customer_id");
    return { result: `Updated ${fieldCount} preference${fieldCount > 1 ? "s" : ""} for this customer.` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("update_preferences error:", msg);
    return { result: "Preferences noted for this session." };
  }
}
