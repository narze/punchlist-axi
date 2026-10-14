<script lang="ts">
  import NotePanel from '../../src/client/NotePanel.svelte';
  import type { Draft } from '../../src/client/context.ts';
  import Frame from '../Frame.svelte';
  import { noop } from '../fixtures.ts';

  const on = { onadd: noop, oncancel: noop, onopen: noop, oncopy: noop, onedit: noop, onlocate: noop, onparent: noop, onchild: noop };
  const drafts: { title: string; draft: Draft; comment: string }[] = $state([
    { title: 'Element with a source file', draft: { kind: 'element', els: [], desc: 'button#buy.btn.primary', hint: 'src/routes/+page.svelte:12:5',
      file: { file: 'src/routes/+page.svelte', line: 12, column: 5 }, top: false }, comment: '' },
    { title: 'No file known: Locate', comment: 'Make this bigger on phones', draft: { kind: 'element', els: [], desc: 'div.card > h3',
      hint: 'main > section.cards > div.card:nth-of-type(2) > h3', file: null, top: false } },
    { title: 'Selected text', draft: { kind: 'text', els: [], text: 'doors 18:30', desc: 'text “doors 18:30” in p.after',
      hint: 'app/views/events/show.html.erb', file: { file: 'app/views/events/show.html.erb' }, top: false }, comment: '' },
    { title: 'Whole page', draft: { kind: 'page', els: [], desc: 'Whole page', hint: '/events/1', file: null, top: false }, comment: '' },
    { title: 'Target low on the page: sheet at the top', draft: { kind: 'elements', els: [], desc: '2 elements: a.nav, a.nav', hint: 'src/lib/Nav.svelte:4:3',
      file: { file: 'src/lib/Nav.svelte', line: 4, column: 3 }, top: true }, comment: '' },
  ]);
  const fields = $state<(HTMLTextAreaElement | undefined)[]>([]);
</script>

{#each drafts as d, i (d.title)}
  <Frame title={d.title} height={300}><NotePanel draft={d.draft} bind:comment={d.comment} bind:field={fields[i]} {...on} /></Frame>
{/each}
