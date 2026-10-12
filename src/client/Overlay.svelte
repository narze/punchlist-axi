<!-- Outlines drawn over the page: hover, drag marquee, the draft's targets, and numbered marks for saved notes. -->
<script lang="ts">
  import { areaRect, here, type Box, type Draft, type LiveNote } from './context.ts';
  import Outline from './Outline.svelte';

  const { notes, draft, hover, marquee }: {
    notes: LiveNote[]; draft: Draft | null; hover: { box: Box; label: string } | null; marquee: Box | null;
  } = $props();

  interface Mark { kind: 'draft' | 'noted'; rect: () => Box; ok: () => boolean; tag?: string | undefined; pin?: number | undefined }
  const marks = $derived.by(() => {
    const out: Mark[] = [];
    const always = () => true;
    notes.forEach((n, i) => {
      if (n.path !== here()) return;
      const area = n.area;
      if (n.kind === 'area' && area) { out.push({ kind: 'noted', rect: () => areaRect(area), ok: always, pin: i + 1 }); return; }
      n.els.forEach((el, j) => { if (el) out.push({ kind: 'noted', rect: () => el.getBoundingClientRect(), ok: () => el.isConnected, pin: j === 0 ? i + 1 : undefined }); });
    });
    if (draft) {
      const { area, desc } = draft;
      if (draft.kind === 'area' && area) out.push({ kind: 'draft', rect: () => areaRect(area), ok: always, tag: desc });
      else draft.els.forEach((el, j) => { out.push({ kind: 'draft', rect: () => el.getBoundingClientRect(), ok: () => el.isConnected, tag: j === 0 ? desc : undefined }); });
    }
    return out;
  });

  // marks follow their targets through scrolling, layout changes and animations: re-measure every frame while there are any
  let placed = $state.raw<(Mark & { box: Box })[]>([]);
  $effect(() => {
    const list = marks;
    let id = 0;
    const measure = () => {
      placed = list.filter(m => m.ok()).map(m => ({ ...m, box: m.rect() }));
      if (list.length) id = requestAnimationFrame(measure);
    };
    measure();
    return () => { cancelAnimationFrame(id); };
  });
</script>

<div class="layer">
  {#if hover}<Outline kind="hover" box={hover.box} tag={hover.label} />{/if}
  {#if marquee}<Outline kind="marquee" box={marquee} />{/if}
  {#each placed as m, i (i)}
    <Outline kind={m.kind} box={m.box} tag={m.tag} />
    {#if m.pin}<div class="pin" style:left="{m.box.left}px" style:top="{m.box.top}px">{m.pin}</div>{/if}
  {/each}
</div>

<style>
  .layer { position: fixed; inset: 0; pointer-events: none; z-index: 2147483645; }
  .pin { position: fixed; width: 22px; height: 22px; margin: -11px 0 0 -11px; border-radius: 50%; background: #7c3aed; color: #fff;
    font: 600 12px/22px ui-sans-serif, system-ui, sans-serif; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,.3); }
</style>
