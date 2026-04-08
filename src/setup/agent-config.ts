import { SYSTEM_PROMPT } from "./system-prompt";

/**
 * ElevenLabs Conversational AI agent configuration.
 *
 * Values sourced from the design doc (ADR-001, section 5) and
 * agent-configuration-2.md. Sections marked TODO need external doc content.
 */

const WORKER_BASE_URL = process.env.WORKER_URL;
if (!WORKER_BASE_URL) {
  throw new Error("WORKER_URL environment variable is required (e.g. https://legacy-elevenlabs-agent.xxx.workers.dev)");
}

export const agentConfig = {
  name: "Riley — Legacy Wine & Liquor",

  // ─── LLM Configuration ───────────────────────────────────────────
  conversation_config: {
    agent: {
      prompt: {
        prompt: SYSTEM_PROMPT,
      },
      first_message:
        "Hi there! This is Riley from Legacy Wine and Liquor. How can I help you today?",
      language: "en",
    },

    llm: {
      model: "claude-sonnet-4-6",
      temperature: 0.4,
      max_tokens: 300,
    },

    // ─── TTS Configuration ──────────────────────────────────────────
    tts: {
      model_id: "eleven_flash_v2_5",
      voice_id: "", // TODO: Set from ElevenLabs voice library
      stability: 0.45,
      similarity_boost: 0.8,
      speed: 1.05,
      optimize_streaming_latency: 3,
    },

    // ─── ASR Configuration ──────────────────────────────────────────
    asr: {
      quality: "high",
      // Brand names and store terms for ASR accuracy
      keywords: [
        "Legacy Wine and Liquor",
        "Macallan",
        "Yamazaki",
        "Pappy Van Winkle",
        "Buffalo Trace",
        "Blanton's",
        "Weller",
        "Eagle Rare",
        "Woodford Reserve",
        "Maker's Mark",
        "Hendrick's",
        "Clase Azul",
        "Don Julio",
        "Casamigos",
        "Patron",
        "Grey Goose",
        "Tito's",
        "Veuve Clicquot",
        "Dom Perignon",
        "Moet",
        "Opus One",
        "Caymus",
        "Silver Oak",
        "Duckhorn",
        "Stag's Leap",
        "Sanford",
        "French Avenue",
        "allocated",
        "restock",
        "waitlist",
        "delivery",
        "shipping",
        // TODO: Add remaining ASR keywords from design doc section 5
      ],
    },

    // ─── Turn-taking Configuration ──────────────────────────────────
    turn: {
      turn_timeout: 8,
      mode: "turn",
      silence_end_call_timeout: 30,
    },

    // ─── Webhook Tools ──────────────────────────────────────────────
    tools: [
      {
        type: "webhook",
        name: "check_inventory",
        description:
          "Search the store's product inventory by name, brand, or category. Returns matching products with price, stock status, and availability.",
        webhook: {
          url: `${WORKER_BASE_URL}/tools/check_inventory`,
          method: "POST",
        },
        parameters: {
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
        },
      },
      {
        type: "webhook",
        name: "lookup_customer",
        description:
          "Look up a customer's full context by phone number. Returns their profile, preferences, recent interactions, and pending restock interests.",
        webhook: {
          url: `${WORKER_BASE_URL}/tools/lookup_customer`,
          method: "POST",
        },
        parameters: {
          type: "object",
          properties: {
            phone: {
              type: "string",
              description: "The caller's phone number",
            },
          },
          required: ["phone"],
        },
      },
      {
        type: "webhook",
        name: "log_caller",
        description:
          "Log a call interaction with the customer's details and call outcome. Call this before ending the conversation.",
        webhook: {
          url: `${WORKER_BASE_URL}/tools/log_caller`,
          method: "POST",
        },
        parameters: {
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
            conversation_id: {
              type: "string",
              description: "The ElevenLabs conversation ID",
            },
          },
          required: ["phone"],
        },
      },
      {
        type: "webhook",
        name: "add_to_waitlist",
        description:
          "Add a customer to the restock notification waitlist for an out-of-stock product.",
        webhook: {
          url: `${WORKER_BASE_URL}/tools/add_to_waitlist`,
          method: "POST",
        },
        parameters: {
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
        },
      },
      {
        type: "webhook",
        name: "smart_recommend",
        description:
          "Generate personalized product recommendations based on the customer's taste profile, occasion, and budget.",
        webhook: {
          url: `${WORKER_BASE_URL}/tools/smart_recommend`,
          method: "POST",
        },
        parameters: {
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
        },
      },
      {
        type: "webhook",
        name: "update_preferences",
        description:
          "Save or update customer taste preferences learned during the conversation.",
        webhook: {
          url: `${WORKER_BASE_URL}/tools/update_preferences`,
          method: "POST",
        },
        parameters: {
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
        },
      },
    ],

    // ─── Built-in Tools ─────────────────────────────────────────────
    builtin_tools: [
      { type: "end_call" },
      {
        type: "transfer_to_number",
        phone_number: "+14078787003",
        description: "Transfer the caller to a Legacy Wine & Liquor team member",
      },
    ],

    // ─── Guardrails ─────────────────────────────────────────────────
    safety: {
      guardrails: [
        { type: "focus" },
        { type: "prompt_injection" },
      ],
    },

    // ─── Privacy ────────────────────────────────────────────────────
    privacy: {
      pii_redaction: {
        enabled: true,
        fields: ["contact_number", "email_address"],
      },
    },
  },

  // ─── Platform Settings ──────────────────────────────────────────
  platform_settings: {
    call_limits: {
      max_concurrent: 5,
      max_daily: 200,
    },
  },
};
