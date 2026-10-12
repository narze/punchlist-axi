// Port choice for `start`: without --port it reuses a proxy for the same target or shifts to the next
// free port (like Vite); an explicit --port is strict. PUNCHLIST_PORT moves the first port off 4000.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), '../scripts/punchlist-axi.mjs');
const BASE = 43000 + Math.floor(Math.random() * 500);
const T1 = String(BASE + 600), T2 = String(BASE + 601), T3 = String(BASE + 602); // targets no real proxy uses
const env = { ...process.env, PUNCHLIST_PORT: String(BASE) };
const cli = (...a: string[]) => { const r = spawnSync(process.execPath, [CLI, ...a], { encoding: 'utf8', env, timeout: 15000 }); return { code: r.status, out: r.stdout }; };
const STATE = path.join(os.tmpdir(), 'punchlist');
let ok = 0; const t = async (name: string, fn: () => Promise<void> | void) => { await fn(); ok++; console.log('✓', name); };

// another program holds the first port
const foreign = net.createServer();
await new Promise<void>(r => { foreign.listen(BASE, '127.0.0.1', r); });

try {
  await t('start without --port skips a busy port and says so', () => {
    const r = cli('start', '--target', T1);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, new RegExp(`port: ${BASE + 1}\\n`));
    assert.match(r.out, new RegExp(`state: "?started \\(port ${BASE} is busy\\)"?`));
    assert.match(r.out, new RegExp(`wait --port ${BASE + 1}`), 'next steps name the port it got');
  });
  await t('start again for the same target reuses that proxy', () => {
    const r = cli('start', '--target', T1);
    assert.match(r.out, new RegExp(`port: ${BASE + 1}\\n`)); assert.match(r.out, /already running/);
  });
  await t('another target gets the next free port, and the first log is kept', () => {
    const r = cli('start', '--target', T2);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, new RegExp(`port: ${BASE + 2}\\n`));
    assert.match(r.out, new RegExp(`ports ${BASE}-${BASE + 1} are busy`));
    assert.match(fs.readFileSync(path.join(STATE, `${BASE + 1}.log`), 'utf8'), new RegExp(`proxying http://localhost:${T1}`), 'the running proxy log is not truncated');
  });
  await t('an explicit --port stays strict', () => {
    const busy = cli('start', '--target', T3, '--port', String(BASE + 1));
    assert.equal(busy.code, 1); assert.match(busy.out, /PORT_BUSY/);
    const taken = cli('start', '--target', T3, '--port', String(BASE));
    assert.equal(taken.code, 1); assert.match(taken.out, new RegExp(`port ${BASE} is in use`));
  });
  await t('start --help documents the shift and PUNCHLIST_PORT', () => {
    const r = cli('start', '--help');
    assert.match(r.out, /next free port/); assert.match(r.out, /PUNCHLIST_PORT/);
  });
} finally {
  for (const p of [BASE + 1, BASE + 2]) cli('stop', '--port', String(p));
  for (const p of [BASE, BASE + 1, BASE + 2]) fs.rmSync(path.join(STATE, `${p}.log`), { force: true });
  foreign.close();
}
console.log(`\n${ok} passed`);
