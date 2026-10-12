---
name: punchlist
description: Click-to-edit for any running web app. Starts a local proxy in front of the user's dev server that injects an element picker, so the user can tap any element in a real browser (desktop or phone, also over Tailscale), type what should change, and you receive the element's selector, HTML, styles and source-file hints and edit the code. Use this whenever the user wants to point at UI and have it changed, says things like "let me click the element", "visual edit", "inspect and fix", "จิ้ม element แล้วแก้", or wants to tweak a page from their phone - even if they don't name this skill. Works with any server (Rails, SvelteKit, Vite, Next, static) with no changes to the app.
metadata:
  argument-hint: <dev server port or URL>
---

# punchlist

punchlist runs a proxy in the background in front of the user's dev server. The user annotates elements in the browser and presses Send; you pull the batch with a blocking command, edit the source, and report back. Nothing in the user's app changes.

## Current guidance lives in the CLI

Do not follow workflow details from memory or from this file. Read the source of truth first:

```bash
node "${CLAUDE_SKILL_DIR}/../../../scripts/punchlist.mjs" --help
```

Then start the proxy. It returns at once and prints the link for the user and the next command to run:

```bash
node "${CLAUDE_SKILL_DIR}/../../../scripts/punchlist.mjs" start --target <port|url>
```

Do not wrap `start` in `nohup` or `&`; it already runs the proxy in the background. Run `wait` in the foreground and follow the instructions it prints.

## Request

$ARGUMENTS

If the request above is non-empty, it names the dev server (port or URL) - read `--help`, then start the proxy for it. If it is empty, find the dev server port as `--help` describes.
