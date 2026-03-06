# LiquorDash — Environment Variables & API Keys Guide

This document lists every environment variable used by LiquorDash, explains what each one does, and provides step-by-step instructions for obtaining the required API keys and credentials.

---

## Quick Start

Create a `.env` file in the project root and populate it with the variables below. The `scripts/load-env.js` loader reads this file at startup and also auto-maps certain variables to their `EXPO_PUBLIC_` equivalents for the mobile client.

```bash
cp .env.example .env
# Then fill in the values using this guide
```

---

## Complete Variable Reference

### 1. App Identity (Manus OAuth)

These variables power user authentication and the OAuth login flow. When running inside the Manus platform, they are injected automatically. For external hosting, you need your own OAuth provider or can disable auth features.

| Variable | Required | Description |
|---|---|---|
| `VITE_APP_ID` | Yes | Expo/Manus application identifier. Used to identify the app during OAuth. |
| `VITE_OAUTH_PORTAL_URL` | Yes | OAuth portal URL (e.g., `https://portal.manus.space`). The login screen redirects here. |
| `OAUTH_SERVER_URL` | Yes | OAuth server URL for token exchange and session validation. |
| `OWNER_OPEN_ID` | No | The OpenID of the app owner. Used to auto-assign the admin role. |
| `OWNER_NAME` | No | Display name of the app owner. |

> **Note:** These are Manus-platform-specific. If you are self-hosting without Manus OAuth, you will need to replace the auth system with your own (e.g., Firebase Auth, Auth0, or Clerk).

---

### 2. Database

LiquorDash uses MySQL via Drizzle ORM for cross-device data sync, order management, and inventory storage.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MySQL connection string in the format: `mysql://user:password@host:port/database?ssl={"rejectUnauthorized":true}` |

**How to set up:**

1. Provision a MySQL database (e.g., PlanetScale, AWS RDS, DigitalOcean Managed Database, or a local MySQL 8 instance).
2. Create a database named `liquordash` (or any name you prefer).
3. Copy the connection string and paste it as the `DATABASE_URL` value.
4. Run `pnpm db:push` to apply the schema migrations.

---

### 3. Server Security

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | Secret key used to sign JWT session cookies. Must be a long random string (32+ characters). |

**How to generate:**

```bash
openssl rand -hex 32
```

Copy the output and use it as your `JWT_SECRET`.

---

### 4. Uber Direct (Delivery Dispatch)

Uber Direct powers real-time delivery dispatch via Uber couriers. This is the core delivery integration for LiquorDash.

| Variable | Required | Description |
|---|---|---|
| `UBER_DIRECT_CLIENT_ID` | Yes (for delivery) | OAuth Client ID from the Uber Direct developer dashboard. |
| `UBER_DIRECT_CLIENT_SECRET` | Yes (for delivery) | OAuth Client Secret from the Uber Direct developer dashboard. |
| `UBER_DIRECT_CUSTOMER_ID` | Yes (for delivery) | Customer ID (UUID format) from the Uber Direct developer dashboard. |

**How to get these credentials:**

