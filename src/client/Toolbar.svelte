<!-- The pill in the corner: annotate, pause animations, notes tray, send. -->
<script lang="ts">
  const { picking, frozen, count, busy, onpick, onfreeze, ontray, onsend }: {
    picking: boolean; frozen: boolean; count: number; busy: number;
    onpick: () => void; onfreeze: () => void; ontray: () => void; onsend: () => void;
  } = $props();
</script>

<div class="tools">
  <button data-act="pick" aria-pressed={picking} title="Annotate (Alt+Shift+E)" aria-label="Annotate" onclick={onpick}>◎</button>
  <button data-act="freeze" class="freeze" aria-pressed={frozen} title="Pause animations (Alt+Shift+P)" aria-label="Pause animations" onclick={onfreeze}>⏸</button>
  <button data-act="tray" aria-label="Notes" onclick={ontray}>🗒 <span class="count">{count}</span>{#if busy}<span class="busy">⏳{busy}</span>{/if}</button>
  <button data-act="send" class="go" disabled={!count} onclick={onsend}>{count ? `Send ${count}` : 'Send'}</button>
</div>

<style>
  .tools { position: fixed; z-index: 2147483647; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom, 0px)); display: flex; gap: 2px;
    padding: 4px; border-radius: 999px; background: #18181b; box-shadow: 0 4px 16px rgba(0,0,0,.3); }
  button { height: 40px; min-width: 40px; border: 0; border-radius: 999px; background: transparent; color: #fafafa;
    font: 600 15px ui-sans-serif, system-ui, sans-serif; cursor: pointer; padding: 0 10px; display: inline-flex; align-items: center; gap: 4px; }
  button[aria-pressed="true"] { background: #7c3aed; }
  .freeze[aria-pressed="true"] { background: #f59e0b; color: #000; }
  .count { font-size: 12px; background: #27272a; border-radius: 999px; padding: 1px 6px; }
  .busy { font-size: 12px; background: #f59e0b; color: #000; border-radius: 999px; padding: 1px 6px; }
  .go { background: #7c3aed; padding: 0 14px; }
  .go:disabled { background: #27272a; color: #71717a; cursor: default; }
</style>
