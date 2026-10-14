// Idle exit: the detached proxy stops by itself after --idle-timeout seconds without a request.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), '../scripts/punchlist-axi.mjs');
const PORT = 44000 + Math.floor(Math.random() * 500), TARGET = String(PORT + 600); // nothing listens on the target
const cli = (...a: string[]) => { const r = spawnSync(process.execPath, [CLI, ...a], { encoding: 'utf8', timeout: 15000 }); return { code: r.status, out: r.stdout }; };
const STATE = path.join(os.tmpdir(), 'punchlist', `${PORT}.json`);
const LOG = path.join(os.tmpdir(), 'punchlist', `${PORT}.log`);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const alive = (pid: number) => { try { process.kill(pid, 0); return true; } catch { return false; } };
let ok = 0; const t = async (name: string, fn: () => Promise<void> | void) => { await fn(); ok++; console.log('✓', name); };

try {
  await t('a bad --idle-timeout is rejected before starting', () => {
    for (const v of ['soon', '-1', '', ' ']) { // a blank value must not quietly mean 0 = never
      const r = cli('start', '--target', TARGET, '--port', String(PORT), '--idle-timeout', v);
      assert.equal(r.code, 2, r.out); assert.match(r.out, /--idle-timeout must be a number/);
      assert.ok(!fs.existsSync(STATE));
    }
  });
  await t('requests keep the proxy alive, then it exits when idle', async () => {
    const r = cli('start', '--target', TARGET, '--port', String(PORT), '--idle-timeout', '2');
    assert.equal(r.code, 0, r.out);
    const { pid } = JSON.parse(fs.readFileSync(STATE, 'utf8')) as { pid: number };
    for (let i = 0; i < 6; i++) { await sleep(500); const s = cli('status', '--port', String(PORT)); assert.equal(s.code, 0, s.out); }
    assert.ok(alive(pid), 'still running after 3s of requests');
    const w = cli('wait', '--port', String(PORT), '--timeout', '4'); // one long-poll that outlasts the idle timeout
    assert.equal(w.code, 0, w.out); assert.match(w.out, /request: none/);
    assert.ok(alive(pid), 'an open wait keeps it running');
    for (let i = 0; i < 40 && alive(pid); i++) await sleep(100);
    assert.ok(!alive(pid), 'exited after 2s without requests');
    assert.ok(!fs.existsSync(STATE), 'removed its state file');
    assert.match(fs.readFileSync(LOG, 'utf8'), /no requests for 2s, exiting/);
  });
  await t('start --help documents --idle-timeout', () => {
    assert.match(cli('start', '--help').out, /--idle-timeout.*default 3600; 0 = never/s);
  });
} finally {
  cli('stop', '--port', String(PORT));
  fs.rmSync(LOG, { force: true });
}
console.log(`\n${ok} passed`);
