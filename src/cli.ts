// punchlist — proxy any local web app, inject an element picker, and queue
// "change this element" requests for whatever coding agent is running the loop.
// TypeScript source; `pnpm build` bundles it into scripts/punchlist-cli.mjs, which needs only Node >= 18 or Bun.
//
//   punchlist start --target 3000 [--port 4000] [--host 127.0.0.1] [--no-auth] [--no-tailscale] [--root .] [--editor-url vscode]   (background)
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
import type { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { runAxiCli, AxiError, installSessionStartHooks, uninstallSessionStartHooks, sessionStartHookStatus } from 'axi-sdk-js';
import type { AxiCliCommand } from 'axi-sdk-js';
import launchEditor from 'launch-editor';
import type { FileRef, Item, LooseElement, OpenRequest, OpenResult, Payload, PublicItem, ServerEvent, SourceFile, Status } from './protocol.ts';
import { VERSION } from './version.ts';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(DIR, 'punchlist-axi.mjs'); // the entry point; this file is punchlist-cli.mjs once built
const STATE_DIR = path.join(os.tmpdir(), 'punchlist');
const PREFIX = '/__pe';
const COOKIE = '__pe_auth';

// ---------------------------------------------------------------- utils

type Command = 'start' | 'serve' | 'wait' | 'show' | 'done' | 'status' | 'stop' | 'setup';
type FlagSpec = Record<string, 'v' | 'b'>; // v = takes a value, b = boolean

const SERVE_FLAGS: FlagSpec = { target: 'v', port: 'v', host: 'v', 'no-auth': 'b', 'no-tailscale': 'b', token: 'v', root: 'v', 'editor-url': 'v' };
const FLAGS: Record<Command, FlagSpec> = {
  start: SERVE_FLAGS, serve: SERVE_FLAGS,
  wait: { port: 'v', timeout: 'v', json: 'b' },
  show: { port: 'v', full: 'b' },
  done: { port: 'v', failed: 'b', open: 'v' },
  status: { port: 'v' },
  stop: { port: 'v' },
  setup: { project: 'b', remove: 'b' },
};

// Every flag of every command; parseArgs only lets through the ones in FLAGS[cmd].
interface Args {
  _: string[];
  target?: string; port?: string; host?: string; 'no-auth'?: true; 'no-tailscale'?: true; token?: string; root?: string; 'editor-url'?: string;
  timeout?: string; json?: true; full?: true; failed?: true; open?: string; project?: true; remove?: true;
}

// Written by `serve` to STATE_DIR/<port>.json; every other command finds the proxy through it.
// tailnet = this machine's Tailscale name, set when the proxy also listens on the tailnet.
interface ProxyState { port: number; host: string; target: string; token: string; auth: boolean; pid: number; cwd?: string; tailnet?: string }

const errorMessage = (e: unknown) => e instanceof Error ? e.message : String(e);

function usageError(msg: string, cmd: Command, extra: string[] = []) {
  const flags = Object.keys(FLAGS[cmd]).map(f => `--${f}`).join(', ');
  return new AxiError(msg, 'VALIDATION_ERROR', [...extra, `Valid flags for \`${cmd}\`: ${flags} (--help always allowed)`]);
}

// Rejects unknown flags (AXI: never silently drop input). Boolean flags never take a value.
function parseArgs(cmd: Command, argv: string[]): Args {
  const spec = FLAGS[cmd], positional: string[] = [], flags: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] ?? '';
    if (!a.startsWith('--')) { positional.push(a); continue; }
    const eq = a.indexOf('=');
    const k = eq > -1 ? a.slice(2, eq) : a.slice(2);
    let v = eq > -1 ? a.slice(eq + 1) : undefined;
    if (!spec[k]) throw usageError(`unknown flag --${k} for \`${cmd}\``, cmd);
    if (spec[k] === 'b') {
      if (v !== undefined) throw usageError(`--${k} takes no value`, cmd);
      flags[k] = true; continue;
    }
    if (v === undefined) {
      v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw usageError(`--${k} needs a value`, cmd);
    }
    flags[k] = v;
  }
  return { ...flags, _: positional }; // keys and kinds checked against FLAGS above
}

