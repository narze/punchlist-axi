# punchlist — handoff

Status as of 2026-10-11: working PoC, automated tests pass, **desktop Chromium verified against GeekCraft (Rails + Turbo)**. Phone, Vite HMR and ActionCable are still unverified (see "Real-browser results" and "Next steps").

## What this is

An AI-agnostic agent skill for click-to-edit. A local reverse proxy sits in front of any dev server and injects a picker script into every HTML page. The user opens the proxied URL (desktop or phone, also over Tailscale), annotates spots on the page, and sends them as one batch. The coding agent pulls the batch with a blocking shell command, edits source, and reports back; the browser shows the status as toasts.

Interactive prototype of the UX (mock agent, no proxy): https://claude.ai/artifact/NNDGbPe55EJEbLzDobnuQw

## Hard requirements (from the user, Noom)

1. **No changes to the target app.** Must work in front of any server: Rails (ERB, Turbo, ActionCable), SvelteKit/Vite, React, static.
2. **Works on a phone over Tailscale.** This is why it's a proxy and not a browser extension.
3. **AI-agnostic.** Any agent that can run shell commands must be able to drive it. No MCP requirement, no vendor CLI baked in.
4. Zero runtime dependencies (`node` ≥ 18 or `bun`). Dev deps for tests are fine.

## Decisions already made (don't relitigate without a reason)

| Considered | Outcome | Why |
|---|---|---|
| Chrome extension | Rejected as primary | No mobile, per-device install. Could be added later as another client of the same daemon. |
| Dev-only `<script>` tag in the app | Rejected | Violates requirement 1. |
| iframe "browser in browser" | Rejected | Cross-origin iframe DOM is inaccessible; same-origin proxy solves it instead. |
| `http-proxy-middleware` | Replaced with hand-rolled Node `http` proxy | Keeps runtime zero-dep. |
| Agent handoff via MCP | Rejected in favor of `wait`/`done` CLI | Works with every agent; MCP could be added as an optional extra. |
| Upstream sees `X-Forwarded-*` | Stripped on purpose | Rails would then use the tailnet host for `base_url` and fail Host Authorization / CSRF origin checks. Upstream must believe it's a plain `localhost` request. |

Prior art reviewed and how this differs: Agentation (React-only, requires installing a component, desktop-only, PolyForm Shield license — do not copy code, ideas only), React Grab (React-only), stagewise (now a full browser/IDE), VS Code integrated browser "Add Element to Chat", Cursor Design Mode, Claude Code Desktop Preview, Pinpoint (VS Code, writes `.pinpoint/*.md`). None satisfy all four requirements.

## Layout

```
punchlist/
  SKILL.md                 # thin skill stub (when this folder is installed as a skill)
  .claude/skills/punchlist/SKILL.md  # same stub, so agents in this repo get the skill
  scripts/punchlist.mjs   # proxy server + CLI: start | serve | wait | done | status | stop; --help = the full guide
  scripts/client.js        # picker injected into pages (shadow DOM UI)
  test/fixture-server.mjs  # fake Rails-like dev server
  test/proxy.test.mjs      # e2e: proxy behaviors + wait/done/status
  test/client.test.mjs     # client.js in jsdom (no layout!)
  package.json             # `npm test`; jsdom is the only devDependency
```

## How it works

**Skill = stub, CLI = guidance (copied from lavish-axi).** The SKILL.md files only say what punchlist is and point to `punchlist.mjs --help` via `${CLAUDE_SKILL_DIR}`. Workflow text lives in `GUIDE` in the CLI and in the `next_step` lines that `start` and `wait` print, so installed skill copies cannot go stale.

