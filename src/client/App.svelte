<!-- The picker: page gestures in, toolbar + note panel + tray + overlay out. State lives here; children only render. -->
<script lang="ts">
  import { flushSync, onMount } from 'svelte';
  import type { FileRef, Note, OpenRequest, OpenResult, Payload, PublicItem, SourceFile } from '../protocol.ts';
  import { API, ApiError, errorMessage, get, listen, post } from './api.ts';
  import type * as EditorModule from './editor.ts';
  import { bestHint, describe, elementContext, fileHint, markdown, here, type Box, type Draft, type LiveNote, type Target, type Toast } from './context.ts';
  import { freezePage, setPickMode, watchPage } from './page.ts';
  import { autoReload, editorBox, restore, save, setEditorBox, withoutEls } from './storage.ts';
  import EditorPanel from './EditorPanel.svelte';
  import NotePanel from './NotePanel.svelte';
  import Overlay from './Overlay.svelte';
  import Toasts from './Toasts.svelte';
  import Toolbar from './Toolbar.svelte';
  import Tray from './Tray.svelte';

  const { host }: { host: HTMLElement } = $props();

  let picking = $state(false), frozen = $state(false), trayOpen = $state(false);
  let notes = $state.raw<LiveNote[]>([]);
  let draft = $state.raw<Draft | null>(null);
  let comment = $state('');
  let field = $state<HTMLTextAreaElement>();
  let hover = $state.raw<{ box: Box; label: string } | null>(null);
  let marquee = $state.raw<Box | null>(null);
  let chip = $state.raw<{ el: Element; text: string; left: number; top: number } | null>(null);
  let toasts = $state.raw<Toast[]>([]);
  let busy = $state(0);
  let box = $state.raw(editorBox()); // where the editor was moved and sized
  // the open file: `src` once loaded; `conflict` is the etag on disk after a refused save; `discarding` = Close was pressed once with changes
  interface OpenFile { ref: FileRef; src: SourceFile | null; dirty: boolean; saving: boolean; conflict: string | null; discarding: boolean }
  let file = $state.raw<OpenFile | null>(null);
  let codeHost = $state<HTMLElement>();
  let code: EditorModule.CodeEditor | null = null;
  let pageEl = (_: Node | null | undefined): _ is Element => false;

  function setNotes(next: LiveNote[]) { notes = next; save(next); }

  let toastId = 0;
  function toast(text: string, opts: { ms?: number; reload?: Toast['reload']; file?: FileRef | undefined } = {}) {
    const t: Toast = { id: ++toastId, text, reload: opts.reload ?? false, file: opts.file };
    toasts = [...toasts, t];
    setTimeout(() => { toasts = toasts.filter(x => x !== t); }, opts.reload || opts.file ? 15000 : opts.ms ?? 5000);
  }

  function setPicking(on: boolean) {
    picking = on;
    setPickMode(on);
    if (!on) hover = null;
    else chip = null;
  }
  function setFrozen(on: boolean) {
    frozen = on;
    freezePage(on);
    toast(on ? '⏸ Animations paused' : '▶︎ Animations resumed', { ms: 2500 });
  }

  // ---------------------------------------------------------------- drafting
  function snapshot(t: Target): Omit<Note, 'comment'> {
    return { kind: t.kind, path: here(), title: document.title, text: t.text, area: t.area, frozen, elements: t.els.map(elementContext) };
  }
  function startDraft(t: Target) {
    const snap = snapshot(t);
    const first = snap.elements[0], el = t.els[0];
    if (!first || !el) return;
    // keep the target visible: a target in the lower half gets the sheet at the top
    const r = t.area ? { top: t.area.y - scrollY, bottom: t.area.y - scrollY + t.area.height } : el.getBoundingClientRect();
    hover = null; trayOpen = false;
    draft = { ...t, desc: describe(snap), hint: bestHint(first.hints) || first.selector, file: fileHint(first.hints), top: (r.top + r.bottom) / 2 > innerHeight / 2 };
    // focus inside the gesture: early keys aren't lost and iOS opens the keyboard
    flushSync();
    field?.focus({ preventScroll: true });
  }
  function cancelDraft() { draft = null; comment = ''; }
  function addNote() {
    const text = comment.trim();
    if (!draft || !text) { field?.focus(); return; }
    setNotes([...notes, { ...snapshot(draft), comment: text, els: draft.els }]);
    cancelDraft();
    toast(`📝 Note ${notes.length} added${picking ? ' — tap the next spot' : ''}`, { ms: 2500 });
  }
  // On the proxy's own machine the proxy launches the editor. From anywhere else (tailscale, a phone) that would open it
  // on the wrong screen, so the proxy only resolves the file and the browser follows the editor URL (Remote-SSH back).
  const onProxyHost = () => ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  async function openFile(file: FileRef) {
    const launch = onProxyHost();
    try {
      const b = await post<Partial<OpenResult>>('/open', { ...file, launch } satisfies OpenRequest);
      if (!launch && b.url) { const a = document.createElement('a'); a.href = b.url; a.click(); }
      toast(`↗ ${launch ? 'Opened' : 'Opening'} ${b.file ?? file.file} in your editor`, { ms: 2500 });
    } catch (e) { toast(`❌ Open failed: ${errorMessage(e)}`); }
  }
  // navigator.clipboard needs a secure context; plain http over a tailnet IP is not one
  function copyFile(f: FileRef) {
    const text = f.file + (f.line ? `:${String(f.line)}${f.column ? `:${String(f.column)}` : ''}` : '');
    const fallback = () => {
      const t = Object.assign(document.createElement('textarea'), { value: text });
      (host.shadowRoot ?? document.body).append(t); t.select();
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- the only way outside a secure context
      const ok = document.execCommand('copy');
      t.remove();
      toast(ok ? `⧉ Copied ${text}` : `❌ Copy failed: ${text}`, { ms: ok ? 2500 : 5000 });
    };
    if (!window.isSecureContext || typeof navigator.clipboard === 'undefined') { fallback(); return; }
    navigator.clipboard.writeText(text).then(() => { toast(`⧉ Copied ${text}`, { ms: 2500 }); }, fallback);
  }
  // no file in the hints (e.g. JSX built without source info): the agent finds it and runs `done --open`
  // locate requests from ✎ Edit, whose answer opens in the editor here
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- not rendered
  const editLocates = new Set<string>();
  // `edit`: the agent's answer opens in the editor here, not the desktop one
  async function locate(edit: boolean) {
    if (!draft) return;
    const { elements: [el], ...n } = snapshot(draft);
    try {
      const payload: Payload = { kind: 'locate', ...(edit ? { edit: true } : {}), notes: [{ ...n, comment: 'Find the source file of this element', elements: el ? [el] : [] }] };
      const it = await post<PublicItem>('/requests', payload);
      if (edit) editLocates.add(it.id);
      toast(`🔎 Asked the agent to find this file${edit ? ' to edit here' : ''}`, { ms: 2500 });
    } catch (e) { toast(`❌ Locate failed: ${errorMessage(e)}`); }
  }
  // ---------------------------------------------------------------- in-browser editor
  // CodeMirror is its own bundle, loaded on first use; a failed load is retried next time
  let editorModule: Promise<typeof EditorModule> | null = null;
  function loadEditor() {
    const url = `${API}/editor.js`; // a variable, so esbuild leaves the import to the browser
    editorModule ??= (import(url) as Promise<typeof EditorModule>).catch((e: unknown) => { editorModule = null; throw e; });
    return editorModule;
  }
  // updates the open file, unless it was closed (or another one opened) in the meantime
  const isOpen = (ref: FileRef) => file?.ref === ref;
  function patch(ref: FileRef, p: Partial<OpenFile>) { if (file?.ref === ref) file = { ...file, ...p }; }
  async function openEditor(ref: FileRef) {
    if (file?.dirty) { toast('✎ Save or discard the open file first'); return; }
    closeEditor();
    // annotate mode blocks touch scrolling, the editor's too; back on when the editor closes
    if (picking) { setPicking(false); pickAfterEdit = true; }
    file = { ref, src: null, dirty: false, saving: false, conflict: null, discarding: false };
    try {
      const [mod, src] = await Promise.all([loadEditor(), get<SourceFile>(`/file?path=${encodeURIComponent(ref.file)}`)]);
      if (!isOpen(ref)) return;
      patch(ref, { src });
      flushSync(); // the code box is in the DOM
      if (!codeHost) return;
      code = mod.createEditor(codeHost, { root: must(host.shadowRoot), file: src.file, doc: src.content, line: ref.line, column: ref.column,
        onchange: dirty => { patch(ref, { dirty, discarding: false }); }, onsave: () => { void saveFile(); } });
      code.focus();
    } catch (e) {
      if (isOpen(ref)) file = null;
      toast(`❌ Edit failed: ${errorMessage(e)}`);
    }
  }
  // `etag`: overwrite what is on disk now (after a conflict)
  async function saveFile(etag?: string) {
    const f = file, c = code;
    if (!f?.src || !c || f.saving) return;
    const { ref, src } = f, content = c.value();
    patch(ref, { saving: true });
    try {
      const r = await post<{ file: string; etag: string }>('/file', { file: src.file, content, etag: etag ?? src.etag } satisfies SourceFile);
      if (isOpen(ref)) c.saved(content);
      patch(ref, { src: { ...src, content, etag: r.etag }, saving: false, conflict: null });
      toast(`💾 Saved ${r.file}`, { reload: 'button' });
    } catch (e) {
      const conflict = e instanceof ApiError && e.status === 409 && typeof e.body['etag'] === 'string' ? e.body['etag'] : null;
      patch(ref, { saving: false, ...(conflict ? { conflict } : {}) });
      if (!conflict) toast(`❌ Save failed: ${errorMessage(e)}`);
    }
  }
  // after a conflict: drop the edits and take the file as it is on disk
  async function reloadFile() {
    const f = file, c = code;
    if (!f?.src || !c) return;
    try {
      const src = await get<SourceFile>(`/file?path=${encodeURIComponent(f.src.file)}`);
      if (!isOpen(f.ref)) return;
      c.reset(src.content);
      patch(f.ref, { src, conflict: null });
    } catch (e) { toast(`❌ Load failed: ${errorMessage(e)}`); }
  }
  // unsaved changes take a second press
  function requestClose() {
    if (file?.dirty && !file.discarding) { file = { ...file, discarding: true }; return; }
    closeEditor();
  }
  let pickAfterEdit = false;
  function closeEditor() {
    code?.destroy(); code = null; file = null;
    if (pickAfterEdit) { pickAfterEdit = false; setPicking(true); }
  }
  const must = <T,>(x: T | null | undefined): T => { if (x == null) throw new Error('no shadow root'); return x; };

  function parent() { const p = draft?.els[0]?.parentElement; if (pageEl(p)) startDraft({ kind: 'element', els: [p] }); }
  function child() { const c = draft?.els[0]?.firstElementChild; if (c) startDraft({ kind: 'element', els: [c] }); }

  function pickSelection() {
    if (!chip) return;
    const t: Target = { kind: 'text', els: [chip.el], text: chip.text };
    chip = null;
    getSelection()?.removeAllRanges();
    startDraft(t);
  }

  // ---------------------------------------------------------------- tray + send
  async function copy() {
    try { await navigator.clipboard.writeText(markdown(notes)); toast('📋 Copied', { ms: 2000 }); }
    catch { toast('❌ Clipboard not available here'); }
  }
  async function send() {
    if (!notes.length) return;
    try {
      const payload: Payload = { notes: notes.map(withoutEls), viewport: { w: innerWidth, h: innerHeight } };
      await post('/requests', payload);
      setNotes([]);
      cancelDraft(); trayOpen = false;
    } catch (e) { toast(`❌ Send failed: ${errorMessage(e)}`); }
  }

  // ---------------------------------------------------------------- status (SSE)
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- only the `busy` count is shown
  const items = new Map<string, PublicItem>();
  function onUpdate(it: PublicItem, fresh: boolean) {
    const prev = items.get(it.id);
    items.set(it.id, it);
    busy = [...items.values()].filter(i => i.status === 'pending' || i.status === 'working').length;
    if (!fresh || prev?.status === it.status) return;
    if (it.status === 'pending') toast(`📨 ${it.id} queued — ${it.label}`);
    if (it.status === 'working') toast(`🛠 ${it.id} agent is on it`);
    const over = it.status === 'done' || it.status === 'failed';
    // a locate result never reloads: the draft would be lost
    if (it.kind === 'locate') {
      if (it.status === 'failed') toast(`❌ ${it.message ?? 'Agent could not find the file'}`);
      // asked from ✎ Edit: straight into the editor here; from 🔎 Locate: Open / Copy
      else if (it.status === 'done' && it.file && editLocates.has(it.id)) { toast(`✎ ${it.message ?? 'Found'}`, { ms: 2500 }); void openEditor(it.file); }
      else if (it.status === 'done') toast(`🔎 ${it.message ?? 'Found'}`, { file: it.file });
      return;
    }
    if (!over) return;
    // never reload over unsaved edits
    if (it.status === 'done' && autoReload() && !file?.dirty) { location.reload(); return; }
    toast(`${it.status === 'done' ? '✅' : '❌'} ${it.id}${it.message ? ': ' + it.message : ''}`, { reload: 'agent' });
  }

  function onKey(e: KeyboardEvent) {
    if (e.altKey && e.shiftKey && e.code === 'KeyE') { e.preventDefault(); cancelDraft(); setPicking(!picking); }
    else if (e.altKey && e.shiftKey && e.code === 'KeyP') { e.preventDefault(); setFrozen(!frozen); }
    else if (e.key === 'Escape' && file) { /* the editor has its own Escape uses (search, completion); Close is a button */ }
    else if (e.key === 'Escape' && (picking || draft || trayOpen)) {
      if (draft) cancelDraft(); else if (picking) setPicking(false); else trayOpen = false;
    }
  }

  // ---------------------------------------------------------------- init (+ Turbo visits)
  onMount(() => {
    ({ pageEl } = watchPage(host, {
      picking: () => picking,
      drafting: () => draft !== null,
      hover: h => { hover = h; },
      marquee: b => { marquee = b; },
      pick: startDraft,
      selected: s => {
        chip = s && { el: s.el, text: s.text, left: Math.max(8, Math.min(s.rect.left, innerWidth - 130)), top: Math.min(s.rect.bottom + 8, innerHeight - 120) };
      },
    }));
    document.addEventListener('keydown', onKey, true);
    const init = () => { notes = restore(); };
    init();
    document.addEventListener('turbo:load', init);
    addEventListener('popstate', () => { setTimeout(init, 0); });
    listen(msg => {
      if (msg.type === 'snapshot') for (const it of msg.items) onUpdate(it, false);
      else onUpdate(msg.item, true);
    });
  });
