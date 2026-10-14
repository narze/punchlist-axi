---
name: publish
description: Release punchlist-axi - bump the version, tag a GitHub release with a changelog, and stage the npm publish.
disable-model-invocation: true
---

# publish

The version lives in `package.json`; `pnpm build` bakes it into `scripts/punchlist-axi.mjs` and `scripts/punchlist-cli.mjs` (through `src/version.ts`), so a bump commit changes those three files. Releases are commits on `main` (`chore: release X.Y.Z`) with a `vX.Y.Z` tag and a GitHub release. The user runs `npm publish` themselves: it needs their npm login and often an OTP.

## Steps

1. Preflight. Done when all hold:
   - On `main`, clean tree, level with `origin/main` (`git fetch`, then `git status`).
   - `pnpm check` and `pnpm test` pass.
   - There are commits since the last release. The last release is the newest `v*` tag; before the first tag, the last commit that changed `"version"` in `package.json` (`git log -1 --format=%h -G'"version"' -- package.json`).
2. Bump: `npm version <patch|minor|major> --no-git-tag-version` (the request below names the level; patch when it names none), then `pnpm build`. `npm view punchlist-axi version` must be lower than the new version. Done when `node scripts/punchlist-axi.mjs --version` prints the new version and `git status` shows only `package.json` and the two `scripts/*.mjs`.
3. Changelog, from `git log <last release>..HEAD --format='%h %s'`: one line per user-facing change, grouped under `### Features`, `### Fixes`, `### Other` (by the conventional-commit type; `chore`/`test`/`docs` go to Other or are left out when they mean nothing to users), with the PR number `(#N)` when the subject has one. Write it in plain words for people who install the package. Show it to the user before the release step.
4. Commit `chore: release X.Y.Z`, push `main`, then `gh-axi release create vX.Y.Z --target main --title vX.Y.Z --notes-file <changelog>`. Done when `gh-axi release view vX.Y.Z` shows the notes.
5. Stage the npm publish. `npm pack --dry-run` must list only the `files` in `package.json` with the new version. Check `npm whoami`; when it fails, ask the user to run `! npm login`. Then hand over: the user runs `! npm publish` (add `--otp <code>` if npm asks). After they do, confirm with `npm view punchlist-axi version`.

## Request

$ARGUMENTS
