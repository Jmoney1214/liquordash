import { rpc } from "../lib/supabase";
import type { Env, ToolResponse, CustomerContext } from "../lib/types";

/**
 * lookup_customer — Get full customer context by phone number.
 * Calls the get_customer_context RPC for a single-query context load.
 *
 * Parameters:
 *   phone: string — caller's phone number
 */
export async function lookupCustomer(
  params: Record<string, unknown>,
  env: Env
): Promise<ToolResponse> {
  const phone = String(params.phone ?? "").trim();
  if (!phone) {
    return { result: "No phone number provided. Unable to look up customer." };
  }

  // Normalize phone: strip non-digits, ensure +1 prefix for US numbers
  const digits = phone.replace(/\D/g, "");
  const normalized =
    digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith("1") ? `+${digits}` : phone;

  try {
    const context = await rpc<CustomerContext>(env, "get_customer_context", {
      caller_phone: normalized,
    });

    if (!context.customer) {
      return {
        result: `New caller (${normalized}). No existing customer record found. This is a first-time caller — be welcoming and gather their name if appropriate.`,
      };
    }

    const c = context.customer;
    const name = `${c.first_name} ${c.last_name}`.trim();
    const lines: string[] = [
      `Customer: ${name}`,
      `Segment: ${c.rfm_segment ?? "unclassified"}`,
      `Total orders: ${c.total_orders}, Lifetime spend: $${Number(c.total_spent).toFixed(2)}`,
    ];

    // Preferences summary
    if (context.preferences) {
      const p = context.preferences;
      const prefs: string[] = [];
      if (p.preferred_spirits.length > 0) prefs.push(`Spirits: ${p.preferred_spirits.join(", ")}`);
      if (p.preferred_wine.length > 0) prefs.push(`Wine: ${p.preferred_wine.join(", ")}`);
      if (p.flavor_notes.length > 0) prefs.push(`Flavors: ${p.flavor_notes.join(", ")}`);
      if (p.brand_loyalties.length > 0) prefs.push(`Brands: ${p.brand_loyalties.join(", ")}`);
      if (p.price_range_min || p.price_range_max) {
        prefs.push(`Budget: $${p.price_range_min ?? "?"} – $${p.price_range_max ?? "?"}`);
      }
      if (p.delivery_preference) prefs.push(`Prefers: ${p.delivery_preference}`);
      if (p.notes) prefs.push(`Notes: ${p.notes}`);
      if (prefs.length > 0) {
        lines.push(`Preferences: ${prefs.join(" | ")}`);
      }
      if (p.do_not_suggest.length > 0) {
        lines.push(`Do NOT suggest: ${p.do_not_suggest.join(", ")}`);
      }
    }

    // Recent interactions
    if (context.recent_interactions.length > 0) {
      const recent = context.recent_interactions.slice(0, 3);
      const interactionLines = recent.map((i) => {
        const date = new Date(i.created_at).toLocaleDateString();
        return `  ${date} (${i.channel}): ${i.summary ?? i.outcome ?? "no summary"}`;
      });
      lines.push(`Recent interactions:\n${interactionLines.join("\n")}`);
    }

    // Pending restock
    if (context.pending_restock.length > 0) {
      const restockItems = context.pending_restock.map((r) => r.product_name);
      lines.push(`Waiting for restock: ${restockItems.join(", ")}`);
    }

    return { result: lines.join("\n") };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("lookup_customer error:", msg);
    return {
      result: `Unable to retrieve customer information at this time. Treat as a new caller and provide great service.`,
    };
  }
}
