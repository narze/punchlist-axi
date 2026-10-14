<script lang="ts">
  import Toolbar from '../../src/client/Toolbar.svelte';
  import Frame from '../Frame.svelte';
  import { noop } from '../fixtures.ts';

  const on = { onurl: noop, onpick: noop, onfreeze: noop, ontray: noop, onsend: noop };
</script>

<Frame title="Idle" height={72}><Toolbar picking={false} frozen={false} browsing={false} count={0} busy={0} {...on} /></Frame>
<Frame title="Annotating" height={72}><Toolbar picking={true} frozen={false} browsing={false} count={0} busy={0} {...on} /></Frame>
<Frame title="Animations paused" height={72}><Toolbar picking={true} frozen={true} browsing={false} count={0} busy={0} {...on} /></Frame>
<Frame title="3 notes waiting" height={72}><Toolbar picking={false} frozen={false} browsing={false} count={3} busy={0} {...on} /></Frame>
<Frame title="Agent working on 2 requests" height={72}><Toolbar picking={false} frozen={false} browsing={false} count={1} busy={2} {...on} /></Frame>
<Frame title="Address bar open" height={72}><Toolbar picking={false} frozen={false} browsing={true} count={0} busy={0} {...on} /></Frame>
<Frame title="Menu open" height={180}><Toolbar picking={false} frozen={false} browsing={false} count={2} busy={0} menuOpen={true} {...on} /></Frame>
<Frame title="Menu open, animations paused, address bar open" height={180}><Toolbar picking={true} frozen={true} browsing={true} count={0} busy={0} menuOpen={true} {...on} /></Frame>
