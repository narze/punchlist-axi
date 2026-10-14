<!-- Outlines drawn straight on the stage (Overlay draws them in a layer that ignores the pointer, so they can't be picked there). -->
<script lang="ts">
  import Outline from '../../src/client/Outline.svelte';
  import Frame from '../Frame.svelte';
</script>

<Frame title="Hover, draft, noted, marquee" height={200}>
  <Outline kind="hover" box={{ left: 24, top: 40, width: 160, height: 40 }} tag="button#buy.btn.primary" />
  <Outline kind="draft" box={{ left: 220, top: 40, width: 200, height: 60 }} tag="div.card > h3" />
  <Outline kind="noted" box={{ left: 24, top: 120, width: 160, height: 48 }} />
  <Outline kind="marquee" box={{ left: 220, top: 130, width: 200, height: 50 }} />
</Frame>
<Frame title="Near the top: tag below" height={100}>
  <Outline kind="hover" box={{ left: 24, top: 8, width: 220, height: 36 }} tag="header.top > nav" />
</Frame>
