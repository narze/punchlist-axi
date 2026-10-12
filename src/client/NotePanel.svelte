<!-- The sheet for the note being written. -->
<script lang="ts">
  import type { Draft } from './context.ts';

  let { draft, editMode, comment = $bindable(), field = $bindable(), onadd, oncancel, onopen, onedit, onlocate, onparent, onchild }: {
    draft: Draft; editMode: boolean; comment: string; field: HTMLTextAreaElement | undefined;
    onadd: () => void; oncancel: () => void; onopen: () => void; onedit: () => void; onlocate: () => void; onparent: () => void; onchild: () => void;
  } = $props();

  // typing a note must not trigger the app's keyboard shortcuts
  const keep = (e: KeyboardEvent) => { e.stopPropagation(); };
</script>

<div class="sheet panel" class:top={draft.top} role="dialog" aria-label="Add a note">
  <div class="label">{draft.desc}</div>
  <div class="where">
    <div class="hint">{draft.hint}</div>
    {#if draft.file}
      <button class="open" type="button" title="Open this file in your editor" onclick={onopen}>↗ Open</button>
      {#if editMode}<button class="edit" type="button" title="Edit this file here" onclick={onedit}>✎ Edit</button>{/if}
    {:else}
      <button class="locate" type="button" title={editMode ? 'Ask the agent to find this file and open it here' : 'Ask the agent to find this file and open it in your editor'}
        onclick={onlocate}>🔎 Locate</button>
    {/if}
  </div>
  <textarea bind:this={field} bind:value={comment} placeholder="What should change? (⌘/Ctrl+Enter to add)"
    onkeydown={e => { keep(e); if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onadd(); }} onkeyup={keep} onkeypress={keep}></textarea>
  <div class="row">
    {#if draft.kind === 'element'}
      <button class="up" type="button" title="Select parent" onclick={onparent}>⬆ parent</button>
      <button class="down" type="button" title="Select first child" onclick={onchild}>⬇ child</button>
    {/if}
    <button class="cancel" type="button" onclick={oncancel}>Cancel</button>
    <button class="primary add" type="button" onclick={onadd}>Add note</button>
  </div>
</div>

<style>
  .top { top: calc(12px + env(safe-area-inset-top, 0px)); bottom: auto; }
  .label { font: 12px ui-monospace, monospace; color: #fbbf24; word-break: break-all; }
  .where { display: flex; gap: 8px; align-items: center; }
  .hint { flex: 1; min-width: 0; font: 11px ui-monospace, monospace; color: #a1a1aa; margin-top: 2px; word-break: break-all; }
  .open, .edit, .locate { padding: 2px 8px; font-size: 12px; flex: none; }
  textarea { width: 100%; min-height: 64px; margin: 8px 0; padding: 8px; border-radius: 8px; border: 1px solid #3f3f46;
    background: #09090b; color: #fafafa; font-size: 16px; resize: vertical; }
</style>
