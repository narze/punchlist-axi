// End-to-end: fixture server ← punchlist proxy ← curl-like fetches + agent CLI (wait/done/status).
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startFixture } from './fixture-server.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(here, '../scripts/punchlist-axi.mjs');
const TPORT = 39000 + Math.floor(Math.random() * 500), PPORT = TPORT + 500;
const fixture = await startFixture(TPORT);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ok = 0; const t = async (name, fn) => { await fn(); ok++; console.log('✓', name); };
// A fake editor: launch-editor runs $LAUNCH_EDITOR with <file> <line> <column>.
const OPENED = path.join(os.tmpdir(), `pe-opened-${PPORT}.txt`), EDITOR = path.join(os.tmpdir(), `pe-editor-${PPORT}.sh`);
fs.writeFileSync(EDITOR, `#!/bin/sh\necho "$@" >> "${OPENED}"\n`, { mode: 0o755 });
const cli = (...a) => execFileSync(process.execPath, [CLI, ...a], { stdio: 'pipe', timeout: 15000, env: { ...process.env, LAUNCH_EDITOR: EDITOR } }).toString();
const STATE = path.join(os.tmpdir(), 'punchlist', `${PPORT}.json`);

try {
  let startOut;
  await t('start runs the proxy in the background and returns', async () => {
    startOut = cli('start', '--target', String(TPORT), '--port', String(PPORT));
    assert.match(startOut, /__pe\/auth\?token=/);
    assert.match(startOut, /wait --port \d+/, 'tells the agent what to run next');
    assert.match(startOut, /background command.*run_in_background/, 'tells the agent to listen in the background');
    assert.match(startOut, /Alt\+Shift\+E/, 'tells the agent how the user works the picker');
    assert.match(startOut, /reply text/, 'link goes into the reply text: users do not see command output');
    assert.match(startOut, /background/, 'says how to run wait without hiding the reply');
    assert.match(startOut, /Alt\+Shift\+P.*survive reloads/, 'tells the agent about pause, the notes list and reloads');
    assert.match(startOut, /↗ Open/, 'tells the agent about open in editor');
    process.kill(JSON.parse(fs.readFileSync(STATE, 'utf8')).pid, 0); // throws if the daemon is gone
  });
  const { token } = JSON.parse(fs.readFileSync(STATE, 'utf8'));
  await t('start again with the same target reuses the running proxy', async () => {
    const again = cli('start', '--target', String(TPORT), '--port', String(PPORT));
    assert.match(again, /already running/);
    assert.ok(again.includes(`token=${token}`), 'same auth link');
  });
  await t('home view lists only proxies started from this directory', async () => {
    const here = execFileSync(process.execPath, [CLI], { cwd: process.cwd() }).toString();
    assert.match(here, new RegExp(`^  ${PPORT},`, 'm'));
    const elsewhere = execFileSync(process.execPath, [CLI], { cwd: os.tmpdir() }).toString();
    assert.doesNotMatch(elsewhere, new RegExp(`^  ${PPORT},`, 'm'));
    assert.match(elsewhere, /other_proxies: \d+/);
  });
  await t('start with a different target on a busy port fails', async () => {
    assert.throws(() => cli('start', '--target', String(TPORT + 1), '--port', String(PPORT)), e => /already proxies/.test(e.stdout));
  });
  const P = `http://127.0.0.1:${PPORT}`, C = { cookie: `__pe_auth=${token}` };
  const get = (p, h = {}) => fetch(P + p, { headers: { ...C, ...h }, redirect: 'manual' });

  await t('401 without token', async () => assert.equal((await fetch(P + '/')).status, 401));
  await t('auth link sets cookie', async () => {
    const r = await fetch(`${P}/__pe/auth?token=${token}`, { redirect: 'manual' });
    assert.equal(r.status, 302); assert.match(r.headers.get('set-cookie'), /__pe_auth=/);
  });
  await t('injects picker, strips cookie Domain, rewrites absolute URLs', async () => {
    const r = await get('/'); const body = await r.text();
    assert.match(body, /<script src="\/__pe\/client.js" defer data-pe><\/script><\/head>/);
    assert.doesNotMatch(r.headers.get('set-cookie'), /Domain/i);
    assert.match(body, /href="\/abs"/);
  });
  await t('decodes gzip and strips CSP', async () => {
    const r = await get('/gz', { 'accept-encoding': 'gzip' });
    assert.equal(r.headers.get('content-security-policy'), null);
    assert.match(await r.text(), /data-pe/);
  });
  await t('rewrites redirect Location', async () => assert.equal((await get('/redir')).headers.get('location'), '/landed'));
  await t('POST passes CSRF origin check from a tailnet origin', async () => {
    const r = await fetch(P + '/x', { method: 'POST', headers: { ...C, origin: 'https://box.tail1234.ts.net', 'x-forwarded-host': 'box.tail1234.ts.net' } });
    assert.equal(await r.text(), 'csrf ok');
  });
  await t('WebSocket upgrade reaches upstream with rewritten Host', async () => {
    const out = await new Promise((resolve, reject) => {
      const s = net.connect(PPORT, '127.0.0.1', () => {
        s.write(`GET /cable HTTP/1.1\r\nHost: box\r\nOrigin: https://box.ts.net\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nCookie: __pe_auth=${token}\r\n\r\n`);
        setTimeout(() => s.write('ping-after'), 200);
      });
      let b = ''; s.on('data', d => { b += d; if (b.includes('ping-after')) { s.destroy(); resolve(b); } });
      s.on('error', reject); setTimeout(() => reject(new Error('ws timeout')), 3000);
    });
    assert.match(out, /101 Switching/); assert.match(out, new RegExp(`X-Host: localhost:${TPORT}`));
  });
  await t('rejects malformed request payload', async () => {
    const r = await fetch(P + '/__pe/requests', { method: 'POST', headers: { ...C, 'content-type': 'application/json' }, body: '{"prompt":"x"}' });
    assert.equal(r.status, 400);
  });
  await t('open launches the editor on a project file at the given line', async () => {
    const open = body => fetch(P + '/__pe/open', { method: 'POST', headers: { ...C, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const r = await open({ file: 'test/fixture-server.mjs', line: 6, column: 3 });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).file, 'test/fixture-server.mjs');
    for (let i = 0; i < 50 && !fs.existsSync(OPENED); i++) await sleep(50);
    assert.equal(fs.readFileSync(OPENED, 'utf8').trim(), `${path.resolve('test/fixture-server.mjs')} 6 3`);
    assert.equal((await open({ file: path.resolve('package.json') })).status, 200, 'absolute paths inside the project are fine');
    assert.equal((await open({ file: '../outside.txt' })).status, 403, 'nothing outside the project');
    assert.equal((await open({ file: '/etc/hosts' })).status, 403);
    assert.equal((await open({ file: 'app/views/missing.html.erb' })).status, 404);
    assert.equal((await open({})).status, 400);
    assert.equal((await fetch(P + '/__pe/open', { method: 'POST', body: '{"file":"package.json"}' })).status, 401, 'needs the auth cookie');
  });
  const LONG = '<section>' + 'x'.repeat(5000) + '</section>';
  await t('wait prints the batch as TOON with hints, truncated HTML and next steps', async () => {
    const waiter = spawn(process.execPath, [CLI, 'wait', '--port', String(PPORT), '--timeout', '5']);
    let out = ''; waiter.stdout.on('data', d => out += d);
    await sleep(300);
    const payload = { viewport: { w: 390, h: 844 }, notes: [
      { kind: 'element', path: '/', comment: 'make it bigger', elements: [{ label: 'button#buy', selector: '#buy', text: 'Buy', html: '<button id="buy">Buy</button>', styles: { 'font-size': '15px' }, hints: { rails: ['app/views/events/_cta.html.erb'] } }] },
      { kind: 'elements', path: '/', comment: 'pink border', elements: [{ label: 'div.tier', selector: '.tier:nth-of-type(1)', html: '<div class="tier"></div>' }, { label: 'section.big', selector: '.big', html: LONG }] },
    ] };
    const r = await fetch(P + '/__pe/requests', { method: 'POST', headers: { ...C, 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    assert.equal(r.status, 201);
    const code = await new Promise(res => waiter.on('close', res));
    assert.equal(code, 0);
    assert.match(out, /^request:\n  id: r1\n/m);
    assert.match(out, /key: "1"/); assert.match(out, /^ +2a,div.tier,/m); assert.match(out, /^ +2b,section.big,/m);
    assert.match(out, /rails: app\/views\/events\/_cta\.html\.erb/);
    assert.match(out, /truncated, 5019 chars total/);
    assert.doesNotMatch(out, /x{1000}/, 'long HTML is cut');
    assert.doesNotMatch(out, /font-size/, 'computed styles only in show --full');
    assert.match(out, /apply the comment to every target/i, 'help for the elements kind');
    assert.match(out, /no source hint for \[2a\]/i, 'grep tip only for targets without hints');
    assert.match(out, /show r1 --full/);
    assert.match(out, /done r1 /);
  });
  await t('show --full prints selectors, styles and the whole HTML', async () => {
    const out = cli('show', 'r1', '--full', '--port', String(PPORT));
    assert.match(out, /selector: "?#buy"?/); assert.match(out, /font-size/); assert.match(out, /x{5000}/);
    assert.throws(() => cli('show', 'r9', '--port', String(PPORT)), e => /NOT_FOUND/.test(e.stdout));
  });
  await t('done and status after a batch', async () => {
    const out = cli('done', 'r1', '1: bigger 2: border', '--port', String(PPORT));
    assert.match(out, /wait --port \d+.*background command/, 'tells the agent to listen again in the background');
    assert.match(out, /without the user asking/, 'says why: the user should not have to prompt again');
    const st = cli('status', '--port', String(PPORT));
    assert.match(st, /^  r1,done,/m); assert.match(st, /1 request \(0 pending, 0 working, 1 done/);
  });
  await t('locate: the agent finds the file and opens it with done --open', async () => {
    const waiter = spawn(process.execPath, [CLI, 'wait', '--port', String(PPORT), '--timeout', '5']);
    let out = ''; waiter.stdout.on('data', d => out += d);
    await sleep(300);
    const payload = { kind: 'locate', notes: [{ kind: 'element', path: '/', comment: 'Find the source file of this element',
      elements: [{ label: 'img.hidden-xs', selector: 'img.hidden-xs', html: '<img class="hidden-xs">', hints: { react: ['HeroImageCarousel', 'HeroBannerByLocation'] } }] }] };
    const r = await fetch(P + '/__pe/requests', { method: 'POST', headers: { ...C, 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    assert.equal(r.status, 201);
    assert.equal((await r.json()).kind, 'locate', 'the browser learns the kind');
    await new Promise(res => waiter.on('close', res));
    assert.match(out, /kind: locate/);
    assert.match(out, /react: HeroImageCarousel < HeroBannerByLocation/);
    assert.match(out, /do not edit/i, 'tells the agent this is lookup only');
    assert.match(out, /done r2 --open <file>\[:line\[:col\]\]/, 'names the command that answers it');
    assert.doesNotMatch(out, /Handle every note/, 'no note-batch guidance');
    fs.rmSync(OPENED, { force: true });
    assert.throws(() => cli('done', 'r2', '--open', 'app/missing.jsx', '--port', String(PPORT)), e => /not found/.test(e.stdout), 'a wrong path fails so the agent can retry');
    assert.match(cli('status', '--port', String(PPORT)), /^  r2,working,/m, 'and the request stays open');
    const done = cli('done', 'r2', '--open', 'test/fixture-server.mjs:6:3', '--port', String(PPORT));
    assert.match(done, /wait --port \d+/);
    for (let i = 0; i < 50 && !fs.existsSync(OPENED); i++) await sleep(50);
    assert.equal(fs.readFileSync(OPENED, 'utf8').trim(), `${path.resolve('test/fixture-server.mjs')} 6 3`);
    const item = await (await get('/__pe/requests/r2')).json();
    assert.equal(item.status, 'done'); assert.equal(item.message, 'opened test/fixture-server.mjs:6:3');
  });
  await t('wait times out with exit 0 and a definitive empty state', async () => {
    const out = cli('wait', '--port', String(PPORT), '--timeout', '1');
    assert.match(out, /^request: none/m);
    assert.match(out, /wait --port \d+.*background command/, 'tells the agent to keep listening in the background');
  });
  await t('stop ends the background proxy', async () => {
    const { pid } = JSON.parse(fs.readFileSync(STATE, 'utf8'));
    cli('stop', '--port', String(PPORT));
    await sleep(300);
    assert.throws(() => process.kill(pid, 0));
    assert.equal(fs.existsSync(STATE), false);
  });
  console.log(`\n${ok} passed`);
} finally {
  try { process.kill(JSON.parse(fs.readFileSync(STATE, 'utf8')).pid); } catch {}
  fs.rmSync(STATE.replace(/\.json$/, '.log'), { force: true });
  fs.rmSync(OPENED, { force: true }); fs.rmSync(EDITOR, { force: true });
  fixture.close();
}
