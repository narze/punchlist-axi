// What the browser client POSTs to the proxy and what the proxy hands to `wait`. Types only.

export interface Rect { x: number; y: number; width: number; height: number }

// Source-file hints collected in the page; svelte entries are file:line:col, rails is the template stack (outermost first).
export interface Hints { rails: string[]; svelte: string[]; react: string[]; vue: string[] }

// One target as the client captures it.
export interface ElementContext {
  label: string;
  selector: string;
  ancestors: string[];
  text: string;
  html: string;
  styles: Record<string, string>;
  rect: Rect;
  hints: Hints;
}

// The proxy only checks that a note has a comment and targets, so it reads every other target field defensively.
export type LooseElement = Partial<Omit<ElementContext, 'hints'>> & { hints?: Partial<Hints> };

export type NoteKind = 'element' | 'elements' | 'text' | 'area';

export interface Note<E = ElementContext> {
  kind: NoteKind;
  path: string;
  title?: string;
  comment: string;
  text?: string | undefined;  // kind text: the selected text
  area?: Rect | undefined;    // kind area: the boxed region, in page coordinates
  frozen?: boolean;           // captured with animations paused
  elements: E[];
}

export interface Payload<E = ElementContext> {
  kind?: 'locate';  // the user asked the agent to find the file; no notes to apply
  notes: Note<E>[];
  viewport?: { w: number; h: number };
}

export type Status = 'pending' | 'working' | 'done' | 'failed';

export interface Item { id: string; status: Status; createdAt: string; payload: Payload<LooseElement>; message: string | null }

// What the browser sees of an item (no element context).
export interface PublicItem { id: string; kind?: 'locate'; status: Status; message: string | null; label: string; prompt: string }

export type ServerEvent = { type: 'snapshot'; items: PublicItem[] } | { type: 'update'; item: PublicItem };
