<!-- Status messages at the top; a finished request offers Reload and the auto-reload switch. -->
<script lang="ts">
  import type { Toast } from './context.ts';
  import { autoReload, setAutoReload } from './storage.ts';

  const { toasts }: { toasts: Toast[] } = $props();
</script>

<div class="toasts">
  {#each toasts as t (t.id)}
    <div class="toast">
      {t.text}
      {#if t.reload}
        <span class="actions">
          <button type="button" onclick={() => { location.reload(); }}>Reload</button>
          <label><input type="checkbox" checked={autoReload()} onchange={e => { setAutoReload(e.currentTarget.checked); }} />auto</label>
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
