import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Env } from "./types";

let client: SupabaseClient | null = null;

export function getSupabase(env: Env): SupabaseClient {
  if (!client) {
    client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }
  return client;
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
  const sb = getSupabase(env);
  let q = sb.from(table).select(options?.select ?? "*");

  if (options?.filters) {
    for (const f of options.filters) {
      q = q.filter(f.column, f.op, f.value);
    }
  }
  if (options?.order) {
    q = q.order(options.order.column, {
      ascending: options.order.ascending ?? true,
    });
  }
  if (options?.limit) {
    q = q.limit(options.limit);
  }

  const { data, error } = await q;
  if (error) throw new Error(`Supabase query error (${table}): ${error.message}`);
  return (data ?? []) as T[];
}

/** Insert a row into a table. */
export async function insert<T = unknown>(
  env: Env,
  table: string,
  data: Record<string, unknown>
): Promise<T | null> {
  const sb = getSupabase(env);
  const { data: result, error } = await sb
    .from(table)
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Supabase insert error (${table}): ${error.message}`);
  return result as T | null;
}

/** Upsert a row (insert or update on conflict). */
export async function upsert<T = unknown>(
  env: Env,
  table: string,
  data: Record<string, unknown>,
  onConflict: string
): Promise<T | null> {
  const sb = getSupabase(env);
  const { data: result, error } = await sb
    .from(table)
    .upsert(data, { onConflict })
    .select()
    .single();

  if (error) throw new Error(`Supabase upsert error (${table}): ${error.message}`);
  return result as T | null;
}

/** Call a Supabase RPC (database function). */
export async function rpc<T = unknown>(
  env: Env,
  functionName: string,
  params?: Record<string, unknown>
): Promise<T> {
  const sb = getSupabase(env);
  const { data, error } = await sb.rpc(functionName, params);
  if (error) throw new Error(`Supabase RPC error (${functionName}): ${error.message}`);
  return data as T;
}

/** Text search via ILIKE against a column. */
export async function textSearch<T = unknown>(
  env: Env,
  table: string,
  column: string,
  searchTerm: string,
  options?: { select?: string; limit?: number }
): Promise<T[]> {
  const sb = getSupabase(env);
  const { data, error } = await sb
    .from(table)
    .select(options?.select ?? "*")
    .ilike(column, `%${searchTerm}%`)
    .limit(options?.limit ?? 20);

  if (error) throw new Error(`Supabase text search error (${table}): ${error.message}`);
  return (data ?? []) as T[];
}
