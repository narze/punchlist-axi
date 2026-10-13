// End-to-end: fixture server ← punchlist proxy ← curl-like fetches + agent CLI (wait/done/status).
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Item, OpenResult, PublicItem, SourceFile } from '../src/protocol.ts';
import { startFixture } from './fixture-server.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(here, '../scripts/punchlist-axi.mjs');
const TPORT = 39000 + Math.floor(Math.random() * 500), PPORT = TPORT + 500;
const fixture = await startFixture(TPORT);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
let ok = 0; const t = async (name: string, fn: () => Promise<void> | void) => { await fn(); ok++; console.log('✓', name); };
// A fake editor: launch-editor runs $LAUNCH_EDITOR with <file> <line> <column>.
const OPENED = path.join(os.tmpdir(), `pe-opened-${PPORT}.txt`), EDITOR = path.join(os.tmpdir(), `pe-editor-${PPORT}.sh`);
fs.writeFileSync(EDITOR, `#!/bin/sh\necho "$@" >> "${OPENED}"\n`, { mode: 0o755 });
const cli = (...a: string[]) => execFileSync(process.execPath, [CLI, ...a], { stdio: 'pipe', timeout: 15000, env: { ...process.env, LAUNCH_EDITOR: EDITOR } }).toString();
// what a failed cli() printed (AXI errors go to stdout)
const stdout = (e: unknown) => String((e as { stdout?: Buffer }).stdout);
const STATE = path.join(os.tmpdir(), 'punchlist', `${PPORT}.json`);
const readState = () => JSON.parse(fs.readFileSync(STATE, 'utf8')) as { pid: number; token: string };

