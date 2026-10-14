<!-- One story: a title over a stage. The stage is the containing block for the components' `position: fixed`,
     so each one sits in its own box; `contain={false}` leaves them on the real viewport (Overlay measures it). -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  const { title, height = 320, contain = true, children }: { title: string; height?: number; contain?: boolean; children: Snippet } = $props();
</script>

<figure>
  <figcaption>{title}</figcaption>
  <div class="stage" class:contain style:height="{height}px">{@render children()}</div>
</figure>

<style>
  figure { margin: 0 0 20px; }
  figcaption { font: 600 12px ui-sans-serif, system-ui, sans-serif; color: #52525b; margin: 0 0 6px; }
  .stage { position: relative; overflow: hidden; border-radius: 10px; background-color: #fff;
    background-image: linear-gradient(#e4e4e7 1px, transparent 1px), linear-gradient(90deg, #e4e4e7 1px, transparent 1px); background-size: 24px 24px; }
  .contain { transform: translateZ(0); }
  @media (max-width: 640px) { .stage { border-radius: 0; } }
</style>
