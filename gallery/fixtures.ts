// Made-up notes and elements for the stories.
import type { ElementContext, Hints } from '../src/protocol.ts';
import type { LiveNote } from '../src/client/context.ts';

export const noop = (): void => undefined;

const noHints: Hints = { rails: [], svelte: [], react: [], vue: [] };

export function element(label: string, hints: Partial<Hints> = {}): ElementContext {
  return { label, selector: `main > ${label}`, ancestors: ['main'], text: '', html: `<${label.split(/[#.]/)[0] ?? 'div'}>`, styles: {},
    rect: { x: 0, y: 0, width: 120, height: 32 }, hints: { ...noHints, ...hints } };
}

export function note(comment: string, more: Partial<LiveNote> = {}): LiveNote {
  return { kind: 'element', path: location.pathname + location.search, comment, elements: [element('button#buy.btn.primary')], els: [], ...more };
}
