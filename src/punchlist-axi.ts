// Entry point. Answers a bare -v/-V/--version before the full CLI loads (AXI fast path);
// everything else is handled by the bundled CLI next to this file.
import { tryFastPath } from 'axi-sdk-js/fast-path';
import { VERSION } from './version.ts';

if (!tryFastPath(process.argv.slice(2), { version: VERSION })) await import('./punchlist-cli.mjs');