</script>

<Overlay {notes} {draft} {hover} {marquee} />
<Toasts {toasts} onopen={(f: FileRef) => { void openFile(f); }} oncopy={copyFile} />
{#if chip}
  <button class="chip" type="button" style:left="{chip.left}px" style:top="{chip.top}px"
    onpointerdown={e => { e.preventDefault(); }} onclick={pickSelection}>💬 Annotate</button>
{/if}
{#if draft}
  <NotePanel {draft} bind:comment bind:field onadd={addNote} oncancel={cancelDraft} onopen={() => { if (draft?.file) void openFile(draft.file); }}
    oncopy={() => { if (draft?.file) copyFile(draft.file); }} onedit={() => { if (draft?.file) void openEditor(draft.file); else void locate(true); }}
    onlocate={() => { void locate(false); }} onparent={parent} onchild={child} />
{/if}
{#if file}
  <EditorPanel file={file.src?.file ?? file.ref.file} ready={file.src !== null} dirty={file.dirty} saving={file.saving}
    conflict={file.conflict !== null} discarding={file.discarding} bind:host={codeHost}
    {box} onbox={(b: Box | null) => { box = b; setEditorBox(b); }}
    onsave={() => { void saveFile(); }} onclose={requestClose} onload={() => { void reloadFile(); }}
    onoverwrite={() => { void saveFile(file?.conflict ?? undefined); }} />
{/if}
{#if trayOpen}
  <Tray {notes} onremove={i => { setNotes(notes.filter((_, j) => j !== i)); }} oncopy={copy} onclear={() => { setNotes([]); }} onsend={send} />
{/if}
<Toolbar {picking} {frozen} count={notes.length} {busy}
  onpick={() => { cancelDraft(); setPicking(!picking); }}
  onfreeze={() => { setFrozen(!frozen); }}
  ontray={() => { cancelDraft(); trayOpen = !trayOpen; }}
  onsend={send} />

<style>
  /* shared by the sheets and toasts; the shadow root keeps all of it off the page */
  :global(*) { box-sizing: border-box; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  :global(.sheet) { position: fixed; z-index: 2147483647; left: 50%; transform: translateX(-50%); bottom: calc(68px + env(safe-area-inset-bottom, 0px));
    width: min(520px, calc(100vw - 24px)); max-height: calc(100vh - 120px); overflow: auto; background: #18181b; color: #fafafa;
    border-radius: 12px; padding: 12px; box-shadow: 0 8px 32px rgba(0,0,0,.4); }
  :global(.row) { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  :global(.sheet button), .chip { border: 1px solid #3f3f46; background: #27272a; color: #fafafa; border-radius: 6px; padding: 6px 10px; font-size: 13px; cursor: pointer; }
  :global(.primary) { background: #7c3aed !important; border-color: #7c3aed !important; margin-left: auto; }
  .chip { position: fixed; z-index: 2147483647; background: #18181b; box-shadow: 0 4px 16px rgba(0,0,0,.3); }
</style>
