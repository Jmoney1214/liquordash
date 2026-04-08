import { rpc, textSearch } from "../lib/supabase";
import type { Env, ToolResponse, InventoryItem } from "../lib/types";

/**
 * check_inventory — Search products by name/keyword.
 * Tries the Supabase RPC `search_inventory` first, falls back to ILIKE.
 *
 * Parameters:
 *   product_name: string — search query from caller
 *   customer_id?: number — if provided, allows allocated product info
 */
export async function checkInventory(
  params: Record<string, unknown>,
  env: Env
): Promise<ToolResponse> {
  const rawQuery = String(params.product_name ?? "").trim();
  if (!rawQuery) {
    return { result: "I need a product name or description to search for. What are you looking for?" };
  }

  const customerId = params.customer_id ? Number(params.customer_id) : null;

  // Sanitize: strip special chars, normalize whitespace
  const sanitized = rawQuery
    .replace(/[^\w\s'-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  let items: InventoryItem[] = [];

  // Try RPC search first (uses existing search_inventory function in Supabase)
  try {
    items = await rpc<InventoryItem[]>(env, "search_inventory", {
      search_term: sanitized,
    });
  } catch {
    // RPC not available or failed — fall back to ILIKE search
    items = [];
  }

  // Fallback: split into keywords and search via ILIKE on description
  if (items.length === 0) {
    const keywords = sanitized.split(" ").filter((k) => k.length > 1);
    for (const keyword of keywords) {
      const results = await textSearch<InventoryItem>(
        env,
        "products",
        "description",
        keyword,
        { limit: 20 }
      );
      items.push(...results);
    }

    // Deduplicate by id
    const seen = new Set<number>();
    items = items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  if (items.length === 0) {
    return {
      result: `I wasn't able to find anything matching "${rawQuery}" in our inventory. Could you try a different name or description?`,
    };
  }

  // Limit results for voice readability
  const topItems = items.slice(0, 5);
  const lines = topItems.map((item) => {
    const stockStatus = item.in_stock
      ? `In stock (${item.qoh} available)`
      : "Currently out of stock";
    const priceStr = `$${Number(item.price).toFixed(2)}`;

    // Allocated items: only share details with recognized customers
    if (item.is_allocated && !customerId) {
      return `${item.description} — ${priceStr} — This is an allocated product. Ask to speak with a team member for availability.`;
    }

    return `${item.description} — ${priceStr} — ${stockStatus}`;
  });

  let response = lines.join("\n");
  if (items.length > 5) {
    response += `\n\n(Showing top 5 of ${items.length} results)`;
  }

  return { result: response };
}
