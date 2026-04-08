-- ═══════════════════════════════════════════════════════════════════
-- Migration 003: get_customer_context RPC Function
-- Single call for the voice agent to retrieve full customer context:
-- customer record, preferences, recent interactions, pending restock.
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_customer_context(caller_phone TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    cust RECORD;
    prefs JSONB;
    interactions JSONB;
    restock JSONB;
BEGIN
    -- Look up customer by phone
    SELECT * INTO cust
    FROM customers
    WHERE phone = caller_phone
    LIMIT 1;

    -- If no customer found, return null context
    IF cust IS NULL THEN
        RETURN jsonb_build_object(
            'customer', NULL,
            'preferences', NULL,
            'recent_interactions', '[]'::jsonb,
            'pending_restock', '[]'::jsonb
        );
    END IF;

    -- Get preferences
    SELECT to_jsonb(cp.*) INTO prefs
    FROM customer_preferences cp
    WHERE cp.customer_id = cust.id
    LIMIT 1;

    -- Get last 5 interactions
    SELECT COALESCE(jsonb_agg(to_jsonb(ci.*) ORDER BY ci.created_at DESC), '[]'::jsonb)
    INTO interactions
    FROM (
        SELECT *
        FROM customer_interactions
        WHERE customer_id = cust.id
        ORDER BY created_at DESC
        LIMIT 5
    ) ci;

    -- Get pending restock interests
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'product_name', ri.product_name,
            'requested_at', ri.created_at
        )
        ORDER BY ri.created_at DESC
    ), '[]'::jsonb)
    INTO restock
    FROM restock_interest ri
    WHERE ri.customer_id = cust.id
      AND ri.fulfilled = false;

    -- Build result
    result := jsonb_build_object(
        'customer', to_jsonb(cust),
        'preferences', COALESCE(prefs, 'null'::jsonb),
        'recent_interactions', interactions,
        'pending_restock', restock
    );

    RETURN result;
END;
$$;
