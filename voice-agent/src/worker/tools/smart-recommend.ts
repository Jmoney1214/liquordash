import { query, rpc } from "../lib/supabase";
import type { Env, ToolResponse, CustomerPreferences, InventoryItem } from "../lib/types";

/**
 * smart_recommend — Generate personalized product recommendations.
 * Uses customer preferences, occasion, and budget to find matching products.
 *
 * Parameters:
 *   customer_id: number
 *   occasion?: string — e.g. "birthday gift", "dinner party", "casual"
 *   budget?: number — max price
 */
export async function smartRecommend(
  params: Record<string, unknown>,
  env: Env
): Promise<ToolResponse> {
  const customerId = params.customer_id ? Number(params.customer_id) : null;
  const occasion = params.occasion ? String(params.occasion) : undefined;
  const budget = params.budget ? Number(params.budget) : undefined;

  // Load customer preferences if we have an ID
  let prefs: CustomerPreferences | null = null;
  if (customerId) {
    try {
      const rows = await query<CustomerPreferences>(env, "customer_preferences", {
        filters: [{ column: "customer_id", op: "eq", value: customerId }],
        limit: 1,
      });
      prefs = rows[0] ?? null;
    } catch {
      // Continue without preferences
    }
  }

  // Build inventory query filters
  const filters: Array<{ column: string; op: string; value: unknown }> = [
    { column: "in_stock", op: "eq", value: true },
  ];

  // Budget filter
  const maxPrice = budget ?? prefs?.price_range_max;
  if (maxPrice) {
    filters.push({ column: "price", op: "lte", value: maxPrice });
  }
  const minPrice = prefs?.price_range_min;
  if (minPrice && !budget) {
    filters.push({ column: "price", op: "gte", value: minPrice });
  }

  // Query inventory
  let items: InventoryItem[];
  try {
    items = await query<InventoryItem>(env, "products", {
      filters,
      order: { column: "price", ascending: false },
      limit: 50,
    });
  } catch {
    return {
      result: "I'm having trouble accessing our inventory right now. Let me help you another way — what kind of spirit or wine are you interested in?",
    };
  }

  if (items.length === 0) {
    return {
      result: budget
        ? `I couldn't find any in-stock items under $${budget}. Would you like me to broaden the search?`
        : "Our inventory search came up empty with those criteria. Can you tell me more about what you're looking for?",
    };
  }

  // Score items based on preference match
  const doNotSuggest = new Set(
    (prefs?.do_not_suggest ?? []).map((s) => s.toLowerCase())
  );
  const preferredSpirits = new Set(
    (prefs?.preferred_spirits ?? []).map((s) => s.toLowerCase())
  );
  const preferredWine = new Set(
    (prefs?.preferred_wine ?? []).map((s) => s.toLowerCase())
  );
  const brandLoyalties = new Set(
    (prefs?.brand_loyalties ?? []).map((s) => s.toLowerCase())
  );

  const scored = items
    .filter((item) => !doNotSuggest.has(item.description.toLowerCase()))
    .map((item) => {
      let score = 0;
      const desc = item.description.toLowerCase();
      const cat = (item.category ?? "").toLowerCase();

      // Boost for preferred categories
      for (const spirit of preferredSpirits) {
        if (desc.includes(spirit) || cat.includes(spirit)) score += 3;
      }
      for (const wine of preferredWine) {
        if (desc.includes(wine) || cat.includes(wine)) score += 3;
      }
      // Boost for brand loyalty
      for (const brand of brandLoyalties) {
        if (desc.includes(brand)) score += 5;
      }
      // Small boost for higher-quantity items (more reliable availability)
      if (item.qoh > 5) score += 1;

      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (scored.length === 0) {
    return {
      result: "I filtered out some items based on your past preferences. Would you like me to search more broadly?",
    };
  }

  // Format recommendations
  const lines = scored.map(({ item, score }, i) => {
    const priceStr = `$${Number(item.price).toFixed(2)}`;
    let reason = "";
    if (score >= 5) reason = " (matches your favorites)";
    else if (score >= 3) reason = " (based on your taste profile)";
    return `${i + 1}. ${item.description} — ${priceStr}${reason}`;
  });

  let intro = "Here are some recommendations";
  if (occasion) intro += ` for ${occasion}`;
  if (budget) intro += ` under $${budget}`;
  intro += ":";

  return { result: `${intro}\n${lines.join("\n")}` };
}
