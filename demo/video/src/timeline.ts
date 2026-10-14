// What capture.ts recorded: CLI commands and output, scene marks, and where each click, note and drag happened
// (CSS px of the 1280x720 viewport), in seconds of raw.mp4.
import raw from '../../out/timeline.json';

export interface Rect { x: number; y: number; width: number; height: number }
export interface Mark { t: number; kind: string; text: string; rect?: Rect }
const marks = raw as Mark[];

function one(kind: string, text = '', nth = 0): Mark & { rect: Rect } {
  const m = marks.filter(m => m.kind === kind && m.text.includes(text))[nth];
  if (!m) throw new Error(`timeline.json has no ${kind} "${text}" #${nth}: run pnpm demo:capture`);
  return { rect: { x: 640, y: 360, width: 0, height: 0 }, ...m };
}

const n = [0, 1];
export const ev = {
  // the punch list: a clicked note, a dragged box, Send, the agent's fix, Reload
  pick: one('click', 'data-act="pick"'),
  cta: one('click', '.cta'),
  typing: n.map(i => one('typing', '', i)),
  typed: n.map(i => one('typed', '', i)),
  add: n.map(i => one('click', '.add', i)),
  drag: one('drag'),
  dragged: one('dragged'),
  send: one('click', 'data-act="send"'),
  done: one('scene', 'done'),
  reload: one('click', 'Reload'),
  result: one('scene', 'result'),
  // the user's own fix in the page's editor
  edit: one('scene', 'edit'),
  typo: one('typo'),
  editPick: one('click', 'data-act="pick"', 2),
  h1: one('click', 'h1'),
  editBtn: one('click', '.edit'),
  editor: one('editor'),
  word: one('click', 'editor text'),
  editTyping: one('typing', '', 2),
  editTyped: one('typed', '', 2),
  save: one('scene', 'save'),
  close: one('click', '.close'),
  reload2: one('click', 'Reload', 1),
  edited: one('scene', 'edited'),
};
// capture.ts holds the last page for 2.5 s
export const END = ev.edited.t + 2.4;

// the notes as `wait` printed them: label, comment and the innermost template
export const received = (() => {
  const out = one('out', 'notes[').text;
  const pick = (re: RegExp) => [...out.matchAll(re)].map(m => (m[1] ?? '').replace(/\\"/g, '"'));
  const comments = pick(/comment: "?(.*?)"?$/gm), labels = pick(/label: (.*)$/gm), rails = pick(/rails: (.*)$/gm);
  return comments.map((comment, i) => ({ comment, label: labels[i] ?? '', file: (rails[i] ?? '').split(' > ').at(-1) ?? '' }));
})();

// the link `start` printed, shown on the usual port
export const link = `http://localhost:4000/__pe/auth?token=${/token=([\w-]+)/.exec(one('out', 'links:').text)?.[1] ?? ''}`;
