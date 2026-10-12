// AXI contract of the CLI: structured errors on stdout, exit codes 0/1/2, unknown flags rejected.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
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
t('--version is answered before the CLI loads (close to an empty-module floor)', () => {
  const time = args => { const s = performance.now(); spawnSync(process.execPath, args); return performance.now() - s; };
  const median = args => { time(args); const xs = Array.from({ length: 9 }, () => time(args)).sort((a, b) => a - b); return xs[4]; };
  // floor = an empty ES module: loading any .mjs bin costs this much (much more than `node -e` on node 18)
  const empty = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pl-')), 'empty.mjs'); fs.writeFileSync(empty, '');
  const floor = median([empty]), version = median([CLI, '--version']), full = median([CLI, 'stop', '--port', FREE]);
  assert.ok(version - floor < (full - floor) / 2, `--version ${version.toFixed(1)}ms vs floor ${floor.toFixed(1)}ms vs full CLI ${full.toFixed(1)}ms`);
});
t('no args shows the home view, not a manual', () => {
  const r = run();
  assert.equal(r.code, 0);
  assert.match(r.out, /^bin: /m); assert.match(r.out, /^description: /m); assert.match(r.out, /^help\[/m);
  assert.match(r.out, /--help` for commands and the loop/);
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
t('top-level --help is short: commands, the loop, and where to get details', () => {
  const r = run('--help');
  assert.equal(r.code, 0);
  assert.ok(r.out.split('\n').length <= 25, `--help has ${r.out.split('\n').length} lines`);
  for (const c of ['start', 'wait', 'show', 'done', 'status', 'stop']) assert.match(r.out, new RegExp(`^  ${c} `, 'm'), `lists ${c}`);
  assert.match(r.out, /<command> --help/);
});
t('start --help says how to find the dev server port', () => {
  assert.match(run('start', '--help').out, /Procfile\.dev/);
});
t('wait --help carries the source-finding guidance', () => {
  const out = run('wait', '--help').out;
  assert.match(out, /annotate_rendered_view_with_filenames/); assert.match(out, /smallest change/);
});
t('done --help explains partial failures', () => {
  assert.match(run('done', '--help').out, /still do the others/);
});
t('per-command --help is concise and lists the flags', () => {
  const r = run('wait', '--help');
  assert.equal(r.code, 0); assert.match(r.out, /--timeout/); assert.doesNotMatch(r.out, /FINDING THE SOURCE/);
});
console.log(`\n${ok} passed`);
