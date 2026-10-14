// Notes survive reloads and Turbo visits (sessionStorage); the auto-reload choice, the editor's place and recent paths are per browser (localStorage).
import type { Note } from '../protocol.ts';
import { here, type Box, type LiveNote } from './context.ts';

const STORE = '__pe_notes';
const AUTO_RELOAD = '__pe_autoreload';
const EDITOR_BOX = '__pe_editor_box';
const RECENT = '__pe_recent';

export const withoutEls = ({ els, ...n }: LiveNote): Note => n;

export function save(notes: LiveNote[]) {
  try { sessionStorage.setItem(STORE, JSON.stringify(notes.map(withoutEls))); } catch {}
}

// Notes on this page get their elements back by selector, to draw their marks.
export function restore(): LiveNote[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORE) ?? '[]') as Note[];
    return saved.map(n => ({ ...n, els: n.path === here() ? n.elements.map(e => { try { return document.querySelector(e.selector); } catch { return null; } }) : [] }));
  } catch { return []; }
}

export const autoReload = () => { try { return localStorage.getItem(AUTO_RELOAD) === '1'; } catch { return false; } };
export function setAutoReload(on: boolean) {
  try { localStorage.setItem(AUTO_RELOAD, on ? '1' : '0'); } catch {}
}

// where the user moved and sized the editor; null = the default place
export function editorBox(): Box | null {
  try { return JSON.parse(localStorage.getItem(EDITOR_BOX) ?? 'null') as Box | null; } catch { return null; }
}
export function setEditorBox(b: Box | null) {
  try { if (b) localStorage.setItem(EDITOR_BOX, JSON.stringify(b)); else localStorage.removeItem(EDITOR_BOX); } catch {}
}

// paths visited through the proxy, newest first, for the URL sheet
export function recentPaths(): string[] {
  try { const r: unknown = JSON.parse(localStorage.getItem(RECENT) ?? '[]'); return Array.isArray(r) ? r.filter((p): p is string => typeof p === 'string') : []; } catch { return []; }
}
export function visit(path: string) {
  const next = [path, ...recentPaths().filter(p => p !== path)].slice(0, 8);
  try { localStorage.setItem(RECENT, JSON.stringify(next)); } catch {}
  return next;
}
