import { SYSTEM_PROMPT } from "./system-prompt";

/**
 * ElevenLabs Conversational AI agent configuration.
 * Structure matches POST /v1/convai/agents/create API schema.
 */

const WORKER_BASE_URL = process.env.WORKER_URL;
if (!WORKER_BASE_URL) {
  throw new Error("WORKER_URL environment variable is required (e.g. https://legacy-elevenlabs-agent.xxx.workers.dev)");
}

function webhookTool(
  name: string,
  description: string,
  path: string,
  schema: Record<string, unknown>
) {
  return {
    type: "webhook" as const,
    name,
    description,
    webhook: {
      url: `${WORKER_BASE_URL}/tools/${path}`,
      method: "POST",
      api_schema: schema,
    },
  };
}

export const agentConfig = {
  name: "Riley — Legacy Wine & Liquor",

  conversation_config: {
    agent: {
      prompt: {
        prompt: SYSTEM_PROMPT,
        llm: "gpt-4o",
        temperature: 0.4,
        max_tokens: 300,
        tools: [
          webhookTool(
            "check_inventory",
            "Search the store's product inventory by name, brand, or category. Returns matching products with price, stock status, and availability.",
            "check_inventory",
            {
              type: "object",
              properties: {
                product_name: {
                  type: "string",
                  description: "The product name, brand, or category to search for",
                },
                customer_id: {
                  type: "number",
                  description: "The customer's ID (if known) for allocated product access",
                },
              },
              required: ["product_name"],
            }
          ),
          webhookTool(
            "lookup_customer",
            "Look up a customer's full context by phone number. Returns their profile, preferences, recent interactions, and pending restock interests.",
            "lookup_customer",
            {
              type: "object",
              properties: {
                phone: {
                  type: "string",
                  description: "The caller's phone number",
                },
              },
              required: ["phone"],
            }
          ),
          webhookTool(
            "log_caller",
            "Log a call interaction with the customer's details and call outcome. Call this before ending the conversation.",
            "log_caller",
            {
              type: "object",
              properties: {
                phone: {
                  type: "string",
                  description: "Caller's phone number",
                },
                caller_name: {
                  type: "string",
                  description: "Caller's name if known",
                },
                summary: {
                  type: "string",
                  description: "Brief summary of the call",
                },
                outcome: {
                  type: "string",
                  enum: ["purchased", "waitlisted", "inquiry", "no_action", "transferred"],
                  description: "The outcome of the call",
                },
                products_discussed: {
                  type: "array",
                  items: { type: "string" },
                  description: "Product names discussed during the call",
                },
                sentiment: {
                  type: "string",
                  enum: ["positive", "neutral", "negative"],
                  description: "Caller's overall sentiment",
                },
              },
              required: ["phone"],
            }
          ),
          webhookTool(
            "add_to_waitlist",
            "Add a customer to the restock notification waitlist for an out-of-stock product.",
            "add_to_waitlist",
            {
              type: "object",
              properties: {
                customer_id: {
                  type: "number",
                  description: "Customer ID if known",
                },
                phone: {
                  type: "string",
                  description: "Caller's phone number for notification",
                },
                product_name: {
                  type: "string",
                  description: "The product name to be notified about",
                },
                caller_name: {
                  type: "string",
                  description: "Caller's name",
                },
                notes: {
                  type: "string",
                  description: "Any additional notes about the request",
                },
              },
              required: ["product_name", "phone"],
            }
          ),
          webhookTool(
            "smart_recommend",
            "Generate personalized product recommendations based on the customer's taste profile, occasion, and budget.",
            "smart_recommend",
            {
              type: "object",
              properties: {
                customer_id: {
                  type: "number",
                  description: "Customer ID for personalized recommendations",
                },
                occasion: {
                  type: "string",
                  description: "The occasion (e.g., birthday gift, dinner party, casual)",
                },
                budget: {
                  type: "number",
                  description: "Maximum budget in dollars",
                },
              },
              required: [],
            }
          ),
          webhookTool(
            "update_preferences",
            "Save or update customer taste preferences learned during the conversation.",
            "update_preferences",
            {
              type: "object",
              properties: {
                customer_id: {
                  type: "number",
                  description: "Customer ID",
                },
                preferences: {
                  type: "object",
                  description:
                    "Partial preference update. Fields: preferred_spirits, preferred_wine, flavor_notes, brand_loyalties, delivery_preference, notes (all optional)",
                },
              },
              required: ["customer_id", "preferences"],
            }
          ),
        ],
      },
      first_message:
        "Hi there! This is Riley from Legacy Wine and Liquor. How can I help you today?",
      language: "en",
    },

    tts: {
      model_id: "eleven_turbo_v2_5",
      voice_id: "21m00Tcm4TlvDq8ikWAM",
      stability: 0.45,
      similarity_boost: 0.8,
      speed: 1.05,
      optimize_streaming_latency: 3,
    },

    turn: {
      mode: "turn",
      turn_timeout: 8,
    },
  },

  platform_settings: {
    call_limits: {
      max_concurrent: 5,
      max_daily: 200,
    },
  },
};
