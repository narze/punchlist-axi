// Everything the picker does to the host page itself: input capture in annotate mode, and pausing animations.
import { label, type Box, type Target } from './context.ts';

const MAX_ELS = 6;

export interface Picker {
  picking(): boolean;
  drafting(): boolean;
  hover(at: { box: Box; label: string } | null): void;
  marquee(box: Box | null): void;
  pick(t: Target): void;
  // a text selection the user may annotate (outside annotate mode), or null
  selected(sel: { el: Element; text: string; rect: DOMRect } | null): void;
}

// Taps, drags, mouse hover and text selection on the page, reported to the picker UI living in `host`.
export function watchPage(host: HTMLElement, p: Picker) {
  const isOurs = (el: Node) => el === host || host.contains(el);
  const pageEl = (el: Node | null | undefined): el is Element =>
    !!el && el.nodeType === Node.ELEMENT_NODE && !isOurs(el) && el !== document.documentElement && el !== document.body;
  const at = (x: number, y: number) => { host.style.display = 'none'; const el = document.elementFromPoint(x, y); host.style.display = ''; return pageEl(el) ? el : null; };
  const rect = (a: { x: number; y: number }, b: { x: number; y: number }): Box =>
    ({ left: Math.min(a.x, b.x), top: Math.min(a.y, b.y), width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) });
  let drag: { x: number; y: number; moved: boolean } | null = null;

  // the app never sees clicks in annotate mode
  const swallow = (e: Event) => { if (p.picking() && !isOurs(e.target as Node)) { e.preventDefault(); e.stopImmediatePropagation(); } };
  for (const t of ['mousedown', 'mouseup', 'touchstart', 'touchend', 'dblclick', 'contextmenu', 'click'])
    document.addEventListener(t, swallow, { capture: true, passive: false });

  document.addEventListener('pointerdown', e => {
    if (!p.picking() || isOurs(e.target as Node)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    drag = { x: e.clientX, y: e.clientY, moved: false };
  }, true);
  document.addEventListener('pointermove', e => {
    if (!p.picking()) return;
    if (drag) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) drag.moved = true;
      if (drag.moved) { p.hover(null); p.marquee(rect(drag, { x: e.clientX, y: e.clientY })); }
      return;
    }
    if (e.pointerType !== 'mouse' || p.drafting() || isOurs(e.target as Node)) return;
    const el = at(e.clientX, e.clientY);
    if (el) p.hover({ box: el.getBoundingClientRect(), label: label(el) });
  }, true);
  document.addEventListener('pointerup', e => {
    if (!p.picking() || !drag) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const d = drag; drag = null;
    p.marquee(null);
    if (!d.moved) { const el = at(e.clientX, e.clientY); if (el) p.pick({ kind: 'element', els: [el] }); return; }
    const sel = { left: Math.min(d.x, e.clientX), top: Math.min(d.y, e.clientY), right: Math.max(d.x, e.clientX), bottom: Math.max(d.y, e.clientY) };
    const fits = (r: DOMRect) => r.width > 0 && r.height > 0 && r.left >= sel.left - 2 && r.right <= sel.right + 2 && r.top >= sel.top - 2 && r.bottom <= sel.bottom + 2;
    // block elements are wider than their text, so also accept an element whose content fits
    const contentRect = (el: Element) => { const rg = document.createRange(); rg.selectNodeContents(el); return rg.getBoundingClientRect(); };
    const inside = [...document.body.querySelectorAll('*')].filter(el =>
      !isOurs(el) && (fits(el.getBoundingClientRect()) || (el.textContent.trim() && fits(contentRect(el)))));
    const tops = inside.filter(el => !inside.some(o => o !== el && o.contains(el))).slice(0, MAX_ELS);
    if (tops.length === 1) { p.pick({ kind: 'element', els: tops }); return; }
    if (tops.length > 1) { p.pick({ kind: 'elements', els: tops }); return; }
    // empty space → annotate the area, anchored to the smallest element containing it
    let anchor: Element = at((sel.left + sel.right) / 2, (sel.top + sel.bottom) / 2) ?? document.body;
    while (anchor.parentElement && pageEl(anchor.parentElement)) {
      const r = anchor.getBoundingClientRect();
      if (r.left <= sel.left && r.right >= sel.right && r.top <= sel.top && r.bottom >= sel.bottom) break;
      anchor = anchor.parentElement;
    }
    p.pick({ kind: 'area', els: [anchor], area: { x: sel.left + scrollX, y: sel.top + scrollY, width: sel.right - sel.left, height: sel.bottom - sel.top } });
  }, true);
  addEventListener('scroll', () => { p.hover(null); p.selected(null); }, true);

  let selTimer = 0;
  document.addEventListener('selectionchange', () => {
    clearTimeout(selTimer);
    selTimer = setTimeout(() => {
      const s = getSelection();
      if (p.picking() || !s || s.isCollapsed || !s.rangeCount) { p.selected(null); return; }
      const range = s.getRangeAt(0);
      const node = range.commonAncestorContainer;
      const el = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
      const text = s.toString().trim();
      if (!pageEl(el) || !text || el.closest('input, textarea, [contenteditable]')) { p.selected(null); return; }
      p.selected({ el, text: text.slice(0, 300), rect: range.getBoundingClientRect() });
    }, 120);
  });

  return { pageEl };
}

// Annotate mode: crosshair, no scrolling or text selection on the page.
export function setPickMode(on: boolean) {
  const ds = document.documentElement.style;
  ds.cursor = on ? 'crosshair' : '';
  ds.touchAction = on ? 'none' : '';
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- older iOS Safari only knows the prefixed one
  ds.userSelect = ds.webkitUserSelect = on ? 'none' : '';
  if (on) getSelection()?.removeAllRanges();
}

let freezeStyle: HTMLStyleElement | null = null;
// Pause (or resume) CSS animations, transitions, Web Animations and playing media.
export function freezePage(on: boolean) {
  if (on) {
    freezeStyle = document.createElement('style');
    freezeStyle.textContent = '*, *::before, *::after { animation-play-state: paused !important; transition: none !important; }';
    document.head.append(freezeStyle);
  } else freezeStyle?.remove();
  // getAnimations is missing in older browsers (and jsdom)
  for (const a of (document.getAnimations as typeof document.getAnimations | undefined)?.call(document) ?? []) { try { if (on) a.pause(); else a.play(); } catch {} }
  document.querySelectorAll('video, audio').forEach(m => {
    if (!(m instanceof HTMLMediaElement)) return;
    if (on) { m.dataset['peWasPlaying'] = String(!m.paused); m.pause(); } else if (m.dataset['peWasPlaying'] === 'true') m.play().catch(() => undefined);
  });
}
