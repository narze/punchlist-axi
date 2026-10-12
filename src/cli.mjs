// punchlist — proxy any local web app, inject an element picker, and queue
// "change this element" requests for whatever coding agent is running the loop.
// Source; `pnpm build` bundles it into scripts/punchlist.mjs, which needs only Node >= 18 or Bun.
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
import { runAxiCli, AxiError } from 'axi-sdk-js';
import { VERSION } from './version.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(DIR, 'punchlist.mjs'); // the entry point; this file is punchlist-cli.mjs once built
const STATE_DIR = path.join(os.tmpdir(), 'punchlist');
const PREFIX = '/__pe';
const COOKIE = '__pe_auth';

// ---------------------------------------------------------------- utils

const SERVE_FLAGS = { target: 'v', port: 'v', host: 'v', 'no-auth': 'b', token: 'v' };
const FLAGS = {
  start: SERVE_FLAGS, serve: SERVE_FLAGS,
  wait: { port: 'v', timeout: 'v', json: 'b' },
  show: { port: 'v', full: 'b' },
  done: { port: 'v', failed: 'b' },
  status: { port: 'v' },
  stop: { port: 'v' },
};

function usageError(msg, cmd, extra = []) {
  const flags = Object.keys(FLAGS[cmd]).map(f => `--${f}`).join(', ');
  return new AxiError(msg, 'VALIDATION_ERROR', [...extra, `Valid flags for \`${cmd}\`: ${flags} (--help always allowed)`]);
}

// Rejects unknown flags (AXI: never silently drop input). Boolean flags never take a value.
function parseArgs(cmd, argv) {
  const spec = FLAGS[cmd], args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { args._.push(a); continue; }
    const eq = a.indexOf('=');
    const k = eq > -1 ? a.slice(2, eq) : a.slice(2);
    let v = eq > -1 ? a.slice(eq + 1) : undefined;
    if (!spec[k]) throw usageError(`unknown flag --${k} for \`${cmd}\``, cmd);
    if (spec[k] === 'b') {
      if (v !== undefined) throw usageError(`--${k} takes no value`, cmd);
      args[k] = true; continue;
    }
    if (v === undefined) {
      v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw usageError(`--${k} needs a value`, cmd);
    }
    args[k] = v;
  }
  return args;
}

