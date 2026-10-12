// Drag selection with stubbed layout (jsdom has none). Block elements are as wide as their card,
// but the user drags a box around the visible text - that must still pick those elements.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const must = <T>(x: T | null | undefined): T => { assert.ok(x != null); return x; };

const here = path.dirname(fileURLToPath(import.meta.url));
const PAGE = `<!doctype html><html><head></head><body>
  <div id="card"><h3 id="t">Keycap puller</h3><p id="s">Small</p><p id="price">฿150</p></div>
  <footer id="low">Footer</footer>
</body></html>`;
const box = (left: number, top: number, width: number, height: number) => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top }) as DOMRect;
// border boxes: blocks span the 300px card; text is narrow
const BOX: Partial<Record<string, DOMRect>> = { card: box(0, 0, 300, 120), t: box(0, 0, 300, 24), s: box(0, 30, 300, 20), price: box(0, 60, 300, 32), low: box(0, 700, 300, 40) };
const TEXT: Partial<Record<string, DOMRect>> = { card: box(0, 0, 300, 92), t: box(0, 2, 110, 20), s: box(0, 32, 50, 16), price: box(0, 64, 45, 24) };

const dom = new JSDOM(PAGE, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://x/products',
  beforeParse(w) {
    w.document.getAnimations = () => [];
    const zero = box(0, 0, 0, 0);
    w.Element.prototype.getBoundingClientRect = function (this: Element) { return BOX[this.id] ?? zero; };
    w.Range.prototype.getBoundingClientRect = function (this: Range) { return TEXT[(this.startContainer as Element).id] ?? zero; };
  } });
const w = dom.window, d = w.document;
const errors: unknown[] = []; dom.virtualConsole.on('jsdomError', e => errors.push(e));
let target: Element | null = null; // what elementFromPoint finds; the card unless a test sets it
Object.assign(w, { EventSource: class { onmessage = null; }, CSS: { escape: (s: string) => s.replace(/[^\w-]/g, c => '\\' + c) } });
d.elementFromPoint = () => target ?? d.getElementById('card');
w.eval(fs.readFileSync(path.join(here, '../scripts/client.js'), 'utf8'));

const R = must(must(d.querySelector('punchlist-root')).shadowRoot), q = (s: string) => must(R.querySelector<HTMLElement>(s));
const ev = (t: string, x: number, y: number) => d.dispatchEvent(new w.MouseEvent(t, { bubbles: true, clientX: x, clientY: y }));
q('[data-act="pick"]').click();
ev('pointerdown', -5, -5); ev('pointermove', 130, 95); ev('pointerup', 130, 95);

assert.match(q('.panel .label').textContent, /^3 elements/, 'drag around visible text picks the 3 text elements, not an area');
assert.ok(!q('.panel').classList.contains('top'), 'sheet stays at the bottom for a target in the upper half');
q('.cancel').click();

target = d.getElementById('low'); ev('pointerdown', 10, 710); ev('pointerup', 10, 710);
assert.ok(q('.panel').classList.contains('top'), 'sheet moves to the top so it does not cover a target in the lower half');
assert.deepEqual(errors, [], 'no runtime errors');
console.log('✓ client.js: drag around text picks block elements; sheet avoids the target');
w.close();
