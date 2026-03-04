// CommonJS bridge for build systems that only detect app.config.js
// The actual config lives in app.config.ts (TypeScript)
module.exports = require("./app.config.ts").default;
