// The in-browser code editor (CodeMirror 6). Its own bundle, scripts/editor.js: the picker imports it only when the user
// opens a file, so pages that never edit don't pay for it. Lives in the picker's shadow root like the rest of the UI.
import { basicSetup } from 'codemirror';
import { EditorState, Text, type Extension } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { StreamLanguage } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { ruby } from '@codemirror/legacy-modes/mode/ruby';
import { yaml } from '@codemirror/legacy-modes/mode/yaml';
import { oneDark } from '@codemirror/theme-one-dark';

export interface EditorOptions {
  root: ShadowRoot;
  file: string;
  doc: string;
  line?: number | undefined;
  column?: number | undefined;
  onchange: (dirty: boolean) => void;
  onsave: () => void;
}

export interface CodeEditor {
  value(): string;
  // the file as it is on disk now: `doc` replaces the text, `saved` only moves the clean point (after a save)
  reset(doc: string): void;
  saved(doc: string): void;
  focus(): void;
  destroy(): void;
}

function language(file: string): Extension {
  const ext = /\.([^./]+)$/.exec(file)?.[1]?.toLowerCase() ?? '';
  if (['js', 'mjs', 'cjs'].includes(ext)) return javascript();
  if (ext === 'jsx') return javascript({ jsx: true });
  if (['ts', 'mts', 'cts'].includes(ext)) return javascript({ typescript: true });
  if (ext === 'tsx') return javascript({ jsx: true, typescript: true });
  // templates are mostly HTML; Svelte and Vue <script>/<style> blocks get highlighted as JS and CSS
  if (['html', 'htm', 'erb', 'svelte', 'vue', 'astro', 'hbs', 'ejs'].includes(ext)) return html();
  if (['css', 'scss', 'less', 'pcss'].includes(ext)) return css();
  if (ext === 'json') return json();
  if (['rb', 'rake', 'ru', 'gemspec', 'jbuilder'].includes(ext)) return StreamLanguage.define(ruby);
  if (['yml', 'yaml'].includes(ext)) return StreamLanguage.define(yaml);
  return [];
}

const fill = EditorView.theme({
  '&': { height: '100%', fontSize: '13px' },
  '.cm-scroller': { overflow: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
  // 16px stops iOS Safari from zooming into the page when the editor takes focus
  '@media (pointer: coarse)': { '&': { fontSize: '16px' } },
});

export function createEditor(parent: HTMLElement, o: EditorOptions): CodeEditor {
  let clean = Text.of(o.doc.split(/\r?\n/));
  let dirty = false;
  const changed = (doc: Text) => { const d = !doc.eq(clean); if (d !== dirty) { dirty = d; o.onchange(d); } };
  const view = new EditorView({
    parent, root: o.root,
    state: EditorState.create({ doc: o.doc, extensions: [
      keymap.of([{ key: 'Mod-s', preventDefault: true, run: () => { o.onsave(); return true; } }]),
      basicSetup, oneDark, fill, language(o.file),
      o.doc.includes('\r\n') ? EditorState.lineSeparator.of('\r\n') : [], // keep Windows line endings on save
      EditorView.updateListener.of(u => { if (u.docChanged) changed(u.state.doc); }),
    ] }),
  });
  if (o.line) {
    const line = view.state.doc.line(Math.min(Math.max(o.line, 1), view.state.doc.lines));
    const pos = line.from + Math.min(Math.max((o.column ?? 1) - 1, 0), line.length);
    view.dispatch({ selection: { anchor: pos }, effects: EditorView.scrollIntoView(pos, { y: 'center' }) });
  }
  return {
    value: () => view.state.sliceDoc(), // with the file's line separator
    reset(doc) {
      clean = Text.of(doc.split(/\r?\n/));
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: doc } });
      changed(view.state.doc);
    },
    saved(doc) { clean = Text.of(doc.split(/\r?\n/)); changed(view.state.doc); },
    focus: () => { view.focus(); },
    destroy: () => { view.destroy(); },
  };
}
