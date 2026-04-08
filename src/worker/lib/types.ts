// ═══════════════════════════════════════════════════════════════════
// Cloudflare Worker Environment Bindings
// ═══════════════════════════════════════════════════════════════════

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  ELEVENLABS_API_KEY: string;
  WEBHOOK_SECRET: string;
  N8N_WEBHOOK_URL: string;
}

// ═══════════════════════════════════════════════════════════════════
// ElevenLabs Webhook Payloads
// ═══════════════════════════════════════════════════════════════════

export interface ElevenLabsToolPayload {
  tool_call_id: string;
  tool_name: string;
  parameters: Record<string, unknown>;
  conversation_id: string;
}

export interface ToolResponse {
  result: string;
}

export interface EndOfCallPayload {
  conversation_id: string;
  transcript?: string;
  summary?: string;
  duration_seconds?: number;
  recording_url?: string;
  metadata?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════
// Domain Types — Supabase Table Shapes
// ═══════════════════════════════════════════════════════════════════

export interface InventoryItem {
  id: number;
  description: string;
  price: number;
  qoh: number;
  in_stock: boolean;
  category: string;
  subcategory?: string;
  size?: string;
  is_allocated: boolean;
}

export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  rfm_segment?: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
  outbound_consent: boolean;
  consent_collected_at?: string;
}

export interface CustomerPreferences {
  id: number;
  customer_id: number;
  preferred_spirits: string[];
  preferred_wine: string[];
  flavor_notes: string[];
  price_range_min?: number;
  price_range_max?: number;
  brand_loyalties: string[];
  behavioral_notes?: string;
  life_events?: Record<string, unknown>[];
  last_recommendations?: string[];
  do_not_suggest: string[];
  delivery_preference?: string;
  notes?: string;
  updated_at: string;
}

export interface CustomerInteraction {
  id: number;
  customer_id: number;
  channel: "phone_inbound" | "phone_outbound" | "sms" | "email" | "in_store";
  direction: "inbound" | "outbound";
  summary?: string;
  products_discussed?: string[];
  outcome?: string;
  sentiment?: "positive" | "neutral" | "negative";
  duration_seconds?: number;
  conversation_id?: string;
  transcript?: string;
  recording_url?: string;
  created_at: string;
}

export interface CustomerContext {
  customer: Customer | null;
  preferences: CustomerPreferences | null;
  recent_interactions: CustomerInteraction[];
  pending_restock: Array<{
    product_name: string;
    requested_at: string;
  }>;
}

export interface RestockInterest {
  customer_id: number;
  product_name: string;
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════
// Tool Handler Signature
// ═══════════════════════════════════════════════════════════════════

export type ToolHandler = (
  params: Record<string, unknown>,
  env: Env
) => Promise<ToolResponse>;
