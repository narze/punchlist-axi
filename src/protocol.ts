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

// A source file to open; relative to the project root, or absolute inside it.
export interface FileRef { file: string; line?: number; column?: number }

// POST /open: launch (default) opens it in the editor on the proxy machine; launch false only resolves it
// and returns the editor URL, for a browser on another machine to open.
export interface OpenRequest extends FileRef { launch?: boolean }
export interface OpenResult { file: string; abs: string; url: string }

export interface Item { id: string; status: Status; createdAt: string; payload: Payload<LooseElement>; message: string | null; file?: FileRef }

// What the browser sees of an item (no element context). file: what a locate request found.
export interface PublicItem { id: string; kind?: 'locate'; status: Status; message: string | null; label: string; prompt: string; file?: FileRef }

export type ServerEvent = { type: 'snapshot'; items: PublicItem[] } | { type: 'update'; item: PublicItem };
