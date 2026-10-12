// Runs the real client.js in jsdom on the fixture page and checks what it would POST.
// jsdom has no layout, so drag/area selection and overlay positions are NOT covered here.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import type { Note, Payload, ServerEvent } from '../src/protocol.ts';
import { PAGE } from './fixture-server.ts';

const must = <T>(x: T | null | undefined): T => { assert.ok(x != null); return x; };
const here = path.dirname(fileURLToPath(import.meta.url));
const dom = new JSDOM(PAGE.replace('PORT', '3000'), { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://x/events/1',
  beforeParse(w) {
    w.document.getAnimations = () => [];
    w.Range.prototype.getBoundingClientRect = () => ({ left: 10, top: 10, bottom: 30, right: 60 }) as DOMRect;
  } });
const w = dom.window, d = w.document;
const errors: unknown[] = []; dom.virtualConsole.on('jsdomError', e => errors.push(e));
// what the client sent, and the hooks the stubs below hand back
const io: { sent?: Payload | undefined; opened?: unknown; es?: { onmessage: (e: { data: string }) => void }; target?: Element } = {};
Object.assign(w, {
  fetch: (u: string, o: { body: string }) => {
    if (u.endsWith('/open')) { const b = JSON.parse(o.body) as { file: string }; io.opened = b; return Promise.resolve({ ok: true, json: () => Promise.resolve({ file: b.file }) }); }
    io.sent = JSON.parse(o.body) as Payload; return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  },
  EventSource: class { onmessage = (_e: { data: string }) => undefined; constructor() { io.es = this; } }, // the client sets onmessage
  CSS: { escape: (s: string) => s.replace(/[^\w-]/g, c => '\\' + c) },
});
d.elementFromPoint = () => io.target ?? null;
w.eval(fs.readFileSync(path.join(here, '../scripts/client.js'), 'utf8'));

const R = must(must(d.querySelector('punchlist-root')).shadowRoot), q = (s: string) => must(R.querySelector<HTMLElement>(s));
const field = () => must(R.querySelector('textarea'));
const sent = () => must(io.sent);
const byId = (id: string) => must(d.getElementById(id));
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const tool = (a: string) => { q(`[data-act="${a}"]`).click(); };
const tap = (el: Element) => { io.target = el; for (const t of ['pointerdown', 'pointerup']) d.dispatchEvent(new w.MouseEvent(t, { bubbles: true, clientX: 5, clientY: 5 })); };
const add = (text: string) => { field().value = text; q('.add').click(); };

let appClicked = false; byId('buy').addEventListener('click', () => { appClicked = true; });
tool('pick'); tool('freeze');
tap(byId('buy'));
assert.equal(R.activeElement, field(), 'textarea is focused synchronously, so no early keystrokes are lost');
field().value = 'abandoned'; q('.cancel').click();
tap(byId('buy'));
assert.equal(field().value, '', 'Cancel discards the typed text');
byId('buy').click();
assert.equal(appClicked, false, 'app click handlers are swallowed in pick mode');
add('make it bigger');
await sleep(30);

tool('pick'); await sleep(30); // pick off so text selection works
const tn = must(must(d.querySelector('.after')).firstChild), rg = d.createRange();
rg.setStart(tn, 6); rg.setEnd(tn, 11);
const selection = must(w.getSelection());
selection.removeAllRanges(); selection.addRange(rg); d.dispatchEvent(new w.Event('selectionchange'));
await sleep(200);
assert.equal(q('.chip').style.display, 'block', 'Annotate chip appears for a text selection');
q('.chip').click(); add('change to "18:00"');

assert.equal(q('.count').textContent, '2');
assert.equal((JSON.parse(w.sessionStorage.getItem('__pe_notes') ?? '[]') as Note[]).length, 2, 'notes persisted to sessionStorage');
tool('send'); await sleep(30);

assert.equal(sent().notes.length, 2);
const n1 = must(sent().notes[0]), n2 = must(sent().notes[1]);
assert.equal(n1.kind, 'element'); assert.equal(n1.elements[0]?.selector, '#buy'); assert.equal(n1.frozen, true);
assert.equal(n1.elements[0].hints.rails.at(-1), 'app/views/events/_cta.html.erb');
assert.equal(n2.kind, 'text'); assert.equal(n2.text, '18:30'); assert.equal(n2.elements[0]?.label, 'p.after');
assert.equal(q('.count').textContent, '0', 'notes cleared after send');

// Open in editor: the button shows only for hints that name a file
tool('pick');
tap(byId('buy'));
assert.equal(q('.open').style.display, '', 'Open shows for a Rails template hint');
q('.open').click(); await sleep(10);
assert.deepEqual(io.opened, { file: 'app/views/events/_cta.html.erb' });
const sv = Object.assign(d.createElement('div'), { __svelte_meta: { loc: { file: 'src/routes/+page.svelte', line: 4, column: 2 } } });
const comp = Object.assign(d.createElement('span'), { __vueParentComponent: { type: { name: 'PriceTag' } } });
const card = Object.assign(d.createElement('i'), { __reactFiber$x: { type: { name: 'Card' }, _debugSource: { fileName: '/app/src/Card.tsx', lineNumber: 12 } } });
d.body.append(sv, comp, card);
tap(sv); q('.open').click(); await sleep(10);
assert.deepEqual(io.opened, { file: 'src/routes/+page.svelte', line: 4, column: 2 }, 'Svelte hint opens at line and column');
tap(card); q('.open').click(); await sleep(10);
assert.deepEqual(io.opened, { file: '/app/src/Card.tsx', line: 12 }, 'React _debugSource hint opens at the line');
tap(card);
assert.equal(q('.locate').style.display, 'none', 'no Locate when the file is known');
tap(comp);
assert.equal(q('.open').style.display, 'none', 'no Open for a component name only');
assert.equal(q('.locate').style.display, '', 'Locate asks the agent instead');
field().value = 'half typed'; io.sent = undefined;
q('.locate').click(); await sleep(10);
assert.equal(sent().kind, 'locate', 'sends a locate request');
assert.equal(sent().notes.length, 1);
assert.deepEqual(sent().notes[0]?.elements[0]?.hints.vue, ['PriceTag'], 'with the element context and hints');
assert.equal(q('.panel').style.display, 'block', 'the note panel stays open');
assert.equal(field().value, 'half typed', 'the draft text is kept');
assert.equal(q('.count').textContent, '0', 'a locate request is not a note');
w.localStorage.setItem('__pe_autoreload', '1');
const update: ServerEvent = { type: 'update', item: { id: 'r2', kind: 'locate', status: 'done', message: 'opened src/PriceTag.vue:3', label: 'x', prompt: 'x' } };
must(io.es).onmessage({ data: JSON.stringify(update) });
assert.match(q('.toasts').textContent, /opened src\/PriceTag\.vue:3/, 'the result shows as a toast');
assert.equal(q('.panel').style.display, 'block', 'a locate result never reloads the page (the draft would be lost)');
w.localStorage.removeItem('__pe_autoreload');
q('.cancel').click();
assert.deepEqual(errors, [], 'no runtime errors');
console.log('✓ client.js: pick, freeze, text selection, persistence, send payload, open in editor, agent locate');
