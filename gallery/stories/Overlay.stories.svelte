<!-- The whole overlay on made-up page content. Not contained: it measures its targets in the real viewport. -->
<script lang="ts">
  import type { Box, Draft, LiveNote } from '../../src/client/context.ts';
  import Overlay from '../../src/client/Overlay.svelte';
  import Frame from '../Frame.svelte';
  import { note } from '../fixtures.ts';

  let title = $state<HTMLElement>(), buy = $state<HTMLElement>(), more = $state<HTMLElement>(), text = $state<HTMLElement>();
  const notes = $derived<LiveNote[]>(buy && more ? [note('Bigger', { els: [buy] }), note('Same color as Buy', { els: [more] })] : []);
  const draft = $derived<Draft | null>(title ? { kind: 'element', els: [title], desc: 'h3.title', hint: 'src/routes/+page.svelte:3:1', file: null, top: false } : null);
  // hover and marquee are plain boxes: follow the page like Overlay's own marks do
  let hover = $state.raw<{ box: Box; label: string } | null>(null), marquee = $state.raw<Box | null>(null);
  $effect(() => {
    let id = 0;
    const measure = () => {
      if (text) { const r = text.getBoundingClientRect(); hover = { box: r, label: 'p.after' }; marquee = { left: r.left - 8, top: r.bottom + 16, width: 180, height: 40 }; }
      id = requestAnimationFrame(measure);
    };
    measure();
    return () => { cancelAnimationFrame(id); };
  });
</script>

<Frame title="Hover, a draft, two noted elements, a marquee" height={300} contain={false}>
  <div class="fake">
    <h3 bind:this={title}>Bangkok Design Week</h3>
    <p bind:this={text}>doors 18:30</p>
    <button bind:this={buy} type="button">Buy ticket</button>
    <button bind:this={more} type="button">More dates</button>
  </div>
  <Overlay {notes} {draft} {hover} {marquee} />
</Frame>

<style>
  /* room for each outline's tag above it */
  .fake { padding: 36px 40px; }
  h3 { display: inline-block; margin: 0 0 36px; font-size: 20px; }
  p { width: fit-content; margin: 0 0 84px; color: #52525b; }
  button { display: block; margin-bottom: 16px; }
</style>
