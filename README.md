# punchlist

Click-to-edit for any running web app, driven by any coding agent.

A local proxy sits in front of your dev server and injects a picker into every HTML page. You walk through the app (desktop or phone, also over Tailscale), mark the spots that need a change, and send them as one batch - a punch list. Your coding agent pulls the batch with a shell command, edits the source, and reports back; the browser shows the result as a toast.

Nothing in your app changes. It works in front of Rails (Turbo), SvelteKit/Vite, React, Vue and static servers.

## Use

Install the skill (Claude Code, Codex, OpenCode, Cursor and others) with `npx skills add narze/punchlist-axi --skill punchlist`, then ask your agent: `/punchlist 5173` (or "let me click the element I want changed").

By hand, with Node 18+ (no install needed):

```bash
npx -y punchlist-axi start --target 5173      # proxy runs in the background, prints the link
npx -y punchlist-axi wait                     # blocks until you press Send
npx -y punchlist-axi done r1 "1: made it blue"
npx -y punchlist-axi stop
```

Or install it once with `npm i -g punchlist-axi` and run `punchlist-axi start --target 5173`. Every output ends with the next command to run, written the way you called it.

The proxy listens on port 4000, or on the next free port when 4000 is busy (like Vite). Running `start` again for the same dev server reuses its proxy. Pass `--port` to require one port.

Open the printed link (its token sets an access cookie). In the page: press ◎ (Alt+Shift+E), tap an element or drag a box, write a note, repeat, then press **Send**. With ◎ off, selecting text shows an Annotate button. ⏸ (Alt+Shift+P) pauses animations. ✎ Edit in the note panel edits the source in the page (see below). 🗒 lists your notes; notes survive reloads until sent.

Phone access: `tailscale serve --bg <port>`, then open the HTTPS link that `start` prints. Never use `tailscale funnel`: anyone who reaches the proxy can make your agent edit code.

Optional: `punchlist-axi setup hooks` (needs the global install) adds a SessionStart hook to Claude Code, Codex and OpenCode, so new agent sessions see the proxies running for their directory (`--project` for the repo config, `--remove` to undo).

`npx -y punchlist-axi --help` is the full guide for agents.

## Source hints

Each note carries hints that point the agent at the source:

- **Svelte 5 dev**: `file:line:col`
- **Rails**: the template chain, if `config.action_view.annotate_rendered_view_with_filenames = true` is set in development
- **React**: component names (and `_debugSource` on React 18 and older)
- **Vue 3**: component file

## Open in your editor

When the hint names a file, the note panel shows **↗ Open** and **⧉ Copy** (copies `path:line:col`). Files resolve against the directory you started the proxy from, or `--root <dir>`; only files inside it can be opened.

- Browsing on the proxy machine (`localhost`): the proxy opens the file in the editor there, via [launch-editor](https://github.com/vitejs/launch-editor). It finds a running editor (VS Code, Cursor, Zed, JetBrains, Sublime...), or set `LAUNCH_EDITOR` (or `EDITOR`) in the shell that runs `start`.
- Browsing from another machine (Tailscale): the browser follows an editor URL that opens the file over SSH on the proxy machine, `vscode://vscode-remote/ssh-remote+<you>@<tailscale name>/abs/path:line:col` by default. Pick another editor with `--editor-url cursor|windsurf|zed`, or pass a template with `{host}`, `{abs}`, `{line}`, `{col}`. Needs Remote-SSH access to the proxy machine. On a phone, use Copy, or ✎ Edit (below) to change it right in the page.

When the hints name no file (only a component name, or nothing), the panel shows **🔎 Locate** instead. It sends a small request to your agent, which finds the file and hands it back with `done <id> --open <file>[:line]`; the answer arrives as a toast with the same Open / Copy choice. This works with any framework, but it takes the agent's time and needs a `wait` running.

## Edit in the page

**✎ Edit** in the note panel opens the file in a code editor ([CodeMirror](https://codemirror.net)) right in the page, at the hinted line. Save with the button or ⌘/Ctrl+S; the proxy writes the file on the dev machine, and your dev server's reload (Vite HMR, or Reload for Rails templates) shows the change. When the hints name no file, ✎ Edit asks your agent to find it (like 🔎 Locate) and the answer opens here. Drag the editor's header to move it and its corner to resize it (remembered per browser); double-click the header to put it back.

If the file changed on disk since you opened it (say, your agent edited it), Save is refused and you choose **Load from disk** or **Overwrite**. The editor (about 200 KB gzipped) loads only the first time you open a file.

Only source files inside the project (the start directory or `--root`) can be opened: no dotfiles (`.env`, `.git`), nothing in `node_modules`, nothing git ignores, no binary files. Anyone with the access link can save files, which is no more than they can already ask your agent to do.

## Known limits

- HTML is buffered before injection, so streamed HTML arrives all at once.
- Absolute dev-server URLs inside JS bundles are not rewritten (HTML only).
- Pages in cross-origin iframes cannot be picked.
- In annotate mode, touch scrolling is blocked on phones; turn ◎ off to scroll.
- One queue per proxy, no per-user attribution.

## Develop

```bash
pnpm install && pnpm test   # pnpm version comes from package.json "packageManager"
pnpm check                  # typecheck (strict tsc) + lint (typescript-eslint, strict)
node scripts/punchlist-axi.mjs --help   # run the checkout
```