function normalizeTarget(t) {
  if (!t) throw usageError('--target is required (dev server port or URL)', 'start', [`Run \`${PE} start --target 5173\` or \`--target http://localhost:3000\``]);
  t = String(t);
  if (/^\d+$/.test(t)) return `http://localhost:${t}`;
  if (!/^https?:\/\//.test(t)) return `http://${t}`;
  return t.replace(/\/+$/, '');
}


function statePath(port) { return path.join(STATE_DIR, `${port}.json`); }

function loadState(args) {
  if (args.port) {
    const p = statePath(args.port);
    if (!fs.existsSync(p)) throw notRunning(`no proxy running on port ${args.port}`, args.port);
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  const files = fs.existsSync(STATE_DIR) ? fs.readdirSync(STATE_DIR).filter(f => f.endsWith('.json')) : [];
  if (!files.length) throw notRunning('no proxy running');
  files.sort((a, b) => fs.statSync(path.join(STATE_DIR, b)).mtimeMs - fs.statSync(path.join(STATE_DIR, a)).mtimeMs);
  return JSON.parse(fs.readFileSync(path.join(STATE_DIR, files[0]), 'utf8'));
}

function notRunning(msg, port) {
  return new AxiError(msg, 'NOT_RUNNING', [`Run \`${PE} start --target <port|url>${port ? ` --port ${port}` : ''}\``]);
}

async function api(st, p, opts = {}) {
  try { return await fetch(`${apiBase(st)}${p}`, { ...opts, headers: { 'x-pe-token': st.token, ...opts.headers } }); }
  catch { throw new AxiError(`proxy on port ${st.port} is not responding`, 'NOT_RESPONDING', [`Run \`${PE} start --target ${st.target} --port ${st.port}\` to restart it`]); }
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

function links(st) {
  const authPath = st.auth === false ? '/' : `${PREFIX}/auth?token=${st.token}`;
  const ts = tailscaleName();
  return { local: `http://${st.host === '0.0.0.0' ? '127.0.0.1' : st.host}:${st.port}${authPath}`, ...(ts ? { tailscale: `https://${ts}${authPath}` } : {}) };
}

function startOutput(st, state) {
  const l = links(st);
  return {
    proxy: { target: st.target, port: st.port, pid: st.pid, state },
    links: l,
    help: [
      'Send the user the local link exactly (its token sets the access cookie) before you run wait: wait blocks, so a message queued behind it may not reach the user',
      'Tell the user: press ◎ (Alt+Shift+E), tap an element or drag a box, write a note, repeat, then press Send. With ◎ off, selecting text shows an Annotate button',
      ...(l.tailscale ? [`For phone access the user runs \`tailscale serve --bg ${st.port}\` and opens the tailscale link (never \`tailscale funnel\`)`] : []),
      `Run \`${PE} wait --port ${st.port}\` to receive the user's notes`,
    ],
  };
}

// Runs `serve` as a detached child so the agent's shell is free, and returns once it listens.
async function cmdStart(args) {
  const target = new URL(normalizeTarget(args.target ?? args._[0])).origin;
  const port = Number(args.port ?? 4000);
  const p = statePath(port);
  const old = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
  if (old && alive(old.pid)) {
    if (old.target !== target) throw new AxiError(`port ${port} already proxies ${old.target}`, 'PORT_BUSY', [`Run \`${PE} stop --port ${port}\` first, or pick another --port`]);
    return startOutput(old, 'already running');
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
    if (st?.pid === child.pid) return startOutput(st, 'started');
  }
  if (!exited) child.kill();
  const log = fs.readFileSync(logFile, 'utf8').trim().slice(-1000);
  throw new AxiError(`proxy did not start: ${log || 'no output'}`, 'START_FAILED', [`Full log: ${logFile}`]);
}

function cmdServe(args) {
  const target = new URL(normalizeTarget(args.target ?? args._[0]));
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
    if ((m = p.match(/^\/requests\/([\w-]+)$/)) && req.method === 'GET') {
      const it = items.find(i => i.id === m[1]);
      return it ? json(res, 200, it) : json(res, 404, { error: 'unknown id' });
    }
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
  // runs detached with output in the log file, so fail there (start reads it back)
  server.on('error', e => { console.error(e.code === 'EADDRINUSE' ? `port ${port} is in use (pick another with --port)` : e.message); process.exit(1); });

  const cleanup = () => { try { fs.unlinkSync(statePath(port)); } catch {} process.exit(0); };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  return new Promise(() => {}); // keep serving; output goes to the log
}

// ---------------------------------------------------------------- agent side

const HTML_LIMIT = 600;

// One request as AXI output: minimal fields by default, everything with `full`.
function requestView(it, port, full = false) {
  const { notes, viewport } = it.payload;
  const kinds = new Set(notes.map(n => n.kind));
  let cut = false;
  const noHint = [];
  const view = {
    request: { id: it.id, status: it.status, notes: notes.length, ...(viewport ? { viewport: `${viewport.w}x${viewport.h}` } : {}) },
    notes: notes.map((n, i) => ({
      key: String(i + 1),
      kind: n.kind,
      comment: n.comment,
      page: n.path,
      ...(n.frozen ? { frozen: 'captured with animations paused' } : {}),
      ...(n.kind === 'text' ? { selected: n.text } : {}),
      ...(n.kind === 'area' ? { area: `${Math.round(n.area.width)}x${Math.round(n.area.height)} at page (${Math.round(n.area.x)}, ${Math.round(n.area.y)})` } : {}),
      targets: n.elements.map((e, j) => {
        const key = n.elements.length > 1 ? `${i + 1}${'abcdef'[j]}` : String(i + 1);
        const h = e.hints || {};
        const hints = Object.fromEntries(['svelte', 'rails', 'react', 'vue'].filter(k => h[k]?.length)
          .map(k => [k, h[k].join(k === 'rails' ? ' > ' : k === 'svelte' ? ', ' : ' < ')]));
        if (!Object.keys(hints).length) noHint.push(key);
        let html = e.html || '';
        if (!full && html.length > HTML_LIMIT) { html = `${html.slice(0, HTML_LIMIT)}... (truncated, ${html.length} chars total)`; cut = true; }
        return {
          key, label: e.label,
          ...(Object.keys(hints).length ? { hints } : {}),
          ...(e.text ? { text: e.text } : {}),
          html,
          ...(full ? {
            selector: e.selector,
            ...(e.ancestors?.length ? { inside: e.ancestors.join(' > ') } : {}),
            ...(e.styles ? { styles: e.styles } : {}),
            ...(e.rect ? { box: `${Math.round(e.rect.width)}x${Math.round(e.rect.height)} at page (${Math.round(e.rect.x)}, ${Math.round(e.rect.y)})` } : {}),
          } : {}),
        };
      }),
    })),
  };
  const help = ['Handle every note (notes may touch the same file), then report once'];
  if (kinds.has('elements')) help.push('kind elements: apply the comment to every target; they often share one partial or component');
  if (kinds.has('text')) help.push('kind text: change exactly the selected text; it may live in an i18n file (config/locales, src/lib/i18n)');
  if (kinds.has('area')) help.push('kind area: the user boxed empty space; the change belongs at that spot inside the target');
  if (noHint.length) help.push(`No source hint for [${noHint.join('], [')}]: grep for the visible text, ids, data-* attributes or uncommon classes; the page path tells you the route`);
  if (cut || !full) help.push(`Run \`${PE} show ${it.id} --full --port ${port}\` for selectors, computed styles${cut ? ' and the full HTML' : ''}`);
  help.push(`Run \`${PE} done ${it.id} "<one line per note, e.g. 1: ... 2: ...>" --port ${port}\` when finished (--failed if nothing could be done)`);
  return { ...view, help };
}

async function cmdWait(args) {
  const st = loadState(args);
  const secs = Number(args.timeout ?? 540);
  if (!(secs > 0)) throw usageError('--timeout must be a number of seconds', 'wait');
  const deadline = Date.now() + secs * 1000;
  while (Date.now() < deadline) {
    const left = Math.max(1000, Math.min(25000, deadline - Date.now()));
    const r = await api(st, `/next?timeout=${left}`);
    if (r.status === 200) {
      const it = await r.json();
      return args.json ? JSON.stringify(it, null, 2) : requestView(it, st.port);
    }
    if (r.status !== 204) throw new AxiError(`unexpected ${r.status} from the proxy: ${(await r.text()).slice(0, 300)}`, 'PROXY_ERROR');
  }
  return { request: `none (waited ${secs}s)`, help: [`Run \`${PE} wait --port ${st.port}\` to keep listening`] };
}

async function cmdShow(args) {
  const id = args._[0];
  if (!id) throw usageError('request id is required', 'show', [`Run \`${PE} show <id> [--full]\``]);
  const st = loadState(args);
  const r = await api(st, `/requests/${encodeURIComponent(id)}`);
  if (r.status === 404) throw new AxiError(`no request ${id} on port ${st.port}`, 'NOT_FOUND', [`Run \`${PE} status --port ${st.port}\` to list requests`]);
  return requestView(await r.json(), st.port, args.full === true);
}

async function cmdDone(args) {
  const id = args._[0];
  if (!id) throw usageError('request id is required', 'done', [`Run \`${PE} done <id> "<one line per note>"\``]);
  const st = loadState(args);
  const status = args.failed ? 'failed' : 'done';
  const r = await api(st, `/requests/${encodeURIComponent(id)}/done`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status, message: args._.slice(1).join(' ') || null }),
  });
  if (r.status === 404) throw new AxiError(`no request ${id} on port ${st.port}`, 'NOT_FOUND', [`Run \`${PE} status --port ${st.port}\` to list requests`]);
  if (!r.ok) throw new AxiError(`proxy refused: ${r.status} ${(await r.text()).slice(0, 300)}`, 'PROXY_ERROR');
  return { request: { id, status }, help: [`Run \`${PE} wait --port ${st.port}\` for the next batch`] };
}

