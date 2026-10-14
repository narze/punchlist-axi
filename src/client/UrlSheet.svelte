<!-- The address bar: go to another path on this proxy, back / forward / reload, recent paths. -->
<script lang="ts">
  let { value = $bindable(), field = $bindable(), error, recent, ongo, onback, onforward, onreload }: {
    value: string; field: HTMLInputElement | undefined; error: string; recent: string[];
    ongo: (path: string) => void; onback: () => void; onforward: () => void; onreload: () => void;
  } = $props();

  // typing a path must not trigger the app's keyboard shortcuts
  const keep = (e: KeyboardEvent) => { e.stopPropagation(); };
</script>

<!-- Lucide icons (ISC, lucide.dev): arrow-left, arrow-right, rotate-cw -->
<div class="sheet url" role="dialog" aria-label="Go to a page">
  <div class="row">
    <button class="back" type="button" title="Back" aria-label="Back" onclick={onback}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg></button>
    <button class="forward" type="button" title="Forward" aria-label="Forward" onclick={onforward}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></button>
    <button class="reload" type="button" title="Reload" aria-label="Reload" onclick={onreload}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg></button>
    <input bind:this={field} bind:value type="text" inputmode="url" enterkeyhint="go" autocapitalize="off" autocomplete="off" spellcheck="false"
      aria-label="Path" placeholder="/path or a pasted URL"
      onkeydown={e => { keep(e); if (e.key === 'Enter') { e.preventDefault(); ongo(value); } }} onkeyup={keep} onkeypress={keep} />
    <button class="primary go" type="button" onclick={() => { ongo(value); }}>Go</button>
  </div>
  {#if error}<p class="error">{error}</p>{/if}
  {#if recent.length}
    <div class="recent">
      {#each recent as p (p)}<button type="button" title={p} onclick={() => { ongo(p); }}>{p}</button>{/each}
    </div>
  {/if}
</div>

<style>
  .row { flex-wrap: nowrap; }
  .back, .forward, .reload { flex: none; width: 36px; height: 34px; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
  svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  input { flex: 1; min-width: 0; padding: 7px 8px; border-radius: 8px; border: 1px solid #3f3f46; background: #09090b; color: #fafafa;
    font: 16px ui-monospace, monospace; }
  input::selection { background: #7c3aed; color: #fff; }
  .go { flex: none; height: 34px; margin-left: 0; }
  .error { margin: 8px 0 0; color: #f87171; font-size: 13px; }
  .recent { display: flex; flex-direction: column; margin-top: 8px; }
  .recent button { text-align: left; border: 0; border-top: 1px solid #27272a; border-radius: 0; background: transparent; padding: 8px 4px;
    font: 13px ui-monospace, monospace; color: #d4d4d8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
