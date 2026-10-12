# punchlist - AXI compatibility plan

Audit of `scripts/punchlist.mjs` against the AXI skill (`npx skills add kunchenguid/axi`, spec at https://axi.md), 2026-10-12. Browser side (`client.js`) is out of scope.

## Gaps

| # | Principle | Today | Change |
|---|---|---|---|
| 1 | TOON output | Free text; `wait` prints Markdown | TOON on stdout. `wait`: request metadata + `notes[N]{key,kind,comment,target,hint}` table; per-target detail below |
| 2 | Minimal schemas | `wait` prints selector, ancestors, all computed styles, full HTML for every target | Default: key, label, best source hint, text, truncated HTML. Styles/ancestors via `--fields` or `show <id> --full` |
| 3 | Truncation | HTML cut at 4000 in the browser, no size hint | Cut at ~1000 chars with `(truncated, N chars total)` and `help: punchlist show <id> --full`. Needs a new `show` command |
| 4 | Aggregates | `status` lists rows only | `count: 3 requests (1 pending, 1 working, 1 done)` |
| 5 | Empty states | `wait` timeout prints `NO_REQUEST`, exit 2 | `request: none (waited 540s)` + `help: run wait again`, exit 0 (like lavish `status: waiting`) |
| 6 | Errors & exit codes | `die()` writes stderr; exit 2 = no request, 3 = proxy gone; any flag is accepted | Structured `error:` + `help:` on stdout. Exit 0/1/2 only (2 = usage). Reject unknown flags per command and list valid ones. `stop` when not running = no-op exit 0 |
| 7 | Ambient context | None | `punchlist setup hooks` (opt-in) adds a SessionStart hook for Claude Code, Codex, OpenCode: running proxies + pending requests. Record `cwd` in the state file at `start` so output is directory-scoped |
| 7b | Skill | Hand-written stub using `${CLAUDE_SKILL_DIR}` path | Generate SKILL.md from the home view; `--check` step in `npm test`; commands as `npx -y punchlist ...` |
| 8 | Content first | No args prints the guide | No args = home view: `bin`, `description`, running proxies, pending counts, `help[]` |
| 9 | Contextual disclosure | `start` and `wait` print next steps as prose | `help[]` lines on `start`, `wait`, `done`, `status`; none on self-contained output |
| 10 | Help & version | One big guide; no version | Per-command `--help` (flags, defaults, 2-3 examples). `-v/-V/--version` fast path from a leaf `version.js` |

Workflow guidance in today's `GUIDE` (finding the source, note kinds) moves into the `wait` output `help[]` and per-command help, so it stays next to the moment the agent needs it.

## Decision: runtime dependencies (chosen: A, 2026-10-12)

Requirement 4 (AGENTS.md) was zero runtime dependencies. AXI's reference SDK `axi-sdk-js` gives dispatch, structured errors, official TOON (`@toon-format/toon`), hook install, `--version` fast path and self-update, but it adds 2 runtime packages.

- **A. Use `axi-sdk-js` and bundle at release** (recommended): source depends on it; a build step (esbuild) emits one self-contained `dist/punchlist.mjs`, so the installed skill and `npx` still need only `node`. Battle-tested TOON, less custom code. Needs npm publishing, which also solves packaging.
- **B. Stay hand-rolled**: write a small TOON encoder and own dispatch. No build step, but we own spec compliance.

## Order of work (small, testable steps)

0. [x] `axi-sdk-js` + esbuild bundle into `scripts/punchlist.mjs`; package `punchlist-axi`.
1. [x] Exit codes + structured errors + unknown-flag rejection (`test/cli.test.mjs`).
2. [x] TOON output for `status`, `start`, `done`, `stop`; home view on no args; `--version` (via `runAxiCli`). [x] `--version` fast path: `src/punchlist.mjs` + leaf `src/version.mjs`, CLI loaded by dynamic import.
3. [x] `wait` in TOON with truncation (HTML at 600 chars) + new `show <id> [--full]`; kind-specific `help[]` lines.
4. [x] Short top-level `--help` (commands + loop); guidance moved to `start`/`wait`/`done --help` and the `start` output; known limits live in README.
5. `setup hooks` (SessionStart) + generated SKILL.md with `--check`.