async function cmdStatus(args) {
  const st = loadState(args);
  const list = await (await api(st, '/requests')).json();
  const by = s => list.filter(i => i.status === s).length;
  return {
    proxy: { target: st.target, port: st.port, pid: st.pid },
    count: list.length ? `${list.length} request${list.length === 1 ? "" : "s"} (${by('pending')} pending, ${by('working')} working, ${by('done')} done, ${by('failed')} failed)` : '0 requests - the user has not sent anything yet',
    ...(list.length ? { requests: list.map(i => ({ id: i.id, status: i.status, prompt: i.prompt })) } : {}),
    help: [`Run \`${PE} wait --port ${st.port}\` to receive the next batch`],
  };
}

function cmdStop(args) {
  const port = args.port;
  const p = port ? statePath(port) : null;
  if ((p && !fs.existsSync(p)) || (!p && !runningProxies().length)) return { stop: `no proxy running${port ? ` on port ${port}` : ''} (no-op)` };
  const st = loadState(args);
  try { process.kill(st.pid, 'SIGTERM'); } catch { fs.rmSync(statePath(st.port), { force: true }); }
  return { stop: `stopped the proxy on port ${st.port}` };
}

function runningProxies() {
  if (!fs.existsSync(STATE_DIR)) return [];
  return fs.readdirSync(STATE_DIR).filter(f => f.endsWith('.json'))
    .map(f => { try { return JSON.parse(fs.readFileSync(path.join(STATE_DIR, f), 'utf8')); } catch { return null; } })
    .filter(st => st && alive(st.pid));
}

