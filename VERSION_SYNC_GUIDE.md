# LiquorDash Version Sync & Automated Builds

This guide explains how to keep iOS and Android versions in sync and automate builds to both app stores.

---

## Overview

The version sync system consists of three components:

1. **Version Bumping Script** (`scripts/bump-version.mjs`) — Automatically updates `app.json` and creates git tags
2. **GitHub Actions Workflow** (`.github/workflows/build-and-submit.yml`) — Builds and submits to both app stores on tag push
3. **Manual Workflow** — For local testing and one-off builds

---

## Quick Start

### 1. Bump Version Locally

Run the version bump script to increment the version and create a git tag:

```bash
# Bump patch version (1.0.0 → 1.0.1)
node scripts/bump-version.mjs patch

# Bump minor version (1.0.1 → 1.1.0)
node scripts/bump-version.mjs minor

# Bump major version (1.1.0 → 2.0.0)
node scripts/bump-version.mjs major

# Preview changes without committing (dry run)
node scripts/bump-version.mjs patch --dry-run
```

The script will:
- Update `version` in `app.json`
- Create a git commit with message `chore: bump version to X.Y.Z`
- Create a git tag `vX.Y.Z`

### 2. Push to GitHub

```bash
git push origin main
git push origin vX.Y.Z
```

Pushing the tag triggers the GitHub Actions workflow automatically.

### 3. Monitor the Build

Go to your GitHub repo → **Actions** tab to watch the build progress. The workflow will:
1. Build iOS on macOS runners
2. Build Android on Ubuntu runners
3. Submit both to their respective app stores (if secrets are configured)

---

## Manual Builds (Local Testing)

If you want to build locally without pushing to GitHub:

```bash
# Build iOS
eas build -p ios --profile production --non-interactive

# Build Android
eas build -p android --profile production --non-interactive

# Submit to app stores (requires credentials)
eas submit -p ios --profile production --non-interactive
eas submit -p android --profile production --non-interactive
```

---

## GitHub Actions Setup

The workflow requires these secrets to be configured in your GitHub repo settings:

### Required Secrets

| Secret | Description | Where to Get |
|--------|-------------|--------------|
| `EXPO_TOKEN` | Expo CLI authentication token | Run `eas token create` locally, then copy the token |
| `EXPO_APPLE_ID` | Apple ID email | Your Apple Developer account email |
| `EXPO_APPLE_PASSWORD` | App-Specific Password | Generate at [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security → App-Specific Passwords |
| `EXPO_APPLE_TEAM_ID` | Apple Developer Team ID | Found in `eas.json` under `submit.production.ios.appleTeamId` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password | From your Android signing keystore |
| `ANDROID_KEY_PASSWORD` | Key password | From your Android signing keystore |

### How to Add Secrets

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each secret from the table above
4. Save

---

## Version Scheme

LiquorDash uses **semantic versioning**: `MAJOR.MINOR.PATCH`

- **MAJOR** — Breaking changes or major features (e.g., redesign, new platform)
- **MINOR** — New features or significant improvements (e.g., Uber Direct integration)
- **PATCH** — Bug fixes and small improvements (e.g., UI tweaks, performance fixes)

### Current Version

Check the current version in `app.json`:

```bash
cat app.json | grep '"version"'
```

---

## Workflow Diagram

```
Local Machine
    ↓
npm run bump-version:patch
    ↓
git tag v1.0.1
    ↓
git push origin main v1.0.1
    ↓
GitHub Actions Triggered
    ├─→ Build iOS (macOS runner)
    ├─→ Build Android (Ubuntu runner)
    ├─→ Submit iOS to App Store
    └─→ Submit Android to Play Store
    ↓
App Store / Play Store
```

---

## Troubleshooting

### Build fails with "EXPO_TOKEN not found"

**Solution:** Add the `EXPO_TOKEN` secret to your GitHub repo settings. Generate it locally:

```bash
eas token create
```

Copy the token and add it as a GitHub secret.

### iOS submission fails with "Apple ID password incorrect"

**Solution:** Ensure you're using an **App-Specific Password**, not your regular Apple ID password:

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in
3. Click **Sign-In and Security**
4. Scroll to **App-Specific Passwords**
5. Generate a new password for "EAS"
6. Update the `EXPO_APPLE_PASSWORD` secret in GitHub

### Android submission fails with "Keystore not found"

**Solution:** Ensure your Android keystore credentials are correct. Check `eas.json`:

```bash
cat eas.json | grep -A 5 "android"
```

---

## Manual Version Sync (If Script Fails)

If the automated script doesn't work, manually sync versions:

1. **Edit `app.json`:**
   ```json
   {
     "expo": {
       "version": "1.0.1"
     }
   }
   ```

2. **Commit and tag:**
   ```bash
   git add app.json
   git commit -m "chore: bump version to 1.0.1"
   git tag -a v1.0.1 -m "Release v1.0.1"
   git push origin main v1.0.1
   ```

---

## Best Practices

1. **Always use the bump script** — It ensures consistency and creates proper git tags
2. **Test locally before pushing** — Run `eas build` locally first to catch errors
3. **Use semantic versioning** — Makes it easy to understand what changed
4. **Keep `app.json` and `eas.json` in sync** — The bump script does this automatically
5. **Review GitHub Actions logs** — If a build fails, check the Actions tab for detailed error messages

---

## Next Steps

1. **Configure GitHub secrets** (see "GitHub Actions Setup" above)
2. **Test the workflow** by bumping a patch version and pushing a tag
3. **Monitor the build** in the GitHub Actions tab
4. **Verify the app** appears in TestFlight (iOS) and Google Play Console (Android)

For questions or issues, refer to the [Expo EAS Build docs](https://docs.expo.dev/build/introduction/).
