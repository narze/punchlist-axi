<!-- One outlined rectangle, with an optional label tag above it (below when there is no room). -->
<script lang="ts">
  import type { Box } from './context.ts';

  const { kind, box, tag }: { kind: 'hover' | 'marquee' | 'draft' | 'noted'; box: Box; tag?: string | undefined } = $props();
</script>

<div class="box {kind}" class:flip={box.top < 24} style:left="{box.left}px" style:top="{box.top}px" style:width="{box.width}px" style:height="{box.height}px">
  {#if tag}<span class="tag">{tag}</span>{/if}
</div>

<style>
  .box { position: fixed; border: 2px solid #7c3aed; background: rgba(124,58,237,.12); border-radius: 2px; }
  .draft { border-color: #f59e0b; background: rgba(245,158,11,.14); }
  .noted { border: 1.5px dashed #7c3aed; background: transparent; }
  .marquee { border-style: dashed; background: rgba(124,58,237,.08); }
  .tag { position: absolute; left: -2px; top: -22px; background: #7c3aed; color: #fff; font: 11px/20px ui-monospace, monospace;
    padding: 0 6px; border-radius: 3px; white-space: nowrap; max-width: 80vw; overflow: hidden; text-overflow: ellipsis; }
  .draft .tag { background: #f59e0b; color: #000; }
  .flip .tag { top: auto; bottom: -22px; }
</style>
