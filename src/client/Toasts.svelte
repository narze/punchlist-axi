<!-- Status messages at the top; a finished request offers Reload and the auto-reload switch, a located file Open / Copy. -->
<script lang="ts">
  import type { FileRef } from '../protocol.ts';
  import type { Toast } from './context.ts';
  import { autoReload, setAutoReload } from './storage.ts';

  const { toasts, onopen, oncopy }: { toasts: Toast[]; onopen: (f: FileRef) => void; oncopy: (f: FileRef) => void } = $props();
</script>

<div class="toasts">
  {#each toasts as t (t.id)}
    <div class="toast">
      {t.text}
      {#if t.reload}
        <span class="actions">
          <button type="button" onclick={() => { location.reload(); }}>Reload</button>
          {#if t.reload === 'agent'}
            <label><input type="checkbox" checked={autoReload()} onchange={e => { setAutoReload(e.currentTarget.checked); }} />auto</label>
          {/if}
        </span>
      {/if}
      {#if t.file}
        {@const f = t.file}
        <span class="actions">
          <button type="button" onclick={() => { onopen(f); }}>↗ Open</button>
          <button type="button" onclick={() => { oncopy(f); }}>⧉ Copy</button>
        </span>
      {/if}
    </div>
  {/each}
</div>

<style>
  .toasts { position: fixed; z-index: 2147483647; left: 12px; right: 12px; top: calc(12px + env(safe-area-inset-top, 0px));
    display: flex; flex-direction: column; align-items: flex-start; gap: 6px; pointer-events: none; }
  .toast { background: #18181b; color: #fafafa; padding: 8px 10px; border-radius: 8px; font-size: 13px; max-width: 100%;
    box-shadow: 0 4px 16px rgba(0,0,0,.3); display: flex; gap: 8px; align-items: center; pointer-events: auto; }
  .actions { display: flex; gap: 6px; align-items: center; margin-left: auto; }
  button { border: 1px solid #3f3f46; background: #27272a; color: #fafafa; border-radius: 6px; padding: 6px 10px; font-size: 13px; cursor: pointer; }
  label { font-size: 12px; color: #a1a1aa; display: flex; gap: 4px; align-items: center; }
</style>
