<!-- The pill in the corner: annotate, notes tray, a menu (pause animations, go to a page), send. -->
<script lang="ts">
  const { picking, frozen, browsing, count, busy, onurl, onpick, onfreeze, ontray, onsend, menuOpen = false }: {
    picking: boolean; frozen: boolean; browsing: boolean; count: number; busy: number;
    onurl: () => void; onpick: () => void; onfreeze: () => void; ontray: () => void; onsend: () => void;
    menuOpen?: boolean; // the gallery shows it open
  } = $props();
  // svelte-ignore state_referenced_locally
  let open = $state(menuOpen), tools = $state<HTMLElement>();
  const choose = (fn: () => void) => () => { open = false; fn(); };
  // a press anywhere else, or Escape, closes the menu (composedPath sees into the picker's shadow root)
  function outside(e: PointerEvent) { if (open && tools && !e.composedPath().includes(tools)) open = false; }
  function escape(e: KeyboardEvent) { if (open && e.key === 'Escape') open = false; }
</script>

<svelte:window onpointerdowncapture={outside} onkeydown={escape} />

<!-- Lucide icons (ISC, lucide.dev): mouse-pointer-click, pause, list, menu, globe, send. SVG, not emoji, so every device draws them alike -->
<div class="tools" bind:this={tools}>
  <button data-act="pick" aria-pressed={picking} title="Annotate (Alt+Shift+E)" aria-label="Annotate" onclick={onpick}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4.1 12 6" /><path d="m5.1 8-2.9-.8" /><path d="m6 12-1.9 2" /><path d="M7.2 2.2 8 5.1" /><path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z" /></svg>
  </button>
  <button data-act="tray" title="Notes" aria-label="Notes" onclick={ontray}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h.01" /><path d="M3 12h.01" /><path d="M3 19h.01" /><path d="M8 5h13" /><path d="M8 12h13" /><path d="M8 19h13" /></svg>
    <span class="count">{count}</span>{#if busy}<span class="busy">⏳{busy}</span>{/if}
  </button>
  <button data-act="menu" aria-expanded={open} aria-haspopup="menu" title="More" aria-label="More" onclick={() => { open = !open; }}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16" /><path d="M4 12h16" /><path d="M4 19h16" /></svg>
    {#if frozen}<span class="dot" title="Animations paused"></span>{/if}
  </button>
  <button data-act="send" class="go" disabled={!count} onclick={onsend}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" /><path d="m21.854 2.147-10.94 10.939" /></svg>
    {count ? `Send ${String(count)}` : 'Send'}
  </button>
  {#if open}
    <div class="menu" role="menu">
      <button data-act="freeze" role="menuitemcheckbox" aria-checked={frozen} onclick={choose(onfreeze)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{#if frozen}<path d="M6 3 20 12 6 21Z" />{:else}<rect x="14" y="3" width="5" height="18" rx="1" /><rect x="5" y="3" width="5" height="18" rx="1" />{/if}</svg>
        <span class="text">{frozen ? 'Resume animations' : 'Pause animations'}</span><kbd>Alt+Shift+P</kbd>
      </button>
      <button data-act="url" role="menuitemcheckbox" aria-checked={browsing} onclick={choose(onurl)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
        <span class="text">Go to a page</span><kbd>Alt+Shift+L</kbd>
      </button>
    </div>
  {/if}
</div>

<style>
  .tools { position: fixed; z-index: 2147483647; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom, 0px)); display: flex; gap: 2px;
    padding: 4px; border-radius: 999px; background: #18181b; box-shadow: 0 4px 16px rgba(0,0,0,.3); }
  button { height: 40px; min-width: 40px; border: 0; border-radius: 999px; background: transparent; color: #fafafa;
    font: 600 15px ui-sans-serif, system-ui, sans-serif; cursor: pointer; padding: 0 10px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
  svg { flex: none; width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
  button[aria-pressed="true"], button[aria-expanded="true"] { background: #7c3aed; }
  [data-act="menu"] { position: relative; }
  .dot { position: absolute; top: 7px; right: 7px; width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; box-shadow: 0 0 0 2px #18181b; }
  .menu { position: absolute; right: 0; bottom: calc(100% + 8px); min-width: 240px; padding: 4px; border-radius: 12px;
    background: #18181b; box-shadow: 0 8px 32px rgba(0,0,0,.4); display: flex; flex-direction: column; }
  .menu button { justify-content: flex-start; border-radius: 8px; font-weight: 500; font-size: 14px; padding: 0 10px; gap: 10px; }
  .menu button:hover { background: #27272a; }
  .menu [aria-checked="true"] { color: #fbbf24; }
  .menu .text { flex: 1; text-align: left; white-space: nowrap; }
  kbd { font: 11px ui-monospace, monospace; color: #a1a1aa; }
  @media (pointer: coarse) { kbd { display: none; } } /* no keyboard shortcuts on a phone */
  .count { font-size: 12px; background: #27272a; border-radius: 999px; padding: 1px 6px; }
  .busy { font-size: 12px; background: #f59e0b; color: #000; border-radius: 999px; padding: 1px 6px; }
  .go { background: #7c3aed; padding: 0 14px 0 12px; }
  .go svg { width: 16px; height: 16px; }
  .go:disabled { background: #27272a; color: #71717a; cursor: default; }
</style>
