-- ═══════════════════════════════════════════════════════════════════
-- Migration 004: Add Outbound Consent Columns to Customers
-- Tracks whether a customer has opted in to outbound calls/messages.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS outbound_consent BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS consent_collected_at TIMESTAMPTZ;
