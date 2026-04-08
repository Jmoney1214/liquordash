#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════
# launch.sh — Full setup & deploy for the ElevenLabs Voice Agent
#
# Usage:
#   ./scripts/launch.sh
#
# Prerequisites:
#   - Node.js 18+
#   - npm installed
#   - Cloudflare account (wrangler will prompt login if needed)
#
# Environment variables (set before running, or you'll be prompted):
#   ELEVENLABS_API_KEY  — your ElevenLabs API key (sk_...)
#   SUPABASE_URL        — https://rffvoreqcpkqqxwprosg.supabase.co
#   SUPABASE_ANON_KEY   — project anon/public JWT key
#   SUPABASE_DB_URL     — postgres connection string (for migrations)
# ═══════════════════════════════════════════════════════════════════

cd "$(dirname "$0")/.."
ROOT_DIR=$(pwd)

echo "═══════════════════════════════════════════════════════════════"
echo "  Legacy Wine & Liquor — ElevenLabs Voice Agent Launcher"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ─── Collect credentials ─────────────────────────────────────────

if [ -z "${ELEVENLABS_API_KEY:-}" ]; then
  read -rp "ElevenLabs API Key (sk_...): " ELEVENLABS_API_KEY
fi

if [ -z "${SUPABASE_URL:-}" ]; then
  SUPABASE_URL="https://rffvoreqcpkqqxwprosg.supabase.co"
  echo "Using Supabase URL: $SUPABASE_URL"
fi

if [ -z "${SUPABASE_ANON_KEY:-}" ]; then
  read -rp "Supabase anon key (eyJ...): " SUPABASE_ANON_KEY
fi

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo ""
  echo "For migrations, I need the Postgres connection string."
  echo "Find it at: https://supabase.com/dashboard/project/rffvoreqcpkqqxwprosg/settings/database"
  echo "Look for 'Connection string' → URI format"
  read -rp "Supabase DB URL (postgres://...): " SUPABASE_DB_URL
fi

# Generate a webhook secret if not set
WEBHOOK_SECRET="${WEBHOOK_SECRET:-$(openssl rand -hex 32)}"
echo ""
echo "Webhook secret: ${WEBHOOK_SECRET:0:16}... (save this)"

# ─── Step 1: Install dependencies ────────────────────────────────

echo ""
echo "Step 1/5: Installing dependencies..."
npm install

# ─── Step 2: Run Supabase migrations ─────────────────────────────

echo ""
echo "Step 2/5: Running Supabase migrations..."

for migration in migrations/*.sql; do
  filename=$(basename "$migration")
  echo "  Running $filename..."
  if psql "$SUPABASE_DB_URL" -f "$migration" 2>&1; then
    echo "  ✓ $filename"
  else
    echo "  ⚠ $filename may have partially failed (table might already exist)"
  fi
done

echo "  Migrations complete."

# ─── Step 3: Deploy Cloudflare Worker ─────────────────────────────

echo ""
echo "Step 3/5: Deploying Cloudflare Worker..."
DEPLOY_OUTPUT=$(npx wrangler deploy 2>&1)
echo "$DEPLOY_OUTPUT"

# Extract worker URL from deploy output
WORKER_URL=$(echo "$DEPLOY_OUTPUT" | grep -oP 'https://[^\s]+workers\.dev' | head -1 || true)
if [ -z "$WORKER_URL" ]; then
  WORKER_URL="https://legacy-elevenlabs-agent.$(npx wrangler whoami 2>/dev/null | grep -oP '[\w-]+\.workers\.dev' || echo 'YOUR-SUBDOMAIN.workers.dev')"
  echo "Could not auto-detect worker URL. Using: $WORKER_URL"
fi
echo ""
echo "Worker deployed at: $WORKER_URL"

# ─── Step 4: Set Worker secrets ───────────────────────────────────

echo ""
echo "Step 4/5: Setting Cloudflare Worker secrets..."

echo "$SUPABASE_ANON_KEY" | npx wrangler secret put SUPABASE_ANON_KEY 2>&1
echo "  ✓ SUPABASE_ANON_KEY"

echo "$ELEVENLABS_API_KEY" | npx wrangler secret put ELEVENLABS_API_KEY 2>&1
echo "  ✓ ELEVENLABS_API_KEY"

echo "$WEBHOOK_SECRET" | npx wrangler secret put WEBHOOK_SECRET 2>&1
echo "  ✓ WEBHOOK_SECRET"

# ─── Step 5: Create ElevenLabs agent ──────────────────────────────

echo ""
echo "Step 5/5: Creating ElevenLabs agent..."

WORKER_URL="$WORKER_URL" \
ELEVENLABS_API_KEY="$ELEVENLABS_API_KEY" \
npx tsx src/setup/create-agent.ts

# ─── Done ─────────────────────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✓ LAUNCH COMPLETE"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Worker URL:     $WORKER_URL"
echo "Supabase:       $SUPABASE_URL"
echo "Webhook Secret: ${WEBHOOK_SECRET:0:16}..."
echo ""
echo "Test the health endpoint:"
echo "  curl $WORKER_URL/health"
echo ""
echo "Test inventory search:"
echo "  curl -X POST $WORKER_URL/tools/check_inventory \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -H 'x-webhook-secret: $WEBHOOK_SECRET' \\"
echo "    -d '{\"tool_name\":\"check_inventory\",\"parameters\":{\"product_name\":\"macallan\"},\"conversation_id\":\"test\",\"tool_call_id\":\"test\"}'"
echo ""
echo "Next steps:"
echo "  1. Note the Agent ID printed above"
echo "  2. Configure your Twilio SIP trunk to route calls to the ElevenLabs agent"
echo "  3. Make a test call!"
