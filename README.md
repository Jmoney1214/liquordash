# Legacy Wine & Liquor — ElevenLabs Voice Agent

ElevenLabs Conversational AI voice agent backend for Legacy Wine & Liquor. A Cloudflare Worker (Hono + TypeScript) that handles webhook tool calls from ElevenLabs, backed by Supabase.

## Architecture

```
Caller → Twilio SIP → ElevenLabs Agent → Webhook Tools → Cloudflare Worker → Supabase
```

## Tools

| Tool | Description |
|------|-------------|
| `check_inventory` | Search products by name/brand/category |
| `lookup_customer` | Get full customer context by phone number |
| `log_caller` | Log call interactions + upsert customer |
| `add_to_waitlist` | Add to restock notification list |
| `smart_recommend` | Personalized product recommendations |
| `update_preferences` | Save taste/event preferences from conversation |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Run Supabase migrations

Run each SQL file in `migrations/` against your Supabase project (in order):

```bash
psql $DATABASE_URL -f migrations/001-customer-preferences.sql
psql $DATABASE_URL -f migrations/002-customer-interactions.sql
psql $DATABASE_URL -f migrations/003-get-customer-context.sql
psql $DATABASE_URL -f migrations/004-add-consent-column.sql
```

### 3. Configure environment

Update `wrangler.toml` with your `SUPABASE_URL`, then set secrets:

```bash
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put ELEVENLABS_API_KEY
npx wrangler secret put WEBHOOK_SECRET
```

### 4. Deploy

```bash
npm run deploy
```

### 5. Create the ElevenLabs agent

```bash
ELEVENLABS_API_KEY=sk-... npm run setup-agent
```

## Development

```bash
npm run dev        # Local dev server (wrangler dev)
npm run check      # TypeScript type check
npm run test-tools # Test all tool endpoints
```

## Project Structure

```
src/
├── worker/
│   ├── index.ts           # Hono app entry point
│   ├── tools/             # 6 webhook tool handlers
│   └── lib/               # Supabase client + types
└── setup/
    ├── create-agent.ts    # ElevenLabs agent creation script
    ├── agent-config.ts    # Agent configuration
    ├── system-prompt.ts   # System prompt
    └── knowledge-base/    # KB files for ElevenLabs
migrations/                # PostgreSQL migrations for Supabase
scripts/                   # Deploy + test scripts
```
