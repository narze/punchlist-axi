// Runs the real client.js in jsdom on the fixture page and checks what it would POST.
// jsdom has no layout, so drag/area selection and overlay positions are NOT covered here.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import type { Note, Payload, ServerEvent, SourceFile } from '../src/protocol.ts';
import type { EditorOptions } from '../src/client/editor.ts';
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
const io: { sent?: Payload | undefined; opened?: unknown; es?: { onmessage: (e: { data: string }) => void }; target?: Element;
  read?: string; saved?: SourceFile[]; disk?: SourceFile; editor?: FakeEditor | undefined } = {};
interface FakeEditor { opts: EditorOptions; doc: string; destroyed: boolean }
const reply = (status: number, body: unknown) => Promise.resolve({ ok: status < 300, status, json: () => Promise.resolve(body) });
Object.assign(w, {
  fetch: (u: string, o?: { body: string }) => {
    if (u.startsWith('/__pe/file?')) { io.read = new URL(u, 'http://x').searchParams.get('path') ?? ''; return reply(200, must(io.disk)); }
    if (u.endsWith('/file')) {
      const b = JSON.parse(must(o).body) as SourceFile; (io.saved ??= []).push(b);
      const disk = must(io.disk);
      if (b.etag !== disk.etag) return reply(409, { error: 'changed on disk', etag: disk.etag });
      io.disk = { ...b, etag: `e${io.saved.length}` }; return reply(200, { file: b.file, etag: io.disk.etag });
    }
    if (u.endsWith('/open')) { const b = JSON.parse(must(o).body) as { file: string }; io.opened = b; return reply(200, { file: b.file }); }
    io.sent = JSON.parse(must(o).body) as Payload; return reply(200, {});
  },
  // CodeMirror needs layout jsdom lacks: the picker's import of editor.js gets this stand-in (checked in a real browser instead)
  __editorImport: () => Promise.resolve({ createEditor: (_parent: HTMLElement, opts: EditorOptions) => {
    const ed: FakeEditor = io.editor = { opts, doc: opts.doc, destroyed: false };
    return { value: () => ed.doc, reset: (d: string) => { ed.doc = d; opts.onchange(false); }, saved: (d: string) => { opts.onchange(ed.doc !== d); },
      focus: () => undefined, destroy: () => { ed.destroyed = true; } };
  } }),
  EventSource: class { onmessage = (_e: { data: string }) => undefined; constructor() { io.es = this; } }, // the client sets onmessage
  CSS: { escape: (s: string) => s.replace(/[^\w-]/g, c => '\\' + c) },
});
d.elementFromPoint = () => io.target ?? null;
const client = fs.readFileSync(path.join(here, '../scripts/client.js'), 'utf8');
assert.equal(client.match(/\bimport\(/g)?.length, 1, 'one dynamic import: editor.js');
w.eval(client.replace(/\bimport\(/, 'window.__editorImport('));

const R = must(must(d.querySelector('punchlist-root')).shadowRoot), q = (s: string) => must(R.querySelector<HTMLElement>(s));
const shown = (s: string) => R.querySelector(s) !== null;
const field = () => must(R.querySelector('textarea'));
const sent = () => must(io.sent);
const byId = (id: string) => must(d.getElementById(id));
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const tool = (a: string) => { q(`[data-act="${a}"]`).click(); };
const tap = (el: Element) => { io.target = el; for (const t of ['pointerdown', 'pointerup']) d.dispatchEvent(new w.MouseEvent(t, { bubbles: true, clientX: 5, clientY: 5 })); };
const type = (text: string) => { field().value = text; field().dispatchEvent(new w.Event('input', { bubbles: true })); };
const add = (text: string) => { type(text); q('.add').click(); };

let appClicked = false; byId('buy').addEventListener('click', () => { appClicked = true; });
tool('pick'); tool('freeze');
tap(byId('buy'));
assert.equal(R.activeElement, field(), 'textarea is focused synchronously, so no early keystrokes are lost');
type('abandoned'); q('.cancel').click();
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
assert.ok(shown('.chip'), 'Annotate chip appears for a text selection');
q('.chip').click(); add('change to "18:00"');
await sleep(0);

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
assert.ok(shown('.open'), 'Open shows for a Rails template hint');
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
assert.ok(!shown('.locate'), 'no Locate when the file is known');
tap(comp);
assert.ok(!shown('.open'), 'no Open for a component name only');
assert.ok(shown('.locate'), 'Locate asks the agent instead');
type('half typed'); io.sent = undefined;
q('.locate').click(); await sleep(10);
assert.equal(sent().kind, 'locate', 'sends a locate request');
assert.equal(sent().notes.length, 1);
assert.deepEqual(sent().notes[0]?.elements[0]?.hints.vue, ['PriceTag'], 'with the element context and hints');
assert.ok(shown('.panel'), 'the note panel stays open');
assert.equal(field().value, 'half typed', 'the draft text is kept');
assert.equal(q('.count').textContent, '0', 'a locate request is not a note');
w.localStorage.setItem('__pe_autoreload', '1');
const update: ServerEvent = { type: 'update', item: { id: 'r2', kind: 'locate', status: 'done', message: 'opened src/PriceTag.vue:3', label: 'x', prompt: 'x' } };
must(io.es).onmessage({ data: JSON.stringify(update) });
await sleep(0);
assert.match(q('.toasts').textContent, /opened src\/PriceTag\.vue:3/, 'the result shows as a toast');
assert.ok(shown('.panel'), 'a locate result never reloads the page (the draft would be lost)');
w.localStorage.removeItem('__pe_autoreload');
q('.cancel').click();

// ✎ Edit opens the hinted file in the page, saves go back with the etag they were read with
io.disk = { file: 'src/routes/+page.svelte', content: '<h1>hi</h1>\n', etag: 'e0' };
tap(sv); type('my note');
q('.edit').click(); await sleep(10);
assert.equal(io.read, 'src/routes/+page.svelte');
const ed = () => must(io.editor);
assert.equal(ed().opts.line, 4); assert.equal(ed().opts.column, 2, 'opens at the hinted line and column');
assert.equal(ed().opts.root, R, 'CodeMirror lives in our shadow root');
assert.match(q('.editor .file').textContent, /src\/routes\/\+page\.svelte/);
// move by the header, resize by the corner (jsdom has no layout: the sheet reports its inline box, 500×400 at 0,0 before that)
const sheet = q('.editor'), px = (v: string, d: number) => v ? parseFloat(v) : d;
sheet.getBoundingClientRect = () => ({ left: px(sheet.style.left, 0), top: px(sheet.style.top, 0), width: px(sheet.style.width, 500), height: px(sheet.style.height, 400) }) as DOMRect;
const drag = (el: HTMLElement, dx: number, dy: number) => {
  el.setPointerCapture = () => undefined;
  const at = (t: string, x: number, y: number) => new w.MouseEvent(t, { bubbles: true, button: 0, clientX: x, clientY: y });
  el.dispatchEvent(at('pointerdown', 0, 0)); el.dispatchEvent(at('pointermove', dx, dy)); el.dispatchEvent(at('pointerup', dx, dy));
};
drag(q('.editor .head'), 100, 50); await sleep(0);
assert.equal(q('.editor').style.left, '100px'); assert.equal(q('.editor').style.top, '50px', 'the header moves the editor');
drag(q('.editor .grip'), -100, -150); await sleep(0);
assert.equal(q('.editor').style.width, '400px'); assert.equal(q('.editor').style.height, '250px', 'the corner resizes it');
assert.equal(q('.editor').style.left, '100px', 'in place');
drag(q('.editor .grip'), -1000, -1000); await sleep(0);
assert.equal(q('.editor').style.width, '280px', 'not smaller than a usable editor');
assert.deepEqual(JSON.parse(w.localStorage.getItem('__pe_editor_box') ?? 'null'), { left: 100, top: 50, width: 280, height: 180 }, 'remembered per browser');
q('.editor .file').dispatchEvent(new w.MouseEvent('dblclick', { bubbles: true })); await sleep(0);
assert.equal(q('.editor').style.left, '', 'double-click on the header puts it back');
assert.equal(w.localStorage.getItem('__pe_editor_box'), null);
assert.equal((q('.save') as HTMLButtonElement).disabled, true, 'nothing to save yet');
let appKeys = 0; d.addEventListener('keydown', () => { appKeys++; });
q('.editor .code').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'a', bubbles: true, composed: true }));
assert.equal(appKeys, 0, 'typing in the editor never reaches the app');
d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
assert.ok(shown('.editor') && shown('.panel'), 'Escape leaves the editor and the note alone');
ed().doc = '<h1>hello</h1>\n'; ed().opts.onchange(true); await sleep(0);
assert.match(q('.editor .file').textContent, /●/, 'unsaved changes show');
q('.save').click(); await sleep(10);
assert.deepEqual(io.saved?.[0], { file: 'src/routes/+page.svelte', content: '<h1>hello</h1>\n', etag: 'e0' });
assert.doesNotMatch(q('.editor .file').textContent, /●/, 'clean after the save');
assert.match(q('.toasts').textContent, /Saved src\/routes\/\+page\.svelte/);
// the agent writes the file meanwhile: the next save is refused, the user picks
io.disk = { ...io.disk, content: 'agent', etag: 'agent1' };
ed().doc = 'mine'; ed().opts.onchange(true);
ed().opts.onsave(); await sleep(10); // ⌘S in the editor
assert.ok(shown('.conflict'), 'a stale save shows the conflict');
q('.mine').click(); await sleep(10);
assert.deepEqual(io.saved.at(-1), { file: 'src/routes/+page.svelte', content: 'mine', etag: 'agent1' }, 'Overwrite saves over what is on disk');
assert.ok(!shown('.conflict'));
io.disk = { ...io.disk, content: 'agent again', etag: 'agent2' };
ed().doc = 'mine again'; ed().opts.onchange(true); await sleep(0);
q('.save').click(); await sleep(10);
q('.theirs').click(); await sleep(10);
assert.equal(ed().doc, 'agent again', 'Load from disk drops the edits');
assert.ok(!shown('.conflict'));
ed().doc = 'unsaved'; ed().opts.onchange(true); await sleep(0);
q('.close').click(); await sleep(0);
assert.ok(shown('.editor'), 'unsaved changes: the first Close only asks');
assert.equal(q('.close').textContent, 'Discard changes');
q('.close').click(); await sleep(0);
assert.ok(!shown('.editor') && ed().destroyed, 'the second one discards');
assert.equal(field().value, 'my note', 'the note being written is still there');
assert.equal(q('[data-act="pick"]').getAttribute('aria-pressed'), 'true', 'annotate mode is back on after the editor (it blocks touch scrolling, so it was off)');
// no file in the hints: ✎ Edit asks the agent to locate it, and the answer opens here
tap(comp); io.sent = undefined; io.editor = undefined;
q('.edit').click(); await sleep(10);
assert.equal(sent().edit, true, 'the agent learns the file is for the editor here');
io.disk = { file: 'src/PriceTag.vue', content: '<template/>', etag: 'v1' };
const found: ServerEvent = { type: 'update', item: { id: 'r3', kind: 'locate', status: 'done', message: 'found src/PriceTag.vue:3', label: 'x', prompt: 'x', open: { file: 'src/PriceTag.vue', line: 3 } } };
must(io.es).onmessage({ data: JSON.stringify(found) });
await sleep(10);
assert.equal(io.read, 'src/PriceTag.vue');
assert.equal(ed().opts.line, 3);
q('.close').click(); q('.cancel').click();
assert.deepEqual(errors, [], 'no runtime errors');
console.log('✓ client.js: pick, freeze, text selection, persistence, send payload, open in editor, agent locate, edit in the page');
