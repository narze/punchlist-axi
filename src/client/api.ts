// The proxy's endpoints for the page (served under /__pe next to client.js).
import type { ServerEvent } from '../protocol.ts';

const API = '/__pe';

export const errorMessage = (e: unknown) => e instanceof Error ? e.message : String(e);

// POST JSON; throws the proxy's `error` (or the status) when it refuses
export async function post<T = unknown>(path: string, body: unknown): Promise<T> {
  const r = await fetch(API + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const b = await r.json().catch(() => ({})) as T & { error?: string };
  if (!r.ok) throw new Error(b.error ?? String(r.status));
  return b;
}

// queue updates (SSE): a snapshot on connect, then one event per status change
export function listen(on: (msg: ServerEvent) => void) {
  try {
    const es = new EventSource(API + '/events');
    es.onmessage = (e: MessageEvent<string>) => { on(JSON.parse(e.data) as ServerEvent); };
  } catch {}
}
