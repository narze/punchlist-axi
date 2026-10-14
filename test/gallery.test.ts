// The component gallery (gallery/, not shipped) bundles, every story mounts without errors, and its elements carry
// Svelte dev source hints that point into src/client/. jsdom has no layout: how the stories look is checked in a browser.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { options } from '../gallery/config.ts';

let ok = 0; const t = async (name: string, fn: () => Promise<void> | void) => { await fn(); ok++; console.log('✓', name); };
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// jsdom runs classic scripts only: one IIFE, the lazy editor import inlined
const out = await build({ ...options, format: 'iife', splitting: false, sourcemap: false, write: false, logLevel: 'silent' });
const js = out.outputFiles.find(f => f.path.endsWith('.js'))?.text ?? '';
const dom = new JSDOM('<!doctype html><html><head></head><body><div id="app"></div></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://x/',
  // CodeMirror measures text; jsdom has no layout, so it gets empty rects
  beforeParse(w) { w.Range.prototype.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] });
    w.Range.prototype.getBoundingClientRect = () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }) as DOMRect; } });
const w = dom.window, d = w.document;
const errors: unknown[] = []; dom.virtualConsole.on('jsdomError', e => errors.push(e));
dom.virtualConsole.on('error', (...a: unknown[]) => errors.push(a));
w.eval(js);
await sleep(100); // the editor import settles

await t('every component has a section with stories', () => {
  const sections = [...d.querySelectorAll('main section')].map(s => s.id);
  // App holds the state and only composes the others, so it has no stories
  const client = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/client');
  const components = fs.readdirSync(client).filter(f => f.endsWith('.svelte') && f !== 'App.svelte').map(f => f.replace(/\.svelte$/, ''));
  assert.deepEqual([...sections].sort(), components.sort(), 'one gallery section per src/client component: add or remove stories with the component');
  for (const s of sections) assert.ok(d.querySelectorAll(`#${s} figure`).length > 0, `${s} has stories`);
});
await t('stories render the real components', () => {
  assert.equal(d.querySelectorAll('#Toolbar .tools').length, 8);
  assert.equal(d.querySelectorAll('#Toolbar .tools .menu').length, 2, 'the open menu variants');
  assert.ok(d.querySelector('#NotePanel .sheet.panel.top'), 'the top variant');
  assert.equal(d.querySelectorAll('#Tray li').length, 4);
  assert.ok(d.querySelector('#UrlSheet .url .error'), 'the error state');
  assert.ok(d.querySelector('#EditorPanel .editor .conflict'), 'the conflict state');
});
await t('the shared sheet styles are on the page', () => {
  assert.ok([...d.querySelectorAll('style')].some(s => s.textContent.includes('.sheet {')));
});
await t('elements point the agent at the component source (Svelte dev build)', () => {
  const btn = d.querySelector<HTMLElement & { __svelte_meta?: { loc?: { file: string } } }>('#Toolbar [data-act="pick"]');
  assert.match(btn?.__svelte_meta?.loc?.file ?? '', /(^|\/)src\/client\/Toolbar\.svelte$/);
});
await t('no errors while mounting', () => { assert.deepEqual(errors, []); });
console.log(`\n${ok} passed`);
w.close();