**Proxy (`start`)** — `node scripts/punchlist.mjs start --target 3000 --port 4000 [--host 127.0.0.1] [--no-auth]`
- `start` spawns `serve` as a detached child (log: `$TMPDIR/punchlist/<port>.log`), waits until it writes its state file, prints the links + next step, and exits. Same target on a running port: prints the existing link. Different target: error. `serve` = the same proxy in the foreground. No idle shutdown yet (lavish stops after 30 min idle); use `stop`.
- Auth: random token; `/__pe/auth?token=…` sets an HttpOnly `__pe_auth` cookie. Everything else (including WebSocket upgrades) returns 401 without it. Agent CLI uses the `x-pe-token` header from the state file. The auth cookie is stripped before forwarding upstream.
- State file: `$TMPDIR/punchlist/<port>.json` (`port, host, target, token, pid`). CLI commands find the server through it (`--port`, or most recent).
- Request rewriting: `Host` → target host, `Origin`/`Referer` → target origin, drop all `x-forwarded-*`/`forwarded`, drop `accept-encoding`.
- Response rewriting: strip `content-security-policy(-report-only)`; rewrite `Location` and absolute self-URLs (`localhost`/`127.0.0.1`/`[::1]` variants of the target origin) to relative; strip `Domain=` from `Set-Cookie`. HTML only: decode gzip/br/deflate if upstream compressed anyway, inject `<script src="/__pe/client.js" defer data-pe>` before `</head>`.
- WebSockets: raw TCP/TLS pipe after rewriting the upgrade request headers (Vite HMR, ActionCable).
- Tailscale: prints the MagicDNS name if `tailscale` is installed; user runs `tailscale serve --bg 4000`. Never `funnel` — anyone reaching the proxy can make the agent edit code.

**HTTP API (under `/__pe`)**
- `GET /client.js` — the picker (read from disk each request, no-store, so edits apply on reload).
- `POST /requests` — body `{ notes: Note[], viewport: {w,h} }` → `201 { id, status, label, prompt, message }`.
- `GET /next?timeout=ms` — long-poll for the agent; `200` with the oldest pending item (marks it `working`), or `204`.
- `POST /requests/:id/done` — `{ status: "done"|"failed", message }`.
- `GET /requests` — list. `GET /events` — SSE: `{type:"snapshot", items}` then `{type:"update", item}`.

**Note schema (client → server)**
```ts
type Note = {
  kind: 'element' | 'elements' | 'text' | 'area';
  comment: string; path: string; title: string; frozen: boolean;   // frozen = captured with animations paused
  text?: string;                                                   // kind 'text': exact selected text
  area?: { x: number; y: number; width: number; height: number };  // kind 'area': page coords
  elements: Array<{                                                // ≥1; up to 6 for 'elements'
    label: string; selector: string; ancestors: string[]; text: string;
    html: string /* outerHTML, truncated at 4000 */; styles: Record<string,string>;
    rect: { x: number; y: number; width: number; height: number }; // page coords
    hints: { rails: string[]; svelte: string[]; react: string[]; vue: string[] };
  }>;
};
```
Targets are keyed in `wait` output as `[1]`, `[2]`, … or `[3a]`, `[3b]` for multi-element notes.

**Source hints (client.js)**
- Rails: walks HTML comments `<!-- BEGIN app/views/... -->` / `END` to build the template chain. Only present if the app has `config.action_view.annotate_rendered_view_with_filenames = true` in development (we suggest it, never add it ourselves).
- Svelte 5 dev: `element.__svelte_meta.loc` → `file:line:column`.
- React: `__reactFiber$*` owner names, `_debugSource` on React ≤ 18 (React 19 removed it; see next steps).
- Vue 3: `__vueParentComponent` → `type.__file`.

