// Notes survive reloads and Turbo visits (sessionStorage); the auto-reload and edit mode choices are per browser (localStorage).
import type { Note } from '../protocol.ts';
import { here, type LiveNote } from './context.ts';

const STORE = '__pe_notes';
const AUTO_RELOAD = '__pe_autoreload';
const EDIT_MODE = '__pe_edit';

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

export const editMode = () => { try { return localStorage.getItem(EDIT_MODE) === '1'; } catch { return false; } };
export function setEditMode(on: boolean) {
  try { localStorage.setItem(EDIT_MODE, on ? '1' : '0'); } catch {}
}
