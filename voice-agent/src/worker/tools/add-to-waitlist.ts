import { insert } from "../lib/supabase";
import type { Env, ToolResponse } from "../lib/types";

/**
 * add_to_waitlist — Add a customer to the restock interest list.
 * Also logs the interaction with outcome='waitlisted'.
 *
 * Parameters:
 *   customer_id?: number
 *   phone: string
 *   product_name: string — the product they want notified about
 *   caller_name?: string
 *   notes?: string
 */
export async function addToWaitlist(
  params: Record<string, unknown>,
  env: Env
): Promise<ToolResponse> {
  const productName = String(params.product_name ?? "").trim();
  if (!productName) {
    return { result: "I need to know which product you'd like to be notified about." };
  }

  const phone = String(params.phone ?? "").trim();
  const customerId = params.customer_id ? Number(params.customer_id) : null;
  const callerName = params.caller_name ? String(params.caller_name) : undefined;
  const notes = params.notes ? String(params.notes) : undefined;

  try {
    // Insert into restock_interest
    await insert(env, "restock_interest", {
      customer_id: customerId,
      product_name: productName,
      phone,
      caller_name: callerName,
      notes,
      fulfilled: false,
    });

    // Also log as a customer interaction
    if (customerId || phone) {
      await insert(env, "customer_interactions", {
        customer_id: customerId,
        channel: "phone_inbound",
        direction: "inbound",
        summary: `Added to waitlist for: ${productName}`,
        products_discussed: [productName],
        outcome: "waitlisted",
        caller_phone: phone,
        caller_name: callerName,
      });
    }

    return {
      result: `You've been added to our waitlist for ${productName}. We'll reach out as soon as it's back in stock!`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("add_to_waitlist error:", msg);
    return {
      result: `I've noted your interest in ${productName}. Our team will follow up when it's available.`,
    };
  }
}
