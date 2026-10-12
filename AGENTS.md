# punchlist - notes for agents

See README.md for what this is. Layout: `src/cli.mjs` (proxy + CLI source, uses `axi-sdk-js`; `pnpm build` bundles `src/punchlist-axi.mjs` (entry: `--version` fast path) into `scripts/punchlist-axi.mjs` and `src/cli.mjs` into `scripts/punchlist-cli.mjs`; both are committed and must never be edited by hand - `pnpm test` rebuilds first), `scripts/client.js` (picker injected into pages, shadow DOM), `test/` (`pnpm test`: proxy e2e against a fake Rails-like server, client flows in jsdom with stubbed layout). `skills/punchlist/SKILL.md` is the published skill (`npx skills add narze/punchlist-axi --skill punchlist`; it calls `npx -y punchlist-axi`), `.claude/skills/punchlist/SKILL.md` is the dev copy that runs the local build. Both are thin stubs; the CLI (`--help`, next-step lines) is the source of truth for agent guidance.

## Hard requirements

1. **No changes to the target app.** Must work in front of any server: Rails (ERB, Turbo, ActionCable), SvelteKit/Vite, React, static.
2. **Works on a phone over Tailscale.** This is why it is a proxy and not a browser extension.
3. **AI-agnostic.** Any agent that can run shell commands must be able to drive it. No MCP requirement, no vendor CLI baked in.
4. **Only `node` (>= 18) or `bun` needed at runtime.** Source may use libraries (decision 2026-10-12: `axi-sdk-js`), but releases ship bundled files (`scripts/punchlist-axi.mjs` + `scripts/punchlist-cli.mjs`), no install.

## Decisions (do not reopen without a reason)

| Considered | Outcome | Why |
|---|---|---|
| Chrome extension | Rejected as primary | No mobile, per-device install. Could be another client of the same daemon later. |
| Dev-only `<script>` tag in the app | Rejected | Breaks requirement 1. |
| iframe "browser in browser" | Rejected | Cross-origin iframe DOM is inaccessible; a same-origin proxy solves it. |
| `http-proxy-middleware` | Hand-rolled Node `http` proxy | Small, no runtime deps. |
| Agent handoff via MCP | `wait`/`done` CLI instead | Works with every agent. |
| Upstream sees `X-Forwarded-*` | Stripped on purpose | Rails would use the tailnet host and fail Host Authorization / CSRF origin checks. Upstream must see a plain `localhost` request. |
| Skill holds the workflow text | Thin stub, CLI holds guidance | Copied from lavish-axi: installed skills go stale, the CLI does not. |
| `start` in the foreground + `nohup` | `start` spawns a detached `serve` | The agent never manages processes. |
| AXI (https://axi.md) | Adopt, with `axi-sdk-js` + bundled release | See docs/axi-plan.md. |

Prior art (none meets all 4 requirements): Agentation (React-only, needs a component, desktop-only, PolyForm Shield license - ideas only, never copy code), React Grab (React-only), stagewise (now a full browser/IDE), VS Code "Add Element to Chat", Cursor Design Mode, Claude Code Desktop Preview, Pinpoint (VS Code). lavish-axi is the model for the agent loop (long-poll, presence, receipts).

## Verified so far

Desktop Chromium against GeekCraft (Rails + Turbo, on another tailnet host) and 4do (SvelteKit/Vite): auth, injection, URL rewriting, click/drag/area/text notes, Turbo navigation, CSRF form POST, Send -> `wait` -> `done` -> toast, 390px layout. ↗ Open (open in editor) checked in desktop Chromium and at 390px against the test fixture with a fake `LAUNCH_EDITOR`, not with a real editor. 🔎 Locate (agent finds the file when hints name none, answered with `done --open`) is the fallback for every framework - decision 2026-10-12: the agent locates, not a proxy-side grep. Not verified: real phone (iOS Safari), Vite HMR socket through the proxy, ActionCable, ⏸ pause. Always say what was checked in a real browser vs only in jsdom.

## Open work (priority order)

1. AXI compatibility - docs/axi-plan.md.
2. Real-device checks: iPhone Safari via `tailscale serve`, Vite HMR through the proxy, ActionCable (Eventpop).
3. Agent presence in the toolbar ("agent listening"), queue saved to disk, Seen receipts (ideas from lavish-axi).
4. React 19 source hints: `_debugSource` is gone; parse `_debugStack`.
5. Streaming HTML: inject on the fly instead of buffering.
6. Phone scrolling in annotate mode: long-press-then-drag or two-finger scroll; prototype both and ask the user.
7. Later ideas: voice notes (Web Speech API, Thai works), attach recent `console.error`s, `--worktree` mode, extension client for sites that cannot be proxied.
