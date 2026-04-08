-- ═══════════════════════════════════════════════════════════════════
-- Migration 002: Customer Interactions Table
-- Tracks every touchpoint across all channels (phone, SMS, email,
-- in-store) for building customer intelligence.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS customer_interactions (
    id                  BIGSERIAL PRIMARY KEY,
    customer_id         BIGINT REFERENCES customers(id) ON DELETE SET NULL,

    -- Channel info
    channel             VARCHAR(30) NOT NULL,              -- phone_inbound, phone_outbound, sms, email, in_store
    direction           VARCHAR(10) NOT NULL DEFAULT 'inbound', -- inbound, outbound

    -- Interaction content
    summary             TEXT,                               -- brief summary of the interaction
    products_discussed  JSONB DEFAULT '[]'::jsonb,         -- product names mentioned
    outcome             VARCHAR(50),                        -- purchased, waitlisted, inquiry, no_action, transferred
    sentiment           VARCHAR(15),                        -- positive, neutral, negative

    -- Call-specific fields
    duration_seconds    INTEGER,
    conversation_id     VARCHAR(100),                       -- ElevenLabs conversation_id
    transcript          TEXT,
    recording_url       TEXT,

    -- Caller info (for unmatched callers)
    caller_phone        VARCHAR(20),
    caller_name         VARCHAR(200),

    created_at          TIMESTAMPTZ DEFAULT now()
);

-- Primary lookup: customer's recent interactions
CREATE INDEX IF NOT EXISTS idx_interactions_customer_time
    ON customer_interactions(customer_id, created_at DESC);

-- Analytics: interactions by channel over time
CREATE INDEX IF NOT EXISTS idx_interactions_channel_time
    ON customer_interactions(channel, created_at DESC);

-- Lookup by ElevenLabs conversation ID
CREATE INDEX IF NOT EXISTS idx_interactions_conversation
    ON customer_interactions(conversation_id)
    WHERE conversation_id IS NOT NULL;
