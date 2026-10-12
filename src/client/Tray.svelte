<!-- The list of notes waiting to be sent. -->
<script lang="ts">
  import { describe, here, type LiveNote } from './context.ts';

  const { notes, onremove, oncopy, onclear, onsend }: {
    notes: LiveNote[]; onremove: (i: number) => void; oncopy: () => void; onclear: () => void; onsend: () => void;
  } = $props();
</script>

<div class="sheet tray" role="dialog" aria-label="Notes">
  <h3>Notes to send</h3>
  {#if notes.length}
    <ul class="notes">
      {#each notes as n, i (n)}
        <li>
          <span class="num">{i + 1}</span>
          <div><div class="say">{n.comment}</div><div class="what">{describe(n)}{n.path !== here() ? `  (${n.path})` : ''}</div></div>
          <button type="button" aria-label="Remove note" onclick={() => { onremove(i); }}>×</button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="empty">No notes yet. Press ◎, then tap or drag on the page.</p>
  {/if}
  <div class="row">
    <button class="copy" type="button" onclick={oncopy}>Copy markdown</button>
    <button class="clear" type="button" onclick={onclear}>Clear</button>
    <button class="primary send" type="button" disabled={!notes.length} onclick={onsend}>Send to agent</button>
  </div>
</div>

<style>
  h3 { margin: 0 0 8px; font-size: 14px; }
  ul { list-style: none; margin: 0 0 10px; padding: 0; }
  li { display: grid; grid-template-columns: 22px 1fr auto; gap: 8px; align-items: start; padding: 6px 0; border-bottom: 1px solid #27272a; }
  .num { width: 22px; height: 22px; border-radius: 50%; background: #7c3aed; font: 600 12px/22px ui-sans-serif, system-ui, sans-serif; text-align: center; }
  .say { font-size: 14px; }
  .what { font: 11px ui-monospace, monospace; color: #a1a1aa; word-break: break-all; }
  li button { padding: 2px 8px !important; }
  .empty { color: #a1a1aa; font-size: 13px; margin: 0 0 10px; }
</style>
