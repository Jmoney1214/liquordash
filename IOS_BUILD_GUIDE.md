# LiquorDash — iOS Build Guide

This guide covers how to build and distribute the LiquorDash iOS app outside of Manus, using either **Expo EAS Build** (recommended) or **Xcode/TestFlight** with proper Apple Developer signing.

---

## Prerequisites

Before you begin, ensure you have the following installed and configured on your local machine:

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ (22 recommended) | Required for Expo CLI |
| pnpm | 9.x | Package manager used by this project |
| EAS CLI | 13.0.0+ | `npm install -g eas-cli` |
| Apple Developer Account | Active membership | Required for iOS signing |
| Xcode | 15+ (if building locally) | Only needed for local/Xcode builds |

---

## Project Configuration Summary

| Field | Value |
|---|---|
| App Name | LiquorDash |
| Slug | liquordash |
| iOS Bundle Identifier | `com.justin.etwaru.liquordash` |
| Android Package | `space.manus.liquordash.t20260215021059` |
| Apple ID | `justin.etwaru@gmail.com` |
| App Store Connect App ID | `6759822835` |
| Apple Team ID | `5X26G9SZ8R` |
| Expo SDK | 54 |

---

## Step 1: Clone and Install

```bash
# Clone the repo
git clone https://github.com/Jmoney1214/liquordash.git
cd liquordash

# Install dependencies
pnpm install
```

---

## Step 2: Environment Variables

Create a `.env` file in the project root with the required environment variables. You can find the variable names referenced in `scripts/load-env.js`. Key variables include:

```bash
# Server / API
VITE_APP_ID=<your-expo-project-id>
VITE_OAUTH_PORTAL_URL=<oauth-portal-url>
OAUTH_SERVER_URL=<oauth-server-url>

# Database (if using server features)
DATABASE_URL=<your-postgres-connection-string>

# Uber Direct (delivery integration)
UBER_DIRECT_CUSTOMER_ID=<your-uber-customer-id>
UBER_DIRECT_CLIENT_ID=<your-uber-client-id>
UBER_DIRECT_CLIENT_SECRET=<your-uber-client-secret>
```

If you are only building the mobile client without the backend server, you can skip the server-side variables.

---

## Step 3: Link to Your EAS Project

```bash
# Login to your Expo account
eas login

# Link to your existing EAS project (or create a new one)
eas init --id <your-eas-project-id>
```

If you already have the project linked on expo.dev, this step may not be necessary.

---

## Option A: Build with Expo EAS (Recommended)

This is the simplest path. EAS handles code signing, provisioning profiles, and distribution automatically.

### Production Build (App Store)

```bash
eas build --platform ios --profile production
```

EAS will prompt you to sign in with your Apple Developer account the first time. After credentials are generated and stored remotely, subsequent builds will use them automatically.

### Internal Distribution (Ad Hoc / TestFlight)

```bash
# For internal testing via ad-hoc distribution
eas build --platform ios --profile preview

# For development client
eas build --platform ios --profile development
```

### Submit to App Store / TestFlight

```bash
# Submit the latest production build
eas submit --platform ios --latest

# Or submit a specific build
eas submit --platform ios --id <build-id>
```

The `eas.json` already has your Apple credentials configured in the `submit.production.ios` section.

### Non-Interactive (CI/CD)

For CI/CD pipelines, use the `--non-interactive` flag and set these environment variables:

```bash
export EXPO_APPLE_ID="justin.etwaru@gmail.com"
export EXPO_APPLE_TEAM_ID="5X26G9SZ8R"
export EXPO_APPLE_PASSWORD="<your-app-specific-password>"

eas build --platform ios --profile production --non-interactive
```

Generate an **App-Specific Password** at [appleid.apple.com](https://appleid.apple.com) under Sign-In and Security > App-Specific Passwords.

---

## Option B: Build with Xcode (Local Native Build)

If you prefer full control via Xcode, you can generate the native iOS project and build locally.

### Generate Native Project

```bash
# Generate the ios/ directory
npx expo prebuild --platform ios
```

This creates the `ios/` folder with a standard Xcode project.

### Open in Xcode

```bash
open ios/LiquorDash.xcworkspace
```

### Configure Signing in Xcode

1. Open the project in Xcode.
2. Select the **LiquorDash** target.
3. Go to **Signing & Capabilities**.
4. Select your **Team** (Apple Developer Team ID: `5X26G9SZ8R`).
5. Ensure **Bundle Identifier** is `com.justin.etwaru.liquordash`.
6. Xcode will automatically manage provisioning profiles if "Automatically manage signing" is checked.

### Build and Archive

1. Select a connected device or "Any iOS Device (arm64)" as the build target.
2. Go to **Product > Archive**.
3. Once archived, use **Distribute App** to upload to App Store Connect / TestFlight.

### Local Build via EAS (Alternative)

You can also run EAS builds locally without sending code to Expo servers:

```bash
eas build --platform ios --profile production --local
```

This requires Xcode and CocoaPods installed locally. The output will be an `.ipa` file.

---

## Troubleshooting

**"slug does not match" error during EAS build:**
Ensure `package.json` `name` field is `"liquordash"` and `app.json` `expo.slug` is `"liquordash"`.

**Apple credentials prompt during build:**
Run `eas credentials` first to set up or verify your iOS signing credentials. Once stored, they will be reused automatically.

**Missing provisioning profile:**
Run `eas credentials` and select iOS to regenerate distribution certificates and provisioning profiles.

**Build fails with module not found:**
Run `pnpm install` to ensure all dependencies are installed. If issues persist, delete `node_modules` and `pnpm-lock.yaml`, then run `pnpm install` again.

**Expo prebuild issues:**
If `npx expo prebuild` fails, try with `--clean` flag: `npx expo prebuild --platform ios --clean`.

---

## File Structure (Key Files)

```
liquordash/
├── app/                  # Expo Router screens and layouts
│   ├── (tabs)/           # Tab-based navigation screens
│   ├── product/          # Product detail screens
│   ├── order/            # Order flow screens
│   ├── tracking/         # Delivery tracking
│   └── ...
├── components/           # Reusable UI components
├── hooks/                # Custom React hooks (API, auth, theme)
├── lib/                  # Utilities, tRPC client, theme
├── server/               # Backend server (tRPC + Express)
├── shared/               # Shared types between client and server
├── assets/images/        # App icons, splash screen
├── app.json              # Expo app configuration
├── eas.json              # EAS Build & Submit configuration
├── package.json          # Dependencies and scripts
├── tailwind.config.js    # NativeWind/Tailwind configuration
├── theme.config.js       # Color theme tokens
└── tsconfig.json         # TypeScript configuration
```

---

## Quick Reference Commands

| Action | Command |
|---|---|
| Install dependencies | `pnpm install` |
| Start dev server | `pnpm dev` |
| Start Metro only | `pnpm dev:metro` |
| Run tests | `pnpm test` |
| Type check | `pnpm check` |
| EAS iOS build (production) | `eas build -p ios --profile production` |
| EAS iOS build (preview) | `eas build -p ios --profile preview` |
| Submit to TestFlight | `eas submit -p ios --latest` |
| Generate native project | `npx expo prebuild -p ios` |
| Open in Xcode | `open ios/LiquorDash.xcworkspace` |
