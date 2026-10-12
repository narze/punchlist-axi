# punchlist

Click-to-edit for any running web app, driven by any coding agent.

A local proxy sits in front of your dev server and injects a picker into every HTML page. You walk through the app (desktop or phone, also over Tailscale), mark the spots that need a change, and send them as one batch - a punch list. Your coding agent pulls the batch with a shell command, edits the source, and reports back; the browser shows the result as a toast.

Nothing in your app changes. It works in front of Rails (Turbo), SvelteKit/Vite, React, Vue and static servers.

## Use

With the skill installed, ask your agent: `/punchlist 5173` (or "let me click the element I want changed").

By hand:

```bash
node scripts/punchlist-axi.mjs start --target 5173      # proxy runs in the background, prints the link
node scripts/punchlist-axi.mjs wait                     # blocks until you press Send
node scripts/punchlist-axi.mjs done r1 "1: made it blue"
node scripts/punchlist-axi.mjs stop
```

Open the printed link (its token sets an access cookie). In the page: press ◎ (Alt+Shift+E), tap an element or drag a box, write a note, repeat, then press **Send**. With ◎ off, selecting text shows an Annotate button. ⏸ (Alt+Shift+P) pauses animations. 🗒 lists your notes; notes survive reloads until sent.

Phone access: `tailscale serve --bg <port>`, then open the HTTPS link that `start` prints. Never use `tailscale funnel`: anyone who reaches the proxy can make your agent edit code.

`node scripts/punchlist-axi.mjs --help` is the full guide for agents.

## Source hints

Each note carries hints that point the agent at the source:

- **Svelte 5 dev**: `file:line:col`
- **Rails**: the template chain, if `config.action_view.annotate_rendered_view_with_filenames = true` is set in development
- **React**: component names (and `_debugSource` on React 18 and older)
- **Vue 3**: component file

## Known limits

- HTML is buffered before injection, so streamed HTML arrives all at once.
- Absolute dev-server URLs inside JS bundles are not rewritten (HTML only).
- Pages in cross-origin iframes cannot be picked.
- In annotate mode, touch scrolling is blocked on phones; turn ◎ off to scroll.
- One queue per proxy, no per-user attribution.

## Develop

```bash
pnpm install && pnpm test   # pnpm version comes from package.json "packageManager"
```
