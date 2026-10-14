<!-- The gallery page: a list of components on the side, every story below it on one page, so a batch of notes can cover several. -->
<script lang="ts">
  import type { Component } from 'svelte';
  import EditorPanelStories from './stories/EditorPanel.stories.svelte';
  import NotePanelStories from './stories/NotePanel.stories.svelte';
  import OutlineStories from './stories/Outline.stories.svelte';
  import OverlayStories from './stories/Overlay.stories.svelte';
  import ToastsStories from './stories/Toasts.stories.svelte';
  import ToolbarStories from './stories/Toolbar.stories.svelte';
  import TrayStories from './stories/Tray.stories.svelte';

  const components: { name: string; stories: Component }[] = [
    { name: 'Toolbar', stories: ToolbarStories },
    { name: 'NotePanel', stories: NotePanelStories },
    { name: 'Tray', stories: TrayStories },
    { name: 'Toasts', stories: ToastsStories },
    { name: 'Outline', stories: OutlineStories },
    { name: 'Overlay', stories: OverlayStories },
    { name: 'EditorPanel', stories: EditorPanelStories },
  ];
</script>

<div class="page">
  <nav aria-label="Components">
    <strong>punchlist</strong>
    {#each components as c (c.name)}<a href="#{c.name}">{c.name}</a>{/each}
  </nav>
  <main>
    {#each components as c (c.name)}
      <section id={c.name}>
        <h2>{c.name} <code>src/client/{c.name}.svelte</code></h2>
        <c.stories />
      </section>
    {/each}
  </main>
</div>

<style>
  :global(body) { margin: 0; background: #f4f4f5; color: #18181b; }
  .page { display: grid; grid-template-columns: 180px minmax(0, 1fr); gap: 24px; padding: 24px; }
  nav { position: sticky; top: 24px; align-self: start; display: flex; flex-direction: column; gap: 2px; font-size: 14px; }
  nav strong { font-size: 15px; margin-bottom: 8px; }
  nav a { color: #3f3f46; text-decoration: none; padding: 4px 8px; border-radius: 6px; }
  nav a:hover { background: #e4e4e7; }
  section { scroll-margin-top: 24px; margin-bottom: 32px; }
  h2 { font-size: 18px; margin: 0 0 12px; display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; }
  code { font: 12px ui-monospace, monospace; color: #71717a; }
  /* a phone: the components get the whole width, as they would on the page */
  @media (max-width: 640px) {
    .page { grid-template-columns: minmax(0, 1fr); padding: 0; gap: 0; }
    nav { position: sticky; top: 0; z-index: 1; flex-direction: row; overflow-x: auto; background: #f4f4f5; padding: 8px 12px; border-bottom: 1px solid #e4e4e7; }
    nav strong { margin: 0 8px 0 0; align-self: center; }
    section { scroll-margin-top: 52px; }
    h2 { padding: 16px 12px 0; }
    :global(figcaption) { padding: 0 12px; }
  }
</style>
