// What the picker reads from the page: labels, selectors, source hints, and the markdown the user can copy.
import type { ElementContext, FileRef, Hints, Note, NoteKind, Rect } from '../protocol.ts';

// What the user picked: live elements, not yet snapshotted.
export interface Target { kind: NoteKind; els: Element[]; text?: string; area?: Rect }
// The note being written, with what the panel shows about it.
export interface Draft extends Target { desc: string; hint: string; file: FileRef | null; top: boolean }
// A saved note keeps its live elements (null when gone) to draw its marks.
export type LiveNote = Note & { els: (Element | null)[] };
// A status message; `reload` adds the Reload button and the auto-reload switch, `file` the Open / Copy buttons.
export interface Toast { id: number; text: string; reload: boolean; file?: FileRef | undefined }
// A rectangle in viewport coordinates.
export interface Box { left: number; top: number; width: number; height: number }

// What dev builds of each framework hang on DOM nodes; read only for source hints.
interface Fiber { type: unknown; return: Fiber | null; _debugSource?: { fileName: string; lineNumber: number } }
interface VueInstance { type?: { __file?: string; name?: string; __name?: string }; parent: VueInstance | null }
type Framework = Element & {
  __svelte_meta?: { loc?: { file: string; line: number; column: number } };
  __vueParentComponent?: VueInstance;
};

const STYLE_PROPS = ['display', 'position', 'width', 'height', 'margin', 'padding', 'gap', 'flex-direction',
  'justify-content', 'align-items', 'color', 'background-color', 'font-family', 'font-size', 'font-weight',
  'line-height', 'border', 'border-radius', 'box-shadow', 'opacity'];

export const here = () => location.pathname + location.search;
export const areaRect = (a: Rect): Box => ({ left: a.x - scrollX, top: a.y - scrollY, width: a.width, height: a.height });

export function label(el: Element) {
  let s = el.localName;
  if (el.id) s += '#' + el.id;
  const cls = [...el.classList].slice(0, 3);
  if (cls.length) s += '.' + cls.join('.');
  if (el.classList.length > 3) s += '…';
  return s;
}

function cssPath(start: Element) {
  const uniq = (id: string) => { try { return document.querySelectorAll('#' + CSS.escape(id)).length === 1; } catch { return false; } };
  const parts = [];
  for (let el: Element | null = start; el && el !== document.documentElement; el = el.parentElement) {
    if (el.id && uniq(el.id)) { parts.unshift('#' + CSS.escape(el.id)); break; }
    const tag = el.localName;
    let part = tag;
    const cls = [...el.classList].filter(c => c.length < 40).slice(0, 2);
    if (cls.length) part += '.' + cls.map(c => CSS.escape(c)).join('.');
    const parent = el.parentElement;
    if (parent) {
      const sibs = [...parent.children].filter(s => s.localName === tag);
      if (sibs.length > 1) part += `:nth-of-type(${sibs.indexOf(el) + 1})`;
    }
    parts.unshift(part);
  }
  return parts.join(' > ');
}

// Rails: config.action_view.annotate_rendered_view_with_filenames = true → <!-- BEGIN app/views/... -->
function railsTemplates(el: Element) {
  const stack: string[] = [];
  const w = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT);
  let c;
  while ((c = w.nextNode() as Comment | null)) {
    if (!(c.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)) break;
    const [, mark, file] = /^(BEGIN|END)\s+(\S+)/.exec(c.data.trim()) ?? [];
    if (!file) continue;
    if (mark === 'BEGIN') stack.push(file);
    else { const i = stack.lastIndexOf(file); if (i >= 0) stack.splice(i); }
  }
  return stack;
}

