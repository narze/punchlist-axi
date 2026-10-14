<script lang="ts">
  import UrlSheet from '../../src/client/UrlSheet.svelte';
  import Frame from '../Frame.svelte';
  import { noop } from '../fixtures.ts';

  const on = { ongo: noop, onback: noop, onforward: noop, onreload: noop };
  const sheets = $state([
    { title: 'Empty, no recent pages', value: '', error: '', recent: [] as string[] },
    { title: 'Recent pages', value: '/events/1', error: '', recent: ['/events/1', '/events/2/edit', '/admin/organizers?page=3&sort=created_at&direction=desc'] },
    { title: 'Refused URL', value: 'javascript:alert(1)', error: 'Only http(s) URLs or paths', recent: [] },
  ]);
  const fields = $state<(HTMLInputElement | undefined)[]>([]);
</script>

{#each sheets as s, i (s.title)}
  <Frame title={s.title} height={s.recent.length ? 300 : 200}>
    <UrlSheet bind:value={s.value} bind:field={fields[i]} error={s.error} recent={s.recent} {...on} />
  </Frame>
{/each}
