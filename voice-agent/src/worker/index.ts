import { Hono } from "hono";
import type { Env, ElevenLabsToolPayload, EndOfCallPayload, ToolHandler } from "./lib/types";
import { insert, upsert } from "./lib/supabase";

import { checkInventory } from "./tools/check-inventory";
import { lookupCustomer } from "./tools/lookup-customer";
import { logCaller } from "./tools/log-caller";
import { addToWaitlist } from "./tools/add-to-waitlist";
import { smartRecommend } from "./tools/smart-recommend";
import { updatePreferences } from "./tools/update-preferences";

const app = new Hono<{ Bindings: Env }>();

// ═══════════════════════════════════════════════════════════════════
// Tool handler registry
// ═══════════════════════════════════════════════════════════════════

const tools: Record<string, ToolHandler> = {
  check_inventory: checkInventory,
  lookup_customer: lookupCustomer,
  log_caller: logCaller,
  add_to_waitlist: addToWaitlist,
  smart_recommend: smartRecommend,
  update_preferences: updatePreferences,
};

// ═══════════════════════════════════════════════════════════════════
// Auth middleware — verify webhook secret
// ═══════════════════════════════════════════════════════════════════

app.use("/tools/*", async (c, next) => {
  const secret = c.env.WEBHOOK_SECRET;
  if (secret) {
    const provided = c.req.header("x-webhook-secret");
    if (provided !== secret) {
      return c.json({ error: "Unauthorized" }, 401);
    }
  }
  await next();
});

app.use("/end-of-call", async (c, next) => {
  const secret = c.env.WEBHOOK_SECRET;
  if (secret) {
    const provided = c.req.header("x-webhook-secret");
    if (provided !== secret) {
      return c.json({ error: "Unauthorized" }, 401);
    }
  }
  await next();
});

// ═══════════════════════════════════════════════════════════════════
// POST /tools/:toolName — ElevenLabs webhook tool dispatch
// ═══════════════════════════════════════════════════════════════════

app.post("/tools/:toolName", async (c) => {
  const toolName = c.req.param("toolName");

  let payload: ElevenLabsToolPayload;
  try {
    payload = await c.req.json<ElevenLabsToolPayload>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  // Use tool_name from payload if present, otherwise use URL param
  const resolvedName = payload.tool_name ?? toolName;
  const handler = tools[resolvedName];

  if (!handler) {
    console.error(`Unknown tool: ${resolvedName}`);
    return c.json(
      { result: `I'm sorry, I can't perform that action right now.` },
      200
    );
  }

  try {
    const result = await handler(payload.parameters ?? {}, c.env);
    return c.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Tool ${resolvedName} error:`, msg);
    return c.json(
      { result: "I encountered an issue processing that request. Let me try to help another way." },
      200
    );
  }
});

// ═══════════════════════════════════════════════════════════════════
// POST /end-of-call — ElevenLabs end-of-call webhook
// ═══════════════════════════════════════════════════════════════════

app.post("/end-of-call", async (c) => {
  let payload: EndOfCallPayload;
  try {
    payload = await c.req.json<EndOfCallPayload>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  try {
    // Log the completed call as an interaction
    await insert(c.env, "customer_interactions", {
      channel: "phone_inbound",
      direction: "inbound",
      conversation_id: payload.conversation_id,
      summary: payload.summary,
      transcript: payload.transcript,
      recording_url: payload.recording_url,
      duration_seconds: payload.duration_seconds,
    });

    // Forward to n8n for downstream automations
    if (c.env.N8N_WEBHOOK_URL) {
      // Fire-and-forget: don't block the response
      c.executionCtx.waitUntil(
        fetch(c.env.N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "call_complete",
            conversation_id: payload.conversation_id,
            summary: payload.summary,
            duration_seconds: payload.duration_seconds,
            transcript: payload.transcript,
            recording_url: payload.recording_url,
            timestamp: new Date().toISOString(),
          }),
        }).catch((err) => {
          console.error("n8n end-of-call forwarding failed:", err);
        })
      );
    }

    return c.json({ status: "ok" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("end-of-call error:", msg);
    return c.json({ status: "ok" });
  }
});

// ═══════════════════════════════════════════════════════════════════
// GET /health — Health check
// ═══════════════════════════════════════════════════════════════════

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "legacy-elevenlabs-agent",
    timestamp: new Date().toISOString(),
  });
});

export default app;
