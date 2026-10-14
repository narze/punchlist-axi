// Bundles src/ into scripts/, which is committed and shipped: releases need only node, no install.
import { build } from 'esbuild';
import type { BuildOptions } from 'esbuild';
import svelte from 'esbuild-svelte';

const banner = '// Generated from src/ by `pnpm build` - do not edit.';
const node: BuildOptions = { bundle: true, platform: 'node', format: 'esm', target: 'node18' };

await Promise.all([
  // the full CLI; bundled CommonJS deps (launch-editor) need a require
  build({ ...node, entryPoints: ['src/cli.ts'], outfile: 'scripts/punchlist-cli.mjs',
    banner: { js: `#!/usr/bin/env node\n${banner}\nimport { createRequire } from "node:module"; const require = createRequire(import.meta.url);` } }),
  // the bin: answers --version itself, imports the CLI next to it for everything else
  build({ ...node, entryPoints: ['src/punchlist-axi.ts'], outfile: 'scripts/punchlist-axi.mjs', external: ['./punchlist-cli.mjs'],
    banner: { js: `#!/usr/bin/env node\n${banner}` } }),
  // the picker the proxy injects into pages; css goes into our shadow root, no `window.__svelte` on the app's page.
  // Minified: that is what drops Svelte's dev-only branches.
  build({ bundle: true, minify: true, platform: 'browser', format: 'iife', target: 'es2020', entryPoints: ['src/client/index.ts'], outfile: 'scripts/client.js',
    mainFields: ['svelte', 'browser', 'module', 'main'], conditions: ['svelte', 'browser', 'production'], loader: { '.css': 'text' },
    plugins: [svelte({ compilerOptions: { css: 'injected', discloseVersion: false } })], banner: { js: banner } }),
  // the in-browser editor (CodeMirror): an ES module the picker imports on first use, so it costs nothing until then
  build({ bundle: true, minify: true, platform: 'browser', format: 'esm', target: 'es2020', entryPoints: ['src/client/editor.ts'], outfile: 'scripts/editor.js',
    banner: { js: banner } }),
]);
