// `pnpm demo:capture`: records the raw footage for the demo video. It serves demo/app from a temp copy,
// puts the real proxy in front of it, and drives a headless Chromium through one punch list:
// two clicked notes and one dragged box, Send, then a fake agent (string edits on the copy) answers with `done`.
// Writes demo/out/raw.mp4 (1080p, from CDP screencast frames, encoded by the system ffmpeg), and demo/out/timeline.json: the CLI commands, their real output,
// scene marks, and where each click, typed note and drag happened (CSS px of the 1280x720 viewport), in seconds from the
// start of the video, for the edit in demo/video/ (it draws the terminal and points the camera with them).
// Not shipped. Chromium: $CHROME, else /usr/bin/chromium (playwright-core downloads no browser).
import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { chromium, type Page } from 'playwright-core';
import { startApp } from './app/server.ts';

const here = import.meta.dirname, out = path.join(here, 'out'), cli = path.join(here, '../scripts/punchlist-axi.mjs');
const APP_PORT = 5199, PROXY_PORT = 4123, W = 1280, H = 720, SCALE = 1.5, FPS = 30;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// what the fake agent changes after `wait`: one edit per note, in the order the notes are sent
const notes = [
  { at: 'h1', text: 'Typo: "coffe" should be "coffee"', fix: ['Fresh coffe,', 'Fresh coffee,'] },
  { at: '.cta', text: 'Make this the main button: bigger, brand color', fix: ['/* cta */ .cta { display: inline-block; border: 0; border-radius: 6px; background: #e7e5e4; color: #57534e; padding: 6px 12px; font-size: 13px; }',
    '/* cta */ .cta { display: inline-block; border: 0; border-radius: 999px; background: #b45309; color: #fff; padding: 14px 28px; font-size: 17px; font-weight: 600; box-shadow: 0 8px 24px rgba(180,83,9,.3); }'] },
  { at: '.grid', text: 'Cards feel cramped, give them room', fix: ['gap: 4px; }', 'gap: 24px; }'],
    more: [['border-radius: 4px; padding: 12px; }', 'border-radius: 16px; padding: 24px; }']] },
] as const;
const summary = '1: fixed the typo in _hero.html.erb  2: .cta is now the brand button  3: 24px gaps, roomier cards';

interface Rect { x: number; y: number; width: number; height: number }
type Kind = 'cmd' | 'out' | 'scene' | 'click' | 'typing' | 'typed' | 'drag' | 'dragged';
const timeline: { t: number; kind: Kind; text: string; rect?: Rect }[] = [];
let t0 = 0;
const mark = (kind: Kind, text: string, rect?: Rect | null) => { timeline.push({ t: (Date.now() - t0) / 1000, kind, text, ...(rect ? { rect } : {}) }); };

async function run(args: string[]) {
  mark('cmd', `punchlist-axi ${args.join(' ')}`);
  const { stdout } = await promisify(execFile)('node', [cli, ...args]);
  mark('out', stdout);
  return stdout;
}

// headless Chromium draws no pointer: a fake one follows the mouse, and a ring shows each press
const cursor = () => {
  addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div');
    c.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M4 2l16 10-7 1.5L9.5 21z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: 'fixed', left: '0', top: '0', zIndex: '2147483647', pointerEvents: 'none', transform: 'translate(-4px,-2px)', transition: 'scale .12s' });
    document.documentElement.append(c);
    // capture on window runs before the picker's listeners, which swallow events in annotate mode
    addEventListener('pointermove', e => { c.style.left = `${e.clientX}px`; c.style.top = `${e.clientY}px`; }, true);
    addEventListener('pointerdown', e => {
      c.style.scale = '.85';
      const r = document.createElement('div');
      Object.assign(r.style, { position: 'fixed', left: `${e.clientX - 18}px`, top: `${e.clientY - 18}px`, width: '36px', height: '36px', borderRadius: '50%',
        border: '3px solid #7c3aed', zIndex: '2147483646', pointerEvents: 'none', transition: 'transform .4s, opacity .4s' });
      document.documentElement.append(r);
      requestAnimationFrame(() => { r.style.transform = 'scale(1.6)'; r.style.opacity = '0'; });
      setTimeout(() => { r.remove(); }, 500);
    }, true);
    addEventListener('pointerup', () => { c.style.scale = '1'; }, true);
  });
};

// eased mouse moves, so the pointer glides like a hand instead of jumping
let mx = W / 2, my = H / 2;
async function glide(page: Page, x: number, y: number, ms = 600) {
  const steps = Math.max(8, Math.round(ms / 16)), fx = mx, fy = my;
  for (let i = 1; i <= steps; i++) {
    const k = i / steps, e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
    await page.mouse.move(fx + (x - fx) * e, fy + (y - fy) * e);
    await sleep(16);
  }
  mx = x; my = y;
}
async function center(page: Page, selector: string) {
  const b = await page.locator(selector).first().boundingBox();
  if (!b) throw new Error(`not on screen: ${selector}`);
  return { x: b.x + b.width / 2, y: b.y + b.height / 2, b };
}
async function click(page: Page, selector: string) {
  // aim again when the target moved during the glide (toasts above it expire, say)
  for (let i = 0; i < 3; i++) {
    const { x, y } = await center(page, selector);
    if (Math.hypot(x - mx, y - my) < 2) break;
    await glide(page, x, y, i ? 300 : 600);
  }
  await sleep(150);
  mark('click', selector, await page.locator(selector).first().boundingBox());
  await page.mouse.down(); await sleep(80); await page.mouse.up();
}
async function note(page: Page, text: string) {
  await sleep(400);
  mark('typing', text, await page.locator('punchlist-root .sheet').first().boundingBox());
  await page.locator('punchlist-root textarea').pressSequentially(text, { delay: 45 });
  mark('typed', text);
  await sleep(400);
  await click(page, 'punchlist-root .add');
  await sleep(500);
}

