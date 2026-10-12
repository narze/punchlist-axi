// AXI contract of the CLI: structured errors on stdout, exit codes 0/1/2, unknown flags rejected.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), '../scripts/punchlist.mjs');
const FREE = String(41000 + Math.floor(Math.random() * 500)); // a port with no proxy
const run = (...a) => { const r = spawnSync(process.execPath, [CLI, ...a], { encoding: 'utf8', timeout: 15000 }); return { code: r.status, out: r.stdout, err: r.stderr }; };
let ok = 0; const t = (name, fn) => { fn(); ok++; console.log('✓', name); };

t('--version prints the bare version', () => {
  const r = run('--version');
  assert.equal(r.code, 0); assert.equal(r.out, '0.1.0\n');
});
t('no args shows the home view, not a manual', () => {
  const r = run();
  assert.equal(r.code, 0);
  assert.match(r.out, /^bin: /m); assert.match(r.out, /^description: /m); assert.match(r.out, /^help\[/m);
});
t('unknown command: exit 2, structured error on stdout', () => {
  const r = run('bogus');
  assert.equal(r.code, 2); assert.match(r.out, /^error: /m); assert.equal(r.err, '');
});
t('unknown flag is rejected and valid flags are listed', () => {
  const r = run('status', '--prot', FREE);
  assert.equal(r.code, 2); assert.match(r.out, /unknown flag --prot/); assert.match(r.out, /--port/);
});
t('missing --target is a usage error', () => {
  const r = run('start');
  assert.equal(r.code, 2); assert.match(r.out, /^error: .*--target/m);
});
t('done without an id is a usage error', () => {
  const r = run('done', '--port', FREE);
  assert.equal(r.code, 2); assert.match(r.out, /^error: /m);
});
t('show without an id is a usage error', () => {
  const r = run('show', '--port', FREE);
  assert.equal(r.code, 2); assert.match(r.out, /^error: /m);
});
t('stop when nothing runs is a no-op', () => {
  const r = run('stop', '--port', FREE);
  assert.equal(r.code, 0); assert.match(r.out, /no proxy running.*no-op/);
});
t('wait with no proxy: exit 1 and says how to start one', () => {
  const r = run('wait', '--port', FREE);
  assert.equal(r.code, 1); assert.match(r.out, /^error: /m); assert.match(r.out, /start --target/);
});
t('per-command --help is concise and lists the flags', () => {
  const r = run('wait', '--help');
  assert.equal(r.code, 0); assert.match(r.out, /--timeout/); assert.doesNotMatch(r.out, /FINDING THE SOURCE/);
});
console.log(`\n${ok} passed`);
