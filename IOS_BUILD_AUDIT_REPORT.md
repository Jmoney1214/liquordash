# iOS EAS Build Audit Report — LiquorDash

**Date:** March 11, 2026  
**Verdict: READY FOR iOS BUILD**

---

## Errors Found and Fixed

| # | Issue | Severity | File Changed | Fix Applied |
|---|-------|----------|-------------|-------------|
| 1 | `newArchEnabled: false` but `react-native-reanimated` 4.1.6 requires New Architecture | **CRITICAL** | `app.json` | Set `newArchEnabled: true` |
| 2 | `expo-notifications` used in 5+ files but missing from `app.json` plugins | **CRITICAL** | `app.json` | Added `expo-notifications` plugin with icon and color config |
| 3 | `expo-build-properties` had no iOS config — no deployment target set | **HIGH** | `app.json` | Added `ios.deploymentTarget: "15.1"` and `ios.newArchEnabled: true` |
| 4 | No `extra.eas.projectId` or `owner` in `app.json` — EAS can't link project | **HIGH** | `app.json` | Added `extra.eas.projectId` and `owner: "justin.etwaru"` |
| 5 | `packageManager: "pnpm@9.12.0"` but user has pnpm 10.28.0 — corepack mismatch | **MEDIUM** | `package.json` | Updated to `pnpm@10.28.0` |
| 6 | `build:all` script used `npm run` instead of `pnpm run` | **LOW** | `package.json` | Changed to `pnpm run` |
| 7 | No `.easignore` file — server/, drizzle/, tests uploaded to EAS unnecessarily | **LOW** | `.easignore` (new) | Created `.easignore` excluding server-only files |

## Files Changed

1. **`app.json`** — 7 changes (newArch, notifications plugin, iOS build props, projectId, owner)
2. **`package.json`** — 2 changes (packageManager version, build:all script)
3. **`.easignore`** — New file (excludes server/, drizzle/, tests from EAS uploads)

## Health Check Results

| Check | Result |
|-------|--------|
| `pnpm install` | OK — 1154 packages |
| `npx expo config --json` | OK — all 7 plugins resolve |
| `npx expo-doctor` | 17/17 checks passed |
| TypeScript | 0 errors |
| Tests | 351 passed, 1 skipped |

## Items Verified as Correct (No Changes Needed)

- `bundleIdentifier`: `space.manus.liquordash.t20260215021059` — matches App Store Connect
- `eas.json`: production profile with `credentialsSource: "remote"`, `autoIncrement: true`, `EXPO_NO_INTERACTIVE=1`
- `eas.json` submit config: correct Apple ID, ASC App ID, Team ID
- `babel.config.js`: correct — `react-native-worklets/plugin` registered (reanimated 4.x uses worklets, not its own babel plugin)
- `metro.config.js`: correct — `server/` blocked from bundle, NativeWind configured
- `tsconfig.json`: correct — extends expo base, NativeWind types included
- `expo-router`: entry point `expo-router/entry` in package.json — correct
- `.npmrc`: `node-linker=hoisted` — correct for Expo/React Native
- Icon assets: all 1024x1024 — correct for App Store
- `ITSAppUsesNonExemptEncryption: false` — correct, avoids export compliance prompt

## Remaining Warnings (Non-Blocking)

1. **WebSocket URL hardcoded to `ws://localhost:3000/ws`** for native — this will not connect in production. Should use `EXPO_PUBLIC_API_BASE_URL` to derive the WS URL. Not a build blocker but will affect runtime.
2. **Lightspeed auth URL fallback to `http://localhost:3000`** — same issue, non-blocking for build.

## Commands to Run on Your Mac

```bash
# Step 1: Pull the fixes
cd ~/liquordash
git pull origin main

# Step 2: Clean install with correct pnpm
rm -rf node_modules
pnpm install

# Step 3: Verify config resolves
npx expo config --json | head -5

# Step 4: Build
eas build -p ios --profile production --non-interactive
```