function normalizeTarget(t: string | undefined) {
  if (!t) throw usageError('--target is required (dev server port or URL)', 'start', [`Run \`${PE} start --target 5173\` or \`--target http://localhost:3000\``]);
  if (/^\d+$/.test(t)) return `http://localhost:${t}`;
  if (!/^https?:\/\//.test(t)) return `http://${t}`;
  return t.replace(/\/+$/, '');
}


// How a browser on another machine opens a file on this one: an editor URL that goes over SSH
// (VS Code / Cursor Remote-SSH, Zed remote). {host} is user@<tailscale name or hostname>.
const EDITOR_URLS: Record<string, string> = {
  vscode: 'vscode://vscode-remote/ssh-remote+{host}{abs}:{line}:{col}',
  cursor: 'cursor://vscode-remote/ssh-remote+{host}{abs}:{line}:{col}',
  windsurf: 'windsurf://vscode-remote/ssh-remote+{host}{abs}:{line}:{col}',
  zed: 'zed://ssh/{host}{abs}:{line}:{col}',
};

function editorUrlTemplate(v: string | undefined) {
  const t = EDITOR_URLS[v ?? 'vscode'] ?? v ?? '';
  if (!t.includes('{abs}')) throw usageError(`--editor-url must be ${Object.keys(EDITOR_URLS).join(', ')} or a template with {abs}`, 'start',
    ["e.g. `--editor-url 'vscode://vscode-remote/ssh-remote+{host}{abs}:{line}:{col}'` ({host}, {abs}, {line}, {col})"]);
  return t;
}

function statePath(port: string | number) { return path.join(STATE_DIR, `${port}.json`); }

function readState(file: string) { return JSON.parse(fs.readFileSync(file, 'utf8')) as ProxyState; }

function loadState(args: Args) {
  if (args.port) {
    const p = statePath(args.port);
    if (!fs.existsSync(p)) throw notRunning(`no proxy running on port ${args.port}`, args.port);
    return readState(p);
  }
  const files = fs.existsSync(STATE_DIR) ? fs.readdirSync(STATE_DIR).filter(f => f.endsWith('.json')) : [];
  files.sort((a, b) => fs.statSync(path.join(STATE_DIR, b)).mtimeMs - fs.statSync(path.join(STATE_DIR, a)).mtimeMs);
  if (!files[0]) throw notRunning('no proxy running');
  return readState(path.join(STATE_DIR, files[0]));
}

function notRunning(msg: string, port?: string) {
  return new AxiError(msg, 'NOT_RUNNING', [`Run \`${PE} start --target <port|url>${port ? ` --port ${port}` : ''}\``]);
}

type ApiInit = Omit<RequestInit, 'headers'> & { headers?: Record<string, string> };

async function api(st: ProxyState, p: string, opts: ApiInit = {}) {
  try { return await fetch(`${apiBase(st)}${p}`, { ...opts, headers: { 'x-pe-token': st.token, ...opts.headers } }); }
  catch { throw new AxiError(`proxy on port ${st.port} is not responding`, 'NOT_RESPONDING', [`Run \`${PE} start --target ${st.target} --port ${st.port}\` to restart it`]); }
}

function apiBase(st: ProxyState) {
  const h = ['0.0.0.0', '::', ''].includes(st.host) ? '127.0.0.1' : st.host;
  return `http://${h.includes(':') ? `[${h}]` : h}:${st.port}${PREFIX}`;
}

function readBody(req: http.IncomingMessage, limit = 2e6) {
  return new Promise<string>((resolve, reject) => {
    let size = 0; const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => { size += c.length; if (size > limit) { reject(new Error('body too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { resolve(Buffer.concat(chunks).toString('utf8')); });
    req.on('error', reject);
  });
}

function json(res: http.ServerResponse, status: number, obj: unknown) {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function getCookie(header: string | undefined, name: string) {
  for (const part of (header ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

function stripCookie(header: string | undefined, name: string) {
  if (!header) return header;
  const kept = header.split(';').map(s => s.trim()).filter(s => s && !s.startsWith(name + '='));
  return kept.length ? kept.join('; ') : undefined;
}

// This machine's tailnet name and addresses, when tailscale is installed and connected.
function tailscaleSelf() {
  try {
    const out = execFileSync('tailscale', ['status', '--json'], { stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000, encoding: 'utf8' });
    const j = JSON.parse(out) as { BackendState?: string; Self?: { DNSName?: string; TailscaleIPs?: string[] } };
    const name = j.Self?.DNSName?.replace(/\.$/, '');
    return j.BackendState === 'Running' && name ? { name, ips: j.Self?.TailscaleIPs ?? [] } : null;
  } catch { return null; }
}

// ---------------------------------------------------------------- start (background) / serve (foreground)

function alive(pid: number) { try { process.kill(pid, 0); return true; } catch { return false; } }

function printInfo(st: ProxyState) {
  const authPath = !st.auth ? '/' : `${PREFIX}/auth?token=${st.token}`;
  console.log(`punchlist: proxying ${st.target}`);
  console.log(`  Local:     http://${st.host === '0.0.0.0' ? '127.0.0.1' : st.host}:${st.port}${authPath}`);
  if (st.tailnet) console.log(`  Tailscale: http://${st.tailnet}:${st.port}${authPath}`);
  console.log(`  Agent:     ${PE} wait --port ${st.port}`);
}

function links(st: ProxyState) {
  const authPath = !st.auth ? '/' : `${PREFIX}/auth?token=${st.token}`;
  return { local: `http://${st.host === '0.0.0.0' ? '127.0.0.1' : st.host}:${st.port}${authPath}`, ...(st.tailnet ? { tailscale: `http://${st.tailnet}:${st.port}${authPath}` } : {}) };
}

function startOutput(st: ProxyState, state: string) {
  const l = links(st);
  return {
    proxy: { target: st.target, port: st.port, pid: st.pid, state },
    links: l,
    help: [
      'Paste the full local link into your reply text - the user does not see command output, and the link token sets the access cookie',
      'Tell the user: press ◎ (Alt+Shift+E), tap an element or drag a box, write a note, repeat, then press Send. With ◎ off, selecting text shows an Annotate button. ⏸ (Alt+Shift+P) pauses animations, 🗒 lists notes, and notes survive reloads until sent. ↗ Open in the note panel opens the source file in their editor (⧉ Copy copies path:line); when no file is known, 🔎 Locate asks you to find it. ✎ Edit in the note panel edits the file right in the page (with no file known, you find it first)',
      'The user can save files from the page while you work: re-read a file before you edit it',
      ...(l.tailscale ? ['Also paste the tailscale link: it opens on the user\'s phone or any other device in their tailnet'] : []),
      `Then run \`${PE} wait --port ${st.port}\` to receive the notes - in the background if your harness notifies you when a background command ends (Claude Code: run_in_background), so your reply with the link reaches the user first. Never end your turn without a wait running`,
    ],
  };
}

const BASE_PORT = () => Number(process.env['PUNCHLIST_PORT'] || 4000);
const PORT_TRIES = 20;

function portFree(port: number, host: string) {
  return new Promise<boolean>(resolve => {
    const srv = net.createServer().once('error', () => { resolve(false); });
    srv.listen(port, host, () => srv.close(() => { resolve(true); }));
  });
}

// Runs `serve` as a detached child so the agent's shell is free, and returns once it listens.
// Without --port: reuse a proxy for the same target, else the first free port from 4000 (like Vite).
async function cmdStart(args: Args) {
  const target = new URL(normalizeTarget(args.target ?? args._[0])).origin;
  editorUrlTemplate(args['editor-url']); // fail here, not in the detached serve
  if (args.root && !fs.existsSync(args.root)) throw usageError(`--root ${path.resolve(args.root)} does not exist`, 'start');
  const auto = args.port == null, base = BASE_PORT();
  let port = auto ? base : Number(args.port);
  if (auto) {
    const running = runningProxies();
    const same = running.find(st => st.target === target);
    if (same) return startOutput(same, 'already running');
    const held = new Set(running.map(st => st.port));
    while (port < base + PORT_TRIES - 1 && (held.has(port) || !(await portFree(port, args.host ?? '127.0.0.1')))) port++;
  }
  const p = statePath(port);
  const old = fs.existsSync(p) ? readState(p) : null;
  if (old && alive(old.pid)) {
    if (old.target !== target) throw new AxiError(`port ${port} already proxies ${old.target}`, 'PORT_BUSY', [`Run \`${PE} stop --port ${port}\` first, or pick another --port`]);
    return startOutput(old, 'already running');
  }
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.rmSync(p, { force: true });
  const logFile = path.join(STATE_DIR, `${port}.log`);
  const fd = fs.openSync(logFile, 'w');
  // serve still shifts on its own if the port is taken between our check and its listen
  const child = spawn(process.execPath, [SCRIPT, 'serve', ...process.argv.slice(3)], { detached: true, stdio: ['ignore', fd, fd], env: { ...process.env, PUNCHLIST_PORT: String(port) } });
  child.unref();
  fs.closeSync(fd);
  const exit = { seen: false }; // an object, so the loop condition sees the 'exit' handler's write
  child.on('exit', () => { exit.seen = true; });
  for (let i = 0; i < 100 && !exit.seen; i++) {
    await new Promise(r => setTimeout(r, 100));
    const st = runningProxies().find(s => s.pid === child.pid);
    if (st) return startOutput(st, st.port === base || !auto ? 'started'
      : `started (${st.port - base > 1 ? `ports ${base}-${st.port - 1} are` : `port ${base} is`} busy)`);
  }
  if (!exit.seen) child.kill();
  const log = fs.readFileSync(logFile, 'utf8').trim().slice(-1000);
  throw new AxiError(`proxy did not start: ${log || 'no output'}`, 'START_FAILED', [`Full log: ${logFile}`]);
}

function cmdServe(args: Args) {
  const target = new URL(normalizeTarget(args.target ?? args._[0]));
  const auto = args.port == null;
  let port = Number(args.port ?? BASE_PORT()); // let: shifts on EADDRINUSE without --port
  const lastPort = port + PORT_TRIES - 1;
  const host = args.host ?? '127.0.0.1';
  const root = path.resolve(args.root ?? '.');
  if (!fs.existsSync(root)) throw usageError(`--root ${root} does not exist`, 'serve');
  const editorUrl = editorUrlTemplate(args['editor-url']);
  let sshHost: string | null = null; // looked up on first use: tailscale status takes a moment
  const noAuth = args['no-auth'] === true;
  // Also listen on this machine's Tailscale addresses, so other devices in the tailnet (a phone)
  // reach the proxy at http://<name>.ts.net:<port>. Not with --no-auth or an explicit --host.
  const wildcard = ['0.0.0.0', '::'].includes(host);
  const ts = noAuth || args['no-tailscale'] || (args.host != null && !wildcard) ? null : tailscaleSelf();
  const tailnetIps = ts && !wildcard ? ts.ips : [];
  const token = args.token ?? crypto.randomBytes(12).toString('base64url');
  const targetPort = Number(target.port) || (target.protocol === 'https:' ? 443 : 80);
  const lib = target.protocol === 'https:' ? https : http;

  // Absolute URLs the app may print for itself (rewritten to relative in HTML).
  const selfOrigins = [target.origin];
  if (['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)) {
    for (const h of ['localhost', '127.0.0.1', '[::1]']) selfOrigins.push(`${target.protocol}//${h}:${targetPort}`);
  }
  const origins = [...new Set(selfOrigins)];

  const items: Item[] = [];
  const waiters = new Set<{ res: http.ServerResponse; timer?: NodeJS.Timeout }>(); // long-poll responses from `wait`
  const sse = new Set<http.ServerResponse>();
  let seq = 0;

  const summarize = (p: Payload<LooseElement>) => {
    const n = p.notes.length;
    return { label: n === 1 ? (p.notes[0]?.comment ?? '').slice(0, 60) : `${n} notes`, prompt: p.notes.map(x => x.comment).join(' | ') };
  };
  const publicItem = (it: Item): PublicItem => ({ id: it.id, ...(it.payload.kind ? { kind: it.payload.kind } : {}), status: it.status, message: it.message, ...summarize(it.payload), ...(it.file ? { file: it.file } : {}) });
  const broadcast = (obj: ServerEvent) => { const line = `data: ${JSON.stringify(obj)}\n\n`; for (const r of sse) r.write(line); };

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

  function authed(req: http.IncomingMessage) {
    if (noAuth) return true;
    return getCookie(req.headers.cookie, COOKIE) === token || req.headers['x-pe-token'] === token;
  }

  function upstreamHeaders(req: http.IncomingMessage) {
    const h = { ...req.headers };
    // Look like a plain local request so dev servers don't trip on host checks
    // (Rails config.hosts, Vite allowedHosts) or CSRF origin checks.
    h.host = target.host;
    if (h.origin) h.origin = target.origin;
    if (h.referer) { try { const u = new URL(h.referer); h.referer = target.origin + u.pathname + u.search; } catch {} }
    delete h['accept-encoding']; // ask for identity so HTML can be rewritten (decoded anyway if ignored)
    const c = stripCookie(h.cookie, COOKIE);
    if (c) h.cookie = c; else delete h.cookie;
    return Object.fromEntries(Object.entries(h).filter(([k]) => !k.startsWith('x-forwarded-') && k !== 'forwarded' && k !== 'x-pe-token'));
  }

  function rewriteLocation(loc: string) {
    for (const o of origins) if (loc === o || loc.startsWith(o + '/') || loc.startsWith(o + '?')) return loc.slice(o.length) || '/';
    return loc;
  }

  function injectHtml(html: string) {
    for (const o of origins) html = html.split(o + '/').join('/').split(o).join('/');
    const tag = `<script src="${PREFIX}/client.js" defer data-pe></script>`;
    if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, tag + '</head>');
    if (/<body[^>]*>/i.test(html)) return html.replace(/<body[^>]*>/i, m => m + tag);
    return html + tag;
  }

  function proxy(req: http.IncomingMessage, res: http.ServerResponse) {
    const upReq = lib.request({
      hostname: target.hostname.replace(/^\[|\]$/g, ''), port: targetPort, method: req.method, path: req.url,
      headers: upstreamHeaders(req), rejectUnauthorized: false,
    }, upRes => {
      const status = upRes.statusCode ?? 502;
      const h = { ...upRes.headers };
      delete h['content-security-policy'];
      delete h['content-security-policy-report-only'];
      if (h.location) h.location = rewriteLocation(h.location);
      if (h['set-cookie']) h['set-cookie'] = h['set-cookie'].map(c => c.replace(/;\s*domain=[^;]*/i, ''));

      const isHtml = /text\/html/i.test(h['content-type'] ?? '');
      if (!isHtml || req.method === 'HEAD' || status === 204 || status === 304) {
        res.writeHead(status, h);
        upRes.pipe(res);
        return;
      }
      let stream: Readable = upRes;
      const enc = (h['content-encoding'] ?? '').toLowerCase();
      if (enc === 'gzip') stream = upRes.pipe(zlib.createGunzip());
      else if (enc === 'br') stream = upRes.pipe(zlib.createBrotliDecompress());
      else if (enc === 'deflate') stream = upRes.pipe(zlib.createInflate());
      const chunks: Buffer[] = [];
      stream.on('data', (c: Buffer) => chunks.push(c));
      stream.on('error', e => { if (!res.headersSent) res.writeHead(502); res.end(`punchlist: decode error ${e.message}`); });
      stream.on('end', () => {
        const body = Buffer.from(injectHtml(Buffer.concat(chunks).toString('utf8')), 'utf8');
        delete h['content-encoding'];
        delete h['transfer-encoding'];
        h['content-length'] = String(body.length);
        res.writeHead(status, h);
        res.end(body);
      });
    });
    upReq.on('error', (e: NodeJS.ErrnoException) => {
      if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(`punchlist: cannot reach ${target.origin} (${e.code ?? e.message}). Is the dev server running?`);
    });
    req.pipe(upReq);
  }

  async function handleApi(req: http.IncomingMessage, res: http.ServerResponse, url: URL) {
    const p = url.pathname.slice(PREFIX.length);
    if (p === '/client.js' || p === '/editor.js') {
      // read per request so a rebuild shows up on reload; gzipped because it goes to phones on every page load.
      // editor.js (CodeMirror) is loaded only when the user opens the in-browser editor.
      const js = fs.readFileSync(path.join(DIR, p.slice(1)));
      const gz = /\bgzip\b/.test(req.headers['accept-encoding'] ?? '');
      res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store', vary: 'accept-encoding',
        ...(gz ? { 'content-encoding': 'gzip' } : {}) });
      res.end(gz ? zlib.gzipSync(js) : js); return;
    }
    if (p === '/requests' && req.method === 'POST') {
      let payload: unknown;
      try { payload = JSON.parse(await readBody(req)); } catch (e) { json(res, 400, { error: errorMessage(e) }); return; }
      if (!isPayload(payload)) { json(res, 400, { error: 'expected { notes: [{ comment, elements: [...] }] }' }); return; }
      const it: Item = { id: `r${++seq}`, status: 'pending', createdAt: new Date().toISOString(), payload, message: null };
      items.push(it);
      log(`received ${it.id}: ${summarize(payload).prompt.slice(0, 100)}`);
      broadcast({ type: 'update', item: publicItem(it) });
      dispatch();
      json(res, 201, publicItem(it)); return;
    }
    if (p === '/requests' && req.method === 'GET') { json(res, 200, items.map(publicItem)); return; }
    const one = /^\/requests\/([\w-]+)$/.exec(p)?.[1], done = /^\/requests\/([\w-]+)\/done$/.exec(p)?.[1];
    if (one && req.method === 'GET') {
      const it = items.find(i => i.id === one);
      if (it) json(res, 200, it); else json(res, 404, { error: 'unknown id' });
      return;
    }
    if (done && req.method === 'POST') {
      const it = items.find(i => i.id === done);
      if (!it) { json(res, 404, { error: 'unknown id' }); return; }
      let body: { status?: unknown; message?: unknown; file?: { [K in keyof FileRef]?: unknown } } = {};
      try { body = JSON.parse((await readBody(req)) || '{}') as typeof body; } catch {}
      it.status = body.status === 'failed' ? 'failed' : 'done';
      it.message = typeof body.message === 'string' && body.message ? body.message : null;
      const f = body.file;
      if (it.status === 'done' && typeof f?.file === 'string') it.file = { file: f.file, ...(f.line ? { line: Number(f.line) } : {}), ...(f.column ? { column: Number(f.column) } : {}) };
      log(`${it.status} ${it.id}${it.message ? `: ${it.message}` : ''}`);
      broadcast({ type: 'update', item: publicItem(it) });
      json(res, 200, publicItem(it)); return;
    }
    if (p === '/open' && req.method === 'POST') {
      let body: { [K in keyof OpenRequest]?: unknown } & { request?: unknown };
      try { body = JSON.parse(await readBody(req)) as typeof body; } catch (e) { json(res, 400, { error: errorMessage(e) }); return; }
      if (typeof body.file !== 'string' || !body.file) { json(res, 400, { error: 'expected { file, line?, column?, launch?, request? }' }); return; }
      // answering a locate from the in-browser editor: the file must be one the page may edit
      const it = typeof body.request === 'string' ? items.find(i => i.id === body.request) : undefined;
      if (it?.payload.edit) { const f = editable(body.file); if ('error' in f) { json(res, f.status, { error: f.error }); return; } }
      const r = openInEditor(body.file, Number(body.line) || 0, Number(body.column) || 0, body.launch !== false);
      json(res, r.status, r.status === 200 ? r.result : { error: r.error }); return;
    }
    if (p === '/file' && req.method === 'GET') {
      const f = editable(url.searchParams.get('path') ?? '');
      if ('error' in f) { json(res, f.status, { error: f.error }); return; }
      const buf = fs.readFileSync(f.real);
      if (buf.includes(0)) { json(res, 415, { error: `${f.rel} is a binary file` }); return; }
      json(res, 200, { file: f.rel, content: buf.toString('utf8'), etag: etag(buf) } satisfies SourceFile); return;
    }
    if (p === '/file' && req.method === 'POST') {
      let body: Partial<Record<keyof SourceFile, unknown>>;
      try { body = JSON.parse(await readBody(req)) as typeof body; } catch (e) { json(res, 400, { error: errorMessage(e) }); return; }
      const { file, content, etag: base } = body;
      if (typeof file !== 'string' || typeof content !== 'string' || typeof base !== 'string') { json(res, 400, { error: 'expected { file, content, etag }' }); return; }
      const f = editable(file);
      if ('error' in f) { json(res, f.status, { error: f.error }); return; }
      // the agent (or another tab) may have written it since the browser loaded it
      const now = etag(fs.readFileSync(f.real));
      if (now !== base) { json(res, 409, { error: `${f.rel} changed on disk since it was opened`, etag: now }); return; }
      const buf = Buffer.from(content, 'utf8');
      fs.writeFileSync(f.real, buf); // in place: keeps the mode, and dev-server watchers see a plain change
      log(`saved ${f.rel} from the browser editor (${buf.length} bytes)`);
      json(res, 200, { file: f.rel, etag: etag(buf) }); return;
    }
    if (p === '/next' && req.method === 'GET') {
      const timeout = Math.min(Number(url.searchParams.get('timeout')) || 25000, 60000);
      const w: { res: http.ServerResponse; timer?: NodeJS.Timeout } = { res };
      w.timer = setTimeout(() => { waiters.delete(w); res.writeHead(204); res.end(); }, timeout);
      req.on('close', () => { clearTimeout(w.timer); waiters.delete(w); });
      waiters.add(w);
      dispatch(); return;
    }
    if (p === '/events') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
      res.write(`data: ${JSON.stringify({ type: 'snapshot', items: items.map(publicItem) } satisfies ServerEvent)}\n\n`);
      sse.add(res);
      const ka = setInterval(() => res.write(': ka\n\n'), 25000);
      req.on('close', () => { clearInterval(ka); sse.delete(res); });
      return;
    }
    json(res, 404, { error: 'not found' });
  }

  const handler = (req: http.IncomingMessage, res: http.ServerResponse) => {
    const url = new URL(req.url ?? '/', 'http://x');
    if (url.pathname === `${PREFIX}/auth`) {
      const next = url.searchParams.get('next');
      const dest = next?.startsWith('/') && !next.startsWith('//') ? next : '/';
      if (noAuth || url.searchParams.get('token') === token) {
        res.writeHead(302, { 'set-cookie': `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`, location: dest });
      } else res.writeHead(403, { 'content-type': 'text/plain' });
      res.end(res.statusCode === 403 ? 'punchlist: bad token' : ''); return;
    }
    if (!authed(req)) {
      res.writeHead(401, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('punchlist: open the link printed by `punchlist start` (it carries the access token).'); return;
    }
    if (url.pathname.startsWith(PREFIX + '/')) { handleApi(req, res, url).catch((e: unknown) => { json(res, 500, { error: errorMessage(e) }); }); return; }
    proxy(req, res);
  };

  // WebSockets (Vite HMR, ActionCable, LiveReload…): raw pipe after rewriting headers.
  const onUpgrade = (req: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
    if (!authed(req)) { socket.end('HTTP/1.1 401 Unauthorized\r\n\r\n'); return; }
    const opts = { host: target.hostname.replace(/^\[|\]$/g, ''), port: targetPort, servername: target.hostname, rejectUnauthorized: false };
    const up = target.protocol === 'https:' ? tls.connect(opts, onConnect) : net.connect(opts, onConnect);
    function onConnect() {
      let raw = `${req.method ?? 'GET'} ${req.url ?? '/'} HTTP/1.1\r\n`;
      const h = upstreamHeaders(req);
      for (const [k, v] of Object.entries(h)) for (const vv of [v ?? []].flat()) raw += `${k}: ${vv}\r\n`;
      up.write(raw + '\r\n');
      if (head.length) up.write(head);
      up.pipe(socket); socket.pipe(up);
    }
    up.on('error', () => socket.destroy());
    socket.on('error', () => up.destroy());
  };

  // A file the page names (from a hint, or the browser editor): only inside the project (--root, default the cwd we were started from).
  interface Refusal { status: 403 | 404 | 413; error: string }
  function projectFile(file: string): { abs: string; real: string; rel: string; realRoot: string } | Refusal {
    const inside = (dir: string, f: string) => f === dir || f.startsWith(dir + path.sep);
    const abs = path.resolve(root, file);
    if (!inside(root, abs)) return { status: 403, error: 'file is outside the project' };
    let real;
    try { real = fs.realpathSync(abs); } catch { return { status: 404, error: `${file} not found in ${root}` }; }
    const realRoot = fs.realpathSync(root);
    if (!inside(realRoot, real)) return { status: 403, error: 'file is outside the project' };
    return { abs, real, rel: path.relative(root, abs), realRoot };
  }

  // What the browser editor may read and write: source files. Not dotfiles (.env, .git), node_modules, or anything git ignores.
  function editable(file: string) {
    const f = projectFile(file);
    if ('error' in f) return f;
    const realRel = path.relative(f.realRoot, f.real);
    if ([...f.rel.split(path.sep), ...realRel.split(path.sep)].some(s => s.startsWith('.') || s === 'node_modules'))
      return { status: 403, error: `${f.rel} cannot be edited in the browser (dotfiles and node_modules are off limits)` } satisfies Refusal;
    try {
      execFileSync('git', ['check-ignore', '-q', '--', realRel], { cwd: f.realRoot, stdio: 'ignore' });
      return { status: 403, error: `${f.rel} cannot be edited in the browser (git ignores it)` } satisfies Refusal;
    } catch {} // exit 1: not ignored; 128 or no git: not a repo, nothing to ignore
    const stat = fs.statSync(f.real);
    if (!stat.isFile()) return { status: 404, error: `${f.rel} is not a file` } satisfies Refusal;
    if (stat.size > 2_000_000) return { status: 413, error: `${f.rel} is too large to edit in the browser` } satisfies Refusal;
    return f;
  }

  const etag = (buf: Buffer) => crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16);

  // Resolves a source file from a hint and, when launch is set, opens it in the editor on this machine
  // (the browser is on it too). Either way it returns the editor URL a browser on another machine opens instead.
  function openInEditor(file: string, line: number, column: number, launch: boolean): { status: 200; result: OpenResult } | { status: 403 | 404 | 413 | 500; error: string } {
    const f = projectFile(file);
    if ('error' in f) return f;
    const { abs, rel } = f;
    sshHost ??= `${os.userInfo().username}@${(ts ?? tailscaleSelf())?.name ?? os.hostname()}`;
    const vars: Record<string, string> = { host: sshHost, abs, file: rel, line: String(line || 1), col: String(column || 1) };
    const url = editorUrl.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
    if (launch) {
      const failures: string[] = []; // filled synchronously when no editor is found
      launchEditor(abs + (line ? `:${line}${column ? `:${column}` : ''}` : ''), (_f, msg) => failures.push(msg ?? 'no editor found (set LAUNCH_EDITOR or EDITOR)'));
      if (failures[0]) return { status: 500, error: failures[0] };
      log(`opened ${rel}${line ? `:${line}` : ''} in the editor`);
    }
    return { status: 200, result: { file: rel, abs, url } };
  }

  function log(msg: string) { console.log(`[punchlist ${new Date().toLocaleTimeString()}] ${msg}`); }

  // One server per address, all on the same port.
  const listenOn = (h: string) => new Promise<http.Server | NodeJS.ErrnoException>(resolve => {
    const s = http.createServer(handler).on('upgrade', onUpgrade).once('error', resolve);
    s.listen(port, h, () => { s.off('error', resolve); resolve(s); });
  });
  // runs detached with output in the log file, so fail there (start reads it back)
  const fail = (msg: string): never => { console.error(msg); process.exit(1); };
  async function bind() {
    for (;;) {
      const main = await listenOn(host);
      if (!(main instanceof http.Server)) {
        if (main.code === 'EADDRINUSE' && auto && port < lastPort) { log(`port ${port} is in use, trying ${port + 1}`); port++; continue; }
        return fail(main.code === 'EADDRINUSE' ? `port ${port} is in use (pick another with --port)` : main.message);
      }
      const servers = [main];
      let clash = false;
      for (const ip of tailnetIps) {
        const s = await listenOn(ip);
        if (s instanceof http.Server) servers.push(s);
        else if (s.code === 'EADDRINUSE') { clash = true; break; }
        else log(`not listening on tailscale address ${ip}: ${s.code ?? s.message}`);
      }
      if (!clash) return servers.length > 1 || wildcard;
      for (const s of servers) s.close();
      if (auto && port < lastPort) { log(`port ${port} is in use on the tailnet, trying ${port + 1}`); port++; continue; }
      return fail(`port ${port} is in use on the tailscale address (pick another with --port, or pass --no-tailscale)`);
    }
  }
  void bind().then(onTailnet => {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    // cwd = the project the agent started us from; the home view (and the session hook) is scoped to it
    const st: ProxyState = { port, host, target: target.origin, token, auth: !noAuth, pid: process.pid, cwd: process.cwd(), ...(ts && onTailnet ? { tailnet: ts.name } : {}) };
    fs.writeFileSync(statePath(port), JSON.stringify(st));
    printInfo(st);
  });

  const cleanup = () => { try { fs.unlinkSync(statePath(port)); } catch {} process.exit(0); };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  return new Promise<never>(() => undefined); // keep serving; output goes to the log
}

// The checks the browser's request has to pass; the rest of the payload is read defensively (see LooseElement).
function isPayload(x: unknown): x is Payload<LooseElement> {
  const notes = (x as { notes?: unknown } | null)?.notes;
  return Array.isArray(notes) && notes.length > 0 && notes.every((n: unknown) => {
    const { comment, elements } = (n ?? {}) as { comment?: unknown; elements?: unknown };
    return typeof comment === 'string' && comment.trim() !== '' && Array.isArray(elements) && elements.length > 0;
  });
}

// ---------------------------------------------------------------- agent side

const HTML_LIMIT = 600;

// One request as AXI output: minimal fields by default, everything with `full`.
function requestView(it: Item, port: number, full = false) {
  const { notes, viewport } = it.payload;
  const kinds = new Set(notes.map(n => n.kind));
  const cut = !full && notes.some(n => n.elements.some(e => (e.html?.length ?? 0) > HTML_LIMIT));
  const noHint: string[] = [];
  const view = {
    request: { id: it.id, status: it.status, notes: notes.length, ...(viewport ? { viewport: `${viewport.w}x${viewport.h}` } : {}) },
    notes: notes.map((n, i) => ({
      key: String(i + 1),
      kind: n.kind,
      comment: n.comment,
      page: n.path,
      ...(n.frozen ? { frozen: 'captured with animations paused' } : {}),
      ...(n.kind === 'text' ? { selected: n.text } : {}),
      ...(n.kind === 'area' && n.area ? { area: `${Math.round(n.area.width)}x${Math.round(n.area.height)} at page (${Math.round(n.area.x)}, ${Math.round(n.area.y)})` } : {}),
      targets: n.elements.map((e, j) => {
        const key = n.elements.length > 1 ? `${i + 1}${'abcdef'.charAt(j)}` : String(i + 1);
        const h = e.hints ?? {};
        const hints = Object.fromEntries((['svelte', 'rails', 'react', 'vue'] as const).flatMap(k => {
          const v = h[k];
          return v?.length ? [[k, v.join(k === 'rails' ? ' > ' : k === 'svelte' ? ', ' : ' < ')]] : [];
        }));
        if (!Object.keys(hints).length) noHint.push(key);
        let html = e.html ?? '';
        if (!full && html.length > HTML_LIMIT) html = `${html.slice(0, HTML_LIMIT)}... (truncated, ${html.length} chars total)`;
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
  if (it.payload.kind === 'locate') return { ...view, request: { ...view.request, kind: 'locate' }, help: [
    `The user wants to open the source of this target ${it.payload.edit ? 'in the editor in their browser (only source files: no dotfiles, node_modules or git-ignored files)' : 'in their editor'}: find the file (and line) that renders it. Lookup only - do not edit anything`,
    'Use the hints first (a component name: grep for its definition), then visible text, ids, data-* attributes or uncommon classes',
    `Run \`${PE} done ${it.id} --open <file>[:line[:col]] --port ${port}\` to hand it back (a path relative to the project; the browser offers Open / Copy); --failed "<why>" if you cannot find it`,
  ] };
  const help = ['Handle every note (notes may touch the same file), then report once'];
  if (kinds.has('elements')) help.push('kind elements: apply the comment to every target; they often share one partial or component');
  if (kinds.has('text')) help.push('kind text: change exactly the selected text; it may live in an i18n file (config/locales, src/lib/i18n)');
  if (kinds.has('area')) help.push('kind area: the user boxed empty space; the change belongs at that spot inside the target');
  if (noHint.length) help.push(`No source hint for [${noHint.join('], [')}]: grep for the visible text, ids, data-* attributes or uncommon classes; the page path tells you the route`);
  if (cut || !full) help.push(`Run \`${PE} show ${it.id} --full --port ${port}\` for selectors, computed styles${cut ? ' and the full HTML' : ''}`);
  help.push(`Run \`${PE} done ${it.id} "<one line per note, e.g. 1: ... 2: ...>" --port ${port}\` when finished (--failed if nothing could be done)`);
  return { ...view, help };
}

async function cmdWait(args: Args) {
  const st = loadState(args);
  const secs = Number(args.timeout ?? 540);
  if (!(secs > 0)) throw usageError('--timeout must be a number of seconds', 'wait');
  const deadline = Date.now() + secs * 1000;
  while (Date.now() < deadline) {
    const left = Math.max(1000, Math.min(25000, deadline - Date.now()));
    const r = await api(st, `/next?timeout=${left}`);
    if (r.status === 200) {
      const it = await r.json() as Item;
      return args.json ? JSON.stringify(it, null, 2) : requestView(it, st.port);
    }
    if (r.status !== 204) throw new AxiError(`unexpected ${r.status} from the proxy: ${(await r.text()).slice(0, 300)}`, 'PROXY_ERROR');
  }
  return { request: `none (waited ${secs}s)`, help: [listenHelp(st.port)] };
}

async function cmdShow(args: Args) {
  const id = args._[0];
  if (!id) throw usageError('request id is required', 'show', [`Run \`${PE} show <id> [--full]\``]);
  const st = loadState(args);
  const r = await api(st, `/requests/${encodeURIComponent(id)}`);
  if (r.status === 404) throw new AxiError(`no request ${id} on port ${st.port}`, 'NOT_FOUND', [`Run \`${PE} status --port ${st.port}\` to list requests`]);
  return requestView(await r.json() as Item, st.port, args.full === true);
}

async function cmdDone(args: Args) {
  const id = args._[0];
  if (!id) throw usageError('request id is required', 'done', [`Run \`${PE} done <id> "<one line per note>"\``]);
  const st = loadState(args);
  const status: Status = args.failed ? 'failed' : 'done';
  let message = args._.slice(1).join(' ') || null;
  let found: FileRef | null = null;
  if (args.open && !args.failed) {
    const [, file, line, column] = /^(.+?)(?::(\d+))?(?::(\d+))?$/.exec(args.open) ?? [];
    // resolve only: the browser offers Open / Copy (or opens it in the page editor), on whichever machine the user is at
    const o = await api(st, '/open', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ file, line, column, launch: false, request: id }) });
    const b = await o.json().catch(() => ({})) as Partial<OpenResult> & { error?: string };
    if (!o.ok || !b.file) throw new AxiError(`could not open ${args.open}: ${b.error ?? o.status}`, 'OPEN_FAILED', [`Fix the path and run \`${PE} done ${id} --open <file>[:line[:col]] --port ${st.port}\` again`,
      ...(o.status === 403 ? [`If no editable file renders it, run \`${PE} done ${id} "<why>" --failed --port ${st.port}\``] : [])]);
    found = { file: b.file, ...(line ? { line: Number(line) } : {}), ...(column ? { column: Number(column) } : {}) };
    message ??= `found ${b.file}${line ? `:${line}${column ? `:${column}` : ''}` : ''}`;
  }
  const r = await api(st, `/requests/${encodeURIComponent(id)}/done`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status, message, ...(found ? { file: found } : {}) }),
  });
  if (r.status === 404) throw new AxiError(`no request ${id} on port ${st.port}`, 'NOT_FOUND', [`Run \`${PE} status --port ${st.port}\` to list requests`]);
  if (!r.ok) throw new AxiError(`proxy refused: ${r.status} ${(await r.text()).slice(0, 300)}`, 'PROXY_ERROR');
  return { request: { id, status }, help: [listenHelp(st.port)] };
}

async function cmdStatus(args: Args) {
  const st = loadState(args);
  const list = await (await api(st, '/requests')).json() as PublicItem[];
  const by = (s: Status) => list.filter(i => i.status === s).length;
  return {
    proxy: { target: st.target, port: st.port, pid: st.pid },
    count: list.length ? `${list.length} request${list.length === 1 ? "" : "s"} (${by('pending')} pending, ${by('working')} working, ${by('done')} done, ${by('failed')} failed)` : '0 requests - the user has not sent anything yet',
    ...(list.length ? { requests: list.map(i => ({ id: i.id, status: i.status, prompt: i.prompt })) } : {}),
    help: [`Run \`${PE} wait --port ${st.port}\` to receive the next batch`],
  };
}

function cmdStop(args: Args) {
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
    .flatMap(f => { try { return [readState(path.join(STATE_DIR, f))]; } catch { return []; } })
    .filter(st => alive(st.pid));
}

// Also the SessionStart hook output: keep it small and scoped to the current directory.
async function home() {
  const here = process.cwd();
  const mine = (st: ProxyState) => st.cwd !== undefined && (here === st.cwd || here.startsWith(st.cwd + path.sep));
  const sts = runningProxies(), local = sts.filter(mine), others = sts.length - local.length;
  const proxies = await Promise.all(local.map(async st => {
    let pending: number | '?' = '?';
    try { pending = (await (await api(st, '/requests', { signal: AbortSignal.timeout(1500) })).json() as PublicItem[]).filter(i => i.status === 'pending').length; } catch {}
    return { port: st.port, target: st.target, pending };
  }));
  return {
    proxies: proxies.length ? proxies : '0 running for this directory',
    ...(others ? { other_proxies: `${others} (started from other directories; see \`${PE} status --port <port>\`)` } : {}),
    help: proxies.length
      ? [`Run \`${PE} wait --port <port>\` to receive notes`, `Run \`${PE} status --port <port>\` to list requests`, `Run \`${PE} --help\` for commands and the loop`]
      : [`Run \`${PE} start --target <port|url>\` to proxy a dev server`, `Run \`${PE} --help\` for commands and the loop`],
  };
}

// Opt-in only (AXI rule 7): the one command that writes agent config.
function cmdSetup(args: Args) {
  if (args._[0] !== 'hooks' || args._.length > 1) throw usageError('unknown setup target', 'setup', [`Run \`${PE} setup hooks [--project] [--remove]\``]);
  // a hook runs at every session start, so it needs a path that npm will not clean up
  if (VIA_NPX && !args.remove) throw new AxiError('setup hooks needs an installed punchlist-axi (the npx cache path can disappear)', 'NOT_INSTALLED',
    ['Run `npm i -g punchlist-axi`, then `punchlist-axi setup hooks`']);
  const scope = args.project ? 'project' as const : 'user' as const;
  const identity = { marker: 'punchlist-axi', execPath: SCRIPT, scope };
  const problems: string[] = [];
  const onError = (m: string) => { problems.push(m); };
  if (args.remove) uninstallSessionStartHooks({ ...identity, onError });
  else installSessionStartHooks({ ...identity, binaryNames: ['punchlist-axi'], shouldInstall: () => true, onError });
  const st = sessionStartHookStatus(identity);
  const row = (agent: string, a: { installed: boolean; path: string }) => ({ agent, installed: a.installed, path: a.path.replace(os.homedir(), '~') });
  return {
    setup: `${args.remove ? 'removed' : 'installed or already up to date'}: SessionStart hooks (${scope} scope)`,
    agents: [row('claude', st.claude), row('codex', st.codex), row('opencode', st.opencode)],
    ...(problems.length ? { warnings: problems } : {}),
    help: args.remove ? [`Run \`${PE} setup hooks${args.project ? ' --project' : ''}\` to install them again`]
      : ['Each new agent session now starts with the proxies running for its directory', `Run \`${PE} setup hooks --remove${args.project ? ' --project' : ''}\` to undo`],
  };
}

// ---------------------------------------------------------------- main

// How the agent should call us again: npx (cache path may be cleaned), a global install on PATH, or a checkout.
const REAL_SCRIPT = (() => { try { return fs.realpathSync(SCRIPT); } catch { return SCRIPT; } })();
const VIA_NPX = REAL_SCRIPT.split(path.sep).includes('_npx');
const ON_PATH = !VIA_NPX && (process.env['PATH'] ?? '').split(path.delimiter).some(dir => {
  try { return dir !== '' && fs.realpathSync(path.join(dir, 'punchlist-axi')) === REAL_SCRIPT; } catch { return false; }
});
const PE = VIA_NPX ? 'npx -y punchlist-axi' : ON_PATH ? 'punchlist-axi' : `node ${SCRIPT}`;
// A background wait wakes the agent when notes arrive, so the user never has to prompt "pick up the notes".
const listenHelp = (port: number) => `Run \`${PE} wait --port ${port}\` as a background command (Claude Code: Bash with run_in_background: true), so new notes reach you without the user asking. Never end your turn without a wait running`;
const GUIDE = `punchlist - click-to-edit for any running web app. A local proxy injects a picker into every
page; the user marks elements and presses Send; you pull the notes, edit the source, report back.

commands:
  start   proxy a dev server in the background and print the link for the user
  wait    block until the user sends notes, then print them
  show    print a request again (--full: selectors, styles, full HTML)
  done    report a request back to the browser
  status  list requests on a proxy
  stop    stop a proxy
  setup   add a SessionStart hook so new agent sessions see running proxies
  serve   run the proxy in the foreground (debugging)

loop: start -> send the user the link -> wait (in the background) -> edit the source -> done -> wait ...
Every output ends with help lines that name the next command.
Run \`${PE} <command> --help\` for flags, examples and guidance.`;

const HELP: Partial<Record<string, string>> = {
  start: `start --target <port|url> [--port 4000] [--host 127.0.0.1] [--no-auth] [--no-tailscale] [--root .] [--editor-url vscode]
  Start the proxy in the background and print the link for the user. Safe to re-run: without
  --port it reuses the proxy for the same target. Always pass the printed --port to later commands.
  Find the dev server port from running processes, Procfile.dev, bin/dev, package.json scripts or
  the conversation; ask the user only if it is unclear.
  --target   dev server port or URL (required)
  --port     proxy port, strict (default: 4000, or the next free port when it is busy;
             set PUNCHLIST_PORT to start from another port)
  --host     listen address (default 127.0.0.1; 0.0.0.0 = all interfaces)
  --no-auth  no access token (purely local use only; never on the tailnet)
  --no-tailscale  do not listen on the tailnet
  --root     project directory that ↗ Open resolves source hints against (default: the cwd)
  --editor-url  how ↗ Open reaches the editor from a browser on another machine (tailscale):
             vscode (default), cursor, windsurf, zed, or a template with {host} {abs} {line} {col}
             ({host} = user@<tailscale name>; the editor connects back over SSH).
             A browser on localhost opens the file in the editor on this machine instead
  When tailscale is installed and connected, the proxy also listens on this machine's tailnet
  addresses and prints a tailscale link (http://<machine>.<tailnet>.ts.net:<port>) that opens on
  the user's phone. Only tailnet devices reach it, and the link token is still required.
  Never use \`tailscale funnel\`: anyone who reaches the proxy can make you edit code.
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
  Run wait as a background command so you stay free and your harness tells you when it exits:
  Claude Code: Bash with run_in_background: true. Other harnesses: any background job that
  reports its exit. No background support: run it in the foreground. Notes queue on the proxy,
  so none are lost between runs. Run wait again after every done and every timeout, without
  commentary, until the user tells you to stop: you hear the user only while wait runs.
  In the background a longer --timeout (e.g. 3600) means fewer empty wake-ups.
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
  done: `done <id> "<one line per note>" [--failed] [--open <file[:line[:col]]>] [--port 4000]
  Report a request back to the browser (shown as a toast). Run it once per request.
  If some notes fail, still do the others and name the failed ones in the message.
  --failed   nothing could be done; the message says why
  --open     the project file you found (answers a locate request); the user gets Open / Copy,
             or the file opens in the page editor when they asked for ✎ Edit
examples:
  ${PE} done r1 "1: CTA larger  2: doors time -> 18:00" --port 4000
  ${PE} done r2 "need the new copy for the hero" --failed
  ${PE} done r3 --open app/assets/javascripts/components/hero.js.jsx:12`,
  status: `status [--port 4000]
  List the requests on a proxy with counts by state.`,
  stop: `stop [--port 4000]
  Stop a proxy. No-op when nothing runs.`,
  setup: `setup hooks [--project] [--remove]
  Add a SessionStart hook to Claude Code, Codex and OpenCode: each session starts with the
  proxies running for its directory (the no-args home view). Safe to re-run.
  --project  write the project's config (.claude/settings.json, ...) instead of the user's
  --remove   take the hooks out again
examples:
  ${PE} setup hooks
  ${PE} setup hooks --remove`,
};

const handlers: Record<Command, (args: Args) => ReturnType<AxiCliCommand<undefined>>> =
  { start: cmdStart, serve: cmdServe, wait: cmdWait, show: cmdShow, done: cmdDone, status: cmdStatus, stop: cmdStop, setup: cmdSetup };
const cmds = Object.fromEntries((Object.keys(handlers) as Command[]).map(k => [k, (argv: string[]) => handlers[k](parseArgs(k, argv))]));

await runAxiCli({
  description: 'Click-to-edit for running web apps: the user marks UI in the browser, you pull the notes and edit the source',
  version: VERSION,
  topLevelHelp: GUIDE + '\n',
  home,
  commands: cmds,
  getCommandHelp: c => { const h = HELP[c]; return h ? h + '\n' : null; },
});