function hints(el: Element): Hints {
  const h: Hints = { rails: railsTemplates(el), svelte: [], react: [], vue: [] };
  for (let n: Element | null = el; n && h.svelte.length < 3; n = n.parentElement) {
    const loc = (n as Framework).__svelte_meta?.loc;
    if (loc?.file) { const s = `${loc.file}:${loc.line}:${loc.column}`; if (!h.svelte.includes(s)) h.svelte.push(s); }
  }
  for (let n: Element | null = el; n && !h.react.length; n = n.parentElement) {
    const key = Object.keys(n).find(k => k.startsWith('__reactFiber$'));
    if (!key) continue;
    for (let f: Fiber | null | undefined = (n as unknown as Record<string, Fiber | undefined>)[key]; f && h.react.length < 6; f = f.return) {
      if (typeof f.type !== 'function' && typeof f.type !== 'object') continue;
      const t = f.type as { displayName?: string; name?: string; render?: { name?: string } } | null;
      const name = t?.displayName || t?.name || t?.render?.name;
      if (!name) continue;
      const src = f._debugSource ? ` (${f._debugSource.fileName}:${f._debugSource.lineNumber})` : '';
      h.react.push(name + src);
    }
  }
  for (let n: Element | null = el; n && !h.vue.length; n = n.parentElement) {
    for (let c: VueInstance | null | undefined = (n as Framework).__vueParentComponent; c && h.vue.length < 6; c = c.parent) {
      const t = c.type ?? {};
      const s = t.__file || t.name || t.__name;
      if (s) h.vue.push(s);
    }
  }
  return h;
}
export const bestHint = (h: Hints) => h.svelte[0] || h.rails.at(-1) || h.vue[0] || h.react[0] || '';
// { file, line?, column? } from the best hint that names a file, or null (a bare component name)
export function fileHint(h: Hints): FileRef | null {
  for (const s of [h.svelte[0], h.rails.at(-1), h.vue[0], h.react.find(r => r.endsWith(')'))]) {
    const m = s && (/\((.+):(\d+)\)$/.exec(s) ?? /^([^\s()]+\.\w+)(?::(\d+))?(?::(\d+))?$/.exec(s));
    if (m?.[1]) return { file: m[1], ...(m[2] ? { line: +m[2] } : {}), ...(m[3] ? { column: +m[3] } : {}) };
  }
  return null;
}

export function elementContext(el: Element): ElementContext {
  const cs = getComputedStyle(el);
  const styles: Record<string, string> = {};
  for (const p of STYLE_PROPS) { const v = cs.getPropertyValue(p); if (v && v !== 'none' && v !== 'normal' && v !== 'auto') styles[p] = v; }
  let html = el.outerHTML;
  if (html.length > 4000) html = html.slice(0, 4000) + '\n<!-- …truncated by punchlist -->';
  const ancestors = [];
  for (let n = el.parentElement; n && n !== document.body && ancestors.length < 4; n = n.parentElement) ancestors.unshift(label(n));
  const r = el.getBoundingClientRect();
  return {
    label: label(el), selector: cssPath(el), ancestors,
    text: ((el as HTMLElement).innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 300),
    html, styles, rect: { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }, hints: hints(el),
  };
}

export function describe(n: Pick<Note, 'kind' | 'text' | 'area' | 'elements'>) {
  const first = n.elements[0]?.label ?? '';
  if (n.kind === 'text' && n.text !== undefined) return `text “${n.text.length > 40 ? n.text.slice(0, 40) + '…' : n.text}” in ${first}`;
  if (n.kind === 'elements') return `${n.elements.length} elements: ${n.elements.map(e => e.label).join(', ')}`;
  if (n.kind === 'area' && n.area) return `area ${Math.round(n.area.width)}×${Math.round(n.area.height)} in ${first}`;
  return first;
}

export function markdown(list: Note[]) {
  const out = [`## Page feedback (${list.length} note${list.length > 1 ? 's' : ''})`, `Viewport ${innerWidth}×${innerHeight}`, ''];
  list.forEach((n, i) => {
    out.push(`### ${i + 1}. ${describe(n)}${n.frozen ? ' (animations paused)' : ''}`);
    out.push(`Page: ${n.path}`);
    const hint = n.elements[0] && bestHint(n.elements[0].hints); if (hint) out.push(`Source: ${hint}`);
    out.push(`Selector: ${n.elements.map(e => e.selector).join(' , ')}`);
    if (n.kind === 'text') out.push(`Selected text: "${n.text ?? ''}"`);
    out.push(`Note: ${n.comment}`, '');
  });
  return out.join('\n');
}
