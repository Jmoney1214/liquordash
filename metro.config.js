const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Exclude server-only code from the mobile bundle
// server/ contains Node.js packages (mysql2, express, etc.) that break Android builds
config.resolver.blockList = [
  new RegExp(path.resolve(__dirname, "server").replace(/[/\\]/g, "[/\\\\]") + "[/\\\\].*"),
];

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
