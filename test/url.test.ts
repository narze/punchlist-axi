// The URL sheet: toPath turns what the user typed or pasted into a path on this proxy,
// then the real client.js in jsdom: open, pre-fill, go, recents, back, the draft guard, the shortcut.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { toPath } from '../src/client/context.ts';
import { PAGE } from './fixture-server.ts';

const cases: [string, string | null][] = [
  ['/orders/5', '/orders/5'],
  ['orders/5', '/orders/5'],
  ['  /a?b=1#c  ', '/a?b=1#c'],
  ['?tab=2', '/?tab=2'],
  ['#top', '/#top'],
  ['http://localhost:3000/events/1?x=1#h', '/events/1?x=1#h'],
  ['https://narze.tail.ts.net:4000/admin', '/admin'],
  ['https://example.com', '/'],
  ['localhost:3000/events/1', '/events/1'],
  ['//evil.example/x', '/evil.example/x'],
  ['HTTPS://Example.com/A', '/A'],
  ['', null],
  ['   ', null],
];
for (const [input, want] of cases) assert.equal(toPath(input), want, JSON.stringify(input));
for (const bad of ['javascript:alert(1)', 'data:text/html,hi', 'mailto:a@b.c', 'ftp://x/y']) {
  assert.throws(() => toPath(bad), /http/, `${bad} is refused`);
}
console.log('✓ toPath: any http(s) origin dropped, path + query + hash kept, other schemes refused');

const must = <T>(x: T | null | undefined): T => { assert.ok(x != null); return x; };
const here = path.dirname(fileURLToPath(import.meta.url));
const dom = new JSDOM(PAGE.replace('PORT', '3000'), { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://x/events/1?tab=2#seats',
  beforeParse(w) { w.document.getAnimations = () => []; } });
const w = dom.window, d = w.document;
const errors: unknown[] = []; dom.virtualConsole.on('jsdomError', e => errors.push(e));
// jsdom cannot navigate: record where the picker sent the browser, and what it asked
const io: { navigated?: string | undefined; back: number; forward: number; asked: number; answer: boolean } = { back: 0, forward: 0, asked: 0, answer: false };
w.HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) { io.navigated = this.href; };
Object.assign(w.History.prototype, { back: () => { io.back++; }, forward: () => { io.forward++; } });
Object.assign(w, {
  confirm: () => { io.asked++; return io.answer; },
  fetch: () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) }),
  EventSource: class { onmessage = () => undefined; },
  CSS: { escape: (s: string) => s },
});
w.localStorage.setItem('__pe_recent', JSON.stringify(['/older', '/events/1?tab=2']));
w.eval(fs.readFileSync(path.join(here, '../scripts/client.js'), 'utf8'));

const R = must(must(d.querySelector('punchlist-root')).shadowRoot), q = (s: string) => must(R.querySelector<HTMLElement>(s));
const shown = (s: string) => R.querySelector(s) !== null;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const input = () => must(R.querySelector<HTMLInputElement>('.url input'));
const go = (text: string) => {
  input().value = text; input().dispatchEvent(new w.Event('input', { bubbles: true }));
  input().dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
};
const recents = () => [...R.querySelectorAll('.url .recent button')].map(b => b.textContent);

assert.equal(q('.tools button').dataset['act'], 'url', 'the URL button comes first in the pill');
q('[data-act="url"]').click(); await sleep(0);
assert.ok(shown('.url'), 'the URL sheet opens');
assert.equal(input().value, '/events/1?tab=2#seats', 'pre-filled with the current path, query and hash');
assert.equal(R.activeElement, input(), 'focused');
assert.deepEqual([input().selectionStart, input().selectionEnd], [0, input().value.length], 'all selected, so typing replaces it');
assert.deepEqual(recents(), ['/events/1?tab=2', '/older'], 'this page went to the top of the recent paths, no duplicates');

go('http://localhost:3000/orders/5?x=1');
assert.equal(io.navigated, 'http://x/orders/5?x=1', 'a pasted URL goes to the same path on this proxy');
io.navigated = undefined;
go('javascript:alert(1)');
assert.equal(io.navigated, undefined, 'other schemes do not navigate');
await sleep(0);
assert.match(q('.url .error').textContent, /http/, 'and say why');
go('   ');
assert.equal(io.navigated, undefined, 'empty input does nothing');
await sleep(0);
assert.ok(!shown('.url .error'), 'a new try clears the error');

q('.url .recent button:last-child').click();
assert.equal(io.navigated, 'http://x/older', 'a recent path is one tap');
q('.url .back').click(); q('.url .forward').click();
assert.deepEqual([io.back, io.forward], [1, 1], 'back and forward use the history');

const keydown = (init: KeyboardEventInit) => { d.dispatchEvent(new w.KeyboardEvent('keydown', { bubbles: true, ...init })); };
keydown({ key: 'Escape' }); await sleep(0);
assert.ok(!shown('.url'), 'Escape closes it');
keydown({ altKey: true, shiftKey: true, code: 'KeyL' }); await sleep(0);
assert.ok(shown('.url'), 'Alt+Shift+L opens it');
keydown({ altKey: true, shiftKey: true, code: 'KeyL' }); await sleep(0);
assert.ok(!shown('.url'), 'and closes it');

// a note being written: leaving the page asks first
q('.tools [data-act="tray"]').click(); await sleep(0);
q('.tray .page').click(); await sleep(0);
const note = must(R.querySelector('textarea'));
note.value = 'half a thought'; note.dispatchEvent(new w.Event('input', { bubbles: true }));
q('[data-act="url"]').click(); await sleep(0);
assert.ok(!shown('.panel'), 'the note panel gives way to the URL sheet');
keydown({ key: 'Escape' }); await sleep(0);
assert.equal(must(R.querySelector('textarea')).value, 'half a thought', 'and comes back with its text after Escape');
q('[data-act="url"]').click(); await sleep(0);
io.navigated = undefined;
go('/elsewhere');
assert.equal(io.asked, 1, 'asks before dropping the note being written');
assert.equal(io.navigated, undefined, 'and stays when the user says no');
io.answer = true;
go('/elsewhere');
assert.equal(io.navigated, 'http://x/elsewhere', 'leaves when the user says yes');

assert.deepEqual(errors, [], 'no runtime errors');
console.log('✓ URL sheet: pre-fill, go, paste a full URL, refuse other schemes, recents, back/forward, Escape, Alt+Shift+L, draft guard');
