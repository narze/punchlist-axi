// punchlist picker — injected by the proxy into every HTML page.
// Notes are snapshotted when added (so they survive navigation) and sent to the agent as one batch.
// `pnpm build` bundles it into scripts/client.js, which the proxy serves as /__pe/client.js.
import { flushSync, mount } from 'svelte';
import App from './App.svelte';
import shared from './shared.css';

declare global { interface Window { __pointEdit?: boolean } }

if (!window.__pointEdit) {
  window.__pointEdit = true;
  // shadow DOM keeps our styles and the app's apart; outside <body> so Turbo keeps it
  const host = document.createElement('punchlist-root');
  const root = host.attachShadow({ mode: 'open' });
  const reset = document.createElement('style');
  reset.textContent = ':host { all: initial; }\n' + shared;
  root.append(reset);
  document.documentElement.appendChild(host);
  mount(App, { target: root, props: { host } });
  flushSync(); // page listeners are live before the page gets another event
}