1. Go to [https://direct.uber.com](https://direct.uber.com) and sign in with your Uber account (or create a new one).
2. Complete the onboarding to create an **Uber Direct Self-Serve Account**.
3. Navigate to **Management > Developer** tab in your dashboard.
4. You will see three credentials displayed:
   - **Customer ID** — a UUID like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **Client ID** — a string like `XXXXXXXXXXXXXXXXXXXXXXXXXX`
   - **Client Secret** — a string like `XXXXXXXXXXXXXXXXXXXXXXXXXX`
5. Copy all three values into your `.env` file.

**Test vs. Production:**

By default, your account starts in **Test mode** (sandbox). In test mode, API calls work but no real deliveries are dispatched. To switch to production:

1. Add billing information in the Uber Direct dashboard.
2. Wait for account approval.
3. Toggle from "Test" to "Production" in the Developer tab.
4. Update your `.env` with the production credentials (they are different from test credentials).

**Verification:** Run `pnpm test` — the `uber-direct-credentials.test.ts` test will validate the format of your credentials.

---

### 5. Lightspeed Retail R-Series (POS / Inventory)

Lightspeed Retail syncs the product catalog, inventory levels, and orders between the physical store's POS system and LiquorDash.

| Variable | Required | Description |
|---|---|---|
| `LIGHTSPEED_CLIENT_ID` | Yes (for POS sync) | OAuth Client ID from the Lightspeed Developer Portal. |
| `LIGHTSPEED_CLIENT_SECRET` | Yes (for POS sync) | OAuth Client Secret from the Lightspeed Developer Portal. |

**How to get these credentials:**

1. Go to [https://developers.retail.lightspeed.app/](https://developers.retail.lightspeed.app/) and create a developer account (or log in).
2. Once logged in, create a **new application** in the developer portal.
3. Set the **OAuth Redirect URI** to your API server's callback endpoint:
   - Local development: `http://localhost:3000/api/lightspeed/callback`
   - Production: `https://your-api-domain.com/api/lightspeed/callback`
4. Copy the **Client ID** and **Client Secret** from your app settings.
5. Paste them into your `.env` file.

**After setup — connecting to your Lightspeed account:**

Once the credentials are in place, an admin user needs to authorize the connection:

1. Open the LiquorDash app and navigate to **Admin > Lightspeed POS**.
2. Tap **Connect Lightspeed** — this redirects to Lightspeed's OAuth consent screen.
3. Log in with your Lightspeed Retail merchant account and authorize the app.
4. The app exchanges the authorization code for access/refresh tokens automatically.
5. Product catalog and inventory will begin syncing.

> **Prerequisite:** You need an active [Lightspeed Retail (R-Series)](https://www.lightspeedhq.com/pos/retail/) merchant account. This is the POS system used in-store.

---

### 6. Built-in AI & Storage (Manus Platform)

These power the LLM (AI chat, image recognition, content generation) and S3-compatible file storage. When running inside Manus, they are injected automatically.

| Variable | Required | Description |
|---|---|---|
| `BUILT_IN_FORGE_API_URL` | No | Base URL for the AI/Storage proxy service. |
| `BUILT_IN_FORGE_API_KEY` | No | API key for the AI/Storage proxy service. |

> **For external hosting:** If you want AI features outside of Manus, you would need to replace the `server/storage.ts` and `server/_core/llm.ts` implementations with your own provider (e.g., OpenAI API + AWS S3). These are optional features — the core ordering and delivery functionality works without them.

---

### 7. Runtime Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | Set to `production` for production builds. |
| `PORT` | No | `3000` | Port for the Express API server. |

---

### 8. Apple Build Credentials (EAS Submit)

These are used by `eas submit` to upload builds to App Store Connect. They are configured in `eas.json` under `submit.production.ios`, not in `.env`.

| Field | Value | Where Configured |
|---|---|---|
| Apple ID | `justin.etwaru@gmail.com` | `eas.json` |
| App Store Connect App ID | `6759822835` | `eas.json` |
| Apple Team ID | `5X26G9SZ8R` | `eas.json` |

For CI/CD builds, you may also need:

| Variable | Required | Description |
|---|---|---|
| `EXPO_APPLE_ID` | For CI | Apple ID email for non-interactive EAS builds. |
| `EXPO_APPLE_TEAM_ID` | For CI | Apple Developer Team ID. |
| `EXPO_APPLE_PASSWORD` | For CI | App-Specific Password (generate at [appleid.apple.com](https://appleid.apple.com) > Sign-In and Security > App-Specific Passwords). |

---

### 9. Auto-Mapped Variables (Do Not Set Manually)

The `scripts/load-env.js` script automatically maps certain variables to their `EXPO_PUBLIC_` equivalents so the mobile client can access them. You do **not** need to set these — they are derived at runtime.

| Auto-Mapped Variable | Source Variable |
|---|---|
| `EXPO_PUBLIC_APP_ID` | `VITE_APP_ID` |
| `EXPO_PUBLIC_OAUTH_PORTAL_URL` | `VITE_OAUTH_PORTAL_URL` |
| `EXPO_PUBLIC_OAUTH_SERVER_URL` | `OAUTH_SERVER_URL` |
| `EXPO_PUBLIC_OWNER_OPEN_ID` | `OWNER_OPEN_ID` |
| `EXPO_PUBLIC_OWNER_NAME` | `OWNER_NAME` |

There are two additional `EXPO_PUBLIC_` variables that can be set directly if needed:

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | No | Override the API server URL if it differs from the default derived URL. |
| `EXPO_PUBLIC_API_URL` | No | Same purpose as above; used by the Lightspeed admin screen. |

---

## Sample `.env` File

```bash
# ═══════════════════════════════════════════════════════════════════
# LiquorDash .env
# ═══════════════════════════════════════════════════════════════════

# App Identity (Manus OAuth)
VITE_APP_ID=your-app-id-here
VITE_OAUTH_PORTAL_URL=https://portal.manus.space
OAUTH_SERVER_URL=https://oauth.manus.space
OWNER_OPEN_ID=your-owner-open-id
OWNER_NAME=Justin

# Database
DATABASE_URL=mysql://user:password@host:3306/liquordash?ssl={"rejectUnauthorized":true}

# Server Security
JWT_SECRET=your-64-char-hex-string-from-openssl-rand-hex-32

# Uber Direct
UBER_DIRECT_CLIENT_ID=your-uber-client-id
UBER_DIRECT_CLIENT_SECRET=your-uber-client-secret
UBER_DIRECT_CUSTOMER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Lightspeed Retail
LIGHTSPEED_CLIENT_ID=your-lightspeed-client-id
LIGHTSPEED_CLIENT_SECRET=your-lightspeed-client-secret

# AI & Storage (optional, Manus-only)
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=

# Runtime
NODE_ENV=development
PORT=3000
```

---

## Verification

After populating your `.env`, run the test suite to validate credentials:

```bash
pnpm test
```

The following test files specifically validate credentials:

| Test File | What It Checks |
|---|---|
| `__tests__/uber-direct-credentials.test.ts` | Uber Direct Client ID, Client Secret, and Customer ID format |
| `server/__tests__/lightspeed-credentials.test.ts` | Lightspeed Client ID and Client Secret presence |
| `server/__tests__/apple-credentials.test.ts` | Apple ID, ASC App ID, and Team ID format |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     LiquorDash App                          │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  OAuth    │  │  tRPC    │  │  Uber    │  │ Lightspeed│  │
│  │  Login    │  │  API     │  │  Direct  │  │ POS Sync  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬─────┘  │
│       │              │             │               │        │
└───────┼──────────────┼─────────────┼───────────────┼────────┘
        │              │             │               │
        ▼              ▼             ▼               ▼
   ┌─────────┐   ┌─────────┐  ┌──────────┐   ┌──────────┐
   │  Manus  │   │  MySQL  │  │  Uber    │   │Lightspeed│
   │  OAuth  │   │   DB    │  │  API     │   │  API     │
   └─────────┘   └─────────┘  └──────────┘   └──────────┘
```

Each arrow represents a connection that requires the corresponding environment variables to be configured.
