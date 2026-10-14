// `pnpm gallery`: rebuilds on every change and serves the gallery; the page reloads itself (see main.ts).
// Not shipped: package.json `files` lists only scripts/ and the skill.
import path from 'node:path';
import { context } from 'esbuild';
import { options } from './config.ts';

const ctx = await context(options);
await ctx.watch();
const { port } = await ctx.serve({ servedir: import.meta.dirname, port: Number(process.env['PORT'] ?? 6006) });
const at = `http://localhost:${port}`;
console.log(`gallery: ${at}
annotate it with punchlist: node scripts/punchlist-axi.mjs start --target ${at}
(${path.relative(process.cwd(), import.meta.dirname)}/stories/ holds one file per component)`);
