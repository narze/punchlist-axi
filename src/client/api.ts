// The proxy's endpoints for the page (served under /__pe next to client.js).
import type { ServerEvent } from '../protocol.ts';

export const API = '/__pe';

export const errorMessage = (e: unknown) => e instanceof Error ? e.message : String(e);

// The proxy refused: its `error` as the message, plus the status and the rest of its answer (a 409 carries the current etag).
export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly body: Record<string, unknown>) { super(message); }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(API + path, init);
  const b = await r.json().catch(() => ({})) as T & { error?: string };
  if (!r.ok) throw new ApiError(b.error ?? String(r.status), r.status, b);
  return b;
}

export const get = <T = unknown>(path: string) => call<T>(path);
// POST JSON; throws ApiError when the proxy refuses
export const post = <T = unknown>(path: string, body: unknown) =>
  call<T>(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

// queue updates (SSE): a snapshot on connect, then one event per status change
export function listen(on: (msg: ServerEvent) => void) {
  try {
    const es = new EventSource(API + '/events');
    es.onmessage = (e: MessageEvent<string>) => { on(JSON.parse(e.data) as ServerEvent); };
  } catch {}
}
