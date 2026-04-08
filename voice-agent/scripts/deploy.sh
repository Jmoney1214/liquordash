#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════
# Deploy Legacy Wine & Liquor ElevenLabs Voice Agent Worker
# ═══════════════════════════════════════════════════════════════════

cd "$(dirname "$0")/.."

echo "Building and deploying Cloudflare Worker..."
npx wrangler deploy

echo ""
echo "Setting secrets (you'll be prompted for each value)..."
echo "──────────────────────────────────────────────────────"

secrets=(
  "SUPABASE_ANON_KEY"
  "ELEVENLABS_API_KEY"
  "WEBHOOK_SECRET"
)

for secret in "${secrets[@]}"; do
  echo ""
  echo "Setting ${secret}..."
  npx wrangler secret put "${secret}"
done

echo ""
echo "Deployment complete!"
echo "Worker URL: https://legacy-elevenlabs-agent.<your-subdomain>.workers.dev"
echo ""
echo "Next steps:"
echo "  1. Update WORKER_URL in your .env for the agent setup script"
echo "  2. Run 'npm run setup-agent' to create/update the ElevenLabs agent"
echo "  3. Configure Twilio SIP trunk to route calls to the agent"
