#!/usr/bin/env node
// punchlist — proxy any local web app, inject an element picker, and queue
// "change this element" requests for whatever coding agent is running the loop.
// Zero dependencies. Node >= 18 or Bun.
//
//   punchlist start --target 3000 [--port 4000] [--host 127.0.0.1] [--no-auth]   (background)
//   punchlist serve --target 3000 [...]                                          (foreground)
//   punchlist wait  [--port 4000] [--timeout 540] [--json]
//   punchlist done  <id> ["summary"] [--failed] [--port 4000]
//   punchlist status [--port 4000]
//   punchlist stop   [--port 4000]

import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import zlib from 'node:zlib';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(import.meta.url);
const DIR = path.dirname(SCRIPT);
const STATE_DIR = path.join(os.tmpdir(), 'punchlist');
const PREFIX = '/__pe';
const COOKIE = '__pe_auth';

// ---------------------------------------------------------------- utils

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { args._.push(a); continue; }
    const eq = a.indexOf('=');
    if (eq > -1) { args[a.slice(2, eq)] = a.slice(eq + 1); continue; }
    const k = a.slice(2);
    if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) args[k] = argv[++i];
    else args[k] = true;
  }
  return args;
}

function normalizeTarget(t) {
  if (!t) die('missing --target (e.g. --target 3000 or --target http://localhost:5173)');
  t = String(t);
  if (/^\d+$/.test(t)) return `http://localhost:${t}`;
  if (!/^https?:\/\//.test(t)) return `http://${t}`;
  return t.replace(/\/+$/, '');
}

function die(msg, code = 1) { console.error(`punchlist: ${msg}`); process.exit(code); }

function statePath(port) { return path.join(STATE_DIR, `${port}.json`); }

function loadState(args) {
  if (args.port) {
    const p = statePath(args.port);
    if (!fs.existsSync(p)) die(`no server on port ${args.port}. Start one with: node ${SCRIPT} start --target <port>`, 3);
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  const files = fs.existsSync(STATE_DIR) ? fs.readdirSync(STATE_DIR).filter(f => f.endsWith('.json')) : [];
  if (!files.length) die(`no running server. Start one with: node ${SCRIPT} start --target <port>`, 3);
  files.sort((a, b) => fs.statSync(path.join(STATE_DIR, b)).mtimeMs - fs.statSync(path.join(STATE_DIR, a)).mtimeMs);
  return JSON.parse(fs.readFileSync(path.join(STATE_DIR, files[0]), 'utf8'));
}

function apiBase(st) {
  const h = ['0.0.0.0', '::', ''].includes(st.host) ? '127.0.0.1' : st.host;
  return `http://${h.includes(':') ? `[${h}]` : h}:${st.port}${PREFIX}`;
}

function readBody(req, limit = 2e6) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(new Error('body too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function json(res, status, obj) {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function getCookie(header, name) {
  for (const part of (header || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

function stripCookie(header, name) {
  if (!header) return header;
  const kept = header.split(';').map(s => s.trim()).filter(s => s && !s.startsWith(name + '='));
  return kept.length ? kept.join('; ') : undefined;
}

function tailscaleName() {
  try {
    const out = execFileSync('tailscale', ['status', '--json'], { stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 });
    return JSON.parse(out).Self?.DNSName?.replace(/\.$/, '') || null;
  } catch { return null; }
}

// ---------------------------------------------------------------- start (background) / serve (foreground)

function alive(pid) { try { process.kill(pid, 0); return true; } catch { return false; } }

function printInfo(st) {
  const authPath = st.auth === false ? '/' : `${PREFIX}/auth?token=${st.token}`;
  const ts = tailscaleName();
  console.log(`punchlist: proxying ${st.target}`);
  console.log(`  Local:     http://${st.host === '0.0.0.0' ? '127.0.0.1' : st.host}:${st.port}${authPath}`);
  if (ts) {
    console.log(`  Tailscale: run \`tailscale serve --bg ${st.port}\`, then open`);
    console.log(`             https://${ts}${authPath}`);
  }
  console.log(`  Agent:     node ${SCRIPT} wait --port ${st.port}`);
}

// Runs `serve` as a detached child so the agent's shell is free, and returns once it listens.
async function cmdStart(args) {
  const target = new URL(normalizeTarget(args.target ?? args._[1])).origin;
  const port = Number(args.port ?? 4000);
  const p = statePath(port);
  const old = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
  if (old && alive(old.pid)) {
    if (old.target !== target) die(`port ${port} already proxies ${old.target}. Stop it with \`node ${SCRIPT} stop --port ${port}\` or pick another --port`);
    console.log(`punchlist is already running (pid ${old.pid}).`);
    printInfo(old);
    return nextStep(old);
  }
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.rmSync(p, { force: true });
  const logFile = path.join(STATE_DIR, `${port}.log`);
  const fd = fs.openSync(logFile, 'w');
  const child = spawn(process.execPath, [SCRIPT, 'serve', ...process.argv.slice(3)], { detached: true, stdio: ['ignore', fd, fd] });
  child.unref();
  fs.closeSync(fd);
  let exited = false; child.on('exit', () => { exited = true; });
  for (let i = 0; i < 100 && !exited; i++) {
    await new Promise(r => setTimeout(r, 100));
    const st = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
    if (st?.pid === child.pid) { printInfo(st); console.log(`  Log:       ${logFile}`); return nextStep(st); }
  }
  if (!exited) child.kill();
  die(`proxy did not start. Log (${logFile}):\n${fs.readFileSync(logFile, 'utf8').trim()}`);
}

function nextStep(st) {
  console.log(`
Next: give the user the link above. Then run \`node ${SCRIPT} wait --port ${st.port}\` in the foreground and keep
re-running it (exit 2 = nothing yet). Each request it prints says how to report back with \`done\`.`);
}

function cmdServe(args) {
  const target = new URL(normalizeTarget(args.target ?? args._[1]));
  const port = Number(args.port ?? 4000);
  const host = args.host ?? '127.0.0.1';
  const noAuth = args['no-auth'] === true;
  const token = String(args.token ?? crypto.randomBytes(12).toString('base64url'));
  const targetPort = target.port || (target.protocol === 'https:' ? 443 : 80);
  const lib = target.protocol === 'https:' ? https : http;

  // Absolute URLs the app may print for itself (rewritten to relative in HTML).
  const selfOrigins = [target.origin];
  if (['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)) {
    for (const h of ['localhost', '127.0.0.1', '[::1]']) selfOrigins.push(`${target.protocol}//${h}:${targetPort}`);
  }
  const origins = [...new Set(selfOrigins)];

  const items = [];          // { id, status: pending|working|done|failed, createdAt, payload, message }
  const waiters = new Set(); // long-poll responses from `wait`
  const sse = new Set();
  let seq = 0;

  const summarize = p => {
    const n = p.notes.length;
    return { label: n === 1 ? p.notes[0].comment.slice(0, 60) : `${n} notes`, prompt: p.notes.map(x => x.comment).join(' | ') };
  };
  const publicItem = it => ({ id: it.id, status: it.status, message: it.message, ...summarize(it.payload) });
  const broadcast = obj => { const line = `data: ${JSON.stringify(obj)}\n\n`; for (const r of sse) r.write(line); };

  function dispatch() {
    for (const w of waiters) {
      const it = items.find(i => i.status === 'pending');
      if (!it) return;
      it.status = 'working';
      waiters.delete(w);
      clearTimeout(w.timer);
      json(w.res, 200, it);
      broadcast({ type: 'update', item: publicItem(it) });
    }
  }

  function authed(req) {
    if (noAuth) return true;
    return getCookie(req.headers.cookie, COOKIE) === token || req.headers['x-pe-token'] === token;
  }

  function upstreamHeaders(req) {
    const h = { ...req.headers };
    // Look like a plain local request so dev servers don't trip on host checks
    // (Rails config.hosts, Vite allowedHosts) or CSRF origin checks.
    h.host = target.host;
    if (h.origin) h.origin = target.origin;
    if (h.referer) { try { const u = new URL(h.referer); h.referer = target.origin + u.pathname + u.search; } catch {} }
    for (const k of Object.keys(h)) if (k.startsWith('x-forwarded-') || k === 'forwarded' || k === 'x-pe-token') delete h[k];
    delete h['accept-encoding']; // ask for identity so HTML can be rewritten (decoded anyway if ignored)
    const c = stripCookie(h.cookie, COOKIE);
    if (c) h.cookie = c; else delete h.cookie;
    return h;
  }

  function rewriteLocation(loc) {
    for (const o of origins) if (loc === o || loc.startsWith(o + '/') || loc.startsWith(o + '?')) return loc.slice(o.length) || '/';
    return loc;
  }

  function injectHtml(html) {
    for (const o of origins) html = html.split(o + '/').join('/').split(o).join('/');
    const tag = `<script src="${PREFIX}/client.js" defer data-pe></script>`;
    if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, tag + '</head>');
    if (/<body[^>]*>/i.test(html)) return html.replace(/<body[^>]*>/i, m => m + tag);
    return html + tag;
  }

  function proxy(req, res) {
    const upReq = lib.request({
      hostname: target.hostname.replace(/^\[|\]$/g, ''), port: targetPort, method: req.method, path: req.url,
      headers: upstreamHeaders(req), rejectUnauthorized: false,
    }, upRes => {
      const h = { ...upRes.headers };
      delete h['content-security-policy'];
      delete h['content-security-policy-report-only'];
      if (h.location) h.location = rewriteLocation(h.location);
      if (h['set-cookie']) h['set-cookie'] = h['set-cookie'].map(c => c.replace(/;\s*domain=[^;]*/i, ''));

      const isHtml = /text\/html/i.test(h['content-type'] || '');
      if (!isHtml || req.method === 'HEAD' || upRes.statusCode === 204 || upRes.statusCode === 304) {
        res.writeHead(upRes.statusCode, h);
        upRes.pipe(res);
        return;
      }
      let stream = upRes;
      const enc = String(h['content-encoding'] || '').toLowerCase();
      if (enc === 'gzip') stream = upRes.pipe(zlib.createGunzip());
      else if (enc === 'br') stream = upRes.pipe(zlib.createBrotliDecompress());
      else if (enc === 'deflate') stream = upRes.pipe(zlib.createInflate());
      const chunks = [];
      stream.on('data', c => chunks.push(c));
      stream.on('error', e => { if (!res.headersSent) res.writeHead(502); res.end(`punchlist: decode error ${e.message}`); });
      stream.on('end', () => {
        const body = Buffer.from(injectHtml(Buffer.concat(chunks).toString('utf8')), 'utf8');
        delete h['content-encoding'];
        delete h['transfer-encoding'];
        h['content-length'] = String(body.length);
        res.writeHead(upRes.statusCode, h);
        res.end(body);
      });
    });
    upReq.on('error', e => {
      if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(`punchlist: cannot reach ${target.origin} (${e.code || e.message}). Is the dev server running?`);
    });
    req.pipe(upReq);
  }

  async function api(req, res, url) {
    const p = url.pathname.slice(PREFIX.length);
    if (p === '/client.js') {
      res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' });
      return res.end(fs.readFileSync(path.join(DIR, 'client.js'), 'utf8'));
    }
    if (p === '/requests' && req.method === 'POST') {
      let payload;
      try { payload = JSON.parse(await readBody(req)); } catch (e) { return json(res, 400, { error: e.message }); }
      if (!Array.isArray(payload.notes) || !payload.notes.length || payload.notes.some(n => !n.comment?.trim() || !n.elements?.length))
        return json(res, 400, { error: 'expected { notes: [{ comment, elements: [...] }] }' });
      const it = { id: `r${++seq}`, status: 'pending', createdAt: new Date().toISOString(), payload, message: null };
      items.push(it);
      log(`received ${it.id}: ${summarize(payload).prompt.slice(0, 100)}`);
      broadcast({ type: 'update', item: publicItem(it) });
      dispatch();
      return json(res, 201, publicItem(it));
    }
    if (p === '/requests' && req.method === 'GET') return json(res, 200, items.map(publicItem));
    let m;
    if ((m = p.match(/^\/requests\/([\w-]+)\/done$/)) && req.method === 'POST') {
      const it = items.find(i => i.id === m[1]);
      if (!it) return json(res, 404, { error: 'unknown id' });
      let body = {};
      try { body = JSON.parse((await readBody(req)) || '{}'); } catch {}
      it.status = body.status === 'failed' ? 'failed' : 'done';
      it.message = body.message || null;
      log(`${it.status} ${it.id}${it.message ? `: ${it.message}` : ''}`);
      broadcast({ type: 'update', item: publicItem(it) });
      return json(res, 200, publicItem(it));
    }
    if (p === '/next' && req.method === 'GET') {
      const timeout = Math.min(Number(url.searchParams.get('timeout')) || 25000, 60000);
      const w = { res };
      w.timer = setTimeout(() => { waiters.delete(w); res.writeHead(204); res.end(); }, timeout);
      req.on('close', () => { clearTimeout(w.timer); waiters.delete(w); });
      waiters.add(w);
      return dispatch();
    }
    if (p === '/events') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
      res.write(`data: ${JSON.stringify({ type: 'snapshot', items: items.map(publicItem) })}\n\n`);
      sse.add(res);
      const ka = setInterval(() => res.write(': ka\n\n'), 25000);
      req.on('close', () => { clearInterval(ka); sse.delete(res); });
      return;
    }
    json(res, 404, { error: 'not found' });
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === `${PREFIX}/auth`) {
      const next = url.searchParams.get('next');
      const dest = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
      if (noAuth || url.searchParams.get('token') === token) {
        res.writeHead(302, { 'set-cookie': `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`, location: dest });
      } else res.writeHead(403, { 'content-type': 'text/plain' });
      return res.end(res.statusCode === 403 ? 'punchlist: bad token' : '');
    }
    if (!authed(req)) {
      res.writeHead(401, { 'content-type': 'text/plain; charset=utf-8' });
      return res.end('punchlist: open the link printed by `punchlist start` (it carries the access token).');
    }
    if (url.pathname.startsWith(PREFIX + '/')) return api(req, res, url).catch(e => json(res, 500, { error: e.message }));
    proxy(req, res);
  });

  // WebSockets (Vite HMR, ActionCable, LiveReload…): raw pipe after rewriting headers.
  server.on('upgrade', (req, socket, head) => {
    if (!authed(req)) return socket.end('HTTP/1.1 401 Unauthorized\r\n\r\n');
    const opts = { host: target.hostname.replace(/^\[|\]$/g, ''), port: targetPort, servername: target.hostname, rejectUnauthorized: false };
    const up = (target.protocol === 'https:' ? tls : net).connect(opts, () => {
      let raw = `${req.method} ${req.url} HTTP/1.1\r\n`;
      const h = upstreamHeaders(req);
      for (const [k, v] of Object.entries(h)) for (const vv of [].concat(v)) raw += `${k}: ${vv}\r\n`;
      up.write(raw + '\r\n');
      if (head?.length) up.write(head);
      up.pipe(socket); socket.pipe(up);
    });
    up.on('error', () => socket.destroy());
    socket.on('error', () => up.destroy());
  });

  function log(msg) { console.log(`[punchlist ${new Date().toLocaleTimeString()}] ${msg}`); }

  server.listen(port, host, () => {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    const st = { port, host, target: target.origin, token, auth: !noAuth, pid: process.pid };
    fs.writeFileSync(statePath(port), JSON.stringify(st));
    printInfo(st);
  });
  server.on('error', e => die(e.code === 'EADDRINUSE' ? `port ${port} is in use (pick another with --port)` : e.message));

  const cleanup = () => { try { fs.unlinkSync(statePath(port)); } catch {} process.exit(0); };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

// ---------------------------------------------------------------- agent side

function formatItem(it, port) {
  const { notes, viewport } = it.payload;
  const out = [`## Edit request ${it.id} — ${notes.length} note${notes.length > 1 ? 's' : ''}`];
  if (viewport) out.push(`Viewport: ${viewport.w}×${viewport.h}`);
  out.push('', 'Handle every note. Notes may touch the same file; read each target before editing.', '');
  notes.forEach((n, i) => {
    const no = i + 1;
    const what = n.kind === 'text' ? `selected text in ${n.elements[0].label}`
      : n.kind === 'elements' ? `${n.elements.length} elements`
      : n.kind === 'area' ? `area ${Math.round(n.area.width)}×${Math.round(n.area.height)} inside ${n.elements[0].label}`
      : n.elements[0].label;
    out.push(`### Note ${no}: ${n.comment}`);
    out.push(`- Target: ${what}${n.frozen ? ' (captured with animations paused)' : ''}`);
    out.push(`- Page: ${n.path}${n.title ? ` — "${n.title}"` : ''}`);
    if (n.kind === 'text') out.push(`- Selected text: ${JSON.stringify(n.text)} (change this text specifically)`);
    if (n.kind === 'area') out.push(`- Area at page (${Math.round(n.area.x)}, ${Math.round(n.area.y)}); the user boxed empty space inside the target — the change belongs there`);
    n.elements.forEach((e, j) => {
      const key = n.elements.length > 1 ? `${no}${'abcdef'[j]}` : `${no}`;
      out.push('', `#### [${key}] \`${e.label}\``);
      out.push(`- Selector: \`${e.selector}\``);
      if (e.ancestors?.length) out.push(`- Inside: ${e.ancestors.map(a => `\`${a}\``).join(' > ')}`);
      const h = e.hints || {}, hints = [];
      if (h.svelte?.length) hints.push(`Svelte ${h.svelte.join(', ')}`);
      if (h.rails?.length) hints.push(`Rails templates (outer → inner): ${h.rails.join(' > ')}`);
      if (h.react?.length) hints.push(`React ${h.react.join(' < ')}`);
      if (h.vue?.length) hints.push(`Vue ${h.vue.join(' < ')}`);
      out.push(`- Source hints: ${hints.length ? hints.join('; ') : 'none — grep for the text, ids, classes or data-* attributes'}`);
      if (e.text) out.push(`- Visible text: ${JSON.stringify(e.text)}`);
      if (e.styles) out.push(`- Computed styles: ${Object.entries(e.styles).map(([k, v]) => `${k}: ${v}`).join('; ')}`);
      if (e.rect) out.push(`- Box: ${Math.round(e.rect.width)}×${Math.round(e.rect.height)} at page (${Math.round(e.rect.x)}, ${Math.round(e.rect.y)})`);
      out.push('```html', e.html, '```');
    });
    out.push('');
  });
  out.push(`When finished: node ${SCRIPT} done ${it.id} "<one line per note, e.g. 1: … 2: …>" --port ${port}   (add --failed if nothing could be done)`);
  out.push(`Then listen again: node ${SCRIPT} wait --port ${port}`);
  return out.join('\n');
}

async function cmdWait(args) {
  const st = loadState(args);
  const deadline = Date.now() + Number(args.timeout ?? 540) * 1000;
  while (Date.now() < deadline) {
    const left = Math.max(1000, Math.min(25000, deadline - Date.now()));
    let r;
    try { r = await fetch(`${apiBase(st)}/next?timeout=${left}`, { headers: { 'x-pe-token': st.token } }); }
    catch { die(`server on port ${st.port} is not responding — is it still running?`, 3); }
    if (r.status === 200) {
      const it = await r.json();
      console.log(args.json ? JSON.stringify(it, null, 2) : formatItem(it, st.port));
      return;
    }
    if (r.status !== 204) die(`unexpected ${r.status}: ${await r.text()}`);
  }
  console.log('NO_REQUEST — nothing picked yet. Run `wait` again to keep listening.');
  process.exit(2);
}

async function cmdDone(args) {
  const st = loadState(args);
  const id = args._[1];
  if (!id) die('usage: done <id> ["summary"] [--failed]');
  const r = await fetch(`${apiBase(st)}/requests/${id}/done`, {
    method: 'POST', headers: { 'x-pe-token': st.token, 'content-type': 'application/json' },
    body: JSON.stringify({ status: args.failed ? 'failed' : 'done', message: args._.slice(2).join(' ') || null }),
  }).catch(() => die('server not responding', 3));
  if (!r.ok) die(`${r.status} ${await r.text()}`);
  console.log(`marked ${id} as ${args.failed ? 'failed' : 'done'}`);
}

async function cmdStatus(args) {
  const st = loadState(args);
  const r = await fetch(`${apiBase(st)}/requests`, { headers: { 'x-pe-token': st.token } }).catch(() => die('server not responding', 3));
  const list = await r.json();
  console.log(`port ${st.port} → ${st.target} (pid ${st.pid})`);
  for (const i of list) console.log(`  ${i.id}  ${i.status.padEnd(8)} “${i.prompt}”${i.message ? `  → ${i.message}` : ''}`);
  if (!list.length) console.log('  (no requests yet)');
}

function cmdStop(args) {
  const st = loadState(args);
  try { process.kill(st.pid, 'SIGTERM'); console.log(`stopped punchlist on port ${st.port}`); }
  catch { fs.rmSync(statePath(st.port), { force: true }); console.log('process was already gone; cleaned up state'); }
}

// ---------------------------------------------------------------- main

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];
const cmds = { start: cmdStart, serve: cmdServe, wait: cmdWait, done: cmdDone, status: cmdStatus, stop: cmdStop };
const PE = `node ${SCRIPT}`;
const GUIDE = `punchlist - click-to-edit for any running web app. A local proxy injects a picker into every
page; the user taps elements, writes notes and presses Send; you pull the batch, edit the source, report back.

COMMANDS
  ${PE} start --target <port|url> [--port 4000] [--host 127.0.0.1] [--no-auth]
      Start the proxy in the background (returns at once; re-running with the same target is safe).
      --target is the dev server port or URL. --host 0.0.0.0 listens on all interfaces.
      --no-auth only for purely local use.
  ${PE} serve ...          Same as start, but stays in the foreground (debugging).
  ${PE} wait [--port 4000] [--timeout 540] [--json]
      Block until the user sends a batch. Exit 2 = nothing yet, exit 3 = proxy gone.
  ${PE} done <id> "<one line per note>" [--failed] [--port 4000]
  ${PE} status [--port 4000]    List requests.
  ${PE} stop [--port 4000]      Stop the proxy when the user is finished.

WORKFLOW
  1. Find the dev server port (running processes, Procfile.dev, bin/dev, package.json scripts, the
     conversation; ask the user only if unclear). Run start. Give the user the printed link exactly:
     its token sets a cookie, and without it every page returns 401. If a Tailscale line is printed
     and the user wants phone access, tell them to run \`tailscale serve --bg <port>\` and open the
     HTTPS link. Never suggest \`tailscale funnel\`: anyone who reaches the proxy can make you edit code.
  2. Tell the user briefly: press ◎ (Alt+Shift+E), tap an element or drag a box, write a note,
     repeat, then press Send. With ◎ off, selecting text shows an Annotate button. ⏸ (Alt+Shift+P)
     pauses animations. 🗒 lists notes. Notes survive reloads until sent.
  3. Run wait in the foreground. On exit 2, run it again without commentary; keep going until the
     user tells you to stop. On exit 3, check the log and run start again.
  4. A request holds notes with targets keyed [1], [2] or [3a], [3b]. Kinds: element (one target),
     elements (apply to all; often a shared partial/component), text (change that exact text; it may
     live in an i18n file), area (empty space boxed; change belongs at that spot in the container).
     Handle every note, then run done once with a short line per note. If some notes fail, still do
     the others and say which failed; use --failed only when nothing could be done. Then wait again.

FINDING THE SOURCE (in this order)
  1. Svelte file:line:col or React _debugSource - open it directly.
  2. Rails templates - the last entry is the innermost partial/view. Present only with
     config.action_view.annotate_rendered_view_with_filenames = true in development. Suggest it once
     for Rails apps; do not add it yourself unless the user agrees.
  3. React/Vue component names - grep for the definition.
  4. No hints - grep for visible text (also config/locales/*.yml, src/lib/i18n), id, data-testid,
     data-controller/data-action, uncommon class names. The page path tells you the route.
  The HTML is rendered output, not source. Make the smallest change; if the element comes from a
  shared component/partial, say in the done message that the change affects every use.

KNOWN LIMITS
  Streamed HTML is buffered before injection. Absolute dev-server URLs inside JS bundles are not
  rewritten. Pages in cross-origin iframes cannot be picked.`;

if (!cmds[cmd]) {
  console.log(GUIDE);
  process.exit(cmd && !['help', '--help', '-h'].includes(cmd) && !args.help ? 1 : 0);
}
await cmds[cmd](args);
