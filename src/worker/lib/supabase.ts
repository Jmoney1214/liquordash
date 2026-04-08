import type { Env } from "./types";

/**
 * Lightweight Supabase PostgREST client for Cloudflare Workers.
 * Uses raw fetch instead of @supabase/supabase-js to avoid
 * Node.js runtime dependencies in the Worker.
 */

function headers(env: Env) {
  return {
    apikey: env.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function restUrl(env: Env, path: string): string {
  return `${env.SUPABASE_URL}/rest/v1/${path}`;
}

/** Query a table with optional PostgREST filters. */
export async function query<T = unknown>(
  env: Env,
  table: string,
  options?: {
    select?: string;
    filters?: Array<{ column: string; op: string; value: unknown }>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
  }
): Promise<T[]> {
  const params = new URLSearchParams();
  params.set("select", options?.select ?? "*");

  if (options?.filters) {
    for (const f of options.filters) {
      params.append(f.column, `${f.op}.${f.value}`);
    }
  }
  if (options?.order) {
    const dir = options.order.ascending === false ? "desc" : "asc";
    params.set("order", `${options.order.column}.${dir}`);
  }
  if (options?.limit) {
    params.set("limit", String(options.limit));
  }

  const res = await fetch(`${restUrl(env, table)}?${params}`, {
    headers: headers(env),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase query error (${table}): ${err}`);
  }
  return (await res.json()) as T[];
}

/** Insert a row into a table. */
export async function insert<T = unknown>(
  env: Env,
  table: string,
  data: Record<string, unknown>
): Promise<T | null> {
  const res = await fetch(restUrl(env, table), {
    method: "POST",
    headers: headers(env),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase insert error (${table}): ${err}`);
  }
  const rows = (await res.json()) as T[];
  return rows[0] ?? null;
}

/** Upsert a row (insert or update on conflict). */
export async function upsert<T = unknown>(
  env: Env,
  table: string,
  data: Record<string, unknown>,
  onConflict: string
): Promise<T | null> {
  const res = await fetch(
    `${restUrl(env, table)}?on_conflict=${onConflict}`,
    {
      method: "POST",
      headers: {
        ...headers(env),
        Prefer: "return=representation,resolution=merge-duplicates",
      },
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upsert error (${table}): ${err}`);
  }
  const rows = (await res.json()) as T[];
  return rows[0] ?? null;
}

/** Call a Supabase RPC (database function). */
export async function rpc<T = unknown>(
  env: Env,
  functionName: string,
  params?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(restUrl(env, `rpc/${functionName}`), {
    method: "POST",
    headers: headers(env),
    body: JSON.stringify(params ?? {}),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase RPC error (${functionName}): ${err}`);
  }
  return (await res.json()) as T;
}

/** Text search via ILIKE against a column. */
export async function textSearch<T = unknown>(
  env: Env,
  table: string,
  column: string,
  searchTerm: string,
  options?: { select?: string; limit?: number }
): Promise<T[]> {
  const params = new URLSearchParams();
  params.set("select", options?.select ?? "*");
  params.set(column, `ilike.*${searchTerm}*`);
  params.set("limit", String(options?.limit ?? 20));

  const res = await fetch(`${restUrl(env, table)}?${params}`, {
    headers: headers(env),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase text search error (${table}): ${err}`);
  }
  return (await res.json()) as T[];
}
