-- ═══════════════════════════════════════════════════════════════════
-- Migration 001: Customer Preferences Table
-- Stores taste profiles, behavioral patterns, and agent memory
-- for personalized voice agent interactions.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS customer_preferences (
    id              BIGSERIAL PRIMARY KEY,
    customer_id     BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    -- Taste profile
    preferred_spirits   JSONB DEFAULT '[]'::jsonb,       -- e.g. ["bourbon", "scotch", "mezcal"]
    preferred_wine      JSONB DEFAULT '[]'::jsonb,       -- e.g. ["cabernet", "pinot noir"]
    flavor_notes        JSONB DEFAULT '[]'::jsonb,       -- e.g. ["smoky", "sweet", "oaky"]

    -- Budget
    price_range_min     NUMERIC(10,2),
    price_range_max     NUMERIC(10,2),

    -- Brand affinities
    brand_loyalties     JSONB DEFAULT '[]'::jsonb,       -- e.g. ["Buffalo Trace", "Moet"]

    -- Behavioral patterns
    behavioral_notes    TEXT,                              -- free-form agent observations
    life_events         JSONB DEFAULT '[]'::jsonb,       -- e.g. [{"type":"birthday","date":"2026-05-15","note":"wife's birthday"}]

    -- Agent memory
    last_recommendations JSONB DEFAULT '[]'::jsonb,      -- product names from last call
    do_not_suggest       JSONB DEFAULT '[]'::jsonb,      -- products customer explicitly dislikes
    notes                TEXT,                             -- persistent agent notes

    -- Delivery
    delivery_preference  VARCHAR(50),                     -- "pickup", "delivery", "shipping"

    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT unique_customer_prefs UNIQUE (customer_id)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_customer_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customer_preferences_updated
    BEFORE UPDATE ON customer_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_preferences_timestamp();

-- Index for quick lookup by customer
CREATE INDEX IF NOT EXISTS idx_customer_preferences_customer
    ON customer_preferences(customer_id);
