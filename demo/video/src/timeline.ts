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

const n = [0, 1, 2];
export const ev = {
  pick: one('click', 'data-act="pick"'),
  h1: one('click', 'h1'),
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
};
// capture.ts holds the fixed page for 2.5 s after the result mark
export const END = ev.result.t + 2.4;

// the notes as `wait` printed them: label, comment and the innermost template
export const received = (() => {
  const out = one('out', 'notes[').text;
  const pick = (re: RegExp) => [...out.matchAll(re)].map(m => (m[1] ?? '').replace(/\\"/g, '"'));
  const comments = pick(/comment: "?(.*?)"?$/gm), labels = pick(/label: (.*)$/gm), rails = pick(/rails: (.*)$/gm);
  return comments.map((comment, i) => ({ comment, label: labels[i] ?? '', file: (rails[i] ?? '').split(' > ').at(-1) ?? '' }));
})();