try {
  let startOut;
  await t('start runs the proxy in the background and returns', () => {
    startOut = cli('start', '--target', String(TPORT), '--port', String(PPORT));
    assert.match(startOut, /__pe\/auth\?token=/);
    assert.match(startOut, /wait --port \d+/, 'tells the agent what to run next');
    assert.match(startOut, /background command.*run_in_background/, 'tells the agent to listen in the background');
    assert.match(startOut, /Alt\+Shift\+E/, 'tells the agent how the user works the picker');
    assert.match(startOut, /reply text/, 'link goes into the reply text: users do not see command output');
    assert.match(startOut, /background/, 'says how to run wait without hiding the reply');
    assert.match(startOut, /Alt\+Shift\+P.*survive reloads/, 'tells the agent about pause, the notes list and reloads');
    assert.match(startOut, /↗ Open/, 'tells the agent about open in editor');
    process.kill(readState().pid, 0); // throws if the daemon is gone
  });
  const { token } = readState();
  await t('start again with the same target reuses the running proxy', () => {
    const again = cli('start', '--target', String(TPORT), '--port', String(PPORT));
    assert.match(again, /already running/);
    assert.ok(again.includes(`token=${token}`), 'same auth link');
  });
  await t('home view lists only proxies started from this directory', () => {
    const here = execFileSync(process.execPath, [CLI], { cwd: process.cwd() }).toString();
    assert.match(here, new RegExp(`^  ${PPORT},`, 'm'));
    const elsewhere = execFileSync(process.execPath, [CLI], { cwd: os.tmpdir() }).toString();
    assert.doesNotMatch(elsewhere, new RegExp(`^  ${PPORT},`, 'm'));
    assert.match(elsewhere, /other_proxies: \d+/);
  });
  await t('start with a different target on a busy port fails', () => {
    assert.throws(() => cli('start', '--target', String(TPORT + 1), '--port', String(PPORT)), e => stdout(e).includes('already proxies'));
  });
  const P = `http://127.0.0.1:${PPORT}`, C = { cookie: `__pe_auth=${token}` };
  const get = (p: string, h: Record<string, string> = {}) => fetch(P + p, { headers: { ...C, ...h }, redirect: 'manual' });

  await t('401 without token', async () => { assert.equal((await fetch(P + '/')).status, 401); });
  await t('auth link sets cookie', async () => {
    const r = await fetch(`${P}/__pe/auth?token=${token}`, { redirect: 'manual' });
    assert.equal(r.status, 302); assert.match(r.headers.get('set-cookie') ?? '', /__pe_auth=/);
  });
  await t('injects picker, strips cookie Domain, rewrites absolute URLs', async () => {
    const r = await get('/'); const body = await r.text();
    assert.match(body, /<script src="\/__pe\/client.js" defer data-pe><\/script><\/head>/);
    assert.doesNotMatch(r.headers.get('set-cookie') ?? '', /Domain/i);
    assert.match(body, /href="\/abs"/);
  });
  await t('serves the picker gzipped when the browser accepts it', async () => {
    const js = fs.readFileSync(path.join(here, '../scripts/client.js'), 'utf8');
    const gz = await get('/__pe/client.js', { 'accept-encoding': 'gzip' });
    assert.equal(gz.headers.get('content-encoding'), 'gzip');
    assert.equal(await gz.text(), js, 'fetch decodes it back to client.js');
    const plain = await get('/__pe/client.js', { 'accept-encoding': 'identity' });
    assert.equal(plain.headers.get('content-encoding'), null);
    assert.equal(await plain.text(), js);
  });
  await t('decodes gzip and strips CSP', async () => {
    const r = await get('/gz', { 'accept-encoding': 'gzip' });
    assert.equal(r.headers.get('content-security-policy'), null);
    assert.match(await r.text(), /data-pe/);
  });
  await t('rewrites redirect Location', async () => { assert.equal((await get('/redir')).headers.get('location'), '/landed'); });
  await t('POST passes CSRF origin check from a tailnet origin', async () => {
    const r = await fetch(P + '/x', { method: 'POST', headers: { ...C, origin: 'https://box.tail1234.ts.net', 'x-forwarded-host': 'box.tail1234.ts.net' } });
    assert.equal(await r.text(), 'csrf ok');
  });
  await t('WebSocket upgrade reaches upstream with rewritten Host', async () => {
    const out = await new Promise<string>((resolve, reject) => {
      const s = net.connect(PPORT, '127.0.0.1', () => {
        s.write(`GET /cable HTTP/1.1\r\nHost: box\r\nOrigin: https://box.ts.net\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nCookie: __pe_auth=${token}\r\n\r\n`);
        setTimeout(() => { s.write('ping-after'); }, 200);
      });
      let b = ''; s.on('data', (d: Buffer) => { b += d.toString(); if (b.includes('ping-after')) { s.destroy(); resolve(b); } });
      s.on('error', reject); setTimeout(() => { reject(new Error('ws timeout')); }, 3000);
    });
    assert.match(out, /101 Switching/); assert.match(out, new RegExp(`X-Host: localhost:${TPORT}`));
  });
  await t('rejects malformed request payload', async () => {
    const r = await fetch(P + '/__pe/requests', { method: 'POST', headers: { ...C, 'content-type': 'application/json' }, body: '{"prompt":"x"}' });
    assert.equal(r.status, 400);
  });
  await t('open launches the editor on a project file at the given line', async () => {
    const open = (body: object) => fetch(P + '/__pe/open', { method: 'POST', headers: { ...C, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const r = await open({ file: 'test/fixture-server.ts', line: 6, column: 3 });
    assert.equal(r.status, 200);
    const res = await r.json() as OpenResult;
    assert.equal(res.file, 'test/fixture-server.ts');
    assert.equal(res.abs, path.resolve('test/fixture-server.ts'));
    assert.match(res.url, new RegExp(`^vscode://vscode-remote/ssh-remote\\+[^/]+@[^/]+${res.abs.replace(/[.+]/g, '\\$&')}:6:3$`), 'with the Remote-SSH URL for other machines');
    for (let i = 0; i < 50 && !fs.existsSync(OPENED); i++) await sleep(50);
    assert.equal(fs.readFileSync(OPENED, 'utf8').trim(), `${path.resolve('test/fixture-server.ts')} 6 3`);
    assert.equal((await open({ file: path.resolve('package.json') })).status, 200, 'absolute paths inside the project are fine');
    assert.equal((await open({ file: '../outside.txt' })).status, 403, 'nothing outside the project');
    assert.equal((await open({ file: '/etc/hosts' })).status, 403);
    assert.equal((await open({ file: 'app/views/missing.html.erb' })).status, 404);
    assert.equal((await open({})).status, 400);
    assert.equal((await fetch(P + '/__pe/open', { method: 'POST', body: '{"file":"package.json"}' })).status, 401, 'needs the auth cookie');
    await sleep(300); fs.rmSync(OPENED, { force: true }); // the package.json launch above writes late
    assert.equal((await open({ file: 'package.json', launch: false })).status, 200);
    await sleep(300);
    assert.equal(fs.existsSync(OPENED), false, 'launch: false only resolves');
  });
  // a scratch file inside the project, git-tracked or not but not ignored, so the browser editor may write it
  const SCRATCH = `test/scratch-${PPORT}.txt`, IGNORED = `dist/scratch-${PPORT}.txt`, BINARY = `test/scratch-${PPORT}.bin`;
  await t('the browser editor reads and saves project source files, nothing else', async () => {
    const read = (p: string) => get(`/__pe/file?path=${encodeURIComponent(p)}`);
    const save = (body: object) => fetch(P + '/__pe/file', { method: 'POST', headers: { ...C, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    fs.writeFileSync(SCRATCH, 'one\n');
    const r = await read(SCRATCH);
    assert.equal(r.status, 200);
    const src = await r.json() as SourceFile;
    assert.deepEqual({ file: src.file, content: src.content }, { file: SCRATCH, content: 'one\n' });
    const ok = await save({ file: SCRATCH, content: 'two\n', etag: src.etag });
    assert.equal(ok.status, 200);
    assert.equal(fs.readFileSync(SCRATCH, 'utf8'), 'two\n', 'written to disk');
    const { etag } = await ok.json() as { etag: string };
    assert.notEqual(etag, src.etag);
    fs.writeFileSync(SCRATCH, 'agent\n'); // someone else writes it meanwhile
    const stale = await save({ file: SCRATCH, content: 'three\n', etag });
    assert.equal(stale.status, 409, 'a save over a newer file is refused');
    assert.equal(fs.readFileSync(SCRATCH, 'utf8'), 'agent\n');
    const now = (await stale.json() as { etag: string }).etag;
    assert.equal((await save({ file: SCRATCH, content: 'three\n', etag: now })).status, 200, 'overwrite with the etag on disk');
    assert.equal(fs.readFileSync(SCRATCH, 'utf8'), 'three\n');
    assert.equal((await read('test/fixture-server.ts')).status, 200);
    assert.equal((await read('.gitignore')).status, 403, 'no dotfiles');
    assert.equal((await read('node_modules/svelte/package.json')).status, 403, 'no node_modules');
    fs.mkdirSync('dist', { recursive: true }); fs.writeFileSync(IGNORED, 'x');
    assert.equal((await read(IGNORED)).status, 403, 'nothing git ignores');
    assert.equal((await read('../outside.txt')).status, 403, 'nothing outside the project');
    assert.equal((await read('/etc/hosts')).status, 403);
    assert.equal((await read('src')).status, 404, 'not a directory');
    assert.equal((await read('missing.txt')).status, 404);
    fs.writeFileSync(BINARY, Buffer.from([1, 0, 2]));
    assert.equal((await read(BINARY)).status, 415, 'no binary files');
    assert.equal((await save({ file: '.gitignore', content: '', etag: 'x' })).status, 403, 'refused for writes too');
    assert.equal((await save({ file: SCRATCH })).status, 400);
    assert.equal((await fetch(`${P}/__pe/file?path=${SCRATCH}`)).status, 401, 'needs the auth cookie');
  });
  await t('serves the editor bundle', async () => {
    const r = await get('/__pe/editor.js', { 'accept-encoding': 'gzip' });
    assert.equal(r.status, 200);
    assert.equal(await r.text(), fs.readFileSync(path.join(here, '../scripts/editor.js'), 'utf8'));
  });
  const LONG = '<section>' + 'x'.repeat(5000) + '</section>';
  await t('wait prints the batch as TOON with hints, truncated HTML and next steps', async () => {
    const waiter = spawn(process.execPath, [CLI, 'wait', '--port', String(PPORT), '--timeout', '5']);
    let out = ''; waiter.stdout.on('data', (d: Buffer) => { out += d.toString(); });
    await sleep(300);
    const payload = { viewport: { w: 390, h: 844 }, notes: [
      { kind: 'element', path: '/', comment: 'make it bigger', elements: [{ label: 'button#buy', selector: '#buy', text: 'Buy', html: '<button id="buy">Buy</button>', styles: { 'font-size': '15px' }, hints: { rails: ['app/views/events/_cta.html.erb'] } }] },
      { kind: 'elements', path: '/', comment: 'pink border', elements: [{ label: 'div.tier', selector: '.tier:nth-of-type(1)', html: '<div class="tier"></div>' }, { label: 'section.big', selector: '.big', html: LONG }] },
      { kind: 'page', path: '/events/1', title: 'Event', comment: 'darker theme', elements: [] },
    ] };
    const r = await fetch(P + '/__pe/requests', { method: 'POST', headers: { ...C, 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    assert.equal(r.status, 201);
    const code = await new Promise(res => waiter.on('close', res));
    assert.equal(code, 0);
    assert.match(out, /^request:\n {2}id: r1\n/m);
    assert.match(out, /key: "1"/); assert.match(out, /^ +2a,div.tier,/m); assert.match(out, /^ +2b,section.big,/m);
    assert.match(out, /rails: app\/views\/events\/_cta\.html\.erb/);
    assert.match(out, /truncated, 5019 chars total/);
    assert.doesNotMatch(out, /x{1000}/, 'long HTML is cut');
    assert.doesNotMatch(out, /font-size/, 'computed styles only in show --full');
    assert.match(out, /apply the comment to every target/i, 'help for the elements kind');
    assert.match(out, /no source hint for \[2a\]/i, 'grep tip only for targets without hints');
    assert.match(out, /kind: page\n {4}comment: darker theme\n {4}page: \/events\/1\n {4}title: Event/, 'a page note has no targets');
    assert.match(out, /kind page: no target/, 'help for the page kind');
    assert.match(out, /show r1 --full/);
    assert.match(out, /done r1 /);
  });
  await t('show --full prints selectors, styles and the whole HTML', () => {
    const out = cli('show', 'r1', '--full', '--port', String(PPORT));
    assert.match(out, /selector: "?#buy"?/); assert.match(out, /font-size/); assert.match(out, /x{5000}/);
    assert.throws(() => cli('show', 'r9', '--port', String(PPORT)), e => stdout(e).includes('NOT_FOUND'));
  });
  await t('done and status after a batch', () => {
    const out = cli('done', 'r1', '1: bigger 2: border', '--port', String(PPORT));
    assert.match(out, /wait --port \d+.*background command/, 'tells the agent to listen again in the background');
    assert.match(out, /without the user asking/, 'says why: the user should not have to prompt again');
    const st = cli('status', '--port', String(PPORT));
    assert.match(st, /^ {2}r1,done,/m); assert.match(st, /1 request \(0 pending, 0 working, 1 done/);
  });
  await t('locate: the agent finds the file and hands it back with done --open', async () => {
    const waiter = spawn(process.execPath, [CLI, 'wait', '--port', String(PPORT), '--timeout', '5']);
    let out = ''; waiter.stdout.on('data', (d: Buffer) => { out += d.toString(); });
    await sleep(300);
    const payload = { kind: 'locate', notes: [{ kind: 'element', path: '/', comment: 'Find the source file of this element',
      elements: [{ label: 'img.hidden-xs', selector: 'img.hidden-xs', html: '<img class="hidden-xs">', hints: { react: ['HeroImageCarousel', 'HeroBannerByLocation'] } }] }] };
    const r = await fetch(P + '/__pe/requests', { method: 'POST', headers: { ...C, 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    assert.equal(r.status, 201);
    assert.equal((await r.json() as PublicItem).kind, 'locate', 'the browser learns the kind');
    await new Promise(res => waiter.on('close', res));
    assert.match(out, /kind: locate/);
    assert.match(out, /react: HeroImageCarousel < HeroBannerByLocation/);
    assert.match(out, /do not edit/i, 'tells the agent this is lookup only');
    assert.match(out, /done r2 --open <file>\[:line\[:col\]\]/, 'names the command that answers it');
    assert.doesNotMatch(out, /Handle every note/, 'no note-batch guidance');
    fs.rmSync(OPENED, { force: true });
    assert.throws(() => cli('done', 'r2', '--open', 'app/missing.jsx', '--port', String(PPORT)), e => stdout(e).includes('not found'), 'a wrong path fails so the agent can retry');
    assert.match(cli('status', '--port', String(PPORT)), /^ {2}r2,working,/m, 'and the request stays open');
    const done = cli('done', 'r2', '--open', 'test/fixture-server.ts:6:3', '--port', String(PPORT));
    assert.match(done, /wait --port \d+/);
    await sleep(300);
    assert.equal(fs.existsSync(OPENED), false, 'nothing is launched: the browser offers Open / Copy');
    const item = await (await get('/__pe/requests/r2')).json() as Item;
    assert.equal(item.status, 'done'); assert.equal(item.message, 'found test/fixture-server.ts:6:3');
    assert.deepEqual(item.file, { file: 'test/fixture-server.ts', line: 6, column: 3 }, 'the browser gets the file');
  });
  await t('locate for the browser editor: done --open hands the file to the browser', async () => {
    const waiter = spawn(process.execPath, [CLI, 'wait', '--port', String(PPORT), '--timeout', '5']);
    let out = ''; waiter.stdout.on('data', (d: Buffer) => { out += d.toString(); });
    await sleep(300);
    const payload = { kind: 'locate', edit: true, notes: [{ kind: 'element', path: '/', comment: 'Find the source file of this element',
      elements: [{ label: 'span', selector: 'span', html: '<span></span>', hints: { vue: ['PriceTag'] } }] }] };
    const r = await fetch(P + '/__pe/requests', { method: 'POST', headers: { ...C, 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    assert.equal(r.status, 201);
    await new Promise(res => waiter.on('close', res));
    assert.match(out, /in the editor in their browser/, 'tells the agent where it opens');
    fs.rmSync(OPENED, { force: true });
    assert.throws(() => cli('done', 'r3', '--open', '.gitignore', '--port', String(PPORT)), e => stdout(e).includes('cannot be edited in the browser'), 'only editable files');
    const done = cli('done', 'r3', '--open', 'test/fixture-server.ts:6', '--port', String(PPORT));
    assert.match(done, /wait --port \d+/);
    const item = await (await get('/__pe/requests')).json() as PublicItem[];
    const r3 = item.find(i => i.id === 'r3');
    assert.equal(r3?.status, 'done'); assert.equal(r3.message, 'found test/fixture-server.ts:6');
    assert.deepEqual(r3.file, { file: 'test/fixture-server.ts', line: 6 }, 'the browser learns the file');
    await sleep(300);
    assert.equal(fs.existsSync(OPENED), false, 'no desktop editor');
  });
  await t('wait times out with exit 0 and a definitive empty state', () => {
    const out = cli('wait', '--port', String(PPORT), '--timeout', '1');
    assert.match(out, /^request: none/m);
    assert.match(out, /wait --port \d+.*background command/, 'tells the agent to keep listening in the background');
  });
  await t('stop ends the background proxy', async () => {
    const { pid } = readState();
    cli('stop', '--port', String(PPORT));
    await sleep(300);
    assert.throws(() => process.kill(pid, 0));
    assert.equal(fs.existsSync(STATE), false);
  });
  console.log(`\n${ok} passed`);
} finally {
  try { process.kill(readState().pid); } catch {}
  fs.rmSync(STATE.replace(/\.json$/, '.log'), { force: true });
  fs.rmSync(OPENED, { force: true }); fs.rmSync(EDITOR, { force: true });
  for (const f of ['scratch.txt', 'scratch.bin']) fs.rmSync(path.join(here, f.replace('.', `-${PPORT}.`)), { force: true });
  fs.rmSync(path.join(here, `../dist/scratch-${PPORT}.txt`), { force: true });
  fixture.close();
}
