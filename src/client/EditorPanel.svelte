<!-- The in-browser editor: a file from the project in CodeMirror (mounted into `host` by App), saved back through the proxy. -->
<script lang="ts">
  let { file, ready, dirty, saving, conflict, discarding, host = $bindable(), onsave, onclose, onload, onoverwrite }: {
    file: string; ready: boolean; dirty: boolean; saving: boolean; conflict: boolean; discarding: boolean; host: HTMLElement | undefined;
    onsave: () => void; onclose: () => void; onload: () => void; onoverwrite: () => void;
  } = $props();

  // typing code must not trigger the app's keyboard shortcuts
  const keep = (e: KeyboardEvent) => { e.stopPropagation(); };
</script>

<div class="sheet editor" role="dialog" aria-label="Edit {file}" tabindex="-1" onkeydown={keep} onkeyup={keep} onkeypress={keep}>
  <div class="head">
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
</div>

<style>
  .editor { top: calc(12px + env(safe-area-inset-top, 0px)); max-height: none; width: min(960px, calc(100vw - 24px));
    display: flex; flex-direction: column; gap: 8px; overflow: hidden; padding: 8px; }
  .head { display: flex; gap: 6px; align-items: center; }
  .file { flex: 1; min-width: 0; font: 12px ui-monospace, monospace; color: #fbbf24; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: rtl; text-align: left; }
  .dirty { color: #fafafa; }
  .save { margin-left: 0; }
  .save:disabled { opacity: .5; cursor: default; }
  .conflict { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; font-size: 13px; background: #450a0a; border-radius: 8px; padding: 6px 8px; }
  .conflict span { flex: 1; min-width: 12em; }
  .code { flex: 1; min-height: 0; border-radius: 8px; overflow: hidden; background: #282c34; }
  .loading { color: #a1a1aa; font-size: 13px; margin: 12px; }
</style>