// constant frame rate: repeat the latest screencast frame at every tick
async function encode(frames: { t: number; jpeg: Buffer }[], end: number, file: string) {
  const first = frames[0];
  if (!first) throw new Error('no frames');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-vf', `scale=${W * SCALE}:${H * SCALE}`, '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise<void>((resolve, reject) => { ff.on('close', c => { if (c) reject(new Error(`ffmpeg exited ${String(c)}`)); else resolve(); }); });
  let i = 0;
  for (let t = t0; t <= end; t += 1000 / FPS) {
    while (frames[i + 1] && (frames[i + 1]?.t ?? Infinity) <= t) i++;
    const f = frames[i] ?? first;
    if (!ff.stdin.write(f.jpeg)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await done;
}

fs.mkdirSync(out, { recursive: true });
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'punchlist-demo-'));
fs.copyFileSync(path.join(here, 'app/index.html'), path.join(dir, 'index.html'));
const app = await startApp(dir, APP_PORT);
const started = await run(['start', '--target', String(APP_PORT), '--port', String(PROXY_PORT), '--no-tailscale', '--idle-timeout', '300']);
const link = /local: "([^"]+)"/.exec(started)?.[1];
if (!link) throw new Error(`no link in:\n${started}`);

const browser = await chromium.launch({ executablePath: process.env['CHROME'] ?? '/usr/bin/chromium' });
try {
  const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE });
  await context.addInitScript(cursor);
  const page = await context.newPage();
  // the screencast sends a frame only when the page changes; each is held until the next one
  const frames: { t: number; jpeg: Buffer }[] = [];
  const cdp = await context.newCDPSession(page);
  cdp.on('Page.screencastFrame', f => {
    frames.push({ t: Date.now(), jpeg: Buffer.from(f.data, 'base64') });
    void cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => undefined);
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W * SCALE, maxHeight: H * SCALE });
  t0 = Date.now(); timeline.length = 0; // the video starts with the page; `start` ran before it
  mark('cmd', `punchlist-axi start --target ${APP_PORT}`); mark('out', started);
  await page.goto(link);
  await page.locator('punchlist-root [data-act="pick"]').waitFor();
  await page.mouse.move(mx, my);
  mark('scene', 'page'); await sleep(1500);

  mark('scene', 'annotate'); await click(page, 'punchlist-root [data-act="pick"]'); await sleep(500);
  for (const n of notes.slice(0, 2)) { await click(page, n.at); await note(page, n.text); }

  // a box around the plans: press outside the grid, drag past it
  mark('scene', 'drag');
  const { b } = await center(page, notes[2].at);
  await glide(page, b.x - 12, b.y - 12);
  mark('drag', notes[2].at, { x: b.x - 12, y: b.y - 12, width: b.width + 24, height: b.height + 24 });
  await page.mouse.down();
  await glide(page, b.x + b.width + 12, b.y + b.height + 12, 900); await page.mouse.up();
  mark('dragged', notes[2].at);
  await note(page, notes[2].text);

  // the agent is already waiting when the user presses Send
  mark('scene', 'send');
  const waited = run(['wait', '--port', String(PROXY_PORT)]);
  await sleep(300);
  await click(page, 'punchlist-root [data-act="send"]');
  // annotate off while the agent works, so the pointer stops outlining what it rests on
  await sleep(600); await click(page, 'punchlist-root [data-act="pick"]');
  const batch = await waited;
  const id = /\b(r\d+)\b/.exec(batch)?.[1] ?? 'r1';

  mark('scene', 'agent'); await sleep(1500);
  const file = path.join(dir, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  for (const n of notes) for (const [a, z] of [n.fix, ...('more' in n ? n.more : [])]) html = html.replace(a, z);
  fs.writeFileSync(file, html);
  await run(['done', id, summary, '--port', String(PROXY_PORT)]);

  mark('scene', 'done');
  // the queued / working toasts expire on timers; Reload moves up when they go, so wait for it to stand alone
  await page.waitForFunction(() => {
    const t = document.querySelector('punchlist-root')?.shadowRoot?.querySelectorAll('.toast');
    return t?.length === 1 && t[0]?.textContent.includes('Reload');
  }, null, { timeout: 15000 });
  await sleep(800);
  await click(page, 'punchlist-root .toast button >> text=Reload');
  await page.locator('h1', { hasText: 'coffee,' }).waitFor();
  await page.mouse.move(mx - 1, my); await page.mouse.move(mx, my); // the new page's fake pointer starts where the real one is
  mark('scene', 'result'); await sleep(2500);

  const end = Date.now();
  await cdp.send('Page.stopScreencast');
  await encode(frames, end, path.join(out, 'raw.mp4'));
  fs.writeFileSync(path.join(out, 'timeline.json'), JSON.stringify(timeline, null, 2) + '\n');
  console.log(`wrote ${path.relative(process.cwd(), out)}/raw.mp4 and timeline.json`);
} finally {
  await browser.close();
  await new Promise(r => { spawn('node', [cli, 'stop', '--port', String(PROXY_PORT)], { stdio: 'ignore' }).on('close', r); });
  app.close();
  fs.rmSync(dir, { recursive: true, force: true });
}
