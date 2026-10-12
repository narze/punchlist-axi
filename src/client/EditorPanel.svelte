<!-- The in-browser editor: a file from the project in CodeMirror (mounted into `host` by App), saved back through the proxy.
     Drag the header to move it, the corner to resize it; double-click the header to put it back. -->
<script lang="ts">
  import type { Box } from './context.ts';

  let { file, ready, dirty, saving, conflict, discarding, host = $bindable(), box, onbox, onsave, onclose, onload, onoverwrite }: {
    file: string; ready: boolean; dirty: boolean; saving: boolean; conflict: boolean; discarding: boolean; host: HTMLElement | undefined;
    box: Box | null; onbox: (b: Box | null) => void;
    onsave: () => void; onclose: () => void; onload: () => void; onoverwrite: () => void;
  } = $props();

  let sheet = $state<HTMLElement>();
  const MIN_W = 280, MIN_H = 180, KEEP = 60; // keep this much of the header on screen

  // a saved place may not fit this viewport (another window size, a rotated phone)
  function fit(b: Box): Box {
    const width = Math.max(MIN_W, Math.min(b.width, innerWidth)), height = Math.max(MIN_H, Math.min(b.height, innerHeight));
    return { width, height, left: Math.min(Math.max(b.left, KEEP - width), innerWidth - KEEP), top: Math.min(Math.max(b.top, 0), innerHeight - 40) };
  }
  const shown = $derived(box && fit(box));

  // pointer drag on the header (move) or the corner (resize), touch included
  function drag(e: PointerEvent, mode: 'move' | 'size') {
    if (e.button !== 0 || !sheet || (mode === 'move' && (e.target as Element).closest('button'))) return;
    e.preventDefault();
    const r = sheet.getBoundingClientRect(), from = { x: e.clientX, y: e.clientY };
    const start: Box = { left: r.left, top: r.top, width: r.width, height: r.height };
    const el = e.currentTarget as HTMLElement;
    try { el.setPointerCapture(e.pointerId); } catch {} // keeps the moves coming when the pointer leaves the grip; best effort
    const move = (m: PointerEvent) => {
      const dx = m.clientX - from.x, dy = m.clientY - from.y;
      onbox(fit(mode === 'move' ? { ...start, left: start.left + dx, top: start.top + dy } : { ...start, width: start.width + dx, height: start.height + dy }));
    };
    const end = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', end); el.removeEventListener('pointercancel', end); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  // typing code must not trigger the app's keyboard shortcuts
  const keep = (e: KeyboardEvent) => { e.stopPropagation(); };
</script>

<div bind:this={sheet} class="sheet editor" class:placed={shown} role="dialog" aria-label="Edit {file}" tabindex="-1"
  style:left={shown ? `${shown.left}px` : null} style:top={shown ? `${shown.top}px` : null}
  style:width={shown ? `${shown.width}px` : null} style:height={shown ? `${shown.height}px` : null}
  onkeydown={keep} onkeyup={keep} onkeypress={keep}>
  <div class="head" role="toolbar" tabindex="-1" title="Drag to move, double-click to reset"
    onpointerdown={e => { drag(e, 'move'); }} ondblclick={e => { if (!(e.target as Element).closest('button')) onbox(null); }}>
    <div class="file" title={file}>{file}{#if dirty}<span class="dirty" aria-label="unsaved changes"> ●</span>{/if}</div>
    <button class="close" type="button" onclick={onclose}>{discarding ? 'Discard changes' : 'Close'}</button>
    <button class="primary save" type="button" disabled={!ready || !dirty || saving} title="Save (⌘/Ctrl+S)" onclick={onsave}>{saving ? 'Saving…' : 'Save'}</button>
  </div>
  {#if conflict}
    <div class="conflict" role="alert">
      <span>The file changed on disk since you opened it.</span>
      <button class="theirs" type="button" onclick={onload}>Load from disk</button>
      <button class="mine" type="button" onclick={onoverwrite}>Overwrite</button>
    </div>
  {/if}
  <div class="code" bind:this={host}>{#if !ready}<p class="loading">Loading…</p>{/if}</div>
  <div class="grip" role="separator" aria-label="Resize" title="Drag to resize" onpointerdown={e => { drag(e, 'size'); }}></div>
</div>

<style>
  .editor { top: calc(12px + env(safe-area-inset-top, 0px)); max-height: none; width: min(960px, calc(100vw - 24px));
    display: flex; flex-direction: column; gap: 8px; overflow: hidden; padding: 8px; }
  /* moved or resized: an explicit box instead of the centered sheet */
  .placed { transform: none; bottom: auto; max-width: none; }
  .head { display: flex; gap: 6px; align-items: center; cursor: move; touch-action: none; user-select: none; -webkit-user-select: none; }
  .file { flex: 1; min-width: 0; font: 12px ui-monospace, monospace; color: #fbbf24; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: rtl; text-align: left; }
  .dirty { color: #fafafa; }
  .save { margin-left: 0; }
  .save:disabled { opacity: .5; cursor: default; }
  .conflict { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; font-size: 13px; background: #450a0a; border-radius: 8px; padding: 6px 8px; }
  .conflict span { flex: 1; min-width: 12em; }
  .code { flex: 1; min-height: 0; border-radius: 8px; overflow: hidden; background: #282c34; }
  /* the picker sets a sans font on everything in the shadow root; code is monospaced */
  .code :global(*) { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; }
  .loading { color: #a1a1aa; font-size: 13px; margin: 12px; }
  .grip { position: absolute; right: 0; bottom: 0; width: 22px; height: 22px; cursor: nwse-resize; touch-action: none;
    background: linear-gradient(135deg, transparent 50%, #71717a 50%, #71717a 58%, transparent 58%, transparent 70%, #71717a 70%, #71717a 78%, transparent 78%); }
</style>
