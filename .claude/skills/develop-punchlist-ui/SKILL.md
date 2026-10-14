---
name: develop-punchlist-ui
description: Work on punchlist's own picker UI by annotating its component gallery with punchlist.
disable-model-invocation: true
---

# develop-punchlist-ui

The gallery (`gallery/`, `pnpm gallery`) shows every `src/client/` component in its main states on one page. Put the local punchlist proxy in front of it, and the user's notes arrive with hints like `src/client/NotePanel.svelte:17:4`.

## Steps

1. Sync the gallery with `src/client/` (every `.svelte` there except `App.svelte` has one `gallery/stories/<Component>.stories.svelte` and one entry in `gallery/Gallery.svelte`):
   - Added or removed component: add or remove its stories file and its `Gallery.svelte` entry. `test/gallery.test.ts` fails while the two lists differ.
   - Changed component: diff it against when its stories last changed, `git diff $(git log -1 --format=%h -- gallery/stories/<Component>.stories.svelte) -- src/client/<Component>.svelte`. A new prop, state or `{#if}` branch gets a story or a story variant; a removed one loses it.
   - Done when every component's diff is accounted for and `pnpm check` and `node --import tsx test/gallery.test.ts` pass. Commit the sync by itself.
2. Start the gallery as a tracked background job (it stays in the foreground and does not detach): `pnpm gallery`. Done when `curl -s localhost:6006` answers. `PORT=<n>` picks another port.
3. Start the proxy with the local build: `node scripts/punchlist-axi.mjs start --target http://localhost:6006`. From here, the `start` output and `--help` hold the loop: paste the links, run `wait`, handle notes, `done`, `wait` again.
4. For each note:
   - The hint names the component to edit. Hints into `gallery/` are about the gallery itself.
   - After a change in `src/client/`, run `pnpm build`. The gallery reloads itself with your change, but the picker the user annotates with is `scripts/client.js`, and it changes only after a build and a page reload. Tell the user to reload.
   - When a component gets a new state or prop, add or update its story in `gallery/stories/<Component>.stories.svelte`.
   - Look at the result in a real browser at desktop width and at 390px before `done`. Say what you checked in a browser and what only in jsdom.
   - Done when `pnpm check` and `pnpm test` pass (`test/gallery.test.ts` mounts every story).

## Request

$ARGUMENTS
