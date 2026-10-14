<script lang="ts">
  import Toasts from '../../src/client/Toasts.svelte';
  import Frame from '../Frame.svelte';
  import { noop } from '../fixtures.ts';
</script>

<Frame title="Plain" height={64}><Toasts toasts={[{ id: 1, text: '⏸ Animations paused', reload: false }]} onopen={noop} oncopy={noop} /></Frame>
<Frame title="Request done, with auto-reload" height={64}>
  <Toasts toasts={[{ id: 1, text: '✅ r3: made the button full width', reload: 'agent' }]} onopen={noop} oncopy={noop} />
</Frame>
<Frame title="File saved: Reload" height={64}><Toasts toasts={[{ id: 1, text: '💾 Saved src/routes/+page.svelte', reload: 'button' }]} onopen={noop} oncopy={noop} /></Frame>
<Frame title="Located file" height={64}>
  <Toasts toasts={[{ id: 1, text: '🔎 Found src/lib/Card.svelte:8', reload: false, file: { file: 'src/lib/Card.svelte', line: 8 } }]} onopen={noop} oncopy={noop} />
</Frame>
<Frame title="Stacked, long text" height={150}>
  <Toasts toasts={[
    { id: 1, text: '🛠 r4 agent is on it', reload: false },
    { id: 2, text: '❌ Send failed: Failed to fetch', reload: false },
    { id: 3, text: '✅ r4: moved the header below the hero and fixed the spacing', reload: 'agent' },
  ]} onopen={noop} oncopy={noop} />
</Frame>
