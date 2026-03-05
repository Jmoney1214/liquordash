/**
 * Lightspeed OAuth Routes
 *
 * Registers Express routes for the Lightspeed OAuth authorization flow:
 *   GET  /api/lightspeed/auth       → Redirect admin to Lightspeed login
 *   GET  /api/lightspeed/callback   → Handle OAuth callback with authorization code
 *   GET  /api/lightspeed/status     → Check connection status
 *
 * Token persistence is handled via a simple key-value table in the database.
 */

import type { Express } from "express";
import * as lightspeed from "./lightspeed";

// ─── Token Persistence via Database ──────────────────────────────────────────

// We store tokens as a JSON blob in a simple settings table.
// For simplicity, we use a file-based approach that works without DB too.

import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

const TOKEN_FILE = join(process.cwd(), ".lightspeed-tokens.json");

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  accountId: string;
}

async function saveTokens(data: StoredTokens): Promise<void> {
  await writeFile(TOKEN_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function loadTokens(): Promise<StoredTokens | null> {
  try {
    const content = await readFile(TOKEN_FILE, "utf-8");
    return JSON.parse(content) as StoredTokens;
  } catch {
    return null;
  }
}

// Initialize token persistence
lightspeed.setTokenPersistence(saveTokens, loadTokens);

// ─── Express Routes ──────────────────────────────────────────────────────────

export function registerLightspeedRoutes(app: Express): void {
  /**
   * GET /api/lightspeed/auth
   * Redirects the admin to Lightspeed's OAuth authorization page.
   */
  app.get("/api/lightspeed/auth", (req, res) => {
    try {
      // Build the callback URL based on the request
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const redirectUri = `${protocol}://${host}/api/lightspeed/callback`;

      const authUrl = lightspeed.getAuthorizationUrl(redirectUri);
      res.redirect(authUrl);
    } catch (err) {
      res.status(500).json({
        error: "Failed to generate authorization URL",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });

  /**
   * GET /api/lightspeed/callback
   * Handles the OAuth callback from Lightspeed with the authorization code.
   */
  app.get("/api/lightspeed/callback", async (req, res) => {
    const { code, error } = req.query;

    if (error) {
      res.status(400).send(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h2 style="color: #D93025;">Authorization Failed</h2>
            <p>${String(error)}</p>
            <p>Please close this window and try again from the app.</p>
          </body>
        </html>
      `);
      return;
    }

    if (!code || typeof code !== "string") {
      res.status(400).send(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h2 style="color: #D93025;">Missing Authorization Code</h2>
            <p>No authorization code was received from Lightspeed.</p>
          </body>
        </html>
      `);
      return;
    }

    try {
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const redirectUri = `${protocol}://${host}/api/lightspeed/callback`;

      const tokens = await lightspeed.exchangeCodeForTokens(code, redirectUri);

      // Get account info for display
      const account = await lightspeed.getAccount();

      res.send(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h2 style="color: #22C55E;">✓ Connected to Lightspeed</h2>
            <p>Account: <strong>${account.name}</strong> (ID: ${account.accountID})</p>
            <p>You can now close this window and return to the app.</p>
            <script>
              // Try to notify the app via postMessage
              if (window.opener) {
                window.opener.postMessage({ type: 'lightspeed-connected', accountId: '${tokens.accountId}' }, '*');
              }
              // Auto-close after 3 seconds
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    } catch (err) {
      console.error("[Lightspeed] OAuth callback error:", err);
      res.status(500).send(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h2 style="color: #D93025;">Connection Failed</h2>
            <p>${err instanceof Error ? err.message : String(err)}</p>
            <p>Please close this window and try again.</p>
          </body>
        </html>
      `);
    }
  });

  /**
   * GET /api/lightspeed/status
   * Returns the current Lightspeed connection status.
   */
  app.get("/api/lightspeed/status", async (_req, res) => {
    try {
      const status = await lightspeed.getConnectionStatus();
      res.json(status);
    } catch (err) {
      res.json({
        connected: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  /**
   * POST /api/lightspeed/manual-tokens
   * Allows admin to manually set tokens obtained via Postman or browser flow.
   */
  app.post("/api/lightspeed/manual-tokens", async (req, res) => {
    try {
      const { accessToken, refreshToken, accountId } = req.body;

      if (!accessToken || !refreshToken || !accountId) {
        res.status(400).json({
          error: "Missing required fields: accessToken, refreshToken, accountId",
        });
        return;
      }

      await lightspeed.setManualTokens({ accessToken, refreshToken, accountId });

      // Verify the tokens work by fetching account info
      const account = await lightspeed.getAccount();

      res.json({
        success: true,
        accountId: account.accountID,
        accountName: account.name,
      });
    } catch (err) {
      console.error("[Lightspeed] Manual token entry error:", err);
      res.status(500).json({
        error: "Failed to set tokens",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });

  console.log("[api] Lightspeed OAuth routes registered at /api/lightspeed/*");
}
