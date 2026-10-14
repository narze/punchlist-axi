<script lang="ts">
  import Tray from '../../src/client/Tray.svelte';
  import Frame from '../Frame.svelte';
  import { element, noop, note } from '../fixtures.ts';

  const on = { onremove: noop, oncopy: noop, onclear: noop, onsend: noop, onpage: noop };
  const notes = [
    note('Make the button full width on phones'),
    note('Typo: "Doors" not "doors"', { kind: 'text', text: 'doors 18:30', elements: [element('p.after')] }),
    note('Too much space here', { kind: 'area', area: { x: 40, y: 300, width: 320, height: 120 }, elements: [element('section.cards')] }),
    note('The header overlaps the title', { path: '/events/2/edit', elements: [element('header.top')] }),
  ];
</script>

<Frame title="Empty" height={240}><Tray notes={[]} {...on} /></Frame>
<Frame title="Notes, one on another page" height={400}><Tray {notes} {...on} /></Frame>
