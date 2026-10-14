// Writes both SKILL.md stubs from one template, so the published skill and the dev copy cannot drift.
// `--check` (run by `pnpm test`) only compares and fails when a file is stale.
import fs from 'node:fs';

const DESCRIPTION = `Click-to-edit for any running web app. Starts a local proxy in front of the user's dev server that injects an element picker, so the user can tap any element in a real browser (desktop or phone, also over Tailscale), type what should change, and you receive the element's selector, HTML, styles and source-file hints and edit the code. Use this whenever the user wants to point at UI and have it changed, says things like "let me click the element", "visual edit", "inspect and fix", "จิ้ม element แล้วแก้", or wants to tweak a page from their phone - even if they don't name this skill. Works with any server (Rails, SvelteKit, Vite, Next, static) with no changes to the app.`;

const skill = (bin: string) => `---
name: punchlist
description: ${DESCRIPTION}
metadata:
  argument-hint: <dev server port or URL>
---

# punchlist

punchlist runs a proxy in the background in front of the user's dev server. The user annotates elements in the browser and presses Send; you pull the batch with a blocking command, edit the source, and report back. Nothing in the user's app changes.

## Current guidance lives in the CLI

Do not follow workflow details from memory or from this file. Read the source of truth first:

\`\`\`bash
${bin} --help
\`\`\`

Then start the proxy. It returns at once and prints the link for the user and the next command to run:

\`\`\`bash
${bin} start --target <port|url>
\`\`\`

Do not wrap \`start\` in \`nohup\` or \`&\`; it already runs the proxy in the background.

**Paste the full links from the \`start\` output into your reply text** (the local link, and the tailscale link when there is one, for the user's phone). The user does not see command output, and "I'll share the link" without the URL leaves them stuck. Share the links in a progress message before waiting. Then run \`wait\` as the \`start\` output says and follow the instructions it prints. Background completion behavior depends on your agent harness; read \`wait --help\` rather than assuming a running command will wake an ended turn.

## Request

$ARGUMENTS

If the request above is non-empty, it names the dev server (port or URL) - read \`--help\`, then start the proxy for it. If it is empty, find the dev server port as \`--help\` describes.
`;

const files = {
  // published: `npx skills add narze/punchlist-axi --skill punchlist`
  'skills/punchlist/SKILL.md': skill('npx -y punchlist-axi'),
  // dev copy in this repo: runs the local build
  '.claude/skills/punchlist/SKILL.md': skill('node "${CLAUDE_SKILL_DIR}/../../../scripts/punchlist-axi.mjs"'),
};

const check = process.argv.includes('--check');
const stale = Object.entries(files).filter(([file, text]) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text);
if (check && stale.length) {
  console.error(`stale: ${stale.map(([file]) => file).join(', ')} - edit skill.ts and run pnpm skill`);
  process.exit(1);
}
if (!check) for (const [file, text] of stale) fs.writeFileSync(file, text);
