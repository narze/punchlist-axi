<!-- The picker: page gestures in, toolbar + note panel + tray + overlay out. State lives here; children only render. -->
<script lang="ts">
  import { flushSync, onMount } from 'svelte';
  import type { Note, Payload, PublicItem } from '../protocol.ts';
  import { errorMessage, listen, post } from './api.ts';
  import { bestHint, describe, elementContext, fileHint, markdown, here, type Box, type Draft, type LiveNote, type Target, type Toast } from './context.ts';
  import { freezePage, setPickMode, watchPage } from './page.ts';
  import { autoReload, restore, save, withoutEls } from './storage.ts';
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
  let pageEl = (_: Node | null | undefined): _ is Element => false;

  function setNotes(next: LiveNote[]) { notes = next; save(next); }

  let toastId = 0;
  function toast(text: string, opts: { ms?: number; reload?: boolean } = {}) {
    const t = { id: ++toastId, text, reload: opts.reload ?? false };
    toasts = [...toasts, t];
    setTimeout(() => { toasts = toasts.filter(x => x !== t); }, opts.reload ? 15000 : opts.ms ?? 5000);
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
  // the proxy opens it on the dev machine, so this also works from a phone
  async function openFile() {
    const file = draft?.file;
    if (!file) return;
    try {
      const b = await post<{ file?: string }>('/open', file);
      toast(`↗ Opened ${b.file ?? file.file} in your editor`, { ms: 2500 });
    } catch (e) { toast(`❌ Open failed: ${errorMessage(e)}`); }
  }
  // no file in the hints (e.g. JSX built without source info): the agent finds it and runs `done --open`
  async function locate() {
    if (!draft) return;
    const { elements: [el], ...n } = snapshot(draft);
    try {
      const payload: Payload = { kind: 'locate', notes: [{ ...n, comment: 'Find the source file of this element', elements: el ? [el] : [] }] };
      await post('/requests', payload);
      toast('🔎 Asked the agent to find this file', { ms: 2500 });
    } catch (e) { toast(`❌ Locate failed: ${errorMessage(e)}`); }
  }
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
      if (over) toast(`${it.status === 'done' ? '↗' : '❌'} ${it.message ?? (it.status === 'done' ? 'Opened' : 'Agent could not find the file')}`);
      return;
    }
    if (!over) return;
    if (it.status === 'done' && autoReload()) { location.reload(); return; }
    toast(`${it.status === 'done' ? '✅' : '❌'} ${it.id}${it.message ? ': ' + it.message : ''}`, { reload: true });
  }

  function onKey(e: KeyboardEvent) {
    if (e.altKey && e.shiftKey && e.code === 'KeyE') { e.preventDefault(); cancelDraft(); setPicking(!picking); }
    else if (e.altKey && e.shiftKey && e.code === 'KeyP') { e.preventDefault(); setFrozen(!frozen); }
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
<Toasts {toasts} />
{#if chip}
  <button class="chip" type="button" style:left="{chip.left}px" style:top="{chip.top}px"
    onpointerdown={e => { e.preventDefault(); }} onclick={pickSelection}>💬 Annotate</button>
{/if}
{#if draft}
  <NotePanel {draft} bind:comment bind:field onadd={addNote} oncancel={cancelDraft} onopen={openFile} onlocate={locate} onparent={parent} onchild={child} />
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
