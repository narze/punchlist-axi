<!-- The editor in each of its states; the code box gets the real CodeMirror (src/client/editor.ts) once it loads. -->
<script lang="ts">
  import EditorPanel from '../../src/client/EditorPanel.svelte';
  import Frame from '../Frame.svelte';
  import { noop } from '../fixtures.ts';

  const FILE = 'src/routes/events/[id]/+page.svelte';
  const DOC = `<main>
  <h1 class="title">{data.event.name}</h1>
  <button id="buy" class="btn primary">Buy ticket</button>
  <p class="after">doors {data.event.doors}</p>
</main>
`;
  const on = { onbox: noop, onsave: noop, onclose: noop, onload: noop, onoverwrite: noop };
  const states = [
    { title: 'Loading', ready: false, dirty: false, saving: false, conflict: false, discarding: false },
    { title: 'Open', ready: true, dirty: false, saving: false, conflict: false, discarding: false },
    { title: 'Unsaved changes', ready: true, dirty: true, saving: false, conflict: false, discarding: false },
    { title: 'Saving', ready: true, dirty: true, saving: true, conflict: false, discarding: false },
    { title: 'Changed on disk', ready: true, dirty: true, saving: false, conflict: true, discarding: false },
    { title: 'Close pressed once with changes', ready: true, dirty: true, saving: false, conflict: false, discarding: true },
  ];
  const hosts = $state<(HTMLElement | undefined)[]>([]);

  $effect(() => {
    const ready = states.flatMap((s, i) => { const h = hosts[i]; return s.ready && h ? [h] : []; });
    let gone = false;
    const editors: { destroy(): void }[] = [];
    void import('../../src/client/editor.ts').then(({ createEditor }) => {
      if (gone) return;
      for (const h of ready) editors.push(createEditor(h, { root: document, file: FILE, doc: DOC, line: 3, onchange: noop, onsave: noop }));
    });
    return () => { gone = true; for (const e of editors) e.destroy(); };
  });
</script>

{#each states as s, i (s.title)}
  <Frame title={s.title} height={360}>
    <EditorPanel file={FILE} ready={s.ready} dirty={s.dirty} saving={s.saving} conflict={s.conflict} discarding={s.discarding}
      bind:host={hosts[i]} box={null} {...on} />
  </Frame>
{/each}
<Frame title="Moved and resized" height={360}>
  <EditorPanel file={FILE} ready={false} dirty={false} saving={false} conflict={false} discarding={false}
    host={undefined} box={{ left: 40, top: 40, width: 420, height: 240 }} {...on} />
</Frame>
