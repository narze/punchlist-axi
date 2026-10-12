#!/usr/bin/env node
// Generated from src/ by `pnpm build` - do not edit.

// node_modules/.pnpm/axi-sdk-js@0.1.13/node_modules/axi-sdk-js/dist/fast-path.js
function tryFastPath(argv, options) {
  if (argv.length !== 1) {
    return false;
  }
  const flag = argv[0];
  if (flag !== "-v" && flag !== "-V" && flag !== "--version") {
    return false;
  }
  (options.stdout ?? process.stdout).write(`${options.version}
`);
  return true;
}

// package.json
var version = "0.1.1";

// src/version.ts
var VERSION = version;

// src/punchlist-axi.ts
if (!tryFastPath(process.argv.slice(2), { version: VERSION })) await import("./punchlist-cli.mjs");
