// How the gallery is bundled: like scripts/client.js, but a Svelte dev build, so every element carries
// `__svelte_meta` and a note taken on a story points the agent at src/client/<Component>.svelte:line.
import path from 'node:path';
import type { BuildOptions } from 'esbuild';
import svelte from 'esbuild-svelte';

export const options: BuildOptions = {
  bundle: true, platform: 'browser', format: 'esm', splitting: true, target: 'es2020', sourcemap: true,
  entryPoints: [path.join(import.meta.dirname, 'main.ts')], outdir: path.join(import.meta.dirname, 'dist'),
  mainFields: ['svelte', 'browser', 'module', 'main'], conditions: ['svelte', 'browser', 'development'], loader: { '.css': 'text' },
  plugins: [svelte({ compilerOptions: { css: 'injected', dev: true } })],
};