async function home() {
  const sts = runningProxies();
  const proxies = await Promise.all(sts.map(async st => {
    let pending = '?';
    try { pending = (await (await api(st, '/requests')).json()).filter(i => i.status === 'pending').length; } catch {}
    return { port: st.port, target: st.target, pending };
  }));
  return {
    proxies: proxies.length ? proxies : '0 running',
    help: proxies.length
      ? [`Run \`${PE} wait --port <port>\` to receive notes`, `Run \`${PE} status --port <port>\` to list requests`, `Run \`${PE} --help\` for the full guide`]
      : [`Run \`${PE} start --target <port|url>\` to proxy a dev server`, `Run \`${PE} --help\` for the full guide`],
  };
}

// ---------------------------------------------------------------- main

const PE = `node ${SCRIPT}`;
const GUIDE = `punchlist - click-to-edit for any running web app. A local proxy injects a picker into every
page; the user marks elements and presses Send; you pull the notes, edit the source, report back.

commands:
  start   proxy a dev server in the background and print the link for the user
  wait    block until the user sends notes, then print them
  show    print a request again (--full: selectors, styles, full HTML)
  done    report a request back to the browser
  status  list requests on a proxy
  stop    stop a proxy
  serve   run the proxy in the foreground (debugging)

loop: start -> send the user the link -> wait -> edit the source -> done -> wait ...
Every output ends with help lines that name the next command.
Run \`${PE} <command> --help\` for flags, examples and guidance.`;

const HELP = {
  start: `start --target <port|url> [--port 4000] [--host 127.0.0.1] [--no-auth]
  Start the proxy in the background and print the link for the user. Safe to re-run.
  Find the dev server port from running processes, Procfile.dev, bin/dev, package.json scripts or
  the conversation; ask the user only if it is unclear.
  --target   dev server port or URL (required)
  --port     proxy port (default 4000)
  --host     listen address (default 127.0.0.1; 0.0.0.0 = all interfaces)
  --no-auth  no access token (purely local use only)
examples:
  ${PE} start --target 5173
  ${PE} start --target http://localhost:3000 --port 4001`,
  serve: `serve --target <port|url> [same flags as start]
  Run the proxy in the foreground (debugging). Agents use start.`,
  wait: `wait [--port 4000] [--timeout 540] [--json]
  Block until the user presses Send, then print the batch of notes.
  Prints \`request: none\` (exit 0) when nothing arrives in time: run it again.
  --port     proxy port (default: most recently started proxy)
  --timeout  seconds to wait (default 540, under most shell-tool limits)
  --json     raw request JSON instead of the formatted view
  Keep re-running wait without commentary until the user tells you to stop.
finding the source (in this order):
  1. svelte file:line:col (or React _debugSource) - open it directly
  2. rails templates - the last entry is the innermost partial. Needs
     config.action_view.annotate_rendered_view_with_filenames = true in development; suggest it
     once for Rails apps, never add it without the user's consent
  3. react/vue component names - grep for the definition
  4. no hints - grep for visible text (also i18n files), ids, data-* attributes, rare classes
  The HTML is rendered output, not source. Make the smallest change; if a target comes from a
  shared partial or component, say in done that every use changes.
examples:
  ${PE} wait --port 4000`,
  show: `show <id> [--full] [--port 4000]
  Print one request again. --full adds selectors, ancestors, computed styles, boxes and untruncated HTML.
examples:
  ${PE} show r1 --full --port 4000`,
  done: `done <id> "<one line per note>" [--failed] [--port 4000]
  Report a request back to the browser (shown as a toast). Run it once per request.
  If some notes fail, still do the others and name the failed ones in the message.
  --failed   nothing could be done; the message says why
examples:
  ${PE} done r1 "1: CTA larger  2: doors time -> 18:00" --port 4000
  ${PE} done r2 "need the new copy for the hero" --failed`,
  status: `status [--port 4000]
  List the requests on a proxy with counts by state.`,
  stop: `stop [--port 4000]
  Stop a proxy. No-op when nothing runs.`,
};

const handler = fn => cmd => argv => fn(parseArgs(cmd, argv));
const cmds = Object.fromEntries(Object.entries({ start: cmdStart, serve: cmdServe, wait: cmdWait, show: cmdShow, done: cmdDone, status: cmdStatus, stop: cmdStop })
  .map(([k, fn]) => [k, handler(fn)(k)]));

await runAxiCli({
  description: 'Click-to-edit for running web apps: the user marks UI in the browser, you pull the notes and edit the source',
  version: VERSION,
  topLevelHelp: GUIDE + '\n',
  home,
  commands: cmds,
  getCommandHelp: c => HELP[c] ? HELP[c] + '\n' : null,
});