**Picker UI (client.js)** — shadow DOM appended to `<html>` (outside `<body>`, so Turbo body swaps don't remove it). Toolbar: ◎ annotate (Alt+Shift+E), ⏸ pause animations (Alt+Shift+P), 🗒 tray (list/remove notes, copy markdown, clear), Send.
- Annotate mode: tap/click → element note; drag → all top-most elements fully inside the box (≤ 6) or, if none, an `area` note anchored to the smallest element containing the box. While on, page events are swallowed in capture phase and `touch-action: none` is set on `<html>` (so the page can't scroll in this mode on touch devices).
- Text selection (annotate mode off): `selectionchange` shows a floating "💬 Annotate" chip → `text` note.
- Pause: injects a `<style>` pausing CSS animations/transitions, calls `pause()` on `document.getAnimations()`, pauses playing media and resumes only those.
- Notes are snapshotted at add time and persisted to `sessionStorage` (`__pe_notes`), so they survive reloads and navigation; pins are re-resolved by selector when you return to the note's page.
- Status toasts from SSE; on `done` a toast offers Reload and an "auto" checkbox (`localStorage.__pe_autoreload`).

## Tests

`npm install && npm test` (from the skill folder). 10 proxy e2e checks + 1 jsdom client flow, all passing. jsdom has no layout, so **drag/area selection, overlay positioning, mobile touch, and real animations are untested.**

## Real-browser results (2026-10-11, Playwright Chromium, GeekCraft Rails dev server on another tailnet host)

Command: `start --target http://<tailnet-host>:3000 --port 4000`.

Verified: auth link sets cookie; toolbar injected; absolute self-URLs (hreflang links) rewritten; click-pick swallows link clicks; Rails template hints resolve; drag over several elements -> `elements` note; drag over empty space -> `area` note; Turbo navigation keeps toolbar and notes; form POST (add to cart) passes CSRF and the redirect stays on the proxy; text-selection chip; Send -> `wait` output -> `done` -> toast with Reload over SSE; 390px-wide layout.

Fixed during verification (with regression tests):
- Drag around visible text gave an `area` note: block elements are wider than their text. Now an element also counts as inside when its content rect fits (`test/drag.test.mjs`).
- First keystrokes after a pick were lost (textarea focused in `setTimeout`). Now focused synchronously, which also lets iOS open the keyboard.
- Cancel kept the typed text, so it leaked into the next note. Cancel now clears it.
- The note sheet covered the picked element when it was in the lower half of the viewport. The sheet now moves to the top.
- The hover box kept tracking while the note sheet was open.

Not verified: GeekCraft has no WebSockets, so ActionCable and Vite HMR are untested; no real touch device; ⏸ animation pause not exercised.

## Known limits

- HTML responses are buffered before injection → streamed HTML (SvelteKit streaming, Rails `stream: true`) arrives all at once.
- Absolute self-URLs inside JS bundles aren't rewritten (HTML only).
- Cross-origin iframes can't be picked.
- `touch-action: none` in annotate mode blocks scrolling on phones; user must toggle ◎ off to scroll.
- Single-user assumptions: one queue per proxy, no per-user attribution.

## AXI compatibility

Plan and gap audit: [docs/axi-plan.md](docs/axi-plan.md). The AXI skill is installed globally (`~/.claude/skills/axi`). Open decision: runtime deps (`axi-sdk-js` + bundle, or hand-rolled).

## Next steps (in priority order)

1. **Real-browser verification.** Run against (a) Eventpop Rails dev server with Turbo + ActionCable, (b) a SvelteKit/Vite app (Wordin) for HMR over the proxy, (c) iPhone Safari via `tailscale serve`. Checklist: auth link works over HTTPS; HMR socket connects through the proxy (Vite's client may try `localhost:5173` directly — if so, check `server.hmr.clientPort` behavior and consider rewriting); ActionCable connects; form POST passes CSRF; Turbo navigation keeps the toolbar and pins; drag selection and area notes behave; text selection chip works with iOS selection UI; ⏸ freezes CSS + JS animations; the agent loop (`wait` → edit → `done`) end-to-end with Claude Code. Fix what breaks and add regression tests to `test/`.
2. **React 19 source hints**: `_debugSource` is gone; parse `_debugStack` (an Error stack string) for file:line, or document the limitation.
3. **Streaming HTML**: inject on the fly (scan chunks for `</head>` and pass the rest through) instead of buffering.
4. **Mobile scrolling in annotate mode**: options are long-press-then-drag for marquee, or two-finger scroll. Prototype both, ask Noom.
5. **Ideas from research** (only after 1–4): voice input via Web Speech API (Thai works); capture `console.error`/`window.onerror` and attach the recent ones to the batch; `--worktree` option so the agent edits in a separate git worktree (ClickSmith idea); optional Chrome-extension or `agent-browser --init-script` client that talks to the same daemon for sites you can't proxy.
6. Packaging: decide where the skill lives (Noom's skills repo) and add install notes for Claude Code (`~/.claude/skills/punchlist`) and other agents.

## Working with Noom

Staff engineer, Rails primary, SvelteKit for side projects. Reply in Thai with English technical terms. He prefers trying things hands-on, so ship small, testable increments and say clearly what was verified in a real browser vs only in jsdom.
