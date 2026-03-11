#!/usr/bin/env node

/**
 * bump-version.mjs
 * 
 * Automated version bumping script for LiquorDash.
 * Bumps the version in app.json and eas.json, then commits and tags the release.
 * 
 * Usage:
 *   node scripts/bump-version.mjs major|minor|patch [--dry-run]
 * 
 * Examples:
 *   node scripts/bump-version.mjs patch              # 1.0.0 → 1.0.1
 *   node scripts/bump-version.mjs minor              # 1.0.1 → 1.1.0
 *   node scripts/bump-version.mjs major              # 1.1.0 → 2.0.0
 *   node scripts/bump-version.mjs patch --dry-run    # Preview changes without committing
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const appJsonPath = path.join(projectRoot, 'app.json');
const easJsonPath = path.join(projectRoot, 'eas.json');

function parseVersion(versionString) {
  const parts = versionString.split('.');
  return {
    major: parseInt(parts[0], 10),
    minor: parseInt(parts[1], 10),
    patch: parseInt(parts[2], 10),
  };
}

function bumpVersion(currentVersion, bumpType) {
  const { major, minor, patch } = parseVersion(currentVersion);

  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid bump type: ${bumpType}. Use major, minor, or patch.`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const bumpType = args[0];
  const isDryRun = args.includes('--dry-run');

  if (!bumpType || !['major', 'minor', 'patch'].includes(bumpType)) {
    console.error('Usage: node scripts/bump-version.mjs major|minor|patch [--dry-run]');
    process.exit(1);
  }

  // Read current version from app.json
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
  const currentVersion = appJson.expo.version;
  const newVersion = bumpVersion(currentVersion, bumpType);

  console.log(`📦 Bumping version: ${currentVersion} → ${newVersion}`);

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - no changes will be committed');
  }

  // Update app.json
  appJson.expo.version = newVersion;
  const appJsonContent = JSON.stringify(appJson, null, 2) + '\n';

  if (!isDryRun) {
    fs.writeFileSync(appJsonPath, appJsonContent);
    console.log(`✅ Updated app.json to version ${newVersion}`);
  } else {
    console.log(`📝 Would update app.json to version ${newVersion}`);
  }

  // Update eas.json (if it has a version field)
  const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf-8'));
  if (easJson.version) {
    easJson.version = newVersion;
    const easJsonContent = JSON.stringify(easJson, null, 2) + '\n';
    if (!isDryRun) {
      fs.writeFileSync(easJsonPath, easJsonContent);
      console.log(`✅ Updated eas.json to version ${newVersion}`);
    } else {
      console.log(`📝 Would update eas.json to version ${newVersion}`);
    }
  }

  if (!isDryRun) {
    // Commit and tag
    try {
      execSync(`git add app.json eas.json`, { cwd: projectRoot, stdio: 'inherit' });
      execSync(`git commit -m "chore: bump version to ${newVersion}"`, {
        cwd: projectRoot,
        stdio: 'inherit',
      });
      execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, {
        cwd: projectRoot,
        stdio: 'inherit',
      });
      console.log(`✅ Created git tag: v${newVersion}`);
      console.log(`\n🚀 Next steps:`);
      console.log(`   git push origin main`);
      console.log(`   git push origin v${newVersion}`);
      console.log(`   eas build -p ios --profile production`);
      console.log(`   eas build -p android --profile production`);
    } catch (error) {
      console.error('❌ Git operations failed:', error.message);
      process.exit(1);
    }
  } else {
    console.log(`\n✅ Dry run complete. Run without --dry-run to apply changes.`);
  }
}

main();
